import { useDebounce, useDebouncedCallback } from "use-debounce";
import { memo, useState, useRef, useEffect, useLayoutEffect } from "react";

import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import DownloadIcon from "../icons/download.svg";
import LoadingIcon from "../icons/three-dots.svg";
import BotIcon from "../icons/bot.svg";
import BlackBotIcon from "../icons/black-bot.svg";
import AddIcon from "../icons/add.svg";
import DeleteIcon from "../icons/delete.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import StopIcon from "../icons/pause.svg";
import ResetIcon from "../icons/reload.svg";
import ClearIcon from "../icons/clear.svg";
import MicIcon from "../icons/mic.svg";
import TranslateIcon from "../icons/translate.svg";

import {
  Message,
  SubmitKey,
  useChatStore,
  BOT_HELLO,
  ROLES,
  createMessage,
  useAccessStore,
  Theme,
  ModelType,
  ALL_MODELS,
  ModalConfigValidator,
} from "../store";

import {
  copyToClipboard,
  downloadAs,
  getEmojiUrl,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen,
} from "../utils";

import dynamic from "next/dynamic";

import {
  ControllerPool,
  requestModelsList,
  requestTranscribeAudio,
  requestTranslate,
  requestTextToSpeech,
} from "../requests";
import { Prompt, usePromptStore } from "../store/prompt";
import Locale from "../locales";

import { IconButton } from "./button";
import styles from "./home.module.scss";
import chatStyle from "./chat.module.scss";

import { Input, Modal, showModal, showToast } from "./ui-lib";
import { useNavigate } from "react-router-dom";
import { Path } from "../constant";
import { ModelSelectionModal } from "./model-selection";

const Markdown = dynamic(
  async () => memo((await import("./markdown")).Markdown),
  {
    loading: () => <LoadingIcon />,
  },
);

const Emoji = dynamic(async () => (await import("emoji-picker-react")).Emoji, {
  loading: () => <LoadingIcon />,
});

export function Avatar(props: { role: Message["role"]; model?: ModelType }) {
  const config = useChatStore((state) => state.config);

  if (props.role !== "user") {
    return (
      <div className="no-dark">
        {props.model?.startsWith("gpt-4") ? (
          <BlackBotIcon className={styles["user-avtar"]} />
        ) : (
          <BotIcon className={styles["user-avtar"]} />
        )}
      </div>
    );
  }

  return (
    <div className={styles["user-avtar"]}>
      <Emoji unified={config.avatar} size={18} getEmojiUrl={getEmojiUrl} />
    </div>
  );
}

function exportMessages(messages: Message[], topic: string) {
  const mdText =
    `# ${topic}\n\n` +
    messages
      .map((m) => {
        return m.role === "user"
          ? `## ${Locale.Export.MessageFromYou}:\n${m.content}`
          : `## ${Locale.Export.MessageFromChatGPT}:\n${m.content.trim()}`;
      })
      .join("\n\n");
  const filename = `${topic}.md`;

  showModal({
    title: Locale.Export.Title,
    children: (
      <div className="markdown-body">
        <pre className={styles["export-content"]}>{mdText}</pre>
      </div>
    ),
    actions: [
      <IconButton
        key="copy"
        icon={<CopyIcon />}
        bordered
        text={Locale.Export.Copy}
        onClick={() => copyToClipboard(mdText)}
      />,
      <IconButton
        key="download"
        icon={<DownloadIcon />}
        bordered
        text={Locale.Export.Download}
        onClick={() => downloadAs(mdText, filename)}
      />,
    ],
  });
}

function PromptToast(props: {
  showToast?: boolean;
  showModal?: boolean;
  setShowModal: (_: boolean) => void;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const context = session.context;

  const addContextPrompt = (prompt: Message) => {
    chatStore.updateCurrentSession((session) => {
      session.context.push(prompt);
    });
  };

  const removeContextPrompt = (i: number) => {
    chatStore.updateCurrentSession((session) => {
      session.context.splice(i, 1);
    });
  };

  const updateContextPrompt = (i: number, prompt: Message) => {
    chatStore.updateCurrentSession((session) => {
      session.context[i] = prompt;
    });
  };

  return (
    <div className={chatStyle["prompt-toast"]} key="prompt-toast">
      {props.showToast && (
        <div
          className={chatStyle["prompt-toast-inner"] + " clickable"}
          role="button"
          onClick={() => props.setShowModal(true)}
        >
          <BrainIcon />
          <span className={chatStyle["prompt-toast-content"]}>
            {Locale.Context.Toast(context.length)}
          </span>
        </div>
      )}
      {props.showModal && (
        <div className="modal-mask">
          <Modal
            title={Locale.Context.Edit}
            onClose={() => props.setShowModal(false)}
            actions={[
              <IconButton
                key="reset"
                icon={<CopyIcon />}
                bordered
                text={Locale.Memory.Reset}
                onClick={() =>
                  confirm(Locale.Memory.ResetConfirm) &&
                  chatStore.resetSession()
                }
              />,
              <IconButton
                key="copy"
                icon={<CopyIcon />}
                bordered
                text={Locale.Memory.Copy}
                onClick={() => copyToClipboard(session.memoryPrompt)}
              />,
            ]}
          >
            <>
              <div className={chatStyle["context-prompt"]}>
                {context.map((c, i) => (
                  <div className={chatStyle["context-prompt-row"]} key={i}>
                    <select
                      value={c.role}
                      className={chatStyle["context-role"]}
                      onChange={(e) =>
                        updateContextPrompt(i, {
                          ...c,
                          role: e.target.value as any,
                        })
                      }
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={c.content}
                      type="text"
                      className={chatStyle["context-content"]}
                      rows={1}
                      onInput={(e) =>
                        updateContextPrompt(i, {
                          ...c,
                          content: e.currentTarget.value as any,
                        })
                      }
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      className={chatStyle["context-delete-button"]}
                      onClick={() => removeContextPrompt(i)}
                      bordered
                    />
                  </div>
                ))}

                <div className={chatStyle["context-prompt-row"]}>
                  <IconButton
                    icon={<AddIcon />}
                    text={Locale.Context.Add}
                    bordered
                    className={chatStyle["context-prompt-button"]}
                    onClick={() =>
                      addContextPrompt({
                        role: "system",
                        content: "",
                        date: "",
                      })
                    }
                  />
                </div>
              </div>
              <div className={chatStyle["memory-prompt"]}>
                <div className={chatStyle["memory-prompt-title"]}>
                  <span>
                    {Locale.Memory.Title} ({session.lastSummarizeIndex} of{" "}
                    {session.messages.length})
                  </span>

                  <label className={chatStyle["memory-prompt-action"]}>
                    {Locale.Memory.Send}
                    <input
                      type="checkbox"
                      checked={session.sendMemory}
                      onChange={() =>
                        chatStore.updateCurrentSession(
                          (session) =>
                            (session.sendMemory = !session.sendMemory),
                        )
                      }
                    ></input>
                  </label>
                </div>
                <div className={chatStyle["memory-prompt-content"]}>
                  {session.memoryPrompt || Locale.Memory.EmptyContent}
                </div>
              </div>
            </>
          </Modal>
        </div>
      )}
    </div>
  );
}

function useSubmitHandler() {
  const config = useChatStore((state) => state.config);
  const submitKey = config.submitKey;

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && e.nativeEvent.isComposing) return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export function PromptHints(props: {
  prompts: Prompt[];
  onPromptSelect: (prompt: Prompt) => void;
}) {
  if (props.prompts.length === 0) return null;

  return (
    <div className={styles["prompt-hints"]}>
      {props.prompts.map((prompt, i) => (
        <div
          className={styles["prompt-hint"]}
          key={prompt.title + i.toString()}
          onClick={() => props.onPromptSelect(prompt)}
        >
          <div className={styles["hint-title"]}>{prompt.title}</div>
          <div className={styles["hint-content"]}>{prompt.content}</div>
        </div>
      ))}
    </div>
  );
}

function useScrollToBottom() {
  // for auto-scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollToBottom = () => {
    const dom = scrollRef.current;
    if (dom) {
      setTimeout(() => (dom.scrollTop = dom.scrollHeight), 1);
    }
  };

  // auto scroll
  useLayoutEffect(() => {
    autoScroll && scrollToBottom();
  });

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollToBottom,
  };
}

export function ChatActions(props: {
  showPromptModal: () => void;
  scrollToBottom: () => void;
  hitBottom: boolean;
  onUpdateInput: (text: string) => void;
  inputValue: string;
  onTranslatingChange?: (busy: boolean) => void;
}) {
  const chatStore = useChatStore();
  const accessStore = useAccessStore();
  const config = useChatStore((state) => state.config);
  const updateConfig = useChatStore((state) => state.updateConfig);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showModelSelection, setShowModelSelection] = useState(false);

  // uploader
  const fileInputRef = useRef<HTMLInputElement>(null);
  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;
    let attachedCount = 0;
    for (const file of Array.from(files)) {
      const type = file.type;
      const isText =
        type.startsWith("text/") ||
        type === "application/json" ||
        type === "text/markdown" ||
        type === "text/csv";
      if (!isText) {
        showToast(`暂不支持该文件类型: ${type || file.name}`);
        continue;
      }
      const content = await file.text();
      chatStore.updateCurrentSession((session) => {
        session.context.push(
          createMessage({
            role: "system",
            content: `附件 ${file.name}:\n\n${content}`,
          }),
        );
      });
      attachedCount += 1;
    }
    if (attachedCount > 0) {
      showToast(`已附加 ${attachedCount} 个文件到上下文`);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // voice recorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recordState, setRecordState] = useState<
    "idle" | "recording" | "awaiting_restore"
  >("idle");
  async function onVoiceClick() {
    try {
      if (recordState === "idle") {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const mr = new MediaRecorder(stream);
        mediaRecorderRef.current = mr;
        chunksRef.current = [];
        mr.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };
        mr.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          try {
            const text = await requestTranscribeAudio(blob);
            if (!text || text.length === 0) {
              showToast("未识别到语音内容");
            } else {
              props.onUpdateInput(text);
              showToast("已转写到输入框");
            }
          } catch (e: any) {
            showToast(String(e?.message ?? e));
          } finally {
            chunksRef.current = [];
            // 识别完成后保持“输入中”图标，等待用户点击恢复
            setRecordState("awaiting_restore");
          }
        };
        mr.start();
        setRecordState("recording");
      } else if (recordState === "recording") {
        mediaRecorderRef.current?.stop();
        // 不在这里恢复，等待识别完成后由用户点击恢复
      } else {
        // awaiting_restore -> 恢复到 idle
        setRecordState("idle");
      }
    } catch (e: any) {
      showToast(String(e?.message ?? e));
    }
  }

  // translation
  const LANG_OPTIONS = [
    { code: "zh", label: "中文" },
    { code: "en", label: "英语" },
    { code: "ja", label: "日语" },
    { code: "ko", label: "韩语" },
    { code: "fr", label: "法语" },
    { code: "de", label: "德语" },
    { code: "es", label: "西班牙语" },
    { code: "it", label: "意大利语" },
    { code: "ru", label: "俄语" },
  ];
  const [translating, setTranslating] = useState(false);
  async function doTranslate() {
    const text = props.inputValue || "";
    if (!text.trim()) {
      showToast("输入框为空，无法翻译");
      return;
    }
    if (translating) return;
    props.onTranslatingChange?.(true);
    setTranslating(true);
    try {
      const translated = await requestTranslate(
        text,
        accessStore.translationTargetLang || "zh",
      );
      props.onUpdateInput(translated);
      showToast("已翻译到输入框");
    } catch (e: any) {
      showToast(String(e?.message ?? e));
    } finally {
      setTranslating(false);
      props.onTranslatingChange?.(false);
    }
  }
  function openTranslateMenu() {
    showModal({
      title: "选择目标语言",
      children: (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {LANG_OPTIONS.map((l) => (
            <div
              key={l.code}
              className="clickable"
              onClick={() => {
                accessStore.updateTranslationTargetLang(l.code);
                doTranslate();
              }}
              style={{
                padding: "6px 10px",
                border: "1px solid var(--borderColor)",
                borderRadius: 6,
              }}
            >
              {l.label}
            </div>
          ))}
        </div>
      ),
    });
  }

  // switch themes
  const theme = chatStore.config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    chatStore.updateConfig((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const couldStop = ControllerPool.hasPending();
  const stopAll = () => ControllerPool.stopAll();

  // clear context (memory + custom context)
  function clearContext() {
    chatStore.updateCurrentSession((session) => {
      session.context = [];
      session.memoryPrompt = "";
      session.lastSummarizeIndex = 0;
    });
    showToast("已清理上下文");
  }

  // fetch/refresh models
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

  return (
    <div className={chatStyle["chat-input-actions"]}>
      {couldStop && (
        <div
          className={`${chatStyle["chat-input-action"]} clickable`}
          onClick={stopAll}
        >
          <StopIcon />
        </div>
      )}
      {!props.hitBottom && (
        <div
          className={`${chatStyle["chat-input-action"]} clickable`}
          onClick={props.scrollToBottom}
        >
          <BottomIcon />
        </div>
      )}
      {props.hitBottom && (
        <div
          className={`${chatStyle["chat-input-action"]} clickable`}
          onClick={props.showPromptModal}
        >
          <BrainIcon />
        </div>
      )}

      <div
        className={`${chatStyle["chat-input-action"]} clickable`}
        onClick={nextTheme}
        title={Locale.Settings.Theme}
      >
        {theme === Theme.Auto ? (
          <AutoIcon />
        ) : theme === Theme.Light ? (
          <LightIcon />
        ) : theme === Theme.Dark ? (
          <DarkIcon />
        ) : null}
      </div>

      <div
        className={`${chatStyle["chat-input-action"]} clickable`}
        onClick={clearContext}
        title={"清理上下文"}
      >
        <ClearIcon />
      </div>

      {/* Upload files as context */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="text/*,application/json,text/markdown,text/csv"
        style={{ display: "none" }}
        onChange={(e) => onFilesSelected(e.currentTarget.files)}
      />
      <div
        className={`${chatStyle["chat-input-action"]} clickable`}
        onClick={() => fileInputRef.current?.click()}
        title={"上传文件到上下文"}
      >
        <AddIcon />
      </div>

      {/* Voice input */}
      <div
        className={`${chatStyle["chat-input-action"]} clickable`}
        onClick={onVoiceClick}
        title={
          recordState === "idle"
            ? "开始语音输入"
            : recordState === "recording"
            ? "正在录音，点击停止并转写"
            : "转写完成，点击恢复"
        }
      >
        {recordState === "idle" ? (
          <MicIcon width={16} height={16} />
        ) : (
          <LoadingIcon />
        )}
      </div>

      {/* Translate input */}
      <div
        className={`${chatStyle["chat-input-action"]} clickable`}
        onClick={translating ? undefined : openTranslateMenu}
        title={translating ? "正在翻译…" : "翻译输入框内容"}
        aria-busy={translating}
        style={{ pointerEvents: translating ? "none" : undefined }}
      >
        {translating ? (
          <LoadingIcon />
        ) : (
          <TranslateIcon width={16} height={16} />
        )}
      </div>

      {/* Model selection: show current model as text, click to open menu */}
      <div
        className={`${chatStyle["chat-input-action"]} clickable`}
        onClick={() => setShowModelSelection(true)}
        title={`当前模型：${config.modelConfig.model}`}
      >
        <span style={{ fontSize: 12 }}>{config.modelConfig.model}</span>
      </div>
      {showModelSelection && (
        <ModelSelectionModal
          models={
            accessStore.models && accessStore.models.length > 0
              ? accessStore.models
              : ALL_MODELS.filter((v) => v.available).map((v) => v.name)
          }
          currentModel={config.modelConfig.model}
          onSelect={(model) => {
            updateConfig(
              (config) =>
                (config.modelConfig.model = ModalConfigValidator.model(model)),
            );
          }}
          onClose={() => setShowModelSelection(false)}
        />
      )}
    </div>
  );
}

export function Chat() {
  type RenderMessage = Message & { preview?: boolean };

  const chatStore = useChatStore();
  const [session, sessionIndex] = useChatStore((state) => [
    state.currentSession(),
    state.currentSessionIndex,
  ]);
  const fontSize = useChatStore((state) => state.config.fontSize);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [beforeInput, setBeforeInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatingMessageId, setTranslatingMessageId] = useState<
    number | null
  >(null);
  const [speaking, setSpeaking] = useState<{
    id: number | null;
    loading: boolean;
  }>({ id: null, loading: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [audioTick, setAudioTick] = useState(0);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const { scrollRef, setAutoScroll, scrollToBottom } = useScrollToBottom();
  const [hitBottom, setHitBottom] = useState(false);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();

  const formatTime = (s?: number) => {
    const sec = Math.max(0, Math.floor(s || 0));
    const mm = Math.floor(sec / 60);
    const ss = sec % 60;
    return `${mm}:${String(ss).padStart(2, "0")}`;
  };

  const onChatBodyScroll = (e: HTMLElement) => {
    const isTouchBottom = e.scrollTop + e.clientHeight >= e.scrollHeight - 20;
    setHitBottom(isTouchBottom);
  };

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<Prompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      setPromptHints(promptStore.search(text));
    },
    100,
    { leading: true, trailing: true },
  );

  const onPromptSelect = (prompt: Prompt) => {
    setUserInput(prompt.content);
    setPromptHints([]);
    inputRef.current?.focus();
  };

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        5,
        Math.max(2 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    setUserInput(text);
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (!chatStore.config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };

  // submit user input
  const onUserSubmit = () => {
    if (userInput.length <= 0) return;
    setIsLoading(true);
    chatStore.onUserInput(userInput).then(() => setIsLoading(false));
    setBeforeInput(userInput);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);
  };

  // stop response
  const onUserStop = (messageId: number) => {
    ControllerPool.stop(sessionIndex, messageId);
  };

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput
    if (e.key === "ArrowUp" && userInput.length <= 0) {
      setUserInput(beforeInput);
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e)) {
      onUserSubmit();
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: Message) => {
    // auto fill user input
    if (message.role === "user") {
      setUserInput(message.content);
    }

    // copy to clipboard
    if (selectOrCopy(e.currentTarget, message.content)) {
      e.preventDefault();
    }
  };

  const findLastUesrIndex = (messageId: number) => {
    // find last user input message and resend
    let lastUserMessageIndex: number | null = null;
    for (let i = 0; i < session.messages.length; i += 1) {
      const message = session.messages[i];
      if (message.id === messageId) {
        break;
      }
      if (message.role === "user") {
        lastUserMessageIndex = i;
      }
    }

    return lastUserMessageIndex;
  };

  const deleteMessage = (userIndex: number) => {
    chatStore.updateCurrentSession((session) =>
      session.messages.splice(userIndex, 2),
    );
  };

  const onDelete = (botMessageId: number) => {
    const userIndex = findLastUesrIndex(botMessageId);
    if (userIndex === null) return;
    deleteMessage(userIndex);
  };

  const onResend = (botMessageId: number) => {
    // find last user input message and resend
    const userIndex = findLastUesrIndex(botMessageId);
    if (userIndex === null) return;

    setIsLoading(true);
    const content = session.messages[userIndex].content;
    deleteMessage(userIndex);
    chatStore.onUserInput(content).then(() => setIsLoading(false));
    inputRef.current?.focus();
  };

  const config = useChatStore((state) => state.config);

  const context: RenderMessage[] = session.context.slice();

  const accessStore = useAccessStore();

  // message translation helpers
  const MSG_LANG_OPTIONS = [
    { code: "zh", label: "中文" },
    { code: "en", label: "英语" },
    { code: "ja", label: "日语" },
    { code: "ko", label: "韩语" },
    { code: "fr", label: "法语" },
    { code: "de", label: "德语" },
    { code: "es", label: "西班牙语" },
    { code: "it", label: "意大利语" },
    { code: "ru", label: "俄语" },
  ];
  async function doTranslateMessage(
    id: number,
    content: string,
    target: string,
  ) {
    if (!content || !content.trim()) {
      showToast("消息为空，无法翻译");
      return;
    }
    if (translatingMessageId != null) return;
    setTranslatingMessageId(id);
    try {
      const translated = await requestTranslate(
        content,
        target || accessStore.translationTargetLang || "zh",
      );
      showModal({
        title: `翻译结果（${target}）`,
        children: (
          <div className="markdown-body">
            <pre
              className={styles["export-content"]}
              style={{ whiteSpace: "pre-wrap" }}
            >
              {translated}
            </pre>
          </div>
        ),
        actions: [
          <IconButton
            key="copy"
            icon={<CopyIcon />}
            bordered
            text={"复制"}
            onClick={() => copyToClipboard(translated)}
          />,
          <IconButton
            key="fill"
            icon={<RenameIcon />}
            bordered
            text={"填充到输入框"}
            onClick={() => setUserInput(translated)}
          />,
        ],
      });
    } catch (e: any) {
      showToast(String(e?.message ?? e));
    } finally {
      setTranslatingMessageId(null);
    }
  }
  function openTranslateMessageMenu(id: number, content: string) {
    showModal({
      title: "选择目标语言",
      children: (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {MSG_LANG_OPTIONS.map((l) => (
            <div
              key={l.code}
              className="clickable"
              onClick={() => doTranslateMessage(id, content, l.code)}
              style={{
                padding: "6px 10px",
                border: "1px solid var(--borderColor)",
                borderRadius: 6,
              }}
            >
              {l.label}
            </div>
          ))}
        </div>
      ),
    });
  }

  async function doSpeakMessage(id: number, content: string) {
    if (!content || !content.trim()) {
      showToast("消息为空，无法朗读");
      return;
    }
    if (speaking.loading) return;
    setSpeaking({ id, loading: true });
    try {
      const blob = await requestTextToSpeech(content, {
        format: accessStore.ttsFormat || "mp3",
        voice: accessStore.ttsVoice || "alloy",
        model: accessStore.ttsModel || "tts-1",
      });
      if (!blob || blob.size === 0) {
        throw new Error("生成的音频为空");
      }
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
      audioRef.current.src = url;
      audioRef.current.oncanplay = async () => {
        try {
          await audioRef.current?.play();
        } catch (err: any) {
          showToast(String(err?.message || err));
        }
      };
      audioRef.current.ontimeupdate = () => setAudioTick((t) => t + 1);
      audioRef.current.ondurationchange = () => setAudioTick((t) => t + 1);
      audioRef.current.onerror = () => {
        showToast("无法播放音频，请检查格式或网络");
      };
      audioRef.current.onended = () => {
        setSpeaking({ id: null, loading: false });
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
        audioRef.current = null;
      };
      // 触发加载
      audioRef.current.load();
      setSpeaking({ id, loading: false });
    } catch (e: any) {
      showToast(String(e?.message ?? e));
      setSpeaking({ id: null, loading: false });
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      audioRef.current = null;
    }
  }
  function stopSpeaking() {
    try {
      audioRef.current?.pause();
    } catch {}
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setSpeaking({ id: null, loading: false });
  }

  if (
    context.length === 0 &&
    session.messages.at(0)?.content !== BOT_HELLO.content
  ) {
    const copiedHello = Object.assign({}, BOT_HELLO);
    if (!accessStore.isAuthorized()) {
      copiedHello.content = Locale.Error.Unauthorized;
    }
    context.push(copiedHello);
  }

  // preview messages
  const messages = context
    .concat(session.messages as RenderMessage[])
    .concat(
      isLoading
        ? [
            {
              ...createMessage({
                role: "assistant",
                content: "……",
              }),
              preview: true,
            },
          ]
        : [],
    )
    .concat(
      userInput.length > 0 && config.sendPreviewBubble
        ? [
            {
              ...createMessage({
                role: "user",
                content: userInput,
              }),
              preview: true,
            },
          ]
        : [],
    );

  const [showPromptModal, setShowPromptModal] = useState(false);

  const renameSession = () => {
    const newTopic = prompt(Locale.Chat.Rename, session.topic);
    if (newTopic && newTopic !== session.topic) {
      chatStore.updateCurrentSession((session) => (session.topic = newTopic!));
    }
  };

  // Auto focus
  useEffect(() => {
    if (isMobileScreen) return;
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.chat} key={session.id}>
      <div className={styles["window-header"]}>
        <div className={styles["window-header-title"]}>
          <div
            className={`${styles["window-header-main-title"]} ${styles["chat-body-title"]}`}
            onClickCapture={renameSession}
          >
            {session.topic}
          </div>
          <div className={styles["window-header-sub-title"]}>
            {Locale.Chat.SubTitle(session.messages.length)}
          </div>
        </div>
        <div className={styles["window-actions"]}>
          <div className={styles["window-action-button"] + " " + styles.mobile}>
            <IconButton
              icon={<ReturnIcon />}
              bordered
              title={Locale.Chat.Actions.ChatList}
              onClick={() => navigate(Path.Home)}
            />
          </div>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<RenameIcon />}
              bordered
              onClick={renameSession}
            />
          </div>
          <div className={styles["window-action-button"]}>
            <IconButton
              icon={<ExportIcon />}
              bordered
              title={Locale.Chat.Actions.Export}
              onClick={() => {
                exportMessages(
                  session.messages.filter((msg) => !msg.isError),
                  session.topic,
                );
              }}
            />
          </div>
          {!isMobileScreen && (
            <div className={styles["window-action-button"]}>
              <IconButton
                icon={chatStore.config.tightBorder ? <MinIcon /> : <MaxIcon />}
                bordered
                onClick={() => {
                  chatStore.updateConfig(
                    (config) => (config.tightBorder = !config.tightBorder),
                  );
                }}
              />
            </div>
          )}
        </div>

        <PromptToast
          showToast={!hitBottom}
          showModal={showPromptModal}
          setShowModal={setShowPromptModal}
        />
      </div>

      <div
        className={styles["chat-body"]}
        ref={scrollRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        onMouseDown={() => inputRef.current?.blur()}
        onWheel={(e) => setAutoScroll(hitBottom && e.deltaY > 0)}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        {messages.map((message, i) => {
          const isUser = message.role === "user";
          const showActions =
            !isUser &&
            i > 0 &&
            !(message.preview || message.content.length === 0);
          const showTyping = message.preview || message.streaming;
          const msgId = message.id ?? i;

          return (
            <div
              key={i}
              className={
                isUser ? styles["chat-message-user"] : styles["chat-message"]
              }
            >
              <div className={styles["chat-message-container"]}>
                <div className={styles["chat-message-avatar"]}>
                  <Avatar role={message.role} model={message.model} />
                </div>
                {showTyping && (
                  <div className={styles["chat-message-status"]}>
                    {Locale.Chat.Typing}
                  </div>
                )}
                <div className={styles["chat-message-item"]}>
                  {showActions && (
                    <div className={styles["chat-message-top-actions"]}>
                      {message.streaming ? (
                        <div
                          className={styles["chat-message-top-action"]}
                          onClick={() => onUserStop(message.id ?? i)}
                        >
                          {Locale.Chat.Actions.Stop}
                        </div>
                      ) : (
                        <>
                          <div
                            className={styles["chat-message-top-action"]}
                            onClick={() => onDelete(message.id ?? i)}
                          >
                            {Locale.Chat.Actions.Delete}
                          </div>
                          <div
                            className={styles["chat-message-top-action"]}
                            onClick={() => onResend(message.id ?? i)}
                          >
                            {Locale.Chat.Actions.Retry}
                          </div>
                          <div
                            className={styles["chat-message-top-action"]}
                            onClick={() =>
                              openTranslateMessageMenu(msgId, message.content)
                            }
                            aria-busy={translatingMessageId === msgId}
                          >
                            {translatingMessageId === msgId ? (
                              <LoadingIcon />
                            ) : (
                              "翻译"
                            )}
                          </div>
                          <div
                            className={styles["chat-message-top-action"]}
                            onClick={() => {
                              if (speaking.id === msgId) {
                                stopSpeaking();
                              } else {
                                doSpeakMessage(msgId, message.content);
                              }
                            }}
                            aria-busy={
                              speaking.loading && speaking.id === msgId
                            }
                          >
                            {speaking.loading && speaking.id === msgId ? (
                              <LoadingIcon />
                            ) : speaking.id === msgId ? (
                              "停止朗读"
                            ) : (
                              "朗读"
                            )}
                          </div>
                        </>
                      )}

                      <div
                        className={styles["chat-message-top-action"]}
                        onClick={() => copyToClipboard(message.content)}
                      >
                        {Locale.Chat.Actions.Copy}
                      </div>
                    </div>
                  )}
                  <Markdown
                    content={message.content}
                    loading={
                      (message.preview || message.content.length === 0) &&
                      !isUser
                    }
                    onContextMenu={(e) => onRightClick(e, message)}
                    onDoubleClickCapture={() => {
                      if (!isMobileScreen) return;
                      setUserInput(message.content);
                    }}
                    fontSize={fontSize}
                    parentRef={scrollRef}
                  />
                </div>
                {!isUser && !message.preview && (
                  <div className={styles["chat-message-actions"]}>
                    <div className={styles["chat-message-action-date"]}>
                      {message.date.toLocaleString()}
                    </div>
                    {speaking.id === (message.id ?? i) && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          width: "100%",
                          maxWidth: 420,
                        }}
                      >
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                          {audioRef.current
                            ? formatTime(audioRef.current.currentTime)
                            : "0:00"}
                        </span>
                        <input
                          type="range"
                          min={0}
                          max={audioRef.current?.duration || 0}
                          step={0.01}
                          value={audioRef.current?.currentTime || 0}
                          onChange={(e) => {
                            const v = Number(e.currentTarget.value);
                            if (audioRef.current) {
                              audioRef.current.currentTime = v;
                            }
                          }}
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontSize: 12, opacity: 0.7 }}>
                          {audioRef.current
                            ? formatTime(audioRef.current.duration)
                            : "0:00"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles["chat-input-panel"]}>
        <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

        <ChatActions
          showPromptModal={() => setShowPromptModal(true)}
          scrollToBottom={scrollToBottom}
          hitBottom={hitBottom}
          onUpdateInput={(text) => setUserInput(text)}
          inputValue={userInput}
          onTranslatingChange={(busy) => setIsTranslating(busy)}
        />
        <div className={styles["chat-input-panel-inner"]}>
          <textarea
            ref={inputRef}
            className={styles["chat-input"]}
            placeholder={Locale.Chat.Input(submitKey)}
            onInput={(e) => onInput(e.currentTarget.value)}
            value={userInput}
            onKeyDown={onInputKeyDown}
            onFocus={() => setAutoScroll(true)}
            onBlur={() => {
              setAutoScroll(false);
              setTimeout(() => setPromptHints([]), 500);
            }}
            autoFocus
            rows={inputRows}
          />
          <IconButton
            icon={<SendWhiteIcon />}
            text={Locale.Chat.Send}
            className={styles["chat-input-send"]}
            noDark
            onClick={onUserSubmit}
          />
        </div>
        {isTranslating && <div className={styles["chat-input-progress"]} />}
      </div>
    </div>
  );
}
