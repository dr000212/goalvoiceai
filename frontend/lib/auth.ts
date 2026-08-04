"use client";

import { supabase } from "./supabase";

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

export async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/";
}
