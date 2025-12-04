// frontend/src/App.js
import React, { useEffect, useState } from "react";
import Auth from "./Auth";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const API_BASE = process.env.REACT_APP_BACKEND_URL || "/api";

function niceDate(d) { if (!d) return ""; return new Date(d).toLocaleDateString(); }
function Currency({ value }) { return <strong>₹{Number(value).toFixed(2)}</strong>; }

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ amount: "", category: "Food", description: "", date: new Date().toISOString().slice(0, 10) });
  const [summary, setSummary] = useState({ total: 0, by_category: [] });
  const [monthly, setMonthly] = useState([]);
  const [user, setUser] = useState(localStorage.getItem("username") || null);
  const token = localStorage.getItem("token");

  function authHeaders() {
    const h = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }

  async function fetchExpenses() {
    try {
      const r = await fetch(`${API_BASE}/expenses`, { headers: authHeaders() });
      if (r.status === 401) { logout(); return; }
      setExpenses(await r.json());
    } catch (e) { console.error(e); }
  }
  async function fetchSummary() {
    try {
      const r = await fetch(`${API_BASE}/summary`, { headers: authHeaders() });
      if (r.status === 401) { logout(); return; }
      setSummary(await r.json());
    } catch (e) { console.error(e); }
  }
  async function fetchMonthly() {
    try {
      const r = await fetch(`${API_BASE}/monthly-summary`, { headers: authHeaders() });
      if (r.status === 401) { logout(); return; }
      setMonthly(await r.json());
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    if (token) {
      fetchExpenses();
      fetchSummary();
      fetchMonthly();
    }
  }, [token]);

  async function remove(id) {
    if (!window.confirm("Delete this expense?")) return;
    const r = await fetch(`${API_BASE}/expenses/${id}`, { method: "DELETE", headers: authHeaders() });
    if (r.status === 401) { logout(); return; }
    if (r.ok) {
      await fetchExpenses();
      await fetchSummary();
      await fetchMonthly();
    } else {
      const j = await r.json().catch(() => ({}));
      alert(j.detail || "Delete failed");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUser(null);
    setExpenses([]);
    setSummary({ total: 0, by_category: [] });
    setMonthly([]);
  }

  function onLogin() {
    setUser(localStorage.getItem("username"));
    fetchExpenses(); fetchSummary(); fetchMonthly();
  }

  const pieData = { labels: summary.by_category.map(c => c.category), datasets: [{ data: summary.by_category.map(c => c.total), label: "By Category" }] };
  const barData = { labels: monthly.map(m => new Date(m.month).toLocaleString(undefined, { month: "short", year: "numeric" })), datasets: [{ label: "Monthly Total", data: monthly.map(m => m.total) }] };

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Expense Tracker Dashboard</h1>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, color: "#666" }}>Total spent</div>
          <div style={{ fontSize: 22 }}><Currency value={summary.total} /></div>
          <div style={{ marginTop: 8 }}>
            {user ? <><span style={{ marginRight: 8 }}>Hi, {user}</span><button onClick={logout} style={{ padding: "6px 8px" }}>Logout</button></> : <span style={{ color: "#888" }}>Not logged in</span>}
          </div>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20 }}>
        <div style={{ padding: 16, borderRadius: 8, boxShadow: "0 4px 18px rgba(0,0,0,0.06)", background: "#fff" }}>
          {!user && <Auth onLogin={onLogin} />}

          <h3 style={{ marginTop: user ? 0 : 8 }}>Add Expense</h3>
          <form onSubmit={(e) => e.preventDefault()}>
            <label>Amount</label>
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} type="number" step="0.01" style={{ width: "100%", padding: 8, marginBottom: 10 }} />
            <label>Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ width: "100%", padding: 8, marginBottom: 10 }}>
              <option>Food</option><option>Transport</option><option>Shopping</option><option>Subscription</option><option>Health</option><option>Other</option>
            </select>
            <label>Date</label>
            <input value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} type="date" style={{ width: "100%", padding: 8, marginBottom: 10 }} />
            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g., lunch at cafe" style={{ width: "100%", padding: 8, marginBottom: 12 }} />
            <button type="submit" style={{ width: "100%", padding: 10, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6 }} disabled={!user}>Add Expense</button>
            {!user && <div style={{ marginTop: 8, color: "#888" }}>Please login or register to add expenses</div>}
          </form>

          <div style={{ marginTop: 16 }}>
            <h4>By Category</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {summary.by_category.map(c => (
                <li key={c.category} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span>{c.category}</span><span>₹{Number(c.total).toFixed(2)}</span>
                </li>
              ))}
              {summary.by_category.length === 0 && <li style={{ color: "#888" }}>No data yet</li>}
            </ul>
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Expenses</h3>
            <div style={{ fontSize: 13, color: "#666" }}>{expenses.length} items</div>
          </div>

          <div style={{ marginBottom: 16, padding: 12, borderRadius: 8, boxShadow: "0 4px 18px rgba(0,0,0,0.04)", background: "#fff" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ textAlign: "left", color: "#666", fontSize: 13 }}>
                <th style={{ padding: "8px 6px" }}>Date</th><th style={{ padding: "8px 6px" }}>Description</th><th style={{ padding: "8px 6px" }}>Category</th><th style={{ padding: "8px 6px", textAlign: "right" }}>Amount</th><th style={{ padding: "8px 6px", textAlign: "center" }}>Action</th>
              </tr></thead>
              <tbody>
                {expenses.map(ex => (
                  <tr key={ex.id} style={{ borderTop: "1px solid #f6f7fb" }}>
                    <td style={{ padding: "10px 6px", width: 120 }}>{niceDate(ex.date)}</td>
                    <td style={{ padding: "10px 6px" }}>{ex.description || "—"}</td>
                    <td style={{ padding: "10px 6px" }}>{ex.category}</td>
                    <td style={{ padding: "10px 6px", textAlign: "right" }}><Currency value={ex.amount} /></td>
                    <td style={{ padding: "10px 6px", textAlign: "center" }}><button onClick={() => remove(ex.id)} style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #eee", background: "#fff" }}>Delete</button></td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan="5" style={{ padding: 12, color: "#888" }}>No expenses yet — add one!</td></tr>}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 8, boxShadow: "0 4px 18px rgba(0,0,0,0.04)", background: "#fff" }}>
              <h4 style={{ marginTop: 0 }}>Category Distribution</h4>
              <Pie data={pieData} />
            </div>

            <div style={{ padding: 12, borderRadius: 8, boxShadow: "0 4px 18px rgba(0,0,0,0.04)", background: "#fff" }}>
              <h4 style={{ marginTop: 0 }}>Monthly Totals</h4>
              <Bar data={barData} />
            </div>
          </div>
        </div>
      </section>

      <footer style={{ marginTop: 24, color: "#999", fontSize: 13, textAlign: "center" }}>Built with ❤️ — Expense Tracker Demo</footer>
    </div>
  );
}
