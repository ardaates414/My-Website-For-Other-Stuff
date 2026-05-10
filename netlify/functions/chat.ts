import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  createdAt: string;
}

export default async (httpReq: Request) => {
  const store = getStore({ name: "dogracy-data", consistency: "strong" });

  if (httpReq.method === "GET") {
    const msgs = (await store.get("chat-messages", { type: "json" })) as ChatMessage[] | null;
    const list = msgs ?? [];
    return Response.json(list.slice(-100));
  }

  if (httpReq.method === "POST") {
    const body = await httpReq.json();
    const msgs = ((await store.get("chat-messages", { type: "json" })) as ChatMessage[]) ?? [];
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: body.sender,
      text: body.text,
      createdAt: new Date().toISOString(),
    };
    msgs.push(newMsg);
    await store.setJSON("chat-messages", msgs);
    return Response.json(newMsg, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/chat",
};
