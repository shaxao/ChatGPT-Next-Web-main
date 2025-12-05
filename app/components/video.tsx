"use client";

import React, { useRef, useState } from "react";
import styles from "./video.module.scss";
import { IconButton } from "./button";
import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import { showToast, showModal } from "./ui-lib";
import { requestOpenaiClient } from "../requests";
import { createVideoTask, queryVideoTask } from "../requests";
import { useAccessStore, useChatStore, useGalleryStore } from "../store";
import {
  requestChatStream,
  requestVideoChatStream,
  requestChat,
} from "../requests";
import Loader from "./loader";
import { useMobileScreen } from "../utils";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";

export default function VideoStudio() {
  const [tab, setTab] = useState<
    "text2vid" | "img2vid" | "remix" | "roleCreate" | "roleGenerate"
  >("text2vid");
  const imgInput = useRef<HTMLInputElement>(null);
  const vidInput = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [videoDataUrl, setVideoDataUrl] = useState<string>("");
  const access = useAccessStore();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<string>(
    access.videoModel || "sora-video-landscape-10s",
  );
  const [duration, setDuration] = useState(10);
  const [orientation, setOrientation] = useState<"landscape" | "portrait">(
    "landscape",
  );
  const [outputUrl, setOutputUrl] = useState<string>("");
  const [outputHtml, setOutputHtml] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [hint, setHint] = useState("暂未生成，试试上传图片或输入文案");
  const [generating, setGenerating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const pollTimer = useRef<any>(null);
  const isMobile = useMobileScreen();
  const navigate = useNavigate();
  const CACHE_KEY = "video-studio-cache";
  const [progress, setProgress] = useState<number>(0);
  const controllerRef = useRef<AbortController | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const stallTimerRef = useRef<any>(null);
  const gallery = useGalleryStore();

  // 默认配置本地 Sora2API（用户可在设置页更改）
  React.useEffect(() => {
    const s = useAccessStore.getState();
    if (!s.endpoint) s.updateEndpoint("http://localhost:8000");
    if (!s.token) s.updateToken("han1234");
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const obj = JSON.parse(raw);
        if (typeof obj.prompt === "string") setPrompt(obj.prompt);
        if (typeof obj.tab === "string") setTab(obj.tab);
        if (typeof obj.model === "string") setModel(obj.model);
        if (typeof obj.orientation === "string")
          setOrientation(obj.orientation);
        if (typeof obj.imageDataUrl === "string")
          setImageDataUrl(obj.imageDataUrl);
        if (typeof obj.videoDataUrl === "string")
          setVideoDataUrl(obj.videoDataUrl);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      const obj = {
        prompt,
        tab,
        model,
        orientation,
        imageDataUrl,
        videoDataUrl,
      } as any;
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch {}
  }, [prompt, tab, model, orientation, imageDataUrl, videoDataUrl]);

  React.useEffect(() => {
    if (access.videoModel && access.videoModel !== model) {
      setModel(access.videoModel);
    }
  }, [access.videoModel]);

  const cleanUrl = (u: string) => {
    let s = (u || "").trim();
    s = s.replace(/^`+|`+$/g, "").trim();
    s = s
      .replace(/^"+|"+$/g, "")
      .replace(/^'+|'+$/g, "")
      .trim();
    s = s.replace(/[’“”]+$/g, "").trim();
    s = s.replace(/(%27|%22|%60)+$/i, "");
    s = s.replace(/>+$/g, "").trim();
    s = s.replace(/\s+/g, "");
    return s;
  };

  const isVideoUrl = (url: string) => {
    if (!url) return false;
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return true;
    if (/^https?:\/\/videos\.openai\.com\//i.test(url)) return true;
    if (url.startsWith("data:video")) return true;
    return false;
  };

  const buildMessages = (): any[] => {
    const t = prompt.trim();
    if (tab === "text2vid") {
      return [{ role: "user", content: t || "" }];
    }
    if (tab === "img2vid") {
      const arr: any[] = [];
      if (t) arr.push({ type: "text", text: t });
      if (imageDataUrl)
        arr.push({ type: "image_url", image_url: { url: imageDataUrl } });
      return [{ role: "user", content: arr }];
    }
    if (tab === "remix") {
      return [{ role: "user", content: t }];
    }
    if (tab === "roleCreate") {
      if (!videoDataUrl) return [{ role: "user", content: "" }];
      return [
        {
          role: "user",
          content: [{ type: "video_url", video_url: { url: videoDataUrl } }],
        },
      ];
    }
    if (tab === "roleGenerate") {
      const arr: any[] = [];
      if (videoDataUrl)
        arr.push({ type: "video_url", video_url: { url: videoDataUrl } });
      if (t) arr.push({ type: "text", text: t });
      return [{ role: "user", content: arr }];
    }
    return [{ role: "user", content: t }];
  };

  const onGenerate = async () => {
    const msgs = buildMessages();
    if (
      !msgs[0]?.content ||
      (Array.isArray(msgs[0].content) && msgs[0].content.length === 0)
    ) {
      showToast("请先上传素材或输入文案");
      return;
    }

    const s = useAccessStore.getState();
    if (s.videoProvider === "custom") {
      if (!s.videoApiKey || !s.videoEndpoint) {
        showToast(
          "自定义视频提供商未配置完整：请在设置中填写 API Key 与 Endpoint",
        );
        return;
      }
    } else {
      // 如果已填写自定义端点但未切换提供商，则自动切换
      if (s.videoEndpoint) access.updateVideoProvider("custom");
    }

    setHint("正在生成，请稍候…");
    setGenerating(true);
    setOutputUrl("");
    setOutputHtml("");
    setProgress(0);
    lastUpdateRef.current = Date.now();
    if (stallTimerRef.current) clearInterval(stallTimerRef.current);
    stallTimerRef.current = setInterval(() => {
      const gap = Date.now() - lastUpdateRef.current;
      if (generating && gap > 120000) {
        setHint("连接空闲超过2分钟，仍在等待服务端输出…");
        lastUpdateRef.current = Date.now();
      }
    }, 30000);

    const parseProgress = (text: string) => {
      const re = /\*\*Video Generation Progress\*\*:\s*(\d+)%\s*\(([^)]+)\)/g;
      let m: RegExpExecArray | null = null;
      let last: { p: number; s: string } | null = null;
      while ((m = re.exec(text)) !== null) {
        const p = Number(m[1]);
        const s = String(m[2]);
        last = { p, s };
      }
      if (!last && /\*\*Video Generation Completed\*\*/.test(text)) {
        last = { p: 100, s: "completed" };
      }
      return last;
    };

    const extractHtml = (text: string) => {
      // support ```html 或误拼写 ```heml，以及无代码块直接输出的 <video>
      const m1 = text.match(/```(?:html|heml)\s*([\s\S]*?)\s*```/i);
      if (m1?.[1]) return m1[1].trim();
      const m2 = text.match(/<video[\s\S]*?<\/video>/i);
      return m2?.[0]?.trim() || "";
    };

    const sanitizeVideoHtml = (html: string) => {
      const m = html.match(
        /<video[^>]*src=['\"]\s*([^'\"`]+(?:`?[^'\"<>]*)?)\s*['\"][^>]*><\/video>/i,
      );
      if (m && m[1]) {
        const url = cleanUrl(m[1]);
        setOutputUrl(url);
        setDownloadUrl(url);
        return `<video src="${url}" controls style="width:100%;border-radius:10px"></video>`;
      }
      return "";
    };

    try {
      await requestVideoChatStream(msgs as any, {
        modelConfig: { model } as any,
        onMessage: (message, done) => {
          setHint(message);
          const pr = parseProgress(message);
          if (pr) setProgress(pr.p);
          const html = extractHtml(message);
          if (html) setOutputHtml(sanitizeVideoHtml(html));
          lastUpdateRef.current = Date.now();
          if (done) {
            const urlMatch = message.match(/(https?:\/\/[^\s>'"`)]+)/);
            const dataUrlMatch = message.match(
              /(data:(?:image|video)\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+)/,
            );
            let found = dataUrlMatch?.[1] || urlMatch?.[1] || "";
            if (found) {
              found = cleanUrl(found);
              if (isVideoUrl(found)) {
                setOutputHtml(
                  `<video src="${found}" controls style="width:100%;border-radius:10px"></video>`,
                );
                setDownloadUrl(found);
                setOutputUrl(found);
                (async () => {
                  let title = (prompt || "").split("\n")[0].slice(0, 6);
                  try {
                    const sys = {
                      role: "system",
                      content:
                        "你是一名资深视频文案策划，请根据用户的提示词生成一个不超过6个汉字的标题，不要标点，只返回标题文本。",
                      date: new Date().toISOString(),
                    } as any;
                    const usr = {
                      role: "user",
                      content: prompt || "",
                      date: new Date().toISOString(),
                    } as any;
                    const res = await requestChat([sys, usr], {
                      model: "gpt-3.5-turbo",
                    });
                    const t = (
                      res?.choices?.[0]?.message?.content || ""
                    ).trim();
                    if (t) title = t.slice(0, 6);
                  } catch {}
                  gallery.add({
                    url: found,
                    prompt,
                    title,
                    createdAt: new Date().toLocaleString(),
                  });
                })();
              } else {
                setOutputUrl(found);
              }
            }
            setGenerating(false);
            if (stallTimerRef.current) {
              clearInterval(stallTimerRef.current);
              stallTimerRef.current = null;
            }
          }
        },
        onError: (error) => {
          const msg = String(error?.message ?? error);
          setHint(`生成失败：${msg}`);
          setGenerating(false);
          if (stallTimerRef.current) {
            clearInterval(stallTimerRef.current);
            stallTimerRef.current = null;
          }
        },
        onController: (c) => {
          controllerRef.current = c;
        },
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      setHint(`生成失败：${msg}`);
      setGenerating(false);
      if (stallTimerRef.current) {
        clearInterval(stallTimerRef.current);
        stallTimerRef.current = null;
      }
    }
  };

  const optimizeSystemPrompt = `您是一位拥有多年行业经验的资深影视编剧和视频导演。我将提供给您一些初步的想法、素材或信息，您需要基于这些“一点内容”，为我创作出符合特定风格的专业剧本，并提供详尽的视频镜头制作方案。

请您扮演以下角色，并完成任务：
* 角色: 资深影视编剧兼资深视频导演。
* 能力:
  * 精准提炼用户提供的零散信息，构思故事框架。
  * 创作符合指定风格（如：科技宣传片、生活Vlog、剧情短片、教学视频、广告片等）的专业剧本。
  * 设计符合剧本的镜头语言，包括景别、机位、运镜、构图、画面元素等。
  * 提出有效的转场、音乐、音效、旁白等后期制作建议。

工作流程:
1. 理解我的内容: 仔细分析我提供给您的“一点内容”。
2. 确定风格: 根据我的要求或内容本身的特点，确定并创作出相应风格的剧本。
3. 细化方案: 为剧本的关键部分或整体视频，提供详细的镜头制作方案。

输出要求:
* 剧本: 请使用标准的剧本格式（场景、动作、人物、对话），确保故事情节完整、逻辑清晰、风格统一。
* 镜头制作方案: 请以列表或分点形式清晰呈现，具体到镜头类型、景别、运镜方式、画面构图等。
* 格式: 请使用Markdown格式进行输出，使内容结构化，易于阅读。
* 示例: 为了让我更好地理解您的能力，请至少提供两个不同风格（例如：科技宣传片风格和生活Vlog风格）的剧本和镜头制作方案的综合示例。

现在，请您基于我提供的“一点内容”开始创作。`;

  const onOptimize = async () => {
    const t = prompt.trim();
    if (!t) {
      showToast("请先在输入框提供一点内容");
      return;
    }
    setOptimizing(true);
    const cfg = useChatStore.getState().config.modelConfig;
    const msgs: any[] = [
      {
        role: "system",
        content: optimizeSystemPrompt,
        date: new Date().toISOString(),
      },
      { role: "user", content: t, date: new Date().toISOString() },
    ];
    try {
      await requestChatStream(msgs as any, {
        modelConfig: cfg,
        onMessage: (message, done) => {
          setPrompt(message);
          if (done) setOptimizing(false);
        },
        onError: (error) => {
          const msg = String(error?.message ?? error);
          showToast(`优化失败：${msg}`);
          setOptimizing(false);
        },
      });
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      showToast(`优化失败：${msg}`);
      setOptimizing(false);
    }
  };

  const openAdvanced = () => {
    showModal({
      title: "高级设置",
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className={styles.row}>
            <span>模型</span>
            <select
              value={model}
              onChange={(e) => {
                const v = e.target.value;
                setModel(v);
                access.updateVideoModel(v);
              }}
            >
              <option value="sora-video-landscape-10s">
                sora-video-landscape-10s
              </option>
              <option value="sora-video-landscape-15s">
                sora-video-landscape-15s
              </option>
              <option value="sora-video-10s">sora-video-10s</option>
              <option value="sora-video-15s">sora-video-15s</option>
              <option value="sora-video-portrait-10s">
                sora-video-portrait-10s
              </option>
              <option value="sora-video-portrait-15s">
                sora-video-portrait-15s
              </option>
            </select>
          </div>
          <div className={styles.row}>
            <span>方向</span>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
            >
              <option value="landscape">横屏</option>
              <option value="portrait">竖屏</option>
            </select>
          </div>
          <div className={styles.row}>
            <span>时长</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={10}>10s</option>
              <option value={15}>15s</option>
            </select>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>更多选项即将上线</div>
        </div>
      ),
    });
  };

  return (
    <div className={styles.studio}>
      <div className={styles.panel}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              tab === "text2vid" ? styles.active : ""
            }`}
            onClick={() => setTab("text2vid")}
          >
            文生视频
          </button>
          <button
            className={`${styles.tab} ${
              tab === "img2vid" ? styles.active : ""
            }`}
            onClick={() => setTab("img2vid")}
          >
            图生视频
          </button>
          <button
            className={`${styles.tab} ${tab === "remix" ? styles.active : ""}`}
            onClick={() => setTab("remix")}
          >
            视频 Remix
          </button>
          <button
            className={`${styles.tab} ${
              tab === "roleCreate" ? styles.active : ""
            }`}
            onClick={() => setTab("roleCreate")}
          >
            创建角色
          </button>
          <button
            className={`${styles.tab} ${
              tab === "roleGenerate" ? styles.active : ""
            }`}
            onClick={() => setTab("roleGenerate")}
          >
            角色生成视频
          </button>
        </div>

        {tab === "img2vid" && (
          <div
            className={styles.upload}
            onClick={() => imgInput.current?.click()}
          >
            拖拽/粘贴/点击上传图片
            <input
              type="file"
              accept="image/*"
              ref={imgInput}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => setImageDataUrl(String(reader.result));
                reader.readAsDataURL(f);
                showToast("已选择图片");
              }}
            />
          </div>
        )}

        {tab !== "img2vid" &&
          (tab === "roleCreate" || tab === "roleGenerate") && (
            <div
              className={styles.upload}
              onClick={() => vidInput.current?.click()}
            >
              拖拽/粘贴/点击上传视频
              <input
                type="file"
                accept="video/*"
                ref={vidInput}
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = () => setVideoDataUrl(String(reader.result));
                  reader.readAsDataURL(f);
                  showToast("已选择视频");
                }}
              />
            </div>
          )}

        <div className={styles.actions}>
          <IconButton
            text="提示词优化"
            icon={<ResetIcon />}
            onClick={onOptimize}
          />
          <IconButton
            text="高级设置"
            icon={<ResetIcon />}
            onClick={openAdvanced}
          />
          <IconButton text="生成作品" icon={<AddIcon />} onClick={onGenerate} />
        </div>

        <textarea
          className={styles.inputArea}
          value={prompt}
          placeholder={
            tab === "remix"
              ? "粘贴 Remix 链接或 ID，附上风格指令"
              : tab === "roleCreate"
              ? "可留空，仅上传视频提取角色信息"
              : tab === "roleGenerate"
              ? "上传视频并输入角色动作或剧情"
              : "用自然语言描述你期待的镜头、场景或风格..."
          }
          onChange={(e) => setPrompt(e.target.value)}
        />

        <div
          className={styles.row}
          style={{ justifyContent: "space-between", marginTop: 8 }}
        >
          <div className={styles.row}>
            <span>模型</span>
            <select
              value={model}
              onChange={(e) => {
                const v = e.target.value;
                setModel(v);
                access.updateVideoModel(v);
              }}
            >
              <option value="sora-video-landscape-10s">
                sora-video-landscape-10s
              </option>
              <option value="sora-video-landscape-15s">
                sora-video-landscape-15s
              </option>
              <option value="sora-video-10s">sora-video-10s</option>
              <option value="sora-video-15s">sora-video-15s</option>
              <option value="sora-video-portrait-10s">
                sora-video-portrait-10s
              </option>
              <option value="sora-video-portrait-15s">
                sora-video-portrait-15s
              </option>
            </select>
          </div>
          <div className={styles.row}>
            <span>方向</span>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
            >
              <option value="landscape">横屏</option>
              <option value="portrait">竖屏</option>
            </select>
          </div>
          <div className={styles.row}>
            <span>时长</span>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <option value={10}>10s</option>
              <option value={15}>15s</option>
            </select>
          </div>
        </div>

        {isMobile && (
          <div className={styles.actions}>
            <IconButton
              text="返回侧栏"
              icon={<ResetIcon />}
              onClick={() => navigate(Path.Home)}
            />
          </div>
        )}
      </div>

      <div className={styles.panel}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 8 }}>
          生成状态与提示
        </div>
        <div className={styles.rightHint}>
          {generating && (
            <div style={{ marginBottom: 8 }}>
              <Loader />
            </div>
          )}
          {optimizing && (
            <div style={{ marginBottom: 8 }}>
              <Loader />
            </div>
          )}
          {!!progress && (
            <div className={styles.statusLine}>
              进度 {progress}%
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className={styles.hintText}>{hint}</div>
          {generating && (
            <div style={{ marginTop: 8 }}>
              <IconButton
                text="停止生成"
                icon={<ResetIcon />}
                onClick={() => {
                  controllerRef.current?.abort();
                  setGenerating(false);
                }}
              />
            </div>
          )}
          {outputHtml && (
            <div
              className={styles.outputBox}
              dangerouslySetInnerHTML={{ __html: outputHtml }}
            />
          )}
          {!outputHtml && outputUrl && (
            <div className={styles.outputBox}>
              {outputUrl.startsWith("data:image") ? (
                <img
                  src={outputUrl}
                  alt="生成图片"
                  style={{ width: "100%", borderRadius: 10 }}
                />
              ) : isVideoUrl(outputUrl) ? (
                <video
                  src={outputUrl}
                  controls
                  style={{ width: "100%", borderRadius: 10 }}
                />
              ) : (
                <a href={outputUrl} target="_blank" rel="noreferrer">
                  {outputUrl}
                </a>
              )}
            </div>
          )}
          {(downloadUrl || outputUrl) && (
            <div className={styles.actions}>
              {downloadUrl && (
                <IconButton
                  text="下载视频"
                  icon={<AddIcon />}
                  onClick={async () => {
                    try {
                      const resp = await fetch(downloadUrl, {
                        method: "GET",
                        cache: "no-store",
                      });
                      const ct =
                        resp.headers.get("Content-Type") || "video/mp4";
                      const buf = await resp.arrayBuffer();
                      const blob = new Blob([buf], { type: ct });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `video_${Date.now()}.mp4`;
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => {
                        URL.revokeObjectURL(a.href);
                        a.remove();
                      }, 0);
                    } catch {
                      window.open(downloadUrl, "_blank");
                    }
                  }}
                />
              )}
              {(outputUrl || downloadUrl) && (
                <IconButton
                  text="复制链接"
                  icon={<ResetIcon />}
                  onClick={() => {
                    const raw = downloadUrl || outputUrl;
                    const u = cleanUrl(raw);
                    if (u) navigator.clipboard.writeText(u);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
