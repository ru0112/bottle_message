import { Suspense } from "react";
import Home from "./home";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default function HomePage() {
  if (!isSupabaseConfigured()) {
    return <Home isAuthenticated={false} supabaseConfigured={false} />;
  }

  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-5 py-8 text-sm text-cyan-100/70">
          ログイン状態を確認しています...
        </main>
      }
    >
      <AuthenticatedHome />
    </Suspense>
  );
}

async function AuthenticatedHome() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return <Home isAuthenticated={Boolean(user)} supabaseConfigured />;
}
