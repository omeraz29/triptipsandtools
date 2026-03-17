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
  const tripsStore = getStore({ name: "trips", consistency: "strong" });
  const expensesStore = getStore({ name: "expenses", consistency: "strong" });
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\//, "");
  const parts = path.split("/");

  // POST /api/trips — create trip
  if (req.method === "POST" && path === "trips") {
    const { name } = await req.json();
    if (!name) return json({ error: "Name required" }, 400);
    const code = randomCode();
    const trip = { id: code, name, code, members: [], nextMemberId: 1 };
    await tripsStore.setJSON(code, trip);
    return json(trip);
  }

  // GET /api/trips/:code — get trip
  if (req.method === "GET" && parts.length === 2 && parts[0] === "trips") {
    const trip = await tripsStore.get(parts[1], { type: "json" });
    if (!trip) return json({ error: "Trip not found" }, 404);
    return json(trip);
  }

  // GET /api/trips/:code/members
  if (req.method === "GET" && parts.length === 3 && parts[0] === "trips" && parts[2] === "members") {
    const trip = await tripsStore.get(parts[1], { type: "json" });
    if (!trip) return json({ error: "Trip not found" }, 404);
    return json(trip.members || []);
  }

  // POST /api/trips/:code/members
  if (req.method === "POST" && parts.length === 3 && parts[0] === "trips" && parts[2] === "members") {
    const trip = await tripsStore.get(parts[1], { type: "json" });
    if (!trip) return json({ error: "Trip not found" }, 404);
    const { name } = await req.json();
    if (!name) return json({ error: "Name required" }, 400);
    const member = { id: trip.nextMemberId, name };
    trip.members.push(member);
    trip.nextMemberId++;
    await tripsStore.setJSON(parts[1], trip);
    return json(member);
  }

  // GET /api/trips/:code/expenses
  if (req.method === "GET" && parts.length === 3 && parts[0] === "trips" && parts[2] === "expenses") {
    const expenses = await expensesStore.get(parts[1], { type: "json" }) || [];
    return json(expenses);
  }

  // POST /api/trips/:code/expenses
  if (req.method === "POST" && parts.length === 3 && parts[0] === "trips" && parts[2] === "expenses") {
    const trip = await tripsStore.get(parts[1], { type: "json" });
    if (!trip) return json({ error: "Trip not found" }, 404);
    const { description, amount, payer_member_id, participants } = await req.json();
    const expenses = await expensesStore.get(parts[1], { type: "json" }) || [];
    const expense = { id: Date.now(), description, amount, payer_member_id, participants };
    expenses.push(expense);
    await expensesStore.setJSON(parts[1], expenses);
    return json(expense);
  }

  // PUT /api/expenses/:id
  if (req.method === "PUT" && parts.length === 2 && parts[0] === "expenses") {
    const id = Number(parts[1]);
    const body = await req.json();
    const { blobs } = await expensesStore.list();
    for (const blob of blobs) {
      const expenses = await expensesStore.get(blob.key, { type: "json" }) || [];
      const idx = expenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        expenses[idx] = { id, ...body };
        await expensesStore.setJSON(blob.key, expenses);
        return json(expenses[idx]);
      }
    }
    return json({ error: "Expense not found" }, 404);
  }

  // DELETE /api/expenses/:id
  if (req.method === "DELETE" && parts.length === 2 && parts[0] === "expenses") {
    const id = Number(parts[1]);
    const { blobs } = await expensesStore.list();
    for (const blob of blobs) {
      const expenses = await expensesStore.get(blob.key, { type: "json" }) || [];
      const idx = expenses.findIndex(e => e.id === id);
      if (idx !== -1) {
        expenses.splice(idx, 1);
        await expensesStore.setJSON(blob.key, expenses);
        return json({ ok: true });
      }
    }
    return json({ error: "Expense not found" }, 404);
  }

  return json({ error: "Not found" }, 404);
};

export const config = {
  path: ["/api/trips", "/api/trips/*", "/api/expenses/*"]
};
