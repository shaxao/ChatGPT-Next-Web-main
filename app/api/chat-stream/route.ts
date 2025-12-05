import { createParser } from "eventsource-parser";
import { NextRequest } from "next/server";
import { requestOpenai } from "../common";

function extractStreamText(json: any): string | null {
  try {
    // OpenAI chat-completions stream
    const delta = json?.choices?.[0]?.delta;
    if (typeof delta?.content === "string") return delta.content;
    // Multi-part delta content with URL
    if (Array.isArray(delta?.content)) {
      const urlPart =
        delta.content.find(
          (p: any) =>
            p?.type === "image_url" && typeof p?.image_url?.url === "string",
        ) ||
        delta.content.find(
          (p: any) =>
            p?.type === "video_url" && typeof p?.video_url?.url === "string",
        );
      if (urlPart)
        return (urlPart.image_url?.url || urlPart.video_url?.url) as string;
      const textPart = delta.content.find(
        (p: any) => typeof p?.text === "string",
      );
      if (textPart?.text) return textPart.text as string;
    }
    // Some providers send message instead of delta
    const msg = json?.choices?.[0]?.message;
    if (typeof msg?.content === "string") return msg.content;
    if (Array.isArray(msg?.content)) {
      const urlPart =
        msg.content.find(
          (p: any) =>
            p?.type === "image_url" && typeof p?.image_url?.url === "string",
        ) ||
        msg.content.find(
          (p: any) =>
            p?.type === "video_url" && typeof p?.video_url?.url === "string",
        );
      if (urlPart)
        return (urlPart.image_url?.url || urlPart.video_url?.url) as string;
      const textPart = msg.content.find(
        (p: any) => typeof p?.text === "string",
      );
      if (textPart?.text) return textPart.text as string;
    }
    // Text completions stream
    const text = json?.choices?.[0]?.text;
    if (typeof text === "string") return text;
    // Fallbacks: direct content fields
    if (typeof json?.content === "string") return json.content;
    if (typeof json?.delta === "string") return json.delta;
    // Array content parts (multi-part content)
    if (Array.isArray(json?.content)) {
      const urlPart =
        json.content.find(
          (p: any) =>
            p?.type === "image_url" && typeof p?.image_url?.url === "string",
        ) ||
        json.content.find(
          (p: any) =>
            p?.type === "video_url" && typeof p?.video_url?.url === "string",
        );
      if (urlPart)
        return (urlPart.image_url?.url || urlPart.video_url?.url) as string;
      const part = json.content.find((p: any) => typeof p?.text === "string");
      if (part?.text) return part.text;
    }
  } catch (_) {}
  return null;
}

async function createStream(req: NextRequest) {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const res = await requestOpenai(req);
  console.log("[Stream] upstream", res.status, res.headers.get("Content-Type"));

  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("stream")) {
    const content = await (
      await res.text()
    ).replace(/provided:.*. You/, "provided: ***. You");
    console.log("[Stream] error ", content);
    return "```json\n" + content + "```";
  }

  const stream = new ReadableStream({
    async start(controller) {
      let finished = false;
      let eventCount = 0;
      function onParse(event: any) {
        if (finished) return;
        if (event.type === "event") {
          const data = event.data;
          if (data === "[DONE]") {
            finished = true;
            try {
              controller.close();
            } catch {}
            return;
          }
          try {
            const json = JSON.parse(data);
            const text = extractStreamText(json);
            if (text && text.length > 0) {
              const queue = encoder.encode(text);
              try {
                if (!finished) controller.enqueue(queue);
              } catch {}
            }
            eventCount++;
            const preview = typeof data === "string" ? data.slice(0, 200) : "";
            console.log("[Stream] event", eventCount, preview);
          } catch (e) {
            // Skip malformed chunks instead of crashing the stream
            console.warn("[Stream] parse error", e);
          }
        }
      }

      const parser = createParser(onParse);
      let chunkCount = 0;
      for await (const chunk of res.body as any) {
        if (finished) break;
        const s = decoder.decode(chunk, { stream: true });
        chunkCount++;
        console.log("[Stream] chunk", chunkCount, s.slice(0, 200));
        parser.feed(s);
      }
    },
  });
  return stream;
}

export async function POST(req: NextRequest) {
  try {
    const stream = await createStream(req);
    return new Response(stream);
  } catch (error) {
    console.error("[Chat Stream]", error);
    return new Response(
      ["```json\n", JSON.stringify(error, null, "  "), "\n```"].join(""),
    );
  }
}

export const config = {
  runtime: "edge",
};
