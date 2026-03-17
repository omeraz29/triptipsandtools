import { getStore } from "@netlify/blobs";

export default async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { slug, html, title, description, delete: shouldDelete } = body;

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const itineraryStore = getStore("itineraries");
  const indexStore = getStore("itinerary-index");
  let index = await indexStore.get("index", { type: "json" }) || [];

  if (shouldDelete) {
    await itineraryStore.delete(slug);
    index = index.filter(item => item.slug !== slug);
    await indexStore.setJSON("index", index);
    return new Response(JSON.stringify({ ok: true, deleted: slug }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (!html || !title) {
    return new Response("Missing required fields: html, title", { status: 400 });
  }

  await itineraryStore.set(slug, html);
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
