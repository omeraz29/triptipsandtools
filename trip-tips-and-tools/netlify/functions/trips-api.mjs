import { getStore } from "@netlify/blobs";

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

export default async (req) => {
  const store = getStore({ name: "trips", consistency: "strong" });
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\//, "").split("/");

  // POST /api/trips — create trip
  if (req.method === "POST" && parts.length === 1) {
    const { name } = await req.json();
    if (!name) return json({ error: "Name required" }, 400);
    const code = randomCode();
    const trip = { id: code, name, code, members: [], nextMemberId: 1 };
    await store.setJSON(code, trip);
    return json(trip);
  }

  // GET /api/trips/:code — get trip
  if (req.method === "GET" && parts.length === 2) {
    const trip = await store.get(parts[1], { type: "json" });
    if (!trip) return json({ error: "Trip not found" }, 404);
    return json(trip);
  }

  // GET /api/trips/:code/members
  if (req.method === "GET" && parts.length === 3 && parts[2] === "members") {
    const trip = await store.get(parts[1], { type: "json" });
    if (!trip) return json({ error: "Trip not found" }, 404);
    return json(trip.members || []);
  }

  // POST /api/trips/:code/members
  if (req.method === "POST" && parts.length === 3 && parts[2] === "members") {
    const trip = await store.get(parts[1], { type: "json" });
    if (!trip) return json({ error: "Trip not found" }, 404);
    const { name } = await req.json();
    if (!name) return json({ error: "Name required" }, 400);
    const member = { id: trip.nextMemberId, name };
    trip.members.push(member);
    trip.nextMemberId++;
    await store.setJSON(parts[1], trip);
    return json(member);
  }

  return json({ error: "Not found" }, 404);
};

export const config = {
  path: ["/api/trips", "/api/trips/*"]
};
