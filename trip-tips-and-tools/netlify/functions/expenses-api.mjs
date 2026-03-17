import { getStore } from "@netlify/blobs";

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
  const parts = url.pathname.replace(/^\/api\//, "").split("/");

  // GET /api/trips/:code/expenses
  if (req.method === "GET" && parts[0] === "trips" && parts[2] === "expenses") {
    const expenses = await expensesStore.get(parts[1], { type: "json" }) || [];
    return json(expenses);
  }

  // POST /api/trips/:code/expenses
  if (req.method === "POST" && parts[0] === "trips" && parts[2] === "expenses") {
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
  if (req.method === "PUT" && parts[0] === "expenses") {
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
  if (req.method === "DELETE" && parts[0] === "expenses") {
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
  path: ["/api/trips/*/expenses", "/api/expenses/*"]
};
