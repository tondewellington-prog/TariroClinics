import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function login(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(error.message);
  }
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }
  return data.session;
}

export async function getUserRole(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data.role;
}

export async function syncTransaction(transaction) {
  const session = await getCurrentSession();
  if (!session) {
    throw new Error("No active session.");
  }
  const payload = {
    ...transaction,
    created_by: session.user.id
  };
  const { error } = await supabase.from("transactions").insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getTodayRevenue() {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .gte("timestamp", `${today}T00:00:00`)
    .lte("timestamp", `${today}T23:59:59`);

  if (error) {
    throw new Error(error.message);
  }

  const total = (data || []).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  return total;
}
