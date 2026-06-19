import React, { useState, useEffect, useRef } from "react";
import {
  Wrench, Users, Clock, FileText, Plus, Trash2, Camera, X, LogOut,
  Play, Square, DollarSign, Copy, Check, Search, ChevronRight, Settings,
  Printer, TrendingUp,
} from "lucide-react";
import {
  signIn, signOut, getProfile,
  listCustomers, saveCustomer, deleteCustomer,
  listQuotes, saveQuote, deleteQuote,
  listTimeLogs, clockIn, clockOut, payrollThisWeek,
  supabase, PARTS_MARKUP,
} from "./data.js";

const uid = () => crypto.randomUUID();
const money = (n) => "$" + (Number(n) || 0).toFixed(2);
const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const DEFAULT_RATE = 125;

const DEFAULT_LABOR = [
  { name: "Trans R&R - 4L60E/4L65E (2WD)", hours: 8 },
  { name: "Trans R&R - 4L60E/4L65E (4WD)", hours: 10 },
  { name: "Rear main seal R&R", hours: 4 },
  { name: "Oil cooler R&R - 7.3L Powerstroke", hours: 6 },
  { name: "Radiator R&R", hours: 2.5 },
  { name: "Hydroboost R&R - Super Duty", hours: 2 },
  { name: "Power steering pulley R&R", hours: 1 },
  { name: "Crank position sensor R&R", hours: 1.5 },
  { name: "Brake pads + rotors (axle)", hours: 1.5 },
  { name: "Diagnostic (1 hr)", hours: 1 },
];

const RMS_KEYWORDS = ["trans", "transmission", "4l60", "4l65", "r&r"];
const STATUSES = ["Quoted", "Approved", "In Progress", "Done", "Paid"];
const STATUS_COLOR = {
  Quoted: "#8a8378", Approved: "#b45309", "In Progress": "#c2410c",
  Done: "#2f7d4f", Paid: "#1d6b3f",
};

// price is what the customer pays. For owner rows we also have cost.
const partSell = (p) => (Number(p.price) || (Number(p.cost) || 0) * (1 + PARTS_MARKUP)) * (Number(p.qty) || 1);
const partCostTotal = (q) => q.parts.reduce((s, p) => s + (Number(p.cost) || 0) * (Number(p.qty) || 1), 0);
const partMargin = (q) => q.parts.reduce((s, p) => s + (Number(p.cost) || 0) * PARTS_MARKUP * (Number(p.qty) || 1), 0);

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("quotes");
  const [user, setUser] = useState(null); // { id, name, role }

  const [customers, setCustomers] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [settings, setSettings] = useState({ rate: DEFAULT_RATE, payLink: "" });

  const isOwner = user?.role === "owner";

  // restore session on load + subscribe to auth changes
  useEffect(() => {
    (async () => {
      setUser(await getProfile());
      setLoaded(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange(async () => {
      setUser(await getProfile());
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // load shop data once we know who's signed in
  useEffect(() => {
    if (!user) return;
    (async () => {
      setCustomers(await listCustomers());
      setQuotes(await listQuotes(isOwner));
    })();
    try {
      const s = JSON.parse(localStorage.getItem("eap_settings") || "null");
      if (s) setSettings(s);
    } catch {}
  }, [user, isOwner]);

  const persistSettings = (s) => {
    setSettings(s);
    localStorage.setItem("eap_settings", JSON.stringify(s));
  };

  const refreshQuotes = async () => setQuotes(await listQuotes(isOwner));
  const refreshCustomers = async () => setCustomers(await listCustomers());

  if (!loaded)
    return (
      <div style={S.loading}><Wrench size={28} className="spin" /><span>Loading shop…</span><style>{css}</style></div>
    );

  if (!user) return <Login />;

  return (
    <div style={S.app}>
      <style>{css}</style>
      <header style={S.header}>
        <div style={S.brand}>
          <div style={S.logo}><Wrench size={18} /></div>
          <div>
            <div style={S.brandName}>Elite Auto Performance</div>
            <div style={S.brandSub}>Shop Assistant</div>
          </div>
        </div>
        <div style={S.userBox}>
          <span style={S.userName}>{user.name}{isOwner ? " · owner" : ""}</span>
          <button style={S.iconBtn} onClick={signOut} title="Sign out"><LogOut size={16} /></button>
        </div>
      </header>

      <nav style={S.nav}>
        {[
          ["quotes", FileText, "Quotes"],
          ["customers", Users, "Customers"],
          ["time", Clock, "Time"],
          isOwner ? ["settings", Settings, "Settings"] : null,
        ].filter(Boolean).map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ ...S.navBtn, ...(tab === id ? S.navActive : {}) }}>
            <Icon size={16} /><span>{label}</span>
          </button>
        ))}
      </nav>

      <main style={S.main}>
        {tab === "quotes" && (
          <Quotes
            quotes={quotes} customers={customers} settings={settings} user={user} isOwner={isOwner}
            refreshQuotes={refreshQuotes} refreshCustomers={refreshCustomers}
          />
        )}
        {tab === "customers" && (
          <Customers customers={customers} quotes={quotes} refreshCustomers={refreshCustomers} />
        )}
        {tab === "time" && <TimeTracking user={user} isOwner={isOwner} />}
        {tab === "settings" && isOwner && (
          <SettingsPanel settings={settings} setSettings={persistSettings} />
        )}
      </main>
    </div>
  );
}

// ---------- Login (real email + password) ----------
function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true); setErr("");
    try { await signIn(email.trim(), pw); }
    catch (e) { setErr("Couldn't sign in. Check your email and password."); }
    finally { setBusy(false); }
  };

  return (
    <div style={S.loginWrap}>
      <style>{css}</style>
      <div style={S.loginCard}>
        <div style={{ ...S.logo, width: 44, height: 44, marginBottom: 16 }}><Wrench size={22} /></div>
        <h1 style={S.loginTitle}>Elite Auto Performance</h1>
        <p style={S.loginSub}>Sign in to the shop</p>
        <label style={S.label}>Email</label>
        <input style={S.input} type="email" value={email} autoComplete="username"
          onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="you@example.com" />
        <label style={S.label}>Password</label>
        <input style={S.input} type="password" value={pw} autoComplete="current-password"
          onChange={(e) => { setPw(e.target.value); setErr(""); }}
          onKeyDown={(e) => e.key === "Enter" && go()} placeholder="••••••••" />
        {err && <div style={S.errText}>{err}</div>}
        <button style={S.primaryBtn} onClick={go} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <p style={S.hint}>Accounts are created by the owner in the Supabase dashboard.</p>
      </div>
    </div>
  );
}

// ---------- Quotes ----------
function Quotes({ quotes, customers, settings, user, isOwner, refreshQuotes, refreshCustomers }) {
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("All");

  if (editing)
    return (
      <QuoteEditor
        quote={editing} settings={settings} customers={customers} user={user} isOwner={isOwner}
        refreshCustomers={refreshCustomers}
        onSave={async (q) => { await saveQuote(q, isOwner); await refreshQuotes(); setEditing(null); }}
        onCancel={() => setEditing(null)}
        onDelete={async (id) => { await deleteQuote(id); await refreshQuotes(); setEditing(null); }}
      />
    );

  const shown = filter === "All" ? quotes : quotes.filter((q) => (q.status || "Quoted") === filter);
  const counts = STATUSES.reduce((m, s) => ({ ...m, [s]: quotes.filter((q) => (q.status || "Quoted") === s).length }), {});

  return (
    <div>
      <div style={S.sectionHead}>
        <h2 style={S.h2}>Quotes &amp; jobs</h2>
        <button style={S.primaryBtn} onClick={() => setEditing(newQuote(settings))}><Plus size={16} /> New quote</button>
      </div>

      <div style={S.filterRow}>
        <button style={{ ...S.filterChip, ...(filter === "All" ? S.filterActive : {}) }} onClick={() => setFilter("All")}>
          All <span style={S.filterCount}>{quotes.length}</span>
        </button>
        {STATUSES.map((s) => (
          <button key={s} style={{ ...S.filterChip, ...(filter === s ? S.filterActive : {}) }} onClick={() => setFilter(s)}>
            {s} <span style={S.filterCount}>{counts[s]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty icon={FileText} text={filter === "All" ? "No quotes yet. Start one to build labor, parts, photos and a payment link." : `Nothing in "${filter}" right now.`} />
      ) : (
        <div style={S.list}>
          {shown.map((q) => {
            const cust = customers.find((c) => c.id === q.customer_id);
            const st = q.status || "Quoted";
            return (
              <button key={q.id} style={S.row} onClick={() => setEditing(q)}>
                <span style={{ ...S.statusDot, background: STATUS_COLOR[st] }} />
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={S.rowTitle}>{q.number} · {cust?.name || "No customer"}</div>
                  <div style={S.rowSub}>{q.vehicle || "—"} · {q.lines.length} lines</div>
                </div>
                <span style={{ ...S.statusPill, color: STATUS_COLOR[st], borderColor: STATUS_COLOR[st] }}>{st}</span>
                <div style={S.rowTotal}>{money(quoteTotal(q, settings))}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function newQuote(settings) {
  return {
    id: uid(), number: "Q-" + Date.now().toString().slice(-5), customer_id: null, vehicle: "",
    quote_date: new Date().toISOString().slice(0, 10), lines: [], parts: [], notes: "",
    photos: [], pay_link: settings.payLink || "", status: "Quoted", approved_date: null,
  };
}

function quoteTotal(q, settings) {
  const labor = q.lines.reduce((s, l) => s + (Number(l.hours) || 0) * (Number(l.rate) || settings.rate), 0);
  const parts = q.parts.reduce((s, p) => s + partSell(p), 0);
  return labor + parts;
}

function QuoteEditor({ quote, settings, customers, user, isOwner, refreshCustomers, onSave, onCancel, onDelete }) {
  const [q, setQ] = useState(quote);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef();
  const set = (patch) => setQ((p) => ({ ...p, ...patch }));
  const rate = settings.rate;

  // auto rear main seal on trans jobs
  useEffect(() => {
    const isTrans = q.lines.some((l) => RMS_KEYWORDS.some((k) => l.name.toLowerCase().includes(k)));
    const hasRMS = q.lines.some((l) => l.name.toLowerCase().includes("rear main"));
    if (isTrans && !hasRMS) {
      const rms = DEFAULT_LABOR.find((x) => x.name.toLowerCase().includes("rear main"));
      setQ((p) => ({ ...p, lines: [...p.lines, { id: uid(), name: "Rear main seal R&R (auto-added)", hours: rms?.hours || 4, rate }] }));
    }
    // eslint-disable-next-line
  }, [q.lines.map((l) => l.name).join("|")]);

  const addLabor = (item) => set({ lines: [...q.lines, { id: uid(), name: item.name, hours: item.hours, rate }] });
  const addCustomLine = () => set({ lines: [...q.lines, { id: uid(), name: "", hours: 1, rate }] });
  const updLine = (id, patch) => set({ lines: q.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const delLine = (id) => set({ lines: q.lines.filter((l) => l.id !== id) });

  // Owners enter cost (price derived). Employees enter price directly.
  const addPart = () => set({ parts: [...q.parts, isOwner ? { id: uid(), name: "", cost: 0, qty: 1 } : { id: uid(), name: "", price: 0, qty: 1 }] });
  const updPart = (id, patch) => set({ parts: q.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const delPart = (id) => set({ parts: q.parts.filter((p) => p.id !== id) });

  const onPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      const path = `${q.id}/${uid()}.jpg`;
      const { error } = await supabase.storage.from("job-photos").upload(path, f, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("job-photos").getPublicUrl(path);
        setQ((p) => ({ ...p, photos: [...p.photos, { id: uid(), url: data.publicUrl }] }));
      }
    }
    e.target.value = "";
  };

  const total = quoteTotal(q, settings);
  const laborTotal = q.lines.reduce((s, l) => s + (Number(l.hours) || 0) * (Number(l.rate) || rate), 0);
  const partsTotal = q.parts.reduce((s, p) => s + partSell(p), 0);
  const cust = customers.find((c) => c.id === q.customer_id);

  const quoteText = () => {
    const L = q.lines.map((l) => `  ${l.name} — ${l.hours}hr @ ${money(l.rate)} = ${money(l.hours * l.rate)}`).join("\n");
    const P = q.parts.map((p) => `  ${p.name} x${p.qty} = ${money(partSell(p))}`).join("\n");
    return `ELITE AUTO PERFORMANCE
Quote ${q.number} · ${q.quote_date}
Customer: ${cust?.name || "—"}
Vehicle: ${q.vehicle || "—"}

LABOR:
${L || "  —"}

PARTS:
${P || "  —"}

${q.notes ? "Notes: " + q.notes + "\n\n" : ""}TOTAL: ${money(total)}
${q.pay_link ? "\nPay here: " + q.pay_link : ""}

Elite Auto Performance · 352-460-3285`;
  };

  const copyQuote = () => { navigator.clipboard?.writeText(quoteText()); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  const printQuote = () => {
    const rows = q.lines.map((l) => `<tr><td>${esc(l.name)}</td><td class="r">${l.hours} hr</td><td class="r">${money(l.rate)}</td><td class="r">${money((l.hours || 0) * (l.rate || rate))}</td></tr>`).join("");
    const partRows = q.parts.map((p) => `<tr><td>${esc(p.name)}</td><td class="r">${p.qty}</td><td class="r"></td><td class="r">${money(partSell(p))}</td></tr>`).join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(q.number)}</title>
    <style>*{font-family:Arial,sans-serif;color:#1f1b16;box-sizing:border-box}body{margin:0;padding:40px;max-width:760px}.top{display:flex;justify-content:space-between;border-bottom:3px solid #c2410c;padding-bottom:16px;margin-bottom:24px}.biz{font-size:22px;font-weight:800}.biz span{color:#c2410c}.sub{font-size:12px;color:#6b6459;margin-top:4px;line-height:1.6}.qmeta{text-align:right;font-size:13px;line-height:1.7}.qmeta b{font-size:16px}h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#8a8378;margin:20px 0 6px}table{width:100%;border-collapse:collapse;font-size:13px}th{text-align:left;border-bottom:1px solid #ccc;padding:6px 4px;font-size:11px;text-transform:uppercase;color:#6b6459}td{padding:7px 4px;border-bottom:1px solid #eee}.r{text-align:right}.tot{margin-top:20px;margin-left:auto;width:260px;font-size:14px}.tot div{display:flex;justify-content:space-between;padding:5px 0}.grand{border-top:2px solid #1f1b16;margin-top:6px;padding-top:10px!important;font-size:19px;font-weight:800}.notes{margin-top:24px;font-size:13px;background:#faf7f1;border:1px solid #e4ddcf;border-radius:8px;padding:14px;white-space:pre-wrap}.pay{margin-top:20px;font-size:14px;font-weight:700;color:#2f7d4f}.foot{margin-top:36px;border-top:1px solid #e4ddcf;padding-top:14px;font-size:11px;color:#8a8378;text-align:center;line-height:1.7}@media print{body{padding:0}}</style></head><body>
      <div class="top"><div><div class="biz">Elite Auto <span>Performance</span></div><div class="sub">8602 Treasure Island Rd, FL<br>352-460-3285 · Eliteautoperformance@gmail.com</div></div>
      <div class="qmeta"><b>Quote ${esc(q.number)}</b><br>${q.quote_date}<br>Status: ${q.status || "Quoted"}</div></div>
      <div style="font-size:13px;line-height:1.7"><b>Customer:</b> ${esc(cust?.name || "—")}${cust?.phone ? " · " + esc(cust.phone) : ""}<br><b>Vehicle:</b> ${esc(q.vehicle || "—")}</div>
      <h3>Labor</h3><table><thead><tr><th>Description</th><th class="r">Hours</th><th class="r">Rate</th><th class="r">Amount</th></tr></thead><tbody>${rows || '<tr><td colspan="4">—</td></tr>'}</tbody></table>
      <h3>Parts</h3><table><thead><tr><th>Part</th><th class="r">Qty</th><th class="r"></th><th class="r">Amount</th></tr></thead><tbody>${partRows || '<tr><td colspan="4">—</td></tr>'}</tbody></table>
      <div class="tot"><div><span>Labor</span><span>${money(laborTotal)}</span></div><div><span>Parts</span><span>${money(partsTotal)}</span></div><div class="grand"><span>Total</span><span>${money(total)}</span></div></div>
      ${q.notes ? `<div class="notes">${esc(q.notes)}</div>` : ""}${q.pay_link ? `<div class="pay">Pay online: ${esc(q.pay_link)}</div>` : ""}
      <div class="foot">Thank you for trusting Elite Auto Performance.<br>Quote valid 30 days. Parts and labor warranty per service agreement.</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Allow pop-ups to print/save the quote."); return; }
    w.document.write(html); w.document.close(); setTimeout(() => w.print(), 350);
  };

  const smsLink = () => { const body = encodeURIComponent(quoteText()); return cust?.phone ? `sms:${cust.phone}?&body=${body}` : `sms:?&body=${body}`; };
  const mailLink = () => { const body = encodeURIComponent(quoteText()); const subj = encodeURIComponent(`Quote ${q.number} — Elite Auto Performance`); return `mailto:${cust?.email || ""}?subject=${subj}&body=${body}`; };

  return (
    <div>
      <div style={S.sectionHead}>
        <button style={S.ghostBtn} onClick={onCancel}><X size={16} /> Close</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.dangerBtn} onClick={() => onDelete(q.id)}><Trash2 size={15} /></button>
          <button style={S.primaryBtn} onClick={() => onSave(q)}><Check size={16} /> Save</button>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.gridTwo}>
          <Field label="Quote #"><input style={S.input} value={q.number} onChange={(e) => set({ number: e.target.value })} /></Field>
          <Field label="Date"><input style={S.input} type="date" value={q.quote_date} onChange={(e) => set({ quote_date: e.target.value })} /></Field>
        </div>
        <Field label="Customer">
          <div style={{ display: "flex", gap: 8 }}>
            <select style={S.input} value={q.customer_id || ""} onChange={(e) => set({ customer_id: e.target.value || null })}>
              <option value="">— select —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button style={S.ghostBtn} onClick={async () => {
              const name = prompt("New customer name"); if (!name) return;
              const phone = prompt("Phone (optional)") || "";
              const nc = await saveCustomer({ id: uid(), name, phone, email: "", vehicles: "", notes: "" });
              await refreshCustomers(); if (nc) set({ customer_id: nc.id });
            }}><Plus size={15} /></button>
          </div>
        </Field>
        <Field label="Vehicle"><input style={S.input} value={q.vehicle} placeholder="2005 Suburban 5.3L 2WD" onChange={(e) => set({ vehicle: e.target.value })} /></Field>
        <Field label="Status">
          <div style={S.statusBtnRow}>
            {STATUSES.map((st) => (
              <button key={st}
                onClick={() => set({ status: st, approved_date: st === "Approved" && !q.approved_date ? new Date().toISOString().slice(0, 10) : q.approved_date })}
                style={{ ...S.statusBtn, ...(q.status === st ? { background: STATUS_COLOR[st], color: "#fff", borderColor: STATUS_COLOR[st] } : {}) }}>{st}</button>
            ))}
          </div>
          {q.status === "Approved" && q.approved_date && <p style={S.hint}>Approved {q.approved_date}</p>}
        </Field>
      </div>

      {/* Labor */}
      <div style={S.card}>
        <div style={S.cardHead}><Wrench size={15} /> Labor <span style={S.muted}>@ {money(rate)}/hr</span></div>
        {q.lines.map((l) => (
          <div key={l.id} style={S.lineRow}>
            <input style={{ ...S.input, flex: 1 }} value={l.name} placeholder="Labor item" onChange={(e) => updLine(l.id, { name: e.target.value })} />
            <input style={S.smInput} type="number" step="0.5" value={l.hours} onChange={(e) => updLine(l.id, { hours: e.target.value })} />
            <span style={S.lineAmt}>{money((l.hours || 0) * (l.rate || rate))}</span>
            <button style={S.xBtn} onClick={() => delLine(l.id)}><X size={14} /></button>
          </div>
        ))}
        <div style={S.chipRow}>
          {DEFAULT_LABOR.slice(0, 6).map((item) => (
            <button key={item.name} style={S.chip} onClick={() => addLabor(item)}>+ {item.name}</button>
          ))}
          <button style={S.chipAlt} onClick={addCustomLine}>+ Custom</button>
        </div>
      </div>

      {/* Parts — fields differ by role */}
      <div style={S.card}>
        <div style={S.cardHead}><DollarSign size={15} /> Parts <span style={S.muted}>{isOwner ? "+15% markup auto-applied" : "enter customer price"}</span></div>
        {q.parts.map((p) => (
          <div key={p.id} style={S.lineRow}>
            <input style={{ ...S.input, flex: 1 }} value={p.name} placeholder="Part" onChange={(e) => updPart(p.id, { name: e.target.value })} />
            <input style={S.smInput} type="number" value={p.qty} title="qty" onChange={(e) => updPart(p.id, { qty: e.target.value })} />
            {isOwner
              ? <input style={S.smInput} type="number" value={p.cost} title="your cost" placeholder="cost" onChange={(e) => updPart(p.id, { cost: e.target.value })} />
              : <input style={S.smInput} type="number" value={p.price} title="price" placeholder="price" onChange={(e) => updPart(p.id, { price: e.target.value })} />}
            <span style={S.lineAmt}>{money(partSell(p))}</span>
            <button style={S.xBtn} onClick={() => delPart(p.id)}><X size={14} /></button>
          </div>
        ))}
        <button style={S.chipAlt} onClick={addPart}>+ Add part</button>
      </div>

      {/* Photos */}
      <div style={S.card}>
        <div style={S.cardHead}><Camera size={15} /> Photos</div>
        <div style={S.photoGrid}>
          {q.photos.map((ph) => (
            <div key={ph.id} style={S.photoWrap}>
              <img src={ph.url} alt="" style={S.photo} />
              <button style={S.photoX} onClick={() => set({ photos: q.photos.filter((x) => x.id !== ph.id) })}><X size={12} /></button>
            </div>
          ))}
          <button style={S.photoAdd} onClick={() => fileRef.current?.click()}><Camera size={20} /><span>Add</span></button>
          <input ref={fileRef} type="file" accept="image/*" multiple capture="environment" style={{ display: "none" }} onChange={onPhoto} />
        </div>
      </div>

      {/* Notes + pay */}
      <div style={S.card}>
        <Field label="Notes"><textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={q.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Job notes, diagnosis, parts sourcing…" /></Field>
        <Field label="Payment link (Square / Cash App)">
          <input style={S.input} value={q.pay_link} placeholder="https://cash.app/$… or square link" onChange={(e) => set({ pay_link: e.target.value })} />
        </Field>
      </div>

      {/* Totals */}
      <div style={S.totalCard}>
        <div style={S.totalRow}><span>Labor</span><span>{money(laborTotal)}</span></div>
        <div style={S.totalRow}><span>Parts</span><span>{money(partsTotal)}</span></div>
        <div style={{ ...S.totalRow, ...S.grandTotal }}><span>Total</span><span>{money(total)}</span></div>
      </div>

      {/* Owner-only margin — data simply isn't present for employees */}
      {isOwner && (
        <div style={S.marginCard}>
          <div style={S.marginHead}><TrendingUp size={14} /> Your numbers (owner only)</div>
          <div style={S.totalRow}><span>Part cost (your spend)</span><span>{money(partCostTotal(q))}</span></div>
          <div style={S.totalRow}><span>Parts markup profit</span><span>{money(partMargin(q))}</span></div>
          <div style={S.totalRow}><span>Labor revenue</span><span>{money(laborTotal)}</span></div>
          <div style={{ ...S.totalRow, ...S.marginTotal }}><span>Gross profit (labor + markup)</span><span>{money(laborTotal + partMargin(q))}</span></div>
          <p style={S.marginNote}>Employees' devices never receive these numbers.</p>
        </div>
      )}

      {/* Send actions */}
      <div style={S.sendRow}>
        <button style={S.sendBtn} onClick={copyQuote}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy quote"}</button>
        <button style={S.sendBtn} onClick={printQuote}><Printer size={16} /> Print / PDF</button>
        <a style={S.sendBtn} href={smsLink()}>Text quote</a>
        <a style={S.sendBtn} href={mailLink()}>Email quote</a>
        {q.pay_link && <a style={{ ...S.sendBtn, ...S.payBtn }} href={q.pay_link} target="_blank" rel="noreferrer"><DollarSign size={16} /> Open pay link</a>}
      </div>
    </div>
  );
}

// ---------- Customers ----------
function Customers({ customers, quotes, refreshCustomers }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const filtered = customers.filter((c) => (c.name + c.phone + c.vehicles).toLowerCase().includes(search.toLowerCase()));
  const blank = () => ({ id: uid(), name: "", phone: "", email: "", vehicles: "", notes: "" });

  if (editing)
    return <CustomerEditor c={editing}
      onSave={async (c) => { await saveCustomer(c); await refreshCustomers(); setEditing(null); }}
      onCancel={() => setEditing(null)}
      onDelete={async (id) => { await deleteCustomer(id); await refreshCustomers(); setEditing(null); }} />;

  return (
    <div>
      <div style={S.sectionHead}><h2 style={S.h2}>Customers</h2><button style={S.primaryBtn} onClick={() => setEditing(blank())}><Plus size={16} /> Add</button></div>
      <div style={S.searchWrap}><Search size={15} color="#9a948c" />
        <input style={S.searchInput} placeholder="Search name, phone, vehicle…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {filtered.length === 0 ? <Empty icon={Users} text="No customers yet." /> : (
        <div style={S.list}>
          {filtered.map((c) => {
            const count = quotes.filter((q) => q.customer_id === c.id).length;
            return (
              <button key={c.id} style={S.row} onClick={() => setEditing(c)}>
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={S.rowTitle}>{c.name}</div>
                  <div style={S.rowSub}>{c.phone || "no phone"} · {count} quote{count !== 1 ? "s" : ""}</div>
                </div><ChevronRight size={16} color="#9a948c" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomerEditor({ c, onSave, onCancel, onDelete }) {
  const [d, setD] = useState(c);
  const set = (patch) => setD((p) => ({ ...p, ...patch }));
  return (
    <div>
      <div style={S.sectionHead}>
        <button style={S.ghostBtn} onClick={onCancel}><X size={16} /> Close</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={S.dangerBtn} onClick={() => onDelete(d.id)}><Trash2 size={15} /></button>
          <button style={S.primaryBtn} onClick={() => onSave(d)}><Check size={16} /> Save</button>
        </div>
      </div>
      <div style={S.card}>
        <Field label="Name"><input style={S.input} value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <div style={S.gridTwo}>
          <Field label="Phone"><input style={S.input} value={d.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Email"><input style={S.input} value={d.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        </div>
        <Field label="Vehicles"><input style={S.input} value={d.vehicles} placeholder="2005 Suburban LM7 5.3L; 1995 Buick Century" onChange={(e) => set({ vehicles: e.target.value })} /></Field>
        <Field label="Notes"><textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} value={d.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
      </div>
    </div>
  );
}

// ---------- Time tracking ----------
function TimeTracking({ user, isOwner }) {
  const [logs, setLogs] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [, force] = useState(0);

  const refresh = async () => {
    setLogs(await listTimeLogs());
    if (isOwner) setPayroll(await payrollThisWeek());
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [isOwner]);
  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 1000); return () => clearInterval(i); }, []);

  const open = logs.find((t) => t.employee_id === user.id && !t.end_at);

  const doClockIn = async () => { await clockIn(user.id); await refresh(); };
  const doClockOut = async () => { if (open) { await clockOut(open.id); await refresh(); } };

  const dur = (t) => {
    const ms = (t.end_at ? new Date(t.end_at) : new Date()) - new Date(t.start_at);
    const h = Math.floor(ms / 3.6e6), m = Math.floor((ms % 3.6e6) / 6e4), s = Math.floor((ms % 6e4) / 1000);
    return `${h}h ${m}m${!t.end_at ? ` ${s}s` : ""}`;
  };
  const hours = (t) => ((t.end_at ? new Date(t.end_at) : new Date()) - new Date(t.start_at)) / 3.6e6;

  const weekTotal = logs.filter((t) => t.employee_id === user.id && new Date(t.start_at) > Date.now() - 7 * 864e5).reduce((s, t) => s + hours(t), 0);

  return (
    <div>
      <div style={S.sectionHead}><h2 style={S.h2}>Time clock</h2></div>
      <div style={S.clockCard}>
        <div>
          <div style={S.muted}>{user.name}</div>
          <div style={S.clockState}>{open ? "On the clock" : "Clocked out"}</div>
          {open && <div style={S.clockTime}>{dur(open)}</div>}
          <div style={S.muted}>This week: {weekTotal.toFixed(1)} hrs</div>
        </div>
        {open
          ? <button style={{ ...S.bigBtn, background: "#b3422f" }} onClick={doClockOut}><Square size={18} /> Clock out</button>
          : <button style={{ ...S.bigBtn, background: "#2f7d4f" }} onClick={doClockIn}><Play size={18} /> Clock in</button>}
      </div>

      {isOwner && payroll.length > 0 && (
        <div style={S.card}>
          <div style={S.cardHead}><Users size={15} /> Payroll this week</div>
          {payroll.map((p) => (
            <div key={p.name} style={S.payrollRow}><span>{p.name}</span><span style={S.payrollHrs}>{Number(p.hours).toFixed(1)} hrs</span></div>
          ))}
          <div style={{ ...S.payrollRow, borderTop: `1px solid ${line}`, marginTop: 4, paddingTop: 8, fontWeight: 700 }}>
            <span>Total</span><span style={S.payrollHrs}>{payroll.reduce((s, p) => s + Number(p.hours), 0).toFixed(1)} hrs</span>
          </div>
        </div>
      )}

      <div style={S.sectionHead}><h3 style={S.h3}>{isOwner ? "All entries" : "Your entries"}</h3></div>
      <div style={S.list}>
        {logs.length === 0 && <Empty icon={Clock} text="No time entries yet." />}
        {logs.map((t) => (
          <div key={t.id} style={S.timeRow}>
            <div>
              <div style={S.rowTitle}>{isOwner ? (t.profiles?.name || "") : ""} {!t.end_at && <span style={S.liveDot} />}</div>
              <div style={S.rowSub}>{new Date(t.start_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{t.end_at ? ` → ${new Date(t.end_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : " → now"}</div>
            </div>
            <div style={S.rowTotal}>{dur(t)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- Settings (owner) ----------
function SettingsPanel({ settings, setSettings }) {
  const [s, setS] = useState(settings);
  return (
    <div>
      <div style={S.sectionHead}><h2 style={S.h2}>Settings</h2></div>
      <div style={S.card}>
        <div style={S.cardHead}>Shop defaults</div>
        <Field label="Labor rate ($/hr)">
          <input style={S.input} type="number" value={s.rate}
            onChange={(e) => { const v = { ...s, rate: Number(e.target.value) }; setS(v); setSettings(v); }} />
        </Field>
        <Field label="Default payment link">
          <input style={S.input} value={s.payLink} placeholder="https://cash.app/$EliteAuto…"
            onChange={(e) => { const v = { ...s, payLink: e.target.value }; setS(v); setSettings(v); }} />
        </Field>
        <p style={S.hint}>Parts markup is fixed at 15% and rear main seal auto-adds on transmission jobs. Add or remove employees in the Supabase dashboard under Authentication.</p>
      </div>
    </div>
  );
}

// ---------- shared bits ----------
const Field = ({ label, children }) => (<div style={{ marginBottom: 12 }}><label style={S.label}>{label}</label>{children}</div>);
const Empty = ({ icon: Icon, text }) => (<div style={S.empty}><Icon size={26} color="#c9c2b6" /><p>{text}</p></div>);

// ---------- styles ----------
const ink = "#1f1b16", paper = "#f4f0e8", card = "#fffdf9", line = "#e4ddcf";
const accent = "#c2410c", accentDark = "#9a3412";

const S = {
  loading: { display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", height: "100vh", color: ink, fontFamily: "system-ui", background: paper },
  app: { fontFamily: "system-ui, sans-serif", background: paper, minHeight: "100vh", color: ink, maxWidth: 720, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${line}`, background: card, position: "sticky", top: 0, zIndex: 10 },
  brand: { display: "flex", gap: 10, alignItems: "center" },
  logo: { width: 34, height: 34, borderRadius: 9, background: accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" },
  brandName: { fontWeight: 700, fontSize: 15, letterSpacing: -0.2 },
  brandSub: { fontSize: 11, color: "#8a8378", textTransform: "uppercase", letterSpacing: 1 },
  userBox: { display: "flex", alignItems: "center", gap: 8 },
  userName: { fontSize: 12, color: "#6b6459" },
  iconBtn: { border: `1px solid ${line}`, background: card, borderRadius: 8, padding: 7, cursor: "pointer", color: ink, display: "flex" },
  nav: { display: "flex", gap: 4, padding: "10px 14px", background: card, borderBottom: `1px solid ${line}`, position: "sticky", top: 63, zIndex: 9 },
  navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "8px 4px", border: "none", background: "transparent", borderRadius: 9, cursor: "pointer", color: "#8a8378", fontSize: 11, fontWeight: 600 },
  navActive: { background: paper, color: accent },
  main: { padding: 16 },
  sectionHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 },
  h2: { fontSize: 20, fontWeight: 700, letterSpacing: -0.4, margin: 0 },
  h3: { fontSize: 14, fontWeight: 600, margin: 0, color: "#6b6459" },
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: accent, color: "#fff", border: "none", padding: "9px 14px", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  ghostBtn: { display: "inline-flex", alignItems: "center", gap: 6, background: card, color: ink, border: `1px solid ${line}`, padding: "8px 12px", borderRadius: 9, fontWeight: 600, fontSize: 13, cursor: "pointer" },
  dangerBtn: { background: "#fdece8", color: "#b3422f", border: "1px solid #f3cabe", padding: "8px 10px", borderRadius: 9, cursor: "pointer", display: "flex" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "13px 14px", background: card, border: `1px solid ${line}`, borderRadius: 11, cursor: "pointer", width: "100%" },
  rowTitle: { fontWeight: 600, fontSize: 14 },
  rowSub: { fontSize: 12, color: "#8a8378", marginTop: 2 },
  rowTotal: { fontWeight: 700, fontSize: 14, color: accentDark },
  card: { background: card, border: `1px solid ${line}`, borderRadius: 13, padding: 16, marginBottom: 14 },
  cardHead: { display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b6459" },
  gridTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  label: { display: "block", fontSize: 12, fontWeight: 600, color: "#6b6459", marginBottom: 5 },
  input: { width: "100%", boxSizing: "border-box", padding: "10px 11px", border: `1px solid ${line}`, borderRadius: 9, fontSize: 14, background: "#fff", color: ink, fontFamily: "inherit" },
  smInput: { width: 64, boxSizing: "border-box", padding: "10px 8px", border: `1px solid ${line}`, borderRadius: 9, fontSize: 14, background: "#fff", textAlign: "center" },
  lineRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
  lineAmt: { fontWeight: 600, fontSize: 13, minWidth: 64, textAlign: "right", color: accentDark },
  xBtn: { border: "none", background: "transparent", color: "#b3422f", cursor: "pointer", padding: 5, display: "flex" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { border: `1px solid ${line}`, background: paper, borderRadius: 20, padding: "6px 11px", fontSize: 12, cursor: "pointer", color: ink, fontWeight: 500 },
  chipAlt: { border: `1px dashed ${accent}`, background: "#fff", borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: accent, fontWeight: 600, marginTop: 6 },
  muted: { color: "#9a948c", fontWeight: 400, fontSize: 12 },
  photoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 8 },
  photoWrap: { position: "relative", aspectRatio: "1", borderRadius: 9, overflow: "hidden", border: `1px solid ${line}` },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  photoX: { position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,.6)", border: "none", borderRadius: 6, color: "#fff", padding: 3, cursor: "pointer", display: "flex" },
  photoAdd: { aspectRatio: "1", border: `1px dashed ${line}`, borderRadius: 9, background: paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", color: "#8a8378", fontSize: 11 },
  totalCard: { background: ink, color: "#fff", borderRadius: 13, padding: 16, marginBottom: 14 },
  totalRow: { display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0", color: "#d8d2c6" },
  grandTotal: { fontSize: 20, fontWeight: 700, color: "#fff", borderTop: "1px solid #3a342b", marginTop: 8, paddingTop: 12 },
  sendRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  sendBtn: { flex: "1 1 45%", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: card, color: ink, border: `1px solid ${line}`, padding: "11px", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", textDecoration: "none" },
  payBtn: { background: "#2f7d4f", color: "#fff", border: "none" },
  searchWrap: { display: "flex", alignItems: "center", gap: 8, background: card, border: `1px solid ${line}`, borderRadius: 10, padding: "9px 12px", marginBottom: 12 },
  searchInput: { border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent", color: ink },
  clockCard: { display: "flex", justifyContent: "space-between", alignItems: "center", background: card, border: `1px solid ${line}`, borderRadius: 13, padding: 20, marginBottom: 18 },
  clockState: { fontSize: 20, fontWeight: 700, margin: "2px 0" },
  clockTime: { fontSize: 28, fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums", marginBottom: 4 },
  bigBtn: { display: "inline-flex", alignItems: "center", gap: 8, color: "#fff", border: "none", padding: "16px 22px", borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: "pointer" },
  timeRow: { display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: card, border: `1px solid ${line}`, borderRadius: 11 },
  liveDot: { display: "inline-block", width: 8, height: 8, borderRadius: 4, background: "#2f7d4f", marginLeft: 6 },
  empty: { textAlign: "center", padding: "44px 20px", color: "#9a948c", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 14 },
  loginWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: paper, padding: 20, fontFamily: "system-ui" },
  loginCard: { background: card, border: `1px solid ${line}`, borderRadius: 16, padding: 30, width: "100%", maxWidth: 360 },
  loginTitle: { fontSize: 20, fontWeight: 700, margin: "0 0 2px", letterSpacing: -0.3 },
  loginSub: { fontSize: 13, color: "#8a8378", margin: "0 0 20px" },
  errText: { color: "#b3422f", fontSize: 13, margin: "8px 0" },
  hint: { fontSize: 11, color: "#9a948c", marginTop: 12, lineHeight: 1.5 },
  filterRow: { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 },
  filterChip: { whiteSpace: "nowrap", border: `1px solid ${line}`, background: card, borderRadius: 20, padding: "6px 12px", fontSize: 12, cursor: "pointer", color: "#6b6459", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 },
  filterActive: { background: ink, color: "#fff", borderColor: ink },
  filterCount: { fontSize: 11, opacity: 0.7 },
  statusDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  statusPill: { fontSize: 11, fontWeight: 700, border: "1px solid", borderRadius: 6, padding: "2px 7px", whiteSpace: "nowrap" },
  statusBtnRow: { display: "flex", flexWrap: "wrap", gap: 6 },
  statusBtn: { border: `1px solid ${line}`, background: "#fff", borderRadius: 8, padding: "7px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#6b6459" },
  marginCard: { background: "#fffaf3", border: `1px dashed ${accent}`, borderRadius: 13, padding: 16, marginBottom: 14 },
  marginHead: { display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, color: accentDark, marginBottom: 10 },
  marginTotal: { fontSize: 16, fontWeight: 800, color: accentDark, borderTop: `1px solid ${line}`, marginTop: 6, paddingTop: 10 },
  marginNote: { fontSize: 10.5, color: "#9a948c", marginTop: 10, marginBottom: 0 },
  payrollRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 },
  payrollHrs: { fontWeight: 700, color: accentDark, fontVariantNumeric: "tabular-nums" },
};

const css = `
  * { -webkit-tap-highlight-color: transparent; }
  body { margin: 0; }
  .spin { animation: spin 1.2s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  input:focus, textarea:focus, select:focus { outline: 2px solid ${accent}; outline-offset: -1px; border-color: ${accent}; }
  button:focus-visible, a:focus-visible { outline: 2px solid ${accent}; outline-offset: 2px; }
  @media (prefers-reduced-motion: reduce) { .spin { animation: none; } }
`;
