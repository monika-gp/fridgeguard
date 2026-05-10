import { useState } from "react";

const USERS = [
  { id: "priya", name: "Priya", emoji: "🟣", color: "#7C3AED" },
  { id: "alex",  name: "Alex",  emoji: "🟢", color: "#059669" },
  { id: "ben",   name: "Ben",   emoji: "🟠", color: "#D97706" },
  { id: "cleo",  name: "Cleo",  emoji: "🔴", color: "#DC2626" },
];

const INITIAL_TRUST = { priya: 90, alex: 87, ben: 72, cleo: 91 };

const INITIAL_ITEMS = [
  { id: 1, name: "Yogurt",        icon: "🥛", owner: "priya", expiry: "ok",   missing: true  },
  { id: 2, name: "Leftover Rice", icon: "🍚", owner: "priya", expiry: "soon", missing: false },
  { id: 3, name: "Orange Juice",  icon: "🍊", owner: "alex",  expiry: "ok",   missing: false },
  { id: 4, name: "Cheese Block",  icon: "🧀", owner: "ben",   expiry: "bad",  missing: false },
  { id: 5, name: "Eggs (6)",      icon: "🥚", owner: "ben",   expiry: "ok",   missing: false },
  { id: 6, name: "Salad Leaves",  icon: "🥗", owner: "cleo",  expiry: "bad",  missing: false },
];

const EXPIRY_LABEL = { ok: "✅ Fresh", soon: "⚠️ Expires soon", bad: "❌ Expires today" };
const EXPIRY_COLOR = { ok: "#D1FAE5", soon: "#FEF3C7", bad: "#FEE2E2" };
const EXPIRY_TEXT  = { ok: "#065F46", soon: "#92400E", bad: "#991B1B" };

export default function App() {
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [tab, setTab] = useState("fridge");
  const [newItem, setNewItem] = useState({ name: "", icon: "🍱", expiry: "ok" });
  const [showAdd, setShowAdd] = useState(false);
  const [trust, setTrust] = useState(INITIAL_TRUST);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const user = USERS.find(u => u.id === currentUser);

  function login(userId) {
    setCurrentUser(userId);
    setScreen("app");
    setTab("fridge");
    setAiMessage("");
  }

  function logout() {
    setScreen("login");
    setCurrentUser(null);
  }

  function addItem() {
    if (!newItem.name.trim()) return;
    setItems([...items, {
      id: Date.now(), name: newItem.name, icon: newItem.icon,
      owner: currentUser, expiry: newItem.expiry, missing: false,
    }]);
    setNewItem({ name: "", icon: "🍱", expiry: "ok" });
    setShowAdd(false);
  }

  function flagMissing(id) {
    const item = items.find(i => i.id === id);
    setItems(items.map(i => i.id === id ? { ...i, missing: true } : i));
    setTrust(prev => ({ ...prev, [item.owner]: Math.max(0, prev[item.owner] - 10) }));
  }

  function removeItem(id) {
    setItems(items.filter(i => i.id !== id));
  }

  async function askAI() {
    setAiLoading(true);
    setAiMessage("Thinking...");
    await new Promise(r => setTimeout(r, 2000));
    const myItems = items.filter(i => i.owner === currentUser);
    const missingItems = items.filter(i => i.missing && i.owner === currentUser);
    const expiringItems = items.filter(i => (i.expiry === "bad" || i.expiry === "soon") && i.owner === currentUser);
    const myTrust = trust[currentUser];
    let message = `Hi ${user.name}! 👋 `;
    if (missingItems.length > 0) message += `⚠️ Your ${missingItems.map(i => i.name).join(", ")} has been flagged as missing — check with your roommates! `;
    if (expiringItems.length > 0) message += `🕐 Your ${expiringItems.map(i => i.name).join(", ")} is expiring soon — use it today! `;
    if (myItems.length === 0) message += `You have no items in the fridge right now. `;
    if (myTrust < 80) message += `📉 Your trust score is ${myTrust}/100 — try resolving open disputes.`;
    else message += `✅ Your trust score is ${myTrust}/100 — keep it up!`;
    setAiMessage(message);
    setAiLoading(false);
  }

  const myItems    = items.filter(i => i.owner === currentUser);
  const otherItems = items.filter(i => i.owner !== currentUser);
  const alerts     = items.filter(i => i.missing || i.expiry === "bad");

  const s = {
    page:       { minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)", fontFamily: "'Segoe UI', sans-serif" },
    center:     { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 },
    card:       { background: "white", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", width: "100%", maxWidth: 400 },
    appWrap:    { maxWidth: 480, margin: "0 auto", padding: 16 },
    header:     { background: "white", borderRadius: 16, padding: "12px 16px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" },
    tabRow:     { display: "flex", gap: 8, marginBottom: 16 },
    tab:        (active) => ({ flex: 1, padding: "10px 4px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 13, background: active ? "#4F46E5" : "white", color: active ? "white" : "#6B7280", boxShadow: active ? "0 2px 8px rgba(79,70,229,0.3)" : "0 1px 4px rgba(0,0,0,0.06)" }),
    itemCard:   (mine) => ({ background: mine ? "#F5F3FF" : "white", border: `1px solid ${mine ? "#DDD8FF" : "#F3F4F6"}`, borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }),
    badge:      (expiry) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: EXPIRY_COLOR[expiry], color: EXPIRY_TEXT[expiry], fontWeight: 500 }),
    btn:        (color, text) => ({ padding: "8px 14px", borderRadius: 10, border: "none", background: color, color: text || "white", cursor: "pointer", fontWeight: 500, fontSize: 13 }),
    primaryBtn: { width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "white", fontSize: 16, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" },
    statCard:   { background: "white", borderRadius: 14, padding: 16, flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" },
  };

  // ── LOGIN SCREEN ──
  if (screen === "login") return (
    <div style={s.page}>
      <div style={s.center}>
        <div style={s.card}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🧊</div>
            <h1 style={{ margin: 0, fontSize: 26, color: "#1E1B4B", fontWeight: 700 }}>FridgeGuard</h1>
            <p style={{ color: "#6B7280", margin: "6px 0 0", fontSize: 14 }}>Smart hostel fridge assistant</p>
            <div style={{ width: 40, height: 3, background: "linear-gradient(90deg,#4F46E5,#7C3AED)", borderRadius: 99, margin: "12px auto 0" }} />
          </div>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16, textAlign: "center" }}>Who are you? Pick your profile 👇</p>
          {USERS.map(u => (
            <button key={u.id} onClick={() => login(u.id)}
              style={{ width: "100%", padding: "14px 18px", borderRadius: 14, border: `2px solid #F3F4F6`,
                background: "white", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 24 }}>{u.emoji}</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, color: "#1F2937", fontSize: 15 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>Trust score: {INITIAL_TRUST[u.id]}/100</div>
              </div>
              <span style={{ marginLeft: "auto", color: "#C4B5FD", fontSize: 18 }}>→</span>
            </button>
          ))}
          <p style={{ fontSize: 11, color: "#D1D5DB", textAlign: "center", marginTop: 8 }}>Room 4B · 4 roommates</p>
        </div>
      </div>
    </div>
  );

  // ── MAIN APP ──
  return (
    <div style={s.page}>
      <div style={s.appWrap}>

        {/* Header */}
        <div style={s.header}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>🧊</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1E1B4B" }}>FridgeGuard</div>
              <div style={{ fontSize: 11, color: "#9CA3AF" }}>{user.emoji} {user.name} · Room 4B</div>
            </div>
          </div>
          <button onClick={logout} style={s.btn("#F3F4F6", "#6B7280")}>← Switch</button>
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={s.statCard}>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#4F46E5" }}>{myItems.length}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>My Items</div>
          </div>
          <div style={s.statCard}>
            <div style={{ fontSize: 22, fontWeight: 700, color: alerts.length > 0 ? "#DC2626" : "#059669" }}>{alerts.length}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Alerts</div>
          </div>
          <div style={s.statCard}>
            <div style={{ fontSize: 22, fontWeight: 700, color: trust[currentUser] >= 80 ? "#059669" : "#D97706" }}>{trust[currentUser]}</div>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>Trust Score</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabRow}>
          {["fridge","alerts","trust","ai"].map(t => (
            <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {t === "fridge" ? "🧊 Fridge" : t === "alerts" ? `🔔 ${alerts.length > 0 ? `(${alerts.length})` : "Alerts"}` : t === "trust" ? "🏆 Trust" : "🤖 AI"}
            </button>
          ))}
        </div>

        {/* Fridge Tab */}
        {tab === "fridge" && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#4F46E5", marginBottom: 10 }}>Your Items</p>
            {myItems.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>You have no items in the fridge.</p>}
            {myItems.map(item => (
              <div key={item.id} style={s.itemCard(true)}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#1F2937", fontSize: 14 }}>
                    {item.name} {item.missing && <span style={{ color: "#DC2626", fontSize: 12 }}>⚠️ Missing</span>}
                  </div>
                  <span style={s.badge(item.expiry)}>{EXPIRY_LABEL[item.expiry]}</span>
                </div>
                <button onClick={() => removeItem(item.id)} style={s.btn("#FEE2E2", "#DC2626")}>Remove</button>
              </div>
            ))}

            {showAdd ? (
              <div style={{ background: "white", borderRadius: 14, padding: 16, marginTop: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <input placeholder="Item name (e.g. Milk)" value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 10, boxSizing: "border-box", fontSize: 14 }} />
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {["🍱","🥛","🍎","🧀","🥚","🍊","🥗","🧈","🍚"].map(e => (
                    <span key={e} onClick={() => setNewItem({ ...newItem, icon: e })}
                      style={{ fontSize: 24, cursor: "pointer", opacity: newItem.icon === e ? 1 : 0.3, transition: "opacity 0.2s" }}>{e}</span>
                  ))}
                </div>
                <select value={newItem.expiry} onChange={e => setNewItem({ ...newItem, expiry: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 10, fontSize: 14 }}>
                  <option value="ok">✅ Fresh</option>
                  <option value="soon">⚠️ Expires soon</option>
                  <option value="bad">❌ Expires today</option>
                </select>
                <button onClick={addItem} style={s.primaryBtn}>➕ Add to Fridge</button>
              </div>
            ) : (
              <button onClick={() => setShowAdd(true)}
                style={{ width: "100%", padding: 12, border: "2px dashed #C4B5FD", borderRadius: 14,
                  background: "transparent", color: "#7C3AED", cursor: "pointer", marginTop: 4, fontWeight: 500 }}>
                ➕ Log new item
              </button>
            )}

            <p style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", margin: "20px 0 10px" }}>Roommates' Items</p>
            {otherItems.map(item => {
              const owner = USERS.find(u => u.id === item.owner);
              return (
                <div key={item.id} style={s.itemCard(false)}>
                  <span style={{ fontSize: 28 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#1F2937", fontSize: 14 }}>
                      {item.name} {item.missing && <span style={{ color: "#DC2626", fontSize: 12 }}>⚠️ Missing</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#9CA3AF" }}>{owner.emoji} {owner.name}</div>
                    <span style={s.badge(item.expiry)}>{EXPIRY_LABEL[item.expiry]}</span>
                  </div>
                  <button onClick={() => flagMissing(item.id)} style={s.btn("#FEF3C7", "#92400E")}>Flag</button>
                </div>
              );
            })}
          </div>
        )}

        {/* Alerts Tab */}
        {tab === "alerts" && (
          <div>
            {alerts.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>No alerts right now 🎉</p>}
            {alerts.map(item => {
              const owner = USERS.find(u => u.id === item.owner);
              return (
                <div key={item.id} style={{ background: "white", border: `1px solid ${item.missing ? "#FECACA" : "#FDE68A"}`,
                  borderLeft: `4px solid ${item.missing ? "#DC2626" : "#F59E0B"}`,
                  borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>{item.icon} {item.name}</div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                    {owner.emoji} {owner.name} · {item.missing ? "⚠️ Flagged as missing" : EXPIRY_LABEL[item.expiry]}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Trust Tab */}
        {tab === "trust" && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginBottom: 14 }}>🏆 Trust Leaderboard</p>
            {USERS.slice().sort((a, b) => trust[b.id] - trust[a.id]).map((u, index) => {
              const score = trust[u.id];
              const color = score >= 80 ? "#059669" : score >= 50 ? "#D97706" : "#DC2626";
              const medal = ["🥇","🥈","🥉","4️⃣"][index];
              return (
                <div key={u.id} style={{ background: currentUser === u.id ? "#F5F3FF" : "white",
                  border: `1px solid ${currentUser === u.id ? "#DDD8FF" : "#F3F4F6"}`,
                  borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <span style={{ fontSize: 22 }}>{medal}</span>
                  <span style={{ fontSize: 20 }}>{u.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1F2937" }}>
                      {u.name} {currentUser === u.id && <span style={{ fontSize: 10, background: "#4F46E5", color: "white", padding: "2px 8px", borderRadius: 99 }}>You</span>}
                    </div>
                    <div style={{ marginTop: 6, background: "#F3F4F6", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, background: color, height: "100%", borderRadius: 99, transition: "width 0.5s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color, fontSize: 16, minWidth: 36, textAlign: "right" }}>{score}</span>
                </div>
              );
            })}
            <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 8, lineHeight: 1.6 }}>
              ⚠️ Scores drop by 10 when your item is flagged missing.
            </p>
          </div>
        )}

        {/* AI Tab */}
        {tab === "ai" && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginBottom: 12 }}>🤖 FridgeGuard AI</p>
            {aiMessage && (
              <div style={{ background: "linear-gradient(135deg, #F5F3FF, #EEF2FF)", border: "1px solid #DDD8FF",
                borderRadius: 16, padding: 18, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, marginBottom: 6 }}>🤖 AI ASSISTANT</div>
                <p style={{ fontSize: 14, color: "#1E1B4B", lineHeight: 1.7, margin: 0 }}>
                  {aiLoading ? "🤔 Analysing your fridge..." : aiMessage}
                </p>
              </div>
            )}
            <button onClick={askAI} disabled={aiLoading} style={{
              ...s.primaryBtn, opacity: aiLoading ? 0.7 : 1, cursor: aiLoading ? "not-allowed" : "pointer" }}>
              {aiLoading ? "⏳ Getting your summary..." : `✨ Get my fridge summary`}
            </button>
            <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
              AI reads your fridge in real time and gives<br/>personalized advice for {user.name}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}