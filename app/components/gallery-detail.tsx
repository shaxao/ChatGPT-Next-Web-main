"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./gallery-detail.module.scss";
import { useParams } from "react-router-dom";
import { useGalleryStore } from "../store/gallery";
import { IconButton } from "./button";
import ResetIcon from "../icons/reload.svg";
import ReturnIcon from "../icons/return.svg";
import AddIcon from "../icons/add.svg";
import CopyIcon from "../icons/copy.svg";
import dynamic from "next/dynamic";
import { copyToClipboard } from "../utils";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  ssr: false,
});

export default function GalleryDetail() {
  const params = useParams();
  const id = Number(params.id);
  const store = useGalleryStore();
  const item = useMemo(
    () => store.items.find((i) => i.id === id),
    [store.items, id],
  );
  const parentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFs, setIsFs] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const onFs = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        document.exitFullscreen().catch(() => {});
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  if (!item) {
    return <div className={styles.wrap}>未找到作品</div>;
  }

  return (
    <div className={styles.wrap} ref={parentRef}>
      <div className={styles.header}>
        <div className={styles.title}>
          {item.title || (item.prompt || "").split("\n")[0].slice(0, 20)}
        </div>
        <div className={styles.sub}>{item.createdAt}</div>
      </div>
      <div className={styles.promptToolbar}>
        <IconButton
          text={isFs ? "退出全屏" : "全屏"}
          icon={<ResetIcon />}
          onClick={() => {
            if (!document.fullscreenElement) {
              videoRef.current?.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
        />
        <IconButton
          text="返回"
          icon={<ResetIcon />}
          onClick={() => navigate(-1)}
        />
        <IconButton
          text="侧边栏"
          icon={<ReturnIcon />}
          onClick={() => navigate(Path.Home)}
        />
        <IconButton
          text="复制链接"
          icon={<ResetIcon />}
          onClick={() => copyToClipboard(item.url)}
        />
        <IconButton
          text="下载"
          icon={<AddIcon />}
          onClick={async () => {
            try {
              const resp = await fetch(item.url, {
                method: "GET",
                cache: "no-store",
              });
              const ct = resp.headers.get("Content-Type") || "video/mp4";
              const buf = await resp.arrayBuffer();
              const blob = new Blob([buf], { type: ct });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `video_${id}.mp4`;
              document.body.appendChild(a);
              a.click();
              setTimeout(() => {
                URL.revokeObjectURL(a.href);
                a.remove();
              }, 0);
            } catch {}
          }}
        />
        <IconButton
          text="复制提示词"
          icon={<CopyIcon />}
          onClick={() => copyToClipboard(item.prompt)}
        />
        <IconButton
          text={showPrompt ? "隐藏提示词" : "显示提示词"}
          icon={<ResetIcon />}
          onClick={() => setShowPrompt((s) => !s)}
        />
      </div>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{item.createdAt}</div>
      <div className={styles.videoBox}>
        <video
          ref={videoRef}
          className={isFs ? styles.videoFs : styles.video}
          src={item.url}
          controls
          onDoubleClick={() => {
            if (!document.fullscreenElement) {
              videoRef.current?.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
        />
      </div>

      {showPrompt && (
        <div className={styles.promptOverlay}>
          <Markdown content={item.prompt} parentRef={parentRef} />
        </div>
      )}
      {!isFs && (
        <div className={styles.markdown}>
          <Markdown content={item.prompt} parentRef={parentRef} />
        </div>
      )}
    </div>
  );
}
