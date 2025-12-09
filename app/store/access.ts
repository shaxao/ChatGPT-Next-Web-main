import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AccessControlStore {
  accessCode: string;
  token: string;
  endpoint: string;
  models: string[];
  modelsEndpoint?: string;

  // video generation config
  videoProvider: "chat" | "custom";
  videoModel: string;
  videoApiKey: string;
  videoEndpoint: string;
  videoModels: string[];
  videoModelsEndpoint?: string;
  // video task endpoints
  videoCreatePath?: string;
  videoQueryPath?: string;

  // voice recognition config
  voiceProvider: "openai" | "microsoft" | "custom";
  voiceModel: string;
  voiceApiKey: string;
  voiceEndpoint: string;

  // text-to-speech (TTS) config
  ttsProvider: "openai" | "custom";
  ttsModel: string;
  ttsApiKey: string;
  ttsEndpoint: string;
  ttsVoice: string;
  ttsFormat: "mp3" | "wav" | "ogg";

  // translation config
  translationProvider: "openai" | "deepl" | "microsoft" | "google" | "custom";
  translationApiKey: string;
  translationEndpoint: string;
  translationTargetLang: string;

  needCode: boolean;

  updateToken: (_: string) => void;
  updateCode: (_: string) => void;
  updateEndpoint: (_: string) => void;
  setModels: (_: string[], sourceEndpoint?: string) => void;
  clearModels: () => void;
  enabledAccessControl: () => boolean;
  isAuthorized: () => boolean;
  fetch: () => void;

  // updates for voice
  updateVoiceProvider: (_: AccessControlStore["voiceProvider"]) => void;
  updateVoiceModel: (_: string) => void;
  updateVoiceApiKey: (_: string) => void;
  updateVoiceEndpoint: (_: string) => void;

  // updates for TTS
  updateTtsProvider: (_: AccessControlStore["ttsProvider"]) => void;
  updateTtsModel: (_: string) => void;
  updateTtsApiKey: (_: string) => void;
  updateTtsEndpoint: (_: string) => void;
  updateTtsVoice: (_: string) => void;
  updateTtsFormat: (_: AccessControlStore["ttsFormat"]) => void;

  // updates for translation
  updateTranslationProvider: (
    _: AccessControlStore["translationProvider"],
  ) => void;
  updateTranslationApiKey: (_: string) => void;
  updateTranslationEndpoint: (_: string) => void;
  updateTranslationTargetLang: (_: string) => void;

  // updates for video
  updateVideoProvider: (_: AccessControlStore["videoProvider"]) => void;
  updateVideoModel: (_: string) => void;
  updateVideoApiKey: (_: string) => void;
  updateVideoEndpoint: (_: string) => void;
  setVideoModels: (_: string[], sourceEndpoint?: string) => void;
  clearVideoModels: () => void;
  updateVideoCreatePath: (_: string) => void;
  updateVideoQueryPath: (_: string) => void;
}

export const ACCESS_KEY = "access-control";

let fetchState = 0; // 0 not fetch, 1 fetching, 2 done

const initialAccessState = {
  token: "",
  accessCode: "",
  endpoint: "",
  models: [],
  modelsEndpoint: undefined as string | undefined,
  videoProvider: "chat" as const,
  videoModel: "",
  videoApiKey: "",
  videoEndpoint: "",
  videoModels: [],
  videoModelsEndpoint: undefined as string | undefined,
  videoCreatePath: "v1/video/tasks",
  videoQueryPath: "v1/video/tasks/",
  voiceProvider: "openai" as const,
  voiceModel: "whisper-1",
  voiceApiKey: "",
  voiceEndpoint: "",
  ttsProvider: "openai" as const,
  ttsModel: "tts-1",
  ttsApiKey: "",
  ttsEndpoint: "",
  ttsVoice: "alloy",
  ttsFormat: "mp3" as const,
  translationProvider: "openai" as const,
  translationApiKey: "",
  translationEndpoint: "",
  translationTargetLang: "en",
  needCode: true,
};

export const useAccessStore = create<AccessControlStore>()(
  persist(
    (set, get) => ({
      ...initialAccessState,
      enabledAccessControl() {
        get().fetch();

        return get().needCode;
      },
      updateCode(code: string) {
        set(() => ({ accessCode: code }));
      },
      updateToken(token: string) {
        set(() => ({ token }));
      },
      updateEndpoint(endpoint: string) {
        const prevSource = get().modelsEndpoint;
        set(() => ({ endpoint }));
        // clear cached models if endpoint changes
        if (prevSource && prevSource !== endpoint) {
          set(() => ({ models: [], modelsEndpoint: undefined }));
        }
        // if video provider relies on chat endpoint, clear cached video models
        const prevVideoSource = get().videoModelsEndpoint;
        if (
          get().videoProvider === "chat" &&
          prevVideoSource &&
          prevVideoSource !== endpoint
        ) {
          set(() => ({ videoModels: [], videoModelsEndpoint: undefined }));
        }
      },
      setModels(models: string[], sourceEndpoint?: string) {
        set(() => ({
          models,
          modelsEndpoint: sourceEndpoint ?? get().endpoint,
        }));
      },
      clearModels() {
        set(() => ({ models: [], modelsEndpoint: undefined }));
      },
      setVideoModels(models: string[], sourceEndpoint?: string) {
        set(() => ({
          videoModels: models,
          videoModelsEndpoint:
            sourceEndpoint ??
            (get().videoProvider === "custom"
              ? get().videoEndpoint
              : get().endpoint),
        }));
      },
      clearVideoModels() {
        set(() => ({ videoModels: [], videoModelsEndpoint: undefined }));
      },
      isAuthorized() {
        // has token or has code or disabled access control
        return (
          !!get().token || !!get().accessCode || !get().enabledAccessControl()
        );
      },
      fetch() {
        if (fetchState > 0) return;
        fetchState = 1;
        fetch("/api/config", {
          method: "post",
          body: null,
        })
          .then((res) => res.json())
          .then((res: any) => {
            console.log("[Config] got config from server", res);
            set(() => ({ ...res }));
          })
          .catch(() => {
            console.error("[Config] failed to fetch config");
          })
          .finally(() => {
            fetchState = 2;
          });
      },

      // voice updates
      updateVoiceProvider(provider: AccessControlStore["voiceProvider"]) {
        set(() => ({ voiceProvider: provider }));
      },
      updateVoiceModel(model: string) {
        set(() => ({ voiceModel: model }));
      },
      updateVoiceApiKey(key: string) {
        set(() => ({ voiceApiKey: key }));
      },
      updateVoiceEndpoint(url: string) {
        set(() => ({ voiceEndpoint: url }));
      },

      // TTS updates
      updateTtsProvider(provider: AccessControlStore["ttsProvider"]) {
        set(() => ({ ttsProvider: provider }));
      },
      updateTtsModel(model: string) {
        set(() => ({ ttsModel: model }));
      },
      updateTtsApiKey(key: string) {
        set(() => ({ ttsApiKey: key }));
      },
      updateTtsEndpoint(url: string) {
        set(() => ({ ttsEndpoint: url }));
      },
      updateTtsVoice(voice: string) {
        set(() => ({ ttsVoice: voice }));
      },
      updateTtsFormat(fmt: AccessControlStore["ttsFormat"]) {
        set(() => ({ ttsFormat: fmt }));
      },

      // translation updates
      updateTranslationProvider(
        provider: AccessControlStore["translationProvider"],
      ) {
        set(() => ({ translationProvider: provider }));
      },
      updateTranslationApiKey(key: string) {
        set(() => ({ translationApiKey: key }));
      },
      updateTranslationEndpoint(url: string) {
        set(() => ({ translationEndpoint: url }));
      },
      updateTranslationTargetLang(lang: string) {
        set(() => ({ translationTargetLang: lang }));
      },

      // video updates
      updateVideoProvider(provider: AccessControlStore["videoProvider"]) {
        set(() => ({ videoProvider: provider }));
      },
      updateVideoModel(model: string) {
        set(() => ({ videoModel: model }));
      },
      updateVideoApiKey(key: string) {
        set(() => ({ videoApiKey: key }));
      },
      updateVideoEndpoint(url: string) {
        set(() => ({ videoEndpoint: url }));
      },
      updateVideoCreatePath(path: string) {
        set(() => ({ videoCreatePath: path }));
      },
      updateVideoQueryPath(path: string) {
        set(() => ({ videoQueryPath: path }));
      },
    }),
    {
      name: ACCESS_KEY,
      version: 5,
      migrate: (state: any) => ({ ...initialAccessState, ...(state || {}) }),
    },
  ),
);
