import { getStore } from "@netlify/blobs";

export default async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { slug, html, title, description } = body;
  if (!slug || !html || !title) {
    return new Response("Missing required fields: slug, html, title", { status: 400 });
  }

  const itineraryStore = getStore("itineraries");
  await itineraryStore.set(slug, html);

  const indexStore = getStore("itinerary-index");
  let index = await indexStore.get("index", { type: "json" }) || [];
  index = index.filter(item => item.slug !== slug);
  index.push({ slug, title, description: description || "" });
  await indexStore.setJSON("index", index);

  return new Response(JSON.stringify({ ok: true, slug, total: index.length }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
};

export const config = {
  path: "/api/save-itinerary"
};

export const config = {
  path: "/api/save-itinerary"
};
