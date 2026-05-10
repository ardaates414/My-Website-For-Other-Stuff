import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

interface RequestRecord {
  id: string;
  name: string;
  type: string;
  gameName: string | null;
  platform: string | null;
  description: string;
  status: string;
  createdAt: string;
}

export default async (httpReq: Request) => {
  const store = getStore({ name: "dogracy-data", consistency: "strong" });

  if (httpReq.method === "GET") {
    const list = (await store.get("requests-list", { type: "json" })) as RequestRecord[] | null;
    return Response.json(list ?? []);
  }

  if (httpReq.method === "POST") {
    const body = await httpReq.json();
    const list = ((await store.get("requests-list", { type: "json" })) as RequestRecord[]) ?? [];
    const newRequest: RequestRecord = {
      id: Date.now().toString(),
      name: body.name,
      type: body.type,
      gameName: body.gameName ?? null,
      platform: body.platform ?? null,
      description: body.description ?? "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    list.unshift(newRequest);
    await store.setJSON("requests-list", list);
    return Response.json(newRequest, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/requests",
};
