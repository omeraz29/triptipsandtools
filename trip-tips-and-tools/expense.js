// Trip Tips and Tools — Expense Tool v3.1
// Backend: existing Render/FastAPI at vacation-splitter.onrender.com

const API_BASE = "https://vacation-splitter.onrender.com";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const els = {
    tripName:         $("tripName"),
    joinCode:         $("joinCode"),
    createTripBtn:    $("createTripBtn"),
    joinTripBtn:      $("joinTripBtn"),
    tripInfo:         $("tripInfo"),
    memberName:       $("memberName"),
    addMemberBtn:     $("addMemberBtn"),
    membersWrap:      $("membersWrap"),
    desc:             $("desc"),
    amount:           $("amount"),
    payerPills:       $("payerPills"),
    partPills:        $("partPills"),
    addBtn:           $("addBtn"),
    expenseTbody:     document.querySelector("#expenseTable tbody"),
    settleTbody:      document.querySelector("#settleTable tbody"),
    settleHint:       $("settleHint"),
    editBack:         $("editModalBack"),
    closeEditBtn:     $("closeEditBtn"),
    cancelEditBtn:    $("cancelEditBtn"),
    saveEditBtn:      $("saveEditBtn"),
    deleteExpenseBtn: $("deleteExpenseBtn"),
    editDesc:         $("editDesc"),
    editAmount:       $("editAmount"),
    editPayerPills:   $("editPayerPills"),
    editPartPills:    $("editPartPills"),
  };

  // ── State ─────────────────────────────────────────────────
  let currentTrip   = null;  // { id, name, code }
  let members       = [];    // [{ id (int), name }]
  let expenses      = [];    // [{ id, description, amount, payer_member_id, participants }]

  let payerId       = null;  // int
  let selectedParts = {};    // memberId(int) -> bool

  let editingExpense    = null; // full expense object being edited
  let editPayerId       = null;
  let editSelectedParts = {};

  // ── API helper ────────────────────────────────────────────
  async function api(path, opts = {}){
    const res = await fetch(API_BASE + path, {
      headers: { "Content-Type": "application/json" },
      ...opts
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if(!res.ok){
      throw new Error((data && (data.detail || data.message)) || text || res.statusText);
    }
    return data;
  }

  // ── Helpers ───────────────────────────────────────────────
  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
  function fmtMoney(n){
    const num = Number(n);
    return `$${(Number.isFinite(num) ? num : 0).toFixed(2)}`;
  }
  function normalizeName(s){ return (s || "").trim(); }

  function setStatus(msg){
    els.tripInfo.innerHTML = `<div class="muted">${msg}</div>`;
  }

  // ── Data fetching ─────────────────────────────────────────
  async function fetchMembers(){
    if(!currentTrip) return;
    members = await api(`/api/trips/${currentTrip.code}/members`);
    // default payer to first member if not set
    if(!payerId && members.length) payerId = members[0].id;
    // default all selected
    const defaults = {};
    members.forEach(m => defaults[m.id] = true);
    selectedParts = { ...defaults, ...selectedParts };
  }

  async function fetchExpenses(){
    if(!currentTrip) return;
    expenses = await api(`/api/trips/${currentTrip.code}/expenses`);
  }

  async function refreshAll(){
    if(!currentTrip){ renderAll(); return; }
    try {
      await fetchMembers();
      await fetchExpenses();
      renderAll();
    } catch(e){
      alert("Error refreshing: " + e.message);
    }
  }

  // ── Render ────────────────────────────────────────────────
  function renderTripInfo(){
    if(!currentTrip){
      els.tripInfo.innerHTML = `<div class="muted">No trip joined yet.</div>`;
      return;
    }
    els.tripInfo.innerHTML = `
      <div class="row" style="gap:10px; align-items:center;">
        <div class="muted">Trip:</div>
        <div style="font-weight:900;">${escapeHtml(currentTrip.name)}</div>
        <div class="muted">• Code:</div>
        <div class="codeBox">${escapeHtml(currentTrip.code)}</div>
        <button class="btn ghost" id="copyCodeBtn">Copy code</button>
        <button class="btn ghost" id="leaveTripBtn">Leave trip</button>
      </div>
    `;
    $("copyCodeBtn").onclick = async () => {
      try{
        await navigator.clipboard.writeText(currentTrip.code);
        $("copyCodeBtn").textContent = "Copied!";
        setTimeout(() => $("copyCodeBtn").textContent = "Copy code", 900);
      } catch {
        alert("Your trip code is: " + currentTrip.code);
      }
    };
    $("leaveTripBtn").onclick = () => {
      if(confirm("Leave this trip? You can rejoin anytime with the code.")) leaveTrip();
    };
  }

  function renderMembers(){
    els.membersWrap.innerHTML = "";
    if(!currentTrip){
      els.membersWrap.innerHTML = `<span class="muted">(create or join a trip first)</span>`;
      return;
    }
    if(!members.length){
      els.membersWrap.innerHTML = `<span class="muted">(add friends to begin)</span>`;
      return;
    }
    members.forEach(m => {
      const chip = document.createElement("div");
      chip.className = "friendChip";
      chip.innerHTML = `<span>${escapeHtml(m.name)}</span>`;
      // Note: the backend doesn't support deleting members, so no remove button
      els.membersWrap.appendChild(chip);
    });
  }

  function pillEl(label, on, onClick){
    const d = document.createElement("div");
    d.className = "pill2" + (on ? " on" : "");
    d.textContent = (on ? "✓ " : "") + label;
    d.onclick = onClick;
    return d;
  }

  function renderPills(){
    els.payerPills.innerHTML = "";
    els.partPills.innerHTML  = "";
    if(!currentTrip || !members.length) return;
    for(const m of members){
      els.payerPills.appendChild(
        pillEl(m.name, payerId === m.id, () => { payerId = m.id; renderPills(); })
      );
      els.partPills.appendChild(
        pillEl(m.name, !!selectedParts[m.id], () => {
          selectedParts[m.id] = !selectedParts[m.id];
          renderPills();
        })
      );
    }
  }

  function renderExpenses(){
    els.expenseTbody.innerHTML = "";
    if(!expenses.length) return;
    const nameById = Object.fromEntries(members.map(m => [m.id, m.name]));
    expenses.forEach(e => {
      const tr = document.createElement("tr");
      const splitNames = (e.participants || []).map(id => nameById[id] || "(unknown)").join(", ");
      tr.innerHTML = `
        <td>${escapeHtml(e.description)}</td>
        <td>${escapeHtml(nameById[e.payer_member_id] || "(unknown)")}</td>
        <td>${fmtMoney(e.amount)}</td>
        <td class="muted">${escapeHtml(splitNames)}</td>
        <td style="text-align:right;">
          <button class="btn ghost" style="padding:8px 10px; border-radius:12px;" data-eid="${e.id}">Edit</button>
        </td>
      `;
      els.expenseTbody.appendChild(tr);
    });
    els.expenseTbody.querySelectorAll("button[data-eid]").forEach(btn => {
      btn.addEventListener("click", () => {
        const eid = Number(btn.getAttribute("data-eid"));
        openEditModal(expenses.find(e => e.id === eid));
      });
    });
  }

  function computeBalances(){
    const balances = {};
    for(const e of expenses){
      const amount = Number(e.amount);
      if(!Number.isFinite(amount) || amount <= 0) continue;
      const parts = (e.participants || []).filter(Boolean);
      if(!e.payer_member_id || !parts.length) continue;
      const share = amount / parts.length;
      balances[e.payer_member_id] = (balances[e.payer_member_id] || 0) + amount;
      for(const id of parts){
        balances[id] = (balances[id] || 0) - share;
      }
    }
    for(const k of Object.keys(balances)){
      balances[k] = Math.round(balances[k] * 100) / 100;
    }
    return balances;
  }

  function computeTransfers(balances){
    const creditors = [], debtors = [];
    for(const [id, amt] of Object.entries(balances)){
      if(amt >  0.009) creditors.push({ id: Number(id), amt });
      if(amt < -0.009) debtors.push({ id: Number(id), amt: -amt });
    }
    creditors.sort((a,b) => b.amt - a.amt);
    debtors.sort((a,b)   => b.amt - a.amt);
    const transfers = [];
    let i = 0, j = 0;
    while(i < debtors.length && j < creditors.length){
      const d = debtors[i], c = creditors[j];
      const x = Math.min(d.amt, c.amt);
      transfers.push({ from: d.id, to: c.id, amount: Math.round(x * 100) / 100 });
      d.amt = Math.round((d.amt - x) * 100) / 100;
      c.amt = Math.round((c.amt - x) * 100) / 100;
      if(d.amt <= 0.009) i++;
      if(c.amt <= 0.009) j++;
    }
    return transfers;
  }

  function renderSettlements(){
    els.settleTbody.innerHTML = "";
    if(!currentTrip){
      els.settleHint.textContent = "Create or join a trip to calculate balances.";
      return;
    }
    if(!expenses.length){
      els.settleHint.textContent = "Add expenses to calculate balances.";
      return;
    }
    const nameById  = Object.fromEntries(members.map(m => [m.id, m.name]));
    const transfers = computeTransfers(computeBalances());
    if(!transfers.length){
      els.settleHint.textContent = "Looks settled — nobody owes anything.";
      return;
    }
    els.settleHint.textContent = "Suggested payments to settle up:";
    for(const t of transfers){
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(nameById[t.from] || t.from)}</td>
        <td>${escapeHtml(nameById[t.to]   || t.to)}</td>
        <td>${fmtMoney(t.amount)}</td>
      `;
      els.settleTbody.appendChild(tr);
    }
  }

  function renderAll(){
    renderTripInfo();
    renderMembers();
    renderPills();
    renderExpenses();
    renderSettlements();
  }

  // ── Trip management ───────────────────────────────────────
  function leaveTrip(){
    currentTrip   = null;
    members       = [];
    expenses      = [];
    payerId       = null;
    selectedParts = {};
    localStorage.removeItem("ttt_current_trip");
    renderAll();
  }

  async function joinTrip(code){
    setStatus("Looking up trip…");
    try {
      currentTrip = await api(`/api/trips/${code}`);
      localStorage.setItem("ttt_current_trip", currentTrip.code);
      payerId       = null;
      selectedParts = {};
      await refreshAll();
    } catch(e){
      currentTrip = null;
      alert("Trip not found. Double-check the code and try again.");
      setStatus("No trip joined yet.");
    }
  }

  // ── Edit modal ────────────────────────────────────────────
  function openEditModal(expense){
    if(!expense) return;
    editingExpense    = expense;
    editPayerId       = expense.payer_member_id;
    editSelectedParts = {};
    for(const m of members){
      editSelectedParts[m.id] = (expense.participants || []).includes(m.id);
    }
    els.editDesc.value   = expense.description || "";
    els.editAmount.value = String(expense.amount ?? "");
    renderEditPills();
    els.editBack.style.display = "flex";
  }

  function renderEditPills(){
    els.editPayerPills.innerHTML = "";
    els.editPartPills.innerHTML  = "";
    for(const m of members){
      els.editPayerPills.appendChild(
        pillEl(m.name, editPayerId === m.id, () => { editPayerId = m.id; renderEditPills(); })
      );
      els.editPartPills.appendChild(
        pillEl(m.name, !!editSelectedParts[m.id], () => {
          editSelectedParts[m.id] = !editSelectedParts[m.id];
          renderEditPills();
        })
      );
    }
  }

  function closeEditModal(){
    els.editBack.style.display = "none";
    editingExpense    = null;
    editPayerId       = null;
    editSelectedParts = {};
  }

  // ── Event listeners ───────────────────────────────────────
  els.createTripBtn.addEventListener("click", async () => {
    const name = normalizeName(els.tripName.value);
    if(!name) return alert("Enter a trip name.");
    setStatus("Creating trip…");
    try {
      currentTrip = await api("/api/trips", { method: "POST", body: JSON.stringify({ name }) });
      localStorage.setItem("ttt_current_trip", currentTrip.code);
      els.tripName.value = "";
      payerId = null; selectedParts = {};
      await refreshAll();
    } catch(e){
      alert("Error creating trip: " + e.message);
      setStatus("No trip joined yet.");
    }
  });

  els.joinTripBtn.addEventListener("click", async () => {
    const code = normalizeName(els.joinCode.value).toUpperCase();
    if(!code) return alert("Enter a trip code.");
    els.joinCode.value = "";
    await joinTrip(code);
  });

  els.addMemberBtn.addEventListener("click", async () => {
    if(!currentTrip) return alert("Create or join a trip first.");
    const name = normalizeName(els.memberName.value);
    if(!name) return alert("Enter a friend name.");
    try {
      await api(`/api/trips/${currentTrip.code}/members`, {
        method: "POST", body: JSON.stringify({ name })
      });
      els.memberName.value = "";
      await refreshAll();
    } catch(e){
      alert("Error adding friend: " + e.message);
    }
  });

  els.memberName.addEventListener("keydown", (e) => {
    if(e.key === "Enter") els.addMemberBtn.click();
  });

  els.addBtn.addEventListener("click", async () => {
    if(!currentTrip) return alert("Create or join a trip first.");
    if(!members.length)  return alert("Add at least one friend first.");
    const description = normalizeName(els.desc.value);
    const amount      = Number(els.amount.value);
    if(!description) return alert("Enter a description.");
    if(!Number.isFinite(amount) || amount <= 0) return alert("Enter a valid amount.");
    if(!payerId) return alert("Choose who paid.");
    const participants = members.filter(m => selectedParts[m.id]).map(m => m.id);
    if(!participants.length) return alert("Pick at least one participant.");
    try {
      await api(`/api/trips/${currentTrip.code}/expenses`, {
        method: "POST",
        body: JSON.stringify({ description, amount, payer_member_id: payerId, participants })
      });
      els.desc.value = ""; els.amount.value = "";
      members.forEach(m => selectedParts[m.id] = true);
      await refreshAll();
    } catch(e){
      alert("Error adding expense: " + e.message);
    }
  });

  els.closeEditBtn.addEventListener("click",  closeEditModal);
  els.cancelEditBtn.addEventListener("click", closeEditModal);
  els.editBack.addEventListener("click", (e) => { if(e.target === els.editBack) closeEditModal(); });

  // Note: the backend doesn't have a PATCH/PUT endpoint for expenses,
  // so Save = delete old + create new (same effect, seamless to user)
  els.saveEditBtn.addEventListener("click", async () => {
    if(!currentTrip || !editingExpense) return;
    const description = normalizeName(els.editDesc.value);
    const amount      = Number(els.editAmount.value);
    if(!description) return alert("Enter a description.");
    if(!Number.isFinite(amount) || amount <= 0) return alert("Enter a valid amount.");
    if(!editPayerId) return alert("Choose who paid.");
    const participants = members.filter(m => editSelectedParts[m.id]).map(m => m.id);
    if(!participants.length) return alert("Pick at least one participant.");
    try {
      await api(`/api/expenses/${editingExpense.id}`, {
        method: "PUT",
        body: JSON.stringify({ description, amount, payer_member_id: editPayerId, participants })
      });
      closeEditModal();
      await refreshAll();
    } catch(e){
      alert("Error saving: " + e.message);
    }
  });

  els.deleteExpenseBtn.addEventListener("click", async () => {
    if(!currentTrip || !editingExpense) return;
    if(!confirm("Delete this expense?")) return;
    try {
      await api(`/api/expenses/${editingExpense.id}`, { method: "DELETE" });
      closeEditModal();
      await refreshAll();
    } catch(e){
      alert("Error deleting: " + e.message);
    }
  });

  // ── Init ──────────────────────────────────────────────────
  const lastCode = localStorage.getItem("ttt_current_trip");
  if(lastCode){
    joinTrip(lastCode);
  } else {
    renderAll();
  }
});
