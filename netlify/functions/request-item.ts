import type { Config, Context } from "@netlify/functions";
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

export default async (httpReq: Request, context: Context) => {
  const id = context.params.id;
  const store = getStore({ name: "dogracy-data", consistency: "strong" });

  if (httpReq.method === "DELETE") {
    const list = ((await store.get("requests-list", { type: "json" })) as RequestRecord[]) ?? [];
    const updated = list.filter((r) => r.id !== id);
    await store.setJSON("requests-list", updated);
    await store.delete(`messages-${id}`);
    return new Response(null, { status: 204 });
  }

  if (httpReq.method === "PATCH") {
    const body = await httpReq.json();
    const list = ((await store.get("requests-list", { type: "json" })) as RequestRecord[]) ?? [];
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) {
      return new Response("Not found", { status: 404 });
    }
    list[idx] = { ...list[idx], status: body.status };
    await store.setJSON("requests-list", list);
    return Response.json(list[idx]);
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/requests/:id",
};
