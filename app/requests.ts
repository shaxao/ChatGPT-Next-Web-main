import type { ChatRequest, ChatResponse } from "./api/openai/typing";
import {
  Message,
  ModelConfig,
  ModelType,
  useAccessStore,
  useChatStore,
} from "./store";
import { showToast } from "./components/ui-lib";

const TIME_OUT_MS = 60000;

const makeRequestParam = (
  messages: Message[],
  options?: {
    filterBot?: boolean;
    stream?: boolean;
    model?: ModelType;
  },
): ChatRequest => {
  let sendMessages = messages.map((v) => ({
    role: v.role,
    content: v.content,
  }));

  if (options?.filterBot) {
    sendMessages = sendMessages.filter((m) => m.role !== "assistant");
  }

  const modelConfig = { ...useChatStore.getState().config.modelConfig };

  // @yidadaa: wont send max_tokens, because it is nonsense for Muggles
  // @ts-expect-error
  delete modelConfig.max_tokens;

  // override model config
  if (options?.model) {
    modelConfig.model = options.model;
  }

  return {
    messages: sendMessages,
    stream: options?.stream,
    ...modelConfig,
  };
};

function getHeaders() {
  const accessStore = useAccessStore.getState();
  let headers: Record<string, string> = {};

  if (accessStore.enabledAccessControl()) {
    headers["access-code"] = accessStore.accessCode;
  }

  if (accessStore.token && accessStore.token.length > 0) {
    headers["token"] = accessStore.token;
  }

  if (accessStore.endpoint && accessStore.endpoint.length > 0) {
    headers["base-url"] = accessStore.endpoint;
  }

  return headers;
}

export function requestOpenaiClient(path: string) {
  return async (body: any, method = "POST") => {
    try {
      return await fetch("/api/openai", {
        method,
        headers: {
          "Content-Type": "application/json",
          path,
          ...getHeaders(),
        },
        body: body && JSON.stringify(body),
      });
    } catch (e: any) {
      // Normalize network errors to a readable message
      const msg = String(e?.message ?? e ?? "网络错误");
      throw new Error(`请求失败：${msg}`);
    }
  };
}

// --- new: raw openai multipart for audio uploads ---
function getHeadersRaw() {
  // same as getHeaders but without forcing content-type
  const accessStore = useAccessStore.getState();
  let headers: Record<string, string> = {};

  if (accessStore.enabledAccessControl()) {
    headers["access-code"] = accessStore.accessCode;
  }

  if (accessStore.token && accessStore.token.length > 0) {
    headers["token"] = accessStore.token;
  }

  if (accessStore.endpoint && accessStore.endpoint.length > 0) {
    headers["base-url"] = accessStore.endpoint;
  }

  return headers;
}

export function requestOpenaiMultipart(path: string, form: FormData) {
  return fetch("/api/openai", {
    method: "POST",
    headers: {
      path,
      ...getHeadersRaw(),
    },
    body: form,
  });
}

// helper: headers for TTS proxy based on TTS settings
function getHeadersTTS() {
  const access = useAccessStore.getState();
  const headers: Record<string, string> = {};
  if (access.enabledAccessControl()) headers["access-code"] = access.accessCode;
  const token = access.ttsApiKey || access.token;
  const baseUrl = access.ttsEndpoint || access.endpoint;
  if (token) headers["token"] = token;
  if (baseUrl) headers["base-url"] = baseUrl;
  return headers;
}

// helper: headers for Video generation based on Video settings (default to chat config)
function getHeadersVideo() {
  const access = useAccessStore.getState();
  const headers: Record<string, string> = {};
  if (access.enabledAccessControl()) headers["access-code"] = access.accessCode;
  const useCustom = access.videoProvider === "custom";
  const token = useCustom ? access.videoApiKey || access.token : access.token;
  const baseUrl = useCustom
    ? access.videoEndpoint || access.endpoint
    : access.endpoint;
  if (token) headers["token"] = token;
  if (baseUrl) headers["base-url"] = baseUrl;
  return headers;
}

// --- helpers: video task endpoints (configurable paths)
function getVideoPaths() {
  const access = useAccessStore.getState() as any;
  const createPath: string = access.videoCreatePath || "v1/video/tasks";
  const queryPath: string = access.videoQueryPath || "v1/video/tasks/";
  return { createPath, queryPath };
}

export async function createVideoTask(
  params: any,
): Promise<{ id: string } & Record<string, any>> {
  const { createPath } = getVideoPaths();
  const res = await fetch("/api/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      path: createPath,
      ...getHeadersVideo(),
    },
    body: JSON.stringify(params || {}),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    const msg = json?.error?.message ?? text;
    throw new Error(msg);
  }
  // Support both {id} and {task_id}
  const id = (
    json?.id ||
    json?.task_id ||
    json?.data?.id ||
    json?.data?.task_id ||
    ""
  ).toString();
  if (!id) throw new Error("未返回任务ID");
  return { id, ...json };
}

export async function queryVideoTask(
  taskId: string,
): Promise<
  { status: string; progress?: number; url?: string; error?: string } & Record<
    string,
    any
  >
> {
  const { queryPath } = getVideoPaths();
  const res = await fetch("/api/openai", {
    method: "GET",
    headers: {
      path: `${queryPath}${taskId}`,
      ...getHeadersVideo(),
    },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  if (!res.ok) {
    const msg = json?.error?.message ?? text;
    return { status: "failed", error: msg } as any;
  }
  const status =
    (
      json?.status ||
      json?.state ||
      json?.data?.status ||
      json?.data?.state ||
      ""
    ).toString() || "unknown";
  const progress = Number(
    json?.progress ??
      json?.data?.progress ??
      json?.percent ??
      json?.data?.percent ??
      0,
  );
  const url = (json?.url ||
    json?.video_url ||
    json?.data?.url ||
    json?.data?.video_url) as string | undefined;
  const error = (json?.error?.message || json?.message) as string | undefined;
  return { status, progress, url, error, ...json } as any;
}

// --- new: text to speech ---
export async function requestTextToSpeech(
  text: string,
  options?: { voice?: string; format?: "mp3" | "wav" | "ogg"; model?: string },
): Promise<Blob> {
  const access = useAccessStore.getState();
  const provider = access.ttsProvider ?? access.voiceProvider ?? "openai";

  const body: any = {
    model: options?.model || access.ttsModel || "tts-1",
    input: text,
    voice: options?.voice || access.ttsVoice || "alloy",
    format: options?.format || access.ttsFormat || "mp3",
  };

  if (provider === "openai" || provider === "custom") {
    const headersBase = provider === "custom" ? getHeadersTTS() : getHeaders();
    const res = await fetch("/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        path: "v1/audio/speech",
        ...headersBase,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const raw = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(raw);
      } catch {}
      const msg = json?.error?.message ?? raw;
      throw new Error(msg);
    }
    const ct = res.headers.get("Content-Type") || "audio/mpeg";
    const buf = await res.arrayBuffer();
    return new Blob([buf], { type: ct });
  }

  throw new Error("当前仅支持 OpenAI 格式的文本转语音接口");
}

// --- models list for TTS provider ---
export async function requestVoiceModelsList(): Promise<string[]> {
  const headers = {
    "Content-Type": "application/json",
    path: "v1/models",
    ...getHeadersTTS(),
  } as Record<string, string>;
  const res = await fetch("/api/openai", { method: "GET", headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    const msg = json?.error?.message ?? text;
    throw new Error(msg);
  }

  const data: any[] = Array.isArray(json?.data) ? json.data : [];
  const ids: string[] = data
    .map((m: any) => m?.id)
    .filter((id: unknown): id is string => typeof id === "string");

  const unique = Array.from(new Set<string>(ids));
  unique.sort();
  return unique;
}

// --- models list for Video provider (OpenAI format) ---
export async function requestVideoModelsList(): Promise<string[]> {
  const headers = {
    "Content-Type": "application/json",
    path: "v1/models",
    ...getHeadersVideo(),
  } as Record<string, string>;
  const res = await fetch("/api/openai", { method: "GET", headers });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    const msg = json?.error?.message ?? text;
    throw new Error(msg);
  }

  const data: any[] = Array.isArray(json?.data) ? json.data : [];
  const ids: string[] = data
    .map((m: any) => m?.id)
    .filter((id: unknown): id is string => typeof id === "string");

  const unique = Array.from(new Set<string>(ids));
  unique.sort();
  return unique;
}

// --- translate text helper ---
export async function requestTranslate(
  text: string,
  targetLang: string,
): Promise<string> {
  const access = useAccessStore.getState();
  const provider = access.translationProvider ?? "openai";

  if (provider === "openai") {
    const sys: any = {
      role: "system",
      content: "You are a translation engine. Only return the translated text.",
      date: new Date().toISOString(),
    };
    const usr: any = {
      role: "user",
      content: `Translate to ${targetLang}:\n${text}`,
      date: new Date().toISOString(),
    };
    const res = await requestChat([sys, usr]);
    return (res?.choices?.at(0)?.message?.content ?? "").trim();
  }

  const endpoint = access.translationEndpoint;
  if (!endpoint) {
    throw new Error("未配置翻译服务端点");
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (access.translationApiKey) {
    headers["Authorization"] = `Bearer ${access.translationApiKey}`;
  }
  const body2 = JSON.stringify({ text, target: targetLang });
  const res2 = await fetch(endpoint, { method: "POST", headers, body: body2 });
  const raw = await res2.text();
  let json2: any = null;
  try {
    json2 = JSON.parse(raw);
  } catch {}
  if (!res2.ok) {
    const msg = json2?.error?.message ?? raw;
    throw new Error(msg);
  }
  if (Array.isArray(json2)) {
    return (json2[0]?.translations?.[0]?.text ??
      json2[0]?.text ??
      raw) as string;
  }
  return (json2?.text ?? json2?.data?.text ?? raw) as string;
}

// --- speech to text helper ---
export async function requestTranscribeAudio(blob: Blob): Promise<string> {
  const access = useAccessStore.getState();
  const provider = access.voiceProvider ?? "openai";

  if (provider === "openai") {
    const form = new FormData();
    const fileName = blob.type?.includes("webm") ? "audio.webm" : "audio.wav";
    form.append("file", blob, fileName);
    form.append("model", access.voiceModel || "whisper-1");
    const res = await requestOpenaiMultipart("v1/audio/transcriptions", form);
    const raw = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(raw);
    } catch {}
    if (!res.ok) {
      const msg = json?.error?.message ?? raw;
      throw new Error(msg);
    }
    return (json?.text ?? "").toString();
  }

  const endpoint = access.voiceEndpoint;
  if (!endpoint) {
    throw new Error("未配置语音识别端点");
  }
  const headers: Record<string, string> = {};
  if (provider === "microsoft") {
    if (access.voiceApiKey)
      headers["Ocp-Apim-Subscription-Key"] = access.voiceApiKey;
    headers["Accept"] = "application/json";
    if (blob.type) headers["Content-Type"] = blob.type;
  } else {
    if (access.voiceApiKey)
      headers["Authorization"] = `Bearer ${access.voiceApiKey}`;
    if (blob.type) headers["Content-Type"] = blob.type;
  }
  const resp = await fetch(endpoint, { method: "POST", headers, body: blob });
  const text = await resp.text();
  let json2: any = null;
  try {
    json2 = JSON.parse(text);
  } catch {}
  if (!resp.ok) {
    const msg = json2?.error?.message ?? text;
    throw new Error(msg);
  }
  if (Array.isArray(json2)) {
    return (json2[0]?.translations?.[0]?.text ??
      json2[0]?.text ??
      text) as string;
  }
  return (json2?.text ?? json2?.data?.text ?? text) as string;
}

// --- reintroduced: core chat APIs & helpers ---
export async function requestChat(
  messages: Message[],
  options?: {
    model?: ModelType;
  },
) {
  const req: ChatRequest = makeRequestParam(messages, {
    filterBot: true,
    model: options?.model,
  });

  const res = await requestOpenaiClient("v1/chat/completions")(req);

  try {
    const response = (await res.json()) as ChatResponse;
    return response;
  } catch (error) {
    console.error("[Request Chat] ", error, res.body);
  }
}

export async function requestUsage() {
  const formatDate = (d: Date) =>
    `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
      .getDate()
      .toString()
      .padStart(2, "0")}`;
  const ONE_DAY = 2 * 24 * 60 * 60 * 1000;
  const now = new Date(Date.now() + ONE_DAY);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDate = formatDate(startOfMonth);
  const endDate = formatDate(now);

  const [used, subs] = await Promise.all([
    requestOpenaiClient(
      `dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`,
    )(null, "GET"),
    requestOpenaiClient("dashboard/billing/subscription")(null, "GET"),
  ]);

  const response = (await used.json()) as {
    total_usage?: number;
    error?: {
      type: string;
      message: string;
    };
  };

  const total = (await subs.json()) as {
    hard_limit_usd?: number;
  };

  if (response.error && response.error.type) {
    showToast(response.error.message);
    return;
  }

  if (response.total_usage) {
    response.total_usage = Math.round(response.total_usage) / 100;
  }

  if (total.hard_limit_usd) {
    total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;
  }

  return {
    used: response.total_usage,
    subscription: total.hard_limit_usd,
  };
}

export async function requestHealth(model?: string) {
  // Prefer current selected model from settings; fallback to OpenAI's gpt-4o
  const currentModel = useChatStore.getState().config.modelConfig.model as
    | string
    | undefined;
  const modelName = (model ?? currentModel ?? "gpt-4o") as any;

  try {
    const req = makeRequestParam(
      [
        {
          role: "user",
          content: "ping",
          date: new Date().toISOString(),
        } as Message,
      ],
      {
        filterBot: true,
        stream: false,
        model: modelName,
      },
    );

    const res = await requestOpenaiClient("v1/chat/completions")(req, "POST");
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {}

    // Successful chat completion returns id and choices
    if (res.ok && json && json.id && Array.isArray(json.choices)) {
      return { ok: true, message: "ok", model: modelName };
    }

    const msg = json?.error?.message ?? text;
    return { ok: false, status: res.status, message: msg };
  } catch (e: any) {
    return { ok: false, message: String(e?.message ?? e) };
  }
}

export async function requestChatStream(
  messages: Message[],
  options?: {
    filterBot?: boolean;
    modelConfig?: ModelConfig;
    onMessage: (message: string, done: boolean) => void;
    onError: (error: Error, statusCode?: number) => void;
    onController?: (controller: AbortController) => void;
  },
) {
  const req = makeRequestParam(messages, {
    stream: true,
    filterBot: options?.filterBot,
    // allow overriding model via options.modelConfig.model
    model: options?.modelConfig?.model as any,
  });

  console.log("[Request] ", req);

  const controller = new AbortController();
  const reqTimeoutId = setTimeout(() => controller.abort(), TIME_OUT_MS);

  try {
    const res = await fetch("/api/chat-stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        path: "v1/chat/completions",
        ...getHeaders(),
      },
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(reqTimeoutId);

    let responseText = "";

    const finish = () => {
      options?.onMessage(responseText, true);
      controller.abort();
    };

    if (res.ok) {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      options?.onController?.(controller);

      while (true) {
        const resTimeoutId = setTimeout(() => finish(), TIME_OUT_MS);
        const content = await reader?.read();
        clearTimeout(resTimeoutId);

        if (!content || !content.value) {
          break;
        }

        const text = decoder.decode(content.value, { stream: true });
        responseText += text;

        const done = content.done;
        options?.onMessage(responseText, false);

        if (done) {
          break;
        }
      }

      finish();
    } else if (res.status === 401) {
      console.error("Unauthorized");
      options?.onError(new Error("Unauthorized"), res.status);
    } else {
      console.error("Stream Error", res.body);
      options?.onError(new Error("Stream Error"), res.status);
    }
  } catch (err) {
    console.error("NetWork Error", err);
    options?.onError(err as Error);
  }
}

export async function requestVideoChatStream(
  messages: Message[],
  options?: {
    filterBot?: boolean;
    modelConfig?: ModelConfig;
    onMessage: (message: string, done: boolean) => void;
    onError: (error: Error, statusCode?: number) => void;
    onController?: (controller: AbortController) => void;
  },
) {
  const req = makeRequestParam(messages, {
    stream: true,
    filterBot: options?.filterBot,
    model: options?.modelConfig?.model as any,
  });

  const controller = new AbortController();
  const VIDEO_TIMEOUT_MS = 10 * 60 * 1000;
  const reqTimeoutId = setTimeout(() => controller.abort(), VIDEO_TIMEOUT_MS);

  try {
    const hdr = {
      "Content-Type": "application/json",
      path: "v1/chat/completions",
      ...getHeadersVideo(),
    } as Record<string, string>;
    console.log(
      "[VideoStream] using base-url",
      hdr["base-url"],
      "token_present",
      Boolean(hdr["token"]),
    );
    const res = await fetch("/api/chat-stream", {
      method: "POST",
      headers: hdr,
      body: JSON.stringify(req),
      signal: controller.signal,
    });
    clearTimeout(reqTimeoutId);
    console.log(
      "[VideoStream] response",
      res.status,
      res.headers.get("Content-Type"),
    );

    let responseText = "";
    const MAX_BUFFER = 1024 * 1024; // cap at ~1MB to avoid OOM

    const finish = () => {
      options?.onMessage(responseText, true);
      controller.abort();
    };

    if (res.ok) {
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      options?.onController?.(controller);

      options?.onController?.(controller);

      while (true) {
        const content = await reader?.read();

        if (!content || !content.value) {
          break;
        }

        const text = decoder.decode(content.value, { stream: true });
        console.log("[VideoStream] read", text.slice(0, 200));
        responseText += text;
        if (responseText.length > MAX_BUFFER) {
          responseText = responseText.slice(-MAX_BUFFER);
        }

        const done = content.done;
        options?.onMessage(responseText, false);

        if (done) {
          break;
        }
      }

      finish();
    } else if (res.status === 401) {
      options?.onError(new Error("Unauthorized"), res.status);
    } else {
      options?.onError(new Error("Stream Error"), res.status);
    }
  } catch (err) {
    const e = err as any;
    if (controller.signal.aborted && String(e?.name || e) === "AbortError") {
      return;
    }
    options?.onError(e as Error);
  }
}

export async function requestWithPrompt(
  messages: Message[],
  prompt: string,
  options?: {
    model?: ModelType;
  },
) {
  messages = messages.concat([
    {
      role: "user",
      content: prompt,
      date: new Date().toLocaleString(),
    },
  ]);

  const res = await requestChat(messages, options);

  return res?.choices?.at(0)?.message?.content ?? "";
}

export const ControllerPool = {
  controllers: {} as Record<string, AbortController>,

  addController(
    sessionIndex: number,
    messageId: number,
    controller: AbortController,
  ) {
    const key = this.key(sessionIndex, messageId);
    this.controllers[key] = controller;
    return key;
  },

  stop(sessionIndex: number, messageId: number) {
    const key = this.key(sessionIndex, messageId);
    const controller = this.controllers[key];
    controller?.abort();
  },

  stopAll() {
    Object.values(this.controllers).forEach((v) => v.abort());
  },

  hasPending() {
    return Object.values(this.controllers).length > 0;
  },

  remove(sessionIndex: number, messageId: number) {
    const key = this.key(sessionIndex, messageId);
    delete this.controllers[key];
  },

  key(sessionIndex: number, messageIndex: number) {
    return `${sessionIndex},${messageIndex}`;
  },
};

export async function requestModelsList(): Promise<string[]> {
  const res = await requestOpenaiClient("v1/models")(null, "GET");
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}

  if (!res.ok) {
    const msg = json?.error?.message ?? text;
    throw new Error(msg);
  }

  const data: any[] = Array.isArray(json?.data) ? json.data : [];
  const ids: string[] = data
    .map((m: any) => m?.id)
    .filter((id: unknown): id is string => typeof id === "string");

  // Remove duplicates and sort for stable display
  const unique = Array.from(new Set<string>(ids));
  unique.sort();
  return unique;
}
