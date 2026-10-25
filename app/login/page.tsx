import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center px-5 py-8 text-sm text-cyan-100/70">
          認証画面を読み込んでいます...
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
