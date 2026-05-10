import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

interface Message {
  id: string;
  requestId: string;
  sender: string;
  text: string;
  createdAt: string;
}

export default async (httpReq: Request) => {
  const store = getStore({ name: "dogracy-data", consistency: "strong" });
  const url = new URL(httpReq.url);
  const requestId = url.searchParams.get("requestId");

  if (httpReq.method === "GET") {
    if (!requestId) {
      return Response.json([]);
    }
    const msgs = (await store.get(`messages-${requestId}`, { type: "json" })) as Message[] | null;
    return Response.json(msgs ?? []);
  }

  if (httpReq.method === "POST") {
    const body = await httpReq.json();
    const key = `messages-${body.requestId}`;
    const msgs = ((await store.get(key, { type: "json" })) as Message[]) ?? [];
    const newMsg: Message = {
      id: Date.now().toString(),
      requestId: body.requestId,
      sender: body.sender,
      text: body.text,
      createdAt: new Date().toISOString(),
    };
    msgs.push(newMsg);
    await store.setJSON(key, msgs);
    return Response.json(newMsg, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/messages",
};
