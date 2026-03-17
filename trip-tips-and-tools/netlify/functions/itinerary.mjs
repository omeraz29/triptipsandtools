import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const slug = context.params.slug;
  if (!slug) {
    return new Response("Not found", { status: 404 });
  }

  const store = getStore("itineraries");
  const html = await store.get(slug);

  if (!html) {
    return new Response("Itinerary not found", { status: 404 });
  }

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" }
  });
};

export const config = {
  path: "/itineraries/:slug"
};
