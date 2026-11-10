import { getSupabaseClient } from "@/lib/supabase/client";

export async function sendEmailOtp(email: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithOtp({ email });
  if (error) {
    throw error;
  }
}

export async function verifyEmailOtp(
  email: string,
  token: string,
): Promise<void> {
  const { error } = await getSupabaseClient().auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) {
    throw error;
  }
}
