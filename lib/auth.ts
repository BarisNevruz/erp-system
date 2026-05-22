import { supabase } from "@/lib/supabase";

export async function getCurrentUserProfile() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.email) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", session.user.email)
    .eq("active", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}