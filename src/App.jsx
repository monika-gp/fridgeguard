import { supabase } from './supabase'
import { useState, useEffect } from "react";
const USER_PROFILES = {
  "priya@fridgeguard.com":  { id: "priya",  name: "Priya",  emoji: "🟣", color: "#7C3AED" },
  "rahul@fridgeguard.com":  { id: "rahul",  name: "Rahul",  emoji: "🟢", color: "#059669" },
  "sneha@fridgeguard.com":  { id: "sneha",  name: "Sneha",  emoji: "🟠", color: "#D97706" },
  "arjun@fridgeguard.com":  { id: "arjun",  name: "Arjun",  emoji: "🔴", color: "#DC2626" },
};

const USERS = [
  { id: "priya",  name: "Priya",  emoji: "🟣", color: "#7C3AED" },
  { id: "rahul",  name: "Rahul",  emoji: "🟢", color: "#059669" },
  { id: "sneha",  name: "Sneha",  emoji: "🟠", color: "#D97706" },
  { id: "arjun",  name: "Arjun",  emoji: "🔴", color: "#DC2626" },
];

const INITIAL_TRUST = { priya: 95, rahul: 58, sneha: 89, arjun: 74 };

const INITIAL_ITEMS = [
  { id: 1, name: "Curd",        icon: "🥛", owner: "priya",  expiry: "soon", missing: false },
  { id: 2, name: "Chapati",     icon: "🫓", owner: "priya",  expiry: "bad",  missing: true  },
  { id: 3, name: "Mango Juice", icon: "🥭", owner: "rahul",  expiry: "ok",   missing: false },
  { id: 4, name: "Biryani Box", icon: "🍱", owner: "rahul",  expiry: "bad",  missing: false },
  { id: 5, name: "Eggs (6)",    icon: "🥚", owner: "sneha",  expiry: "ok",   missing: false },
  { id: 6, name: "Butter",      icon: "🧈", owner: "arjun",  expiry: "soon", missing: true  },
];

const EXPIRY_LABEL = { ok: "✅ Fresh", soon: "⚠️ Expires soon", bad: "❌ Expires today" };

function getExpiryStatus(dateStr) {
  if (!dateStr) return "ok";
  const today = new Date();
  const expiry = new Date(dateStr);
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "bad";
  if (diffDays <= 2) return "soon";
  return "ok";
}

function formatExpiryDate(dateStr) {
  if (!dateStr) return "No expiry set";
  const expiry = new Date(dateStr);
  return expiry.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
const EXPIRY_COLOR = { ok: "#D1FAE5", soon: "#FEF3C7", bad: "#FEE2E2" };
const EXPIRY_TEXT  = { ok: "#065F46", soon: "#92400E", bad: "#991B1B" };

export default function App() {
  const [screen, setScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("fridge");
  const [newItem, setNewItem] = useState({ name: "", icon: "🍱", expiry: "ok" });
  const [showAdd, setShowAdd] = useState(false);
  const [trust, setTrust] = useState(INITIAL_TRUST);
  const [aiMessage, setAiMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [history, setHistory] = useState([]);

  const user = USERS.find(u => u.id === currentUser);

  useEffect(() => {
    async function loadAll() {
      const { data: itemsData } = await supabase.from("items").select("*");
      if (itemsData && itemsData.length > 0) setItems(itemsData);

      const { data: trustData } = await supabase.from("trust_scores").select("*");
      if (trustData && trustData.length > 0) {
        const trustObj = {};
        trustData.forEach(row => { trustObj[row.user_id] = row.score; });
        setTrust(trustObj);
      }

      const { data: historyData } = await supabase.from("history").select("*").order("created_at", { ascending: false }).limit(20);
      if (historyData && historyData.length > 0) {
        setHistory(historyData.map(h => ({
          id: h.id,
          text: formatHistory(h),
          icon: h.action === "added" ? "➕" : h.action === "flagged" ? "⚠️" : "📉",
          time: "Recently",
        })));
      }
    }
    loadAll();

    // REALTIME LISTENERS
    const itemsSub = supabase
      .channel("any")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, (payload) => {
        console.log("Realtime items change:", payload);
        supabase.from("items").select("*").then(({ data }) => {
          if (data) setItems(data);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "trust_scores" }, () => {
        supabase.from("trust_scores").select("*").then(({ data }) => {
          if (data) {
            const trustObj = {};
            data.forEach(row => { trustObj[row.user_id] = row.score; });
            setTrust(trustObj);
          }
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => {
        supabase.from("history").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
          if (data) setHistory(data.map(h => ({
            id: h.id,
            text: formatHistory(h),
            icon: h.action === "added" ? "➕" : h.action === "flagged" ? "⚠️" : "📉",
            time: "Recently",
          })));
        });
      })
      .subscribe((status) => {
        console.log("Realtime status:", status);
      });

    return () => {
      supabase.removeChannel(itemsSub);
    };

    const trustSub = supabase
      .channel("trust-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "trust_scores" }, () => {
        supabase.from("trust_scores").select("*").then(({ data }) => {
          if (data) {
            const trustObj = {};
            data.forEach(row => { trustObj[row.user_id] = row.score; });
            setTrust(trustObj);
          }
        });
      })
      .subscribe();

    const historySub = supabase
      .channel("history-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => {
        supabase.from("history").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
          if (data) setHistory(data.map(h => ({
            id: h.id,
            text: formatHistory(h),
            icon: h.action === "added" ? "➕" : h.action === "flagged" ? "⚠️" : "📉",
            time: "Recently",
          })));
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(itemsSub);
      supabase.removeChannel(trustSub);
      supabase.removeChannel(historySub);
    };
  }, []);

  function formatHistory(h) {
    const owner = USERS.find(u => u.id === h.user_id);
    if (h.action === "added") return `${owner?.name} added ${h.item_name} to the fridge`;
    if (h.action === "flagged") return `${h.item_name} was flagged missing`;
    if (h.action === "trust_drop") return `${owner?.name}'s trust score dropped`;
    return h.action;
  }

  async function addHistoryEntry(userId, action, itemName) {
    await supabase.from("history").insert([{ user_id: userId, action, item_name: itemName }]);
  }

  async function login(email, password) {
    setLoginError("");
    setLoginLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoginError("Wrong email or password. Try again!");
      setLoginLoading(false);
      return;
    }
    const profile = USER_PROFILES[email];
    setCurrentUser(profile.id);
    setScreen("app");
    setTab("fridge");
    setAiMessage("");
    setLoginLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setScreen("login");
    setCurrentUser(null);
  }

  async function addItem() {
    if (!newItem.name.trim()) return;
    const item = {
      name: newItem.name,
      icon: newItem.icon,
      owner: currentUser,
      expiry: newItem.expiry,
      expiry_date: newItem.expiryDate || null,
      missing: false,
    };
    const { data } = await supabase.from("items").insert([item]).select();
    if (data) {
      setItems([...items, data[0]]);
      await addHistoryEntry(currentUser, "added", newItem.name);
      setHistory(prev => [
        { id: Date.now(), text: `${user.name} added ${newItem.icon} ${newItem.name} to the fridge`, time: "Just now", icon: "➕" },
        ...prev,
      ]);
    }
    setNewItem({ name: "", icon: "🍱", expiry: "ok" });
    setShowAdd(false);
  }

  async function flagMissing(id) {
    const item = items.find(i => i.id === id);
    const owner = USERS.find(u => u.id === item.owner);
    await supabase.from("items").update({ missing: true }).eq("id", id);
    setItems(items.map(i => i.id === id ? { ...i, missing: true } : i));

    const newScore = Math.max(0, trust[item.owner] - 10);
    await supabase.from("trust_scores").update({ score: newScore }).eq("user_id", item.owner);
    setTrust(prev => ({ ...prev, [item.owner]: newScore }));

    await addHistoryEntry(item.owner, "flagged", item.name);
    await addHistoryEntry(item.owner, "trust_drop", item.name);
    setHistory(prev => [
      { id: Date.now(), text: `${item.icon} ${item.name} was flagged missing`, time: "Just now", icon: "⚠️" },
      { id: Date.now() + 1, text: `${owner.name}'s trust score dropped to ${newScore}`, time: "Just now", icon: "📉" },
      ...prev,
    ]);
  }

  async function removeItem(id) {
    await supabase.from("items").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
  }

  async function askAI() {
    setAiLoading(true);
    setAiMessage("Thinking...");
    await new Promise(r => setTimeout(r, 2000));
    const myItems    = items.filter(i => i.owner === currentUser && i.name.toLowerCase().includes(search.toLowerCase()));
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

  const myItems    = items.filter(i => i.owner === currentUser && i.name.toLowerCase().includes(search.toLowerCase()));
  const otherItems = items.filter(i => i.owner !== currentUser && i.name.toLowerCase().includes(search.toLowerCase()));
  const alerts     = items.filter(i => i.missing || i.expiry === "bad");

  const s = {
    page:       { minHeight: "100vh", background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)", fontFamily: "'Segoe UI', sans-serif" },
    center:     { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24 },
    card:       { background: "white", borderRadius: 20, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", width: "100%", maxWidth: 400 },
    appWrap:    { maxWidth: 480, margin: "0 auto", padding: 16 },
    header:     { background: "white", borderRadius: 16, padding: "12px 16px", marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" },
    tabRow:     { display: "flex", gap: 6, marginBottom: 16 },
    tab:        (active) => ({ flex: 1, padding: "10px 4px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 500, fontSize: 13, background: active ? "#4F46E5" : "white", color: active ? "white" : "#6B7280", boxShadow: active ? "0 2px 8px rgba(79,70,229,0.3)" : "0 1px 4px rgba(0,0,0,0.06)" }),
    itemCard:   (mine) => ({ background: mine ? "#F5F3FF" : "white", border: `1px solid ${mine ? "#DDD8FF" : "#F3F4F6"}`, borderRadius: 14, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }),
    badge:      (expiry) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 99, background: EXPIRY_COLOR[expiry], color: EXPIRY_TEXT[expiry], fontWeight: 500 }),
    btn:        (color, text) => ({ padding: "8px 14px", borderRadius: 10, border: "none", background: color, color: text || "white", cursor: "pointer", fontWeight: 500, fontSize: 13 }),
    primaryBtn: { width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "white", fontSize: 16, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(79,70,229,0.3)" },
    statCard:   { background: "white", borderRadius: 14, padding: 16, flex: 1, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", textAlign: "center" },
  };

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

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, display: "block" }}>Email</label>
            <input
              type="email"
              placeholder="priya@fridgeguard.com"
              value={loginForm.email}
              onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E5E7EB",
                fontSize: 14, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, display: "block" }}>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={loginForm.password}
              onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
              style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #E5E7EB",
                fontSize: 14, boxSizing: "border-box", outline: "none" }}
            />
          </div>

          {loginError && (
            <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "8px 12px",
              borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
              {loginError}
            </div>
          )}

          <button
            onClick={() => login(loginForm.email, loginForm.password)}
            disabled={loginLoading}
            style={{ ...s.primaryBtn, opacity: loginLoading ? 0.7 : 1, cursor: loginLoading ? "not-allowed" : "pointer" }}>
            {loginLoading ? "⏳ Logging in..." : "🔐 Login"}
          </button>

          <div style={{ marginTop: 20, padding: 14, background: "#F5F3FF", borderRadius: 12 }}>
            <p style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, marginBottom: 8 }}>Demo accounts:</p>
            {Object.entries(USER_PROFILES).map(([email, profile]) => (
              <div key={email} onClick={() => setLoginForm({ email, password: `${profile.name}@123` })}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                  cursor: "pointer", borderBottom: "1px solid #EDE9FE" }}>
                <span>{profile.emoji}</span>
                <span style={{ fontSize: 12, color: "#4F46E5" }}>{email}</span>
              </div>
            ))}
            <p style={{ fontSize: 10, color: "#9CA3AF", marginTop: 6 }}>Click any account to autofill</p>
          </div>

          <p style={{ fontSize: 11, color: "#D1D5DB", textAlign: "center", marginTop: 12 }}>Room 4B · 4 roommates</p>
        </div>
      </div>
    </div>
  );
  return (
    <div style={s.page}>
      <div style={s.appWrap}>

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

        <div style={s.tabRow}>
          {["fridge", "alerts", "trust", "ai", "history"].map(t => (
            <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>
              {t === "fridge" ? "🧊" : t === "alerts" ? `🔔${alerts.length > 0 ? `(${alerts.length})` : ""}` : t === "trust" ? "🏆" : t === "ai" ? "🤖" : "📋"}
            </button>
          ))}
        </div>

        {tab === "fridge" && (
          <div>
            <input
            placeholder="🔍 Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 12, border: "1px solid #E5E7EB",
            marginBottom: 14, boxSizing: "border-box", fontSize: 14, outline: "none" }}
            />
            <p style={{ fontSize: 13, fontWeight: 600, color: "#4F46E5", marginBottom: 10 }}>Your Items</p>
            {myItems.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>You have no items in the fridge.</p>}
            {myItems.map(item => (
              <div key={item.id} style={s.itemCard(true)}>
                <span style={{ fontSize: 28 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#1F2937", fontSize: 14 }}>
                    {item.name} {item.missing && <span style={{ color: "#DC2626", fontSize: 12 }}>⚠️ Missing</span>}
                  </div>
                  <span style={s.badge(item.expiry)}>
  {EXPIRY_LABEL[item.expiry]} {item.expiry_date ? `· ${formatExpiryDate(item.expiry_date)}` : ""}
</span>
                </div>
                <button onClick={() => removeItem(item.id)} style={s.btn("#FEE2E2", "#DC2626")}>Remove</button>
              </div>
            ))}

            {showAdd ? (
              <div style={{ background: "white", borderRadius: 14, padding: 16, marginTop: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <input placeholder="Item name (e.g. Dal)" value={newItem.name}
                  onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #E5E7EB", marginBottom: 10, boxSizing: "border-box", fontSize: 14 }} />
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  {["🍱","🥛","🍎","🧀","🥚","🥭","🥗","🧈","🫓"].map(e => (
                    <span key={e} onClick={() => setNewItem({ ...newItem, icon: e })}
                      style={{ fontSize: 24, cursor: "pointer", opacity: newItem.icon === e ? 1 : 0.3 }}>{e}</span>
                  ))}
                </div>
                <div style={{ marginBottom: 10 }}>
  <label style={{ fontSize: 12, color: "#6B7280", marginBottom: 4, display: "block" }}>
    Expiry Date
  </label>
  <input
    type="date"
    value={newItem.expiryDate || ""}
    min={new Date().toISOString().split("T")[0]}
    onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value, expiry: getExpiryStatus(e.target.value) })}
    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 14, boxSizing: "border-box" }}
  />
</div>
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
                    <span style={s.badge(item.expiry)}>
  {EXPIRY_LABEL[item.expiry]} {item.expiry_date ? `· ${formatExpiryDate(item.expiry_date)}` : ""}
</span>
                  </div>
                  <button onClick={() => flagMissing(item.id)} style={s.btn("#FEF3C7", "#92400E")}>Flag</button>
                </div>
              );
            })}
          </div>
        )}

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

        {tab === "history" && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#1F2937", marginBottom: 14 }}>📋 Activity History</p>
            {history.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>No activity yet.</p>}
            {history.map(h => (
              <div key={h.id} style={{ background: "white", border: "1px solid #F3F4F6",
                borderLeft: `4px solid ${h.icon === "⚠️" ? "#DC2626" : h.icon === "📉" ? "#D97706" : "#059669"}`,
                borderRadius: 14, padding: 14, marginBottom: 10,
                display: "flex", alignItems: "center", gap: 12,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <span style={{ fontSize: 20 }}>{h.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "#1F2937", fontWeight: 500 }}>{h.text}</div>
                  <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>🕐 {h.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}