import { useState } from "react";

const USERS = [
  { id: "priya", name: "Priya", emoji: "🟣" },
  { id: "alex",  name: "Alex",  emoji: "🟢" },
  { id: "ben",   name: "Ben",   emoji: "🟠" },
  { id: "cleo",  name: "Cleo",  emoji: "🔴" },
];

const INITIAL_TRUST = {
  priya: 100,
  alex:  87,
  ben:   72,
  cleo:  91,
};

const INITIAL_ITEMS = [
  { id: 1, name: "Yogurt",       icon: "🥛", owner: "priya", expiry: "ok",   missing: true  },
  { id: 2, name: "Leftover Rice",icon: "🍚", owner: "priya", expiry: "soon", missing: false },
  { id: 3, name: "Orange Juice", icon: "🍊", owner: "alex",  expiry: "ok",   missing: false },
  { id: 4, name: "Cheese Block", icon: "🧀", owner: "ben",   expiry: "bad",  missing: false },
  { id: 5, name: "Eggs (6)",     icon: "🥚", owner: "ben",   expiry: "ok",   missing: false },
  { id: 6, name: "Salad Leaves", icon: "🥗", owner: "cleo",  expiry: "bad",  missing: false },
];

const EXPIRY_LABEL = { ok: "✅ Fresh", soon: "⚠️ Expires soon", bad: "❌ Expires today" };

export default function App() {
  const [currentUser, setCurrentUser] = useState("priya");
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [tab, setTab] = useState("fridge");
  const [newItem, setNewItem] = useState({ name: "", icon: "🍱", expiry: "ok" });
  const [showAdd, setShowAdd] = useState(false);
  const [trust, setTrust] = useState(INITIAL_TRUST);

  const user = USERS.find(u => u.id === currentUser);

  function addItem() {
    if (!newItem.name.trim()) return;
    setItems([...items, {
      id: Date.now(),
      name: newItem.name,
      icon: newItem.icon,
      owner: currentUser,
      expiry: newItem.expiry,
      missing: false,
    }]);
    setNewItem({ name: "", icon: "🍱", expiry: "ok" });
    setShowAdd(false);
  }

  function flagMissing(id) {
    const item = items.find(i => i.id === id);
    setItems(items.map(i => i.id === id ? { ...i, missing: true } : i));
    setTrust(prev => ({
      ...prev,
      [item.owner]: Math.max(0, prev[item.owner] - 10)
    }));
  }

  function removeItem(id) {
    setItems(items.filter(i => i.id !== id));
  }

  const myItems    = items.filter(i => i.owner === currentUser);
  const otherItems = items.filter(i => i.owner !== currentUser);
  const alerts     = items.filter(i => i.missing || i.expiry === "bad");

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", fontFamily: "sans-serif", padding: 16 }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>🧊 FridgeGuard</h2>
          <small style={{ color: "gray" }}>Room 4B · logged in as {user.emoji} {user.name}</small>
        </div>
        <select value={currentUser} onChange={e => setCurrentUser(e.target.value)}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #ddd" }}>
          {USERS.map(u => <option key={u.id} value={u.id}>{u.emoji} {u.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      {["fridge", "alerts", "trust"].map(t => (
        <button key={t} onClick={() => setTab(t)}
          style={{ marginRight: 8, padding: "6px 16px", borderRadius: 20,
            background: tab === t ? "#4F46E5" : "#eee",
            color: tab === t ? "white" : "black", border: "none", cursor: "pointer", marginBottom: 16 }}>
          {t === "fridge" ? "🧊 Fridge" : t === "alerts" ? `🔔 Alerts ${alerts.length > 0 ? `(${alerts.length})` : ""}` : "🏆 Trust"}
        </button>
      ))}

      {/* Fridge Tab */}
      {tab === "fridge" && (
        <div>
          <h4 style={{ color: "#4F46E5" }}>Your Items</h4>
          {myItems.length === 0 && <p style={{ color: "gray" }}>You have no items in the fridge.</p>}
          {myItems.map(item => (
            <div key={item.id} style={{ background: "#F5F3FF", border: "1px solid #DDD8FF",
              borderRadius: 12, padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              <div style={{ flex: 1, marginLeft: 12 }}>
                <strong>{item.name}</strong> {item.missing && <span style={{ color: "red" }}>⚠️ Missing</span>}
                <div style={{ fontSize: 12, color: "gray" }}>{EXPIRY_LABEL[item.expiry]}</div>
              </div>
              <button onClick={() => removeItem(item.id)}
                style={{ background: "#fee", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "red" }}>
                Remove
              </button>
            </div>
          ))}

          {showAdd ? (
            <div style={{ background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 12, padding: 12, marginTop: 8 }}>
              <input placeholder="Item name (e.g. Milk)" value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd", marginBottom: 8, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {["🍱","🥛","🍎","🧀","🥚","🍊","🥗","🧈","🍚"].map(e => (
                  <span key={e} onClick={() => setNewItem({ ...newItem, icon: e })}
                    style={{ fontSize: 22, cursor: "pointer", opacity: newItem.icon === e ? 1 : 0.4 }}>{e}</span>
                ))}
              </div>
              <select value={newItem.expiry} onChange={e => setNewItem({ ...newItem, expiry: e.target.value })}
                style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ddd", marginBottom: 8 }}>
                <option value="ok">✅ Fresh</option>
                <option value="soon">⚠️ Expires soon</option>
                <option value="bad">❌ Expires today</option>
              </select>
              <button onClick={addItem}
                style={{ width: "100%", padding: 10, background: "#4F46E5", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}>
                ➕ Add to Fridge
              </button>
            </div>
          ) : (
            <button onClick={() => setShowAdd(true)}
              style={{ width: "100%", padding: 10, border: "1px dashed #aaa", borderRadius: 10,
                background: "transparent", color: "gray", cursor: "pointer", marginTop: 8 }}>
              ➕ Log new item
            </button>
          )}

          <h4 style={{ color: "gray", marginTop: 20 }}>Roommates' Items</h4>
          {otherItems.map(item => {
            const owner = USERS.find(u => u.id === item.owner);
            return (
              <div key={item.id} style={{ background: "#fafafa", border: "1px solid #eee",
                borderRadius: 12, padding: 12, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 24 }}>{item.icon}</span>
                <div style={{ flex: 1, marginLeft: 12 }}>
                  <strong>{item.name}</strong> {item.missing && <span style={{ color: "red" }}>⚠️ Missing</span>}
                  <div style={{ fontSize: 12, color: "gray" }}>{owner.emoji} {owner.name} · {EXPIRY_LABEL[item.expiry]}</div>
                </div>
                <button onClick={() => flagMissing(item.id)}
                  style={{ background: "#fff3cd", border: "none", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "#856404" }}>
                  Flag
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Alerts Tab */}
      {tab === "alerts" && (
        <div>
          {alerts.length === 0 && <p style={{ color: "gray" }}>No alerts right now 🎉</p>}
          {alerts.map(item => {
            const owner = USERS.find(u => u.id === item.owner);
            return (
              <div key={item.id} style={{ background: item.missing ? "#FEF2F2" : "#FFFBEB",
                border: `1px solid ${item.missing ? "#FECACA" : "#FDE68A"}`,
                borderRadius: 12, padding: 12, marginBottom: 8 }}>
                <strong>{item.icon} {item.name}</strong>
                <div style={{ fontSize: 13, color: "gray", marginTop: 4 }}>
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
          <h4 style={{ marginBottom: 16 }}>🏆 Trust Leaderboard</h4>
          {USERS
            .slice()
            .sort((a, b) => trust[b.id] - trust[a.id])
            .map((u, index) => {
              const score = trust[u.id];
              const color = score >= 80 ? "#16A34A" : score >= 50 ? "#D97706" : "#DC2626";
              const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "  ";
              return (
                <div key={u.id} style={{ background: currentUser === u.id ? "#F5F3FF" : "#fafafa",
                  border: `1px solid ${currentUser === u.id ? "#DDD8FF" : "#eee"}`,
                  borderRadius: 12, padding: 12, marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{medal}</span>
                  <span style={{ fontSize: 20 }}>{u.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <strong>{u.name}</strong> {currentUser === u.id && <span style={{ fontSize: 11, background: "#4F46E5", color: "white", padding: "1px 7px", borderRadius: 99 }}>You</span>}
                    <div style={{ marginTop: 6, background: "#eee", borderRadius: 99, height: 8, overflow: "hidden" }}>
                      <div style={{ width: `${score}%`, background: color, height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
                    </div>
                  </div>
                  <span style={{ fontWeight: 600, color, minWidth: 36, textAlign: "right" }}>{score}</span>
                </div>
              );
            })}
          <p style={{ fontSize: 12, color: "gray", marginTop: 12, lineHeight: 1.6 }}>
            ⚠️ Scores drop by 10 when your item is flagged missing.<br/>
            Stay honest to keep your score high!
          </p>
        </div>
      )}

    </div>
  );
}