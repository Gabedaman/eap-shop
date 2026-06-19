import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project: Settings > API.
// The anon key is safe to ship in the client — RLS does the protecting.
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);

const PARTS_MARKUP = 0.15;

// ---- auth ----
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}
export async function signOut() {
  await supabase.auth.signOut();
}
// Returns { id, name, role } or null. role decides what the UI shows.
export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data;
}

// ---- customers ----
export const listCustomers = () =>
  supabase.from("customers").select("*").order("created_at", { ascending: false }).then(r => r.data || []);
export const saveCustomer = (c) =>
  supabase.from("customers").upsert(c).select().single().then(r => r.data);
export const deleteCustomer = (id) =>
  supabase.from("customers").delete().eq("id", id);

// ---- quotes (with their lines, parts, photos) ----
// Owners read parts straight from the table (cost included).
// Employees read from parts_public (no cost column exists there).
export async function listQuotes(isOwner) {
  const { data: quotes } = await supabase
    .from("quotes").select("*").order("created_at", { ascending: false });
  if (!quotes) return [];

  const ids = quotes.map(q => q.id);
  const [{ data: labor }, { data: parts }, { data: photos }] = await Promise.all([
    supabase.from("labor_lines").select("*").in("quote_id", ids),
    isOwner
      ? supabase.from("parts").select("*").in("quote_id", ids)
      : supabase.from("parts_public").select("*").in("quote_id", ids),
    supabase.from("photos").select("*").in("quote_id", ids),
  ]);

  return quotes.map(q => ({
    ...q,
    lines:  (labor  || []).filter(l => l.quote_id === q.id),
    parts:  (parts  || []).filter(p => p.quote_id === q.id),
    photos: (photos || []).filter(ph => ph.quote_id === q.id),
  }));
}

export async function saveQuote(q, isOwner) {
  const { lines, parts, photos, ...quote } = q;
  await supabase.from("quotes").upsert(quote);

  // replace child rows for this quote
  await supabase.from("labor_lines").delete().eq("quote_id", q.id);
  if (lines.length)
    await supabase.from("labor_lines").insert(lines.map(l => ({ ...l, quote_id: q.id })));

  if (isOwner) {
    // owner writes cost + price directly
    await supabase.from("parts").delete().eq("quote_id", q.id);
    if (parts.length)
      await supabase.from("parts").insert(parts.map(p => ({
        ...p, quote_id: q.id, price: (Number(p.cost) || 0) * (1 + PARTS_MARKUP),
      })));
  } else {
    // employee path: no cost ever sent; price-only via the secure function
    for (const p of parts) {
      await supabase.rpc("save_part", {
        p_id: p.id || null, p_quote: q.id, p_name: p.name,
        p_qty: Number(p.qty) || 1, p_price: Number(p.price) || 0,
      });
    }
  }
  return q;
}

export const deleteQuote = (id) => supabase.from("quotes").delete().eq("id", id);

// ---- time clock ----
export const listTimeLogs = () =>
  supabase.from("time_logs").select("*, profiles(name)").order("start_at", { ascending: false }).then(r => r.data || []);
export const clockIn = (employeeId) =>
  supabase.from("time_logs").insert({ employee_id: employeeId });
export const clockOut = (id) =>
  supabase.from("time_logs").update({ end_at: new Date().toISOString() }).eq("id", id);

// Owner-only. Returns [] for employees because the DB function refuses them.
export const payrollThisWeek = () =>
  supabase.rpc("payroll_this_week").then(r => r.data || []);

export { PARTS_MARKUP };
