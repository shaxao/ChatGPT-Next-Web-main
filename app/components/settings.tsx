import { useState, useEffect, useMemo, HTMLProps, useRef } from "react";

import EmojiPicker, { Theme as EmojiTheme } from "emoji-picker-react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import EyeOffIcon from "../icons/eye-off.svg";

import { Input, List, ListItem, Modal, Popover } from "./ui-lib";

import { IconButton } from "./button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  ALL_MODELS,
  useUpdateStore,
  useAccessStore,
  ModalConfigValidator,
} from "../store";
import { Avatar } from "./chat";

import Locale, { AllLangs, changeLang, getLang } from "../locales";
import { copyToClipboard, getEmojiUrl } from "../utils";
import Link from "next/link";
import { Path, UPDATE_URL } from "../constant";
import { Prompt, SearchService, usePromptStore } from "../store/prompt";
import { ErrorBoundary } from "./error";
import { InputRange } from "./input-range";
import { useNavigate } from "react-router-dom";
import {
  requestHealth,
  requestModelsList,
  requestVoiceModelsList,
  requestVideoModelsList,
} from "../requests";
import { showToast } from "../components/ui-lib";

function UserPromptModal(props: { onClose?: () => void }) {
  const promptStore = usePromptStore();
  const userPrompts = promptStore.getUserPrompts();
  const builtinPrompts = SearchService.builtinPrompts;
  const allPrompts = userPrompts.concat(builtinPrompts);
  const [searchInput, setSearchInput] = useState("");
  const [searchPrompts, setSearchPrompts] = useState<Prompt[]>([]);
  const prompts = searchInput.length > 0 ? searchPrompts : allPrompts;

  useEffect(() => {
    if (searchInput.length > 0) {
      const searchResult = SearchService.search(searchInput);
      setSearchPrompts(searchResult);
    } else {
      setSearchPrompts([]);
    }
  }, [searchInput]);

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Prompt.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <IconButton
            key="add"
            onClick={() => promptStore.add({ title: "", content: "" })}
            icon={<ClearIcon />}
            bordered
            text={Locale.Settings.Prompt.Modal.Add}
          />,
        ]}
      >
        <div className={styles["user-prompt-modal"]}>
          <input
            type="text"
            className={styles["user-prompt-search"]}
            placeholder={Locale.Settings.Prompt.Modal.Search}
            value={searchInput}
            onInput={(e) => setSearchInput(e.currentTarget.value)}
          ></input>

          <div className={styles["user-prompt-list"]}>
            {prompts.map((v, _) => (
              <div className={styles["user-prompt-item"]} key={v.id ?? v.title}>
                <div className={styles["user-prompt-header"]}>
                  <input
                    type="text"
                    className={styles["user-prompt-title"]}
                    value={v.title}
                    readOnly={!v.isUser}
                    onChange={(e) => {
                      if (v.isUser) {
                        promptStore.updateUserPrompts(
                          v.id!,
                          (prompt) => (prompt.title = e.currentTarget.value),
                        );
                      }
                    }}
                  ></input>

                  <div className={styles["user-prompt-buttons"]}>
                    {v.isUser && (
                      <IconButton
                        icon={<ClearIcon />}
                        bordered
                        className={styles["user-prompt-button"]}
                        onClick={() => promptStore.remove(v.id!)}
                      />
                    )}
                    <IconButton
                      icon={<CopyIcon />}
                      bordered
                      className={styles["user-prompt-button"]}
                      onClick={() => copyToClipboard(v.content)}
                    />
                  </div>
                </div>
                <Input
                  rows={2}
                  value={v.content}
                  className={styles["user-prompt-content"]}
                  readOnly={!v.isUser}
                  onChange={(e) => {
                    if (v.isUser) {
                      promptStore.updateUserPrompts(
                        v.id!,
                        (prompt) => (prompt.content = e.currentTarget.value),
                      );
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SettingItem(props: {
  title: string;
  subTitle?: string;
  children: JSX.Element;
}) {
  return (
    <ListItem>
      <div className={styles["settings-title"]}>
        <div>{props.title}</div>
        {props.subTitle && (
          <div className={styles["settings-sub-title"]}>{props.subTitle}</div>
        )}
      </div>
      {props.children}
    </ListItem>
  );
}

function PasswordInput(props: HTMLProps<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  function changeVisibility() {
    setVisible(!visible);
  }

  return (
    <div className={styles["password-input-container"]}>
      <IconButton
        icon={visible ? <EyeIcon /> : <EyeOffIcon />}
        onClick={changeVisibility}
        className={styles["password-eye"]}
      />
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={styles["password-input"]}
      />
    </div>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [config, updateConfig, resetConfig, clearAllData, clearSessions] =
    useChatStore((state) => [
      state.config,
      state.updateConfig,
      state.resetConfig,
      state.clearAllData,
      state.clearSessions,
    ]);

  const updateStore = useUpdateStore();
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const currentVersion = updateStore.version;
  const remoteId = updateStore.remoteVersion;
  const hasNewVersion = currentVersion !== remoteId;

  const accessStore = useAccessStore();
  const enabledAccessControl = useMemo(
    () => accessStore.enabledAccessControl(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [checkingHealth, setCheckingHealth] = useState(false);
  const [health, setHealth] = useState<{
    ok: boolean;
    status?: number;
    message?: string;
  } | null>(null);
  const [loadingModels, setLoadingModels] = useState(false);

  async function fetchModels() {
    setLoadingModels(true);
    try {
      const list = await requestModelsList();
      accessStore.setModels(list, accessStore.endpoint);
      if (!list || list.length === 0) {
        showToast("未获取到模型列表");
      } else {
        showToast(`已获取 ${list.length} 个模型`);
      }
    } catch (e: any) {
      showToast(String(e?.message ?? e));
    } finally {
      setLoadingModels(false);
    }
  }

  const [loadingTtsModels, setLoadingTtsModels] = useState(false);
  const [ttsModels, setTtsModels] = useState<string[]>([]);
  const OPENAI_TTS_VOICES = [
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "fable",
    "nova",
    "onyx",
    "sage",
    "shimmer",
  ];
  const voiceSelectValue = OPENAI_TTS_VOICES.includes(accessStore.ttsVoice)
    ? accessStore.ttsVoice
    : "";

  async function fetchTtsModels() {
    setLoadingTtsModels(true);
    try {
      const list = await requestVoiceModelsList();
      setTtsModels(list);
      if (!list || list.length === 0) {
        showToast("未获取到朗读模型");
      } else {
        showToast(`已获取 ${list.length} 个朗读模型`);
      }
    } catch (e: any) {
      showToast(String(e?.message ?? e));
    } finally {
      setLoadingTtsModels(false);
    }
  }
  const [loadingVideoModels, setLoadingVideoModels] = useState(false);
  const [videoModels, setVideoModels] = useState<string[]>([]);

  async function fetchVideoModels() {
    setLoadingVideoModels(true);
    try {
      const list = await requestVideoModelsList();
      setVideoModels(list);
      accessStore.setVideoModels(
        list,
        accessStore.videoProvider === "custom"
          ? accessStore.videoEndpoint
          : accessStore.endpoint,
      );
      if (!list || list.length === 0) {
        showToast("未获取到视频模型");
      } else {
        showToast(`已获取 ${list.length} 个视频模型`);
      }
    } catch (e: any) {
      showToast(String(e?.message ?? e));
    } finally {
      setLoadingVideoModels(false);
    }
  }

  function checkUpdate(force = false) {
    setCheckingUpdate(true);
    updateStore.getLatestVersion(force).then(() => {
      setCheckingUpdate(false);
    });
  }

  const usage = {
    used: updateStore.used,
    subscription: updateStore.subscription,
  };
  const [loadingUsage, setLoadingUsage] = useState(false);
  function checkUsage() {
    setLoadingUsage(true);
    updateStore.updateUsage().finally(() => {
      setLoadingUsage(false);
    });
  }

  function checkHealth() {
    setCheckingHealth(true);
    setHealth(null);
    requestHealth()
      .then((res) => setHealth(res))
      .finally(() => setCheckingHealth(false));
  }

  const promptStore = usePromptStore();
  const builtinCount = SearchService.count.builtin;
  const customCount = promptStore.getUserPrompts().length ?? 0;
  const [shouldShowPromptModal, setShowPromptModal] = useState(false);

  const showUsage = accessStore.isAuthorized();
  useEffect(() => {
    // checks per minutes
    checkUpdate();
    showUsage && checkUsage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home);
      }
    };
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary>
      <div className={styles["window-header"]}>
        <div className={styles["window-header-title"]}>
          <div className={styles["window-header-main-title"]}>
            {Locale.Settings.Title}
          </div>
          <div className={styles["window-header-sub-title"]}>
            {Locale.Settings.SubTitle}
          </div>
        </div>
        <div className={styles["window-actions"]}>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<ClearIcon />}
              onClick={() => {
                const confirmed = window.confirm(
                  `${Locale.Settings.Actions.ConfirmClearAll.Confirm}`,
                );
                if (confirmed) {
                  clearSessions();
                }
              }}
              bordered
              title={Locale.Settings.Actions.ClearAll}
            />
          </div>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<ResetIcon />}
              onClick={() => {
                const confirmed = window.confirm(
                  `${Locale.Settings.Actions.ConfirmResetAll.Confirm}`,
                );
                if (confirmed) {
                  resetConfig();
                }
              }}
              bordered
              title={Locale.Settings.Actions.ResetAll}
            />
          </div>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<CloseIcon />}
              onClick={() => navigate(Path.Home)}
              bordered
              title={Locale.Settings.Actions.Close}
            />
          </div>
        </div>
      </div>
      <div className={styles["settings"]}>
        <List>
          <SettingItem title={Locale.Settings.Avatar}>
            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <EmojiPicker
                  lazyLoadEmojis
                  theme={EmojiTheme.AUTO}
                  getEmojiUrl={getEmojiUrl}
                  onEmojiClick={(e) => {
                    updateConfig((config) => (config.avatar = e.unified));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div
                className={styles.avatar}
                onClick={() => setShowEmojiPicker(true)}
              >
                <Avatar role="user" />
              </div>
            </Popover>
          </SettingItem>

          <SettingItem
            title={Locale.Settings.Update.Version(currentVersion ?? "unknown")}
            subTitle={
              checkingUpdate
                ? Locale.Settings.Update.IsChecking
                : hasNewVersion
                ? Locale.Settings.Update.FoundUpdate(remoteId ?? "ERROR")
                : Locale.Settings.Update.IsLatest
            }
          >
            {checkingUpdate ? (
              <div />
            ) : hasNewVersion ? (
              <Link href={UPDATE_URL} target="_blank" className="link">
                {Locale.Settings.Update.GoToUpdate}
              </Link>
            ) : (
              <IconButton
                icon={<ResetIcon></ResetIcon>}
                text={Locale.Settings.Update.CheckUpdate}
                onClick={() => checkUpdate(true)}
              />
            )}
          </SettingItem>

          <SettingItem title={Locale.Settings.SendKey}>
            <select
              value={config.submitKey}
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.submitKey = e.target.value as any as SubmitKey),
                );
              }}
            >
              {Object.values(SubmitKey).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </SettingItem>

          <ListItem>
            <div className={styles["settings-title"]}>
              {Locale.Settings.Theme}
            </div>
            <select
              value={config.theme}
              onChange={(e) => {
                updateConfig(
                  (config) => (config.theme = e.target.value as any as Theme),
                );
              }}
            >
              {Object.values(Theme).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </ListItem>

          <SettingItem title={Locale.Settings.Lang.Name}>
            <select
              value={getLang()}
              onChange={(e) => {
                changeLang(e.target.value as any);
              }}
            >
              {AllLangs.map((lang) => (
                <option value={lang} key={lang}>
                  {Locale.Settings.Lang.Options[lang]}
                </option>
              ))}
            </select>
          </SettingItem>

          <SettingItem
            title={Locale.Settings.FontSize.Title}
            subTitle={Locale.Settings.FontSize.SubTitle}
          >
            <InputRange
              title={`${config.fontSize ?? 14}px`}
              value={config.fontSize}
              min="12"
              max="18"
              step="1"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.fontSize = Number.parseInt(e.currentTarget.value)),
                )
              }
            ></InputRange>
          </SettingItem>

          <SettingItem title={Locale.Settings.TightBorder}>
            <input
              type="checkbox"
              checked={config.tightBorder}
              onChange={(e) =>
                updateConfig(
                  (config) => (config.tightBorder = e.currentTarget.checked),
                )
              }
            ></input>
          </SettingItem>

          <SettingItem title={Locale.Settings.SendPreviewBubble}>
            <input
              type="checkbox"
              checked={config.sendPreviewBubble}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.sendPreviewBubble = e.currentTarget.checked),
                )
              }
            ></input>
          </SettingItem>
        </List>

        <List>
          {enabledAccessControl ? (
            <SettingItem
              title={Locale.Settings.AccessCode.Title}
              subTitle={Locale.Settings.AccessCode.SubTitle}
            >
              <PasswordInput
                value={accessStore.accessCode}
                type="text"
                placeholder={Locale.Settings.AccessCode.Placeholder}
                onChange={(e) => {
                  accessStore.updateCode(e.currentTarget.value);
                }}
              />
            </SettingItem>
          ) : (
            <></>
          )}

          <SettingItem
            title={Locale.Settings.Token.Title}
            subTitle={Locale.Settings.Token.SubTitle}
          >
            <PasswordInput
              value={accessStore.token}
              type="text"
              placeholder={Locale.Settings.Token.Placeholder}
              onChange={(e) => {
                accessStore.updateToken(e.currentTarget.value);
              }}
            />
          </SettingItem>

          <SettingItem
            title={Locale.Settings.Endpoint?.Title ?? "API Base URL"}
            subTitle={
              Locale.Settings.Endpoint?.SubTitle ?? "用于代理或自定义厂商接口"
            }
          >
            <input
              value={accessStore.endpoint}
              type="text"
              placeholder={
                Locale.Settings.Endpoint?.Placeholder ??
                "例如：https://api.openai.com"
              }
              onChange={(e) => {
                accessStore.updateEndpoint(e.currentTarget.value);
              }}
            />
          </SettingItem>

          <SettingItem
            title={Locale.Settings.HealthCheck?.Title ?? "健康检查"}
            subTitle={
              checkingHealth
                ? Locale.Settings.HealthCheck?.Checking ?? "正在检查…"
                : health
                ? health.ok
                  ? Locale.Settings.HealthCheck?.Ok ?? "服务正常"
                  : Locale.Settings.HealthCheck?.Fail(
                      health.message ?? String(health.status ?? ""),
                    ) ?? `检查失败：${health?.message ?? health?.status ?? ""}`
                : ""
            }
          >
            <IconButton
              icon={<ResetIcon></ResetIcon>}
              text={Locale.Settings.HealthCheck?.Check ?? "检查"}
              onClick={checkHealth}
            />
          </SettingItem>

          <SettingItem
            title={Locale.Settings.Usage.Title}
            subTitle={
              showUsage
                ? loadingUsage
                  ? Locale.Settings.Usage.IsChecking
                  : Locale.Settings.Usage.SubTitle(
                      usage?.used ?? "[?]",
                      usage?.subscription ?? "[?]",
                    )
                : Locale.Settings.Usage.NoAccess
            }
          >
            {!showUsage || loadingUsage ? (
              <div />
            ) : (
              <IconButton
                icon={<ResetIcon></ResetIcon>}
                text={Locale.Settings.Usage.Check}
                onClick={checkUsage}
              />
            )}
          </SettingItem>

          <SettingItem
            title={Locale.Settings.HistoryCount.Title}
            subTitle={Locale.Settings.HistoryCount.SubTitle}
          >
            <InputRange
              title={config.historyMessageCount.toString()}
              value={config.historyMessageCount}
              min="0"
              max="25"
              step="1"
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.historyMessageCount = e.target.valueAsNumber),
                )
              }
            ></InputRange>
          </SettingItem>

          <SettingItem
            title={Locale.Settings.CompressThreshold.Title}
            subTitle={Locale.Settings.CompressThreshold.SubTitle}
          >
            <input
              type="number"
              min={500}
              max={4000}
              value={config.compressMessageLengthThreshold}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.compressMessageLengthThreshold =
                      e.currentTarget.valueAsNumber),
                )
              }
            ></input>
          </SettingItem>
        </List>

        <List>
          <SettingItem title={"语音朗读提供商"}>
            <select
              value={accessStore.ttsProvider}
              onChange={(e) => {
                accessStore.updateTtsProvider(e.currentTarget.value as any);
              }}
            >
              {["openai", "custom"].map((p) => (
                <option value={p} key={p}>
                  {p}
                </option>
              ))}
            </select>
          </SettingItem>
          <SettingItem title={"朗读模型"}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={accessStore.ttsModel}
                onChange={(e) => {
                  accessStore.updateTtsModel(e.currentTarget.value);
                }}
              >
                {ttsModels && ttsModels.length > 0
                  ? ttsModels.map((name) => (
                      <option value={name} key={name}>
                        {name}
                      </option>
                    ))
                  : ["tts-1", "gpt-4o-mini-tts"].map((name) => (
                      <option value={name} key={name}>
                        {name}
                      </option>
                    ))}
              </select>
              <IconButton
                icon={<ResetIcon />}
                text={loadingTtsModels ? "获取中…" : "获取/刷新"}
                onClick={fetchTtsModels}
              />
            </div>
          </SettingItem>
          <SettingItem title={"朗读音色"}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={voiceSelectValue}
                onChange={(e) => {
                  accessStore.updateTtsVoice(e.currentTarget.value);
                }}
              >
                <option value="" disabled>
                  选择音色
                </option>
                {OPENAI_TTS_VOICES.map((v) => (
                  <option value={v} key={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                value={accessStore.ttsVoice}
                type="text"
                placeholder={"如：alloy 或自定义"}
                onChange={(e) => {
                  accessStore.updateTtsVoice(e.currentTarget.value);
                }}
              />
            </div>
          </SettingItem>
          <SettingItem title={"朗读格式"}>
            <select
              value={accessStore.ttsFormat}
              onChange={(e) => {
                accessStore.updateTtsFormat(e.currentTarget.value as any);
              }}
            >
              {["mp3", "wav", "ogg"].map((fmt) => (
                <option value={fmt} key={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </SettingItem>
          <SettingItem title={"朗读 API Key"}>
            <PasswordInput
              value={accessStore.ttsApiKey}
              type="text"
              placeholder={"仅自定义端点需要"}
              onChange={(e) => {
                accessStore.updateTtsApiKey(e.currentTarget.value);
              }}
            />
          </SettingItem>
          <SettingItem title={"朗读端点"}>
            <input
              value={accessStore.ttsEndpoint}
              type="text"
              placeholder={"自定义 TTS 服务端点（OpenAI 接口格式）"}
              onChange={(e) => {
                accessStore.updateTtsEndpoint(e.currentTarget.value);
              }}
            />
          </SettingItem>
        </List>

        <List>
          <SettingItem title={"视频生成提供商"}>
            <select
              value={accessStore.videoProvider}
              onChange={(e) => {
                accessStore.updateVideoProvider(e.currentTarget.value as any);
              }}
            >
              {["chat", "custom"].map((p) => (
                <option value={p} key={p}>
                  {p === "chat" ? "使用聊天配置" : "自定义"}
                </option>
              ))}
            </select>
          </SettingItem>
          <SettingItem title={"视频模型"}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={accessStore.videoModel}
                onChange={(e) => {
                  accessStore.updateVideoModel(e.currentTarget.value);
                }}
              >
                {videoModels && videoModels.length > 0
                  ? videoModels.map((name) => (
                      <option value={name} key={name}>
                        {name}
                      </option>
                    ))
                  : accessStore.models && accessStore.models.length > 0
                  ? accessStore.models.map((name) => (
                      <option value={name} key={name}>
                        {name}
                      </option>
                    ))
                  : ["gpt-4o-mini", "gpt-4o", "gpt-4.1"].map((name) => (
                      <option value={name} key={name}>
                        {name}
                      </option>
                    ))}
              </select>
              <IconButton
                icon={<ResetIcon />}
                text={loadingVideoModels ? "获取中…" : "获取/刷新"}
                onClick={fetchVideoModels}
              />
            </div>
          </SettingItem>
          <SettingItem title={"视频 API Key"}>
            <PasswordInput
              value={accessStore.videoApiKey}
              type="text"
              placeholder={"仅自定义端点需要"}
              onChange={(e) => {
                accessStore.updateVideoApiKey(e.currentTarget.value);
              }}
            />
          </SettingItem>
          <SettingItem title={"视频端点"}>
            <input
              value={accessStore.videoEndpoint}
              type="text"
              placeholder={"自定义视频服务端点（OpenAI 接口格式）"}
              onChange={(e) => {
                accessStore.updateVideoEndpoint(e.currentTarget.value);
              }}
            />
          </SettingItem>
          <SettingItem title={"任务创建路径"} subTitle={"如：v1/video/tasks"}>
            <input
              value={accessStore.videoCreatePath || ""}
              type="text"
              placeholder={"相对路径，拼接到端点后"}
              onChange={(e) => {
                accessStore.updateVideoCreatePath(e.currentTarget.value);
              }}
            />
          </SettingItem>
          <SettingItem title={"任务查询路径"} subTitle={"如：v1/video/tasks/"}>
            <input
              value={accessStore.videoQueryPath || ""}
              type="text"
              placeholder={"相对路径，后接任务ID"}
              onChange={(e) => {
                accessStore.updateVideoQueryPath(e.currentTarget.value);
              }}
            />
          </SettingItem>
        </List>

        <List>
          <SettingItem title={"语音识别提供商"}>
            <select
              value={accessStore.voiceProvider}
              onChange={(e) => {
                accessStore.updateVoiceProvider(e.currentTarget.value as any);
              }}
            >
              {["openai", "microsoft", "custom"].map((p) => (
                <option value={p} key={p}>
                  {p}
                </option>
              ))}
            </select>
          </SettingItem>
          <SettingItem title={"语音模型"}>
            <input
              value={accessStore.voiceModel}
              type="text"
              placeholder={"如：whisper-1"}
              onChange={(e) => {
                accessStore.updateVoiceModel(e.currentTarget.value);
              }}
            />
          </SettingItem>
          <SettingItem title={"语音 API Key"}>
            <PasswordInput
              value={accessStore.voiceApiKey}
              type="text"
              placeholder={"仅自定义或微软端点需要"}
              onChange={(e) => {
                accessStore.updateVoiceApiKey(e.currentTarget.value);
              }}
            />
          </SettingItem>
          <SettingItem title={"语音端点"}>
            <input
              value={accessStore.voiceEndpoint}
              type="text"
              placeholder={"自定义或微软 STT 端点"}
              onChange={(e) => {
                accessStore.updateVoiceEndpoint(e.currentTarget.value);
              }}
            />
          </SettingItem>
        </List>

        <List>
          <SettingItem title={"翻译提供商"}>
            <select
              value={accessStore.translationProvider}
              onChange={(e) => {
                accessStore.updateTranslationProvider(
                  e.currentTarget.value as any,
                );
              }}
            >
              {["openai", "deepl", "microsoft", "google", "custom"].map((p) => (
                <option value={p} key={p}>
                  {p}
                </option>
              ))}
            </select>
          </SettingItem>
          <SettingItem title={"目标语言"}>
            <select
              value={accessStore.translationTargetLang}
              onChange={(e) => {
                accessStore.updateTranslationTargetLang(e.currentTarget.value);
              }}
            >
              {["en", "zh", "ja", "ko", "fr", "de", "es", "it", "ru"].map(
                (l) => (
                  <option value={l} key={l}>
                    {l}
                  </option>
                ),
              )}
            </select>
          </SettingItem>
          <SettingItem title={"翻译 API Key"}>
            <PasswordInput
              value={accessStore.translationApiKey}
              type="text"
              placeholder={"仅自定义端点需要"}
              onChange={(e) => {
                accessStore.updateTranslationApiKey(e.currentTarget.value);
              }}
            />
          </SettingItem>
          <SettingItem title={"翻译端点"}>
            <input
              value={accessStore.translationEndpoint}
              type="text"
              placeholder={"自定义翻译服务端点"}
              onChange={(e) => {
                accessStore.updateTranslationEndpoint(e.currentTarget.value);
              }}
            />
          </SettingItem>
        </List>

        <List>
          <SettingItem
            title={Locale.Settings.Prompt.Disable.Title}
            subTitle={Locale.Settings.Prompt.Disable.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.disablePromptHint}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.disablePromptHint = e.currentTarget.checked),
                )
              }
            ></input>
          </SettingItem>

          <SettingItem
            title={Locale.Settings.Prompt.List}
            subTitle={Locale.Settings.Prompt.ListCount(
              builtinCount,
              customCount,
            )}
          >
            <IconButton
              icon={<EditIcon />}
              text={Locale.Settings.Prompt.Edit}
              onClick={() => setShowPromptModal(true)}
            />
          </SettingItem>
        </List>

        <List>
          <SettingItem title={Locale.Settings.Model}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select
                value={config.modelConfig.model}
                onChange={(e) => {
                  updateConfig(
                    (config) =>
                      (config.modelConfig.model = ModalConfigValidator.model(
                        e.currentTarget.value,
                      )),
                  );
                }}
              >
                {accessStore.models && accessStore.models.length > 0
                  ? accessStore.models.map((name) => (
                      <option value={name} key={name}>
                        {name}
                      </option>
                    ))
                  : ALL_MODELS.map((v) => (
                      <option
                        value={v.name}
                        key={v.name}
                        disabled={!v.available}
                      >
                        {v.name}
                      </option>
                    ))}
              </select>
              <IconButton
                icon={<ResetIcon />}
                text={loadingModels ? "获取中…" : "获取/刷新"}
                onClick={fetchModels}
              />
            </div>
          </SettingItem>
          <SettingItem
            title={Locale.Settings.Temperature.Title}
            subTitle={Locale.Settings.Temperature.SubTitle}
          >
            <InputRange
              value={config.modelConfig.temperature?.toFixed(1)}
              min="0"
              max="2"
              step="0.1"
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.modelConfig.temperature =
                      ModalConfigValidator.temperature(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </SettingItem>
          <SettingItem
            title={Locale.Settings.MaxTokens.Title}
            subTitle={Locale.Settings.MaxTokens.SubTitle}
          >
            <input
              type="number"
              min={100}
              max={32000}
              value={config.modelConfig.max_tokens}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.modelConfig.max_tokens =
                      ModalConfigValidator.max_tokens(
                        e.currentTarget.valueAsNumber,
                      )),
                )
              }
            ></input>
          </SettingItem>
          <SettingItem
            title={Locale.Settings.PresencePenlty.Title}
            subTitle={Locale.Settings.PresencePenlty.SubTitle}
          >
            <InputRange
              value={config.modelConfig.presence_penalty?.toFixed(1)}
              min="-2"
              max="2"
              step="0.5"
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.modelConfig.presence_penalty =
                      ModalConfigValidator.presence_penalty(
                        e.currentTarget.valueAsNumber,
                      )),
                );
              }}
            ></InputRange>
          </SettingItem>
        </List>

        {shouldShowPromptModal && (
          <UserPromptModal onClose={() => setShowPromptModal(false)} />
        )}
      </div>
    </ErrorBoundary>
  );
}
