import { supabase } from "@/lib/supabase";

export async function getUserRole(email: string) {
  const { data, error } = await supabase
    .from("users_role")
    .select("role")
    .eq("email", email)
    .eq("active", true)
    .single();

  if (error) {
    return "Goruntuleyici";
  }

  return data?.role || "Goruntuleyici";
}