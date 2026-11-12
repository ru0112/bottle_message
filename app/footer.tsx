import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950/20">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-5 py-6 text-center sm:flex-row sm:px-8 sm:text-left">
        <p className="text-xs text-slate-300/50">漂流瓶</p>
        <nav
          aria-label="法的情報"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-300/70"
        >
          <Link className="transition hover:text-cyan-100" href="/terms">
            利用規約
          </Link>
          <Link className="transition hover:text-cyan-100" href="/privacy">
            プライバシーポリシー
          </Link>
        </nav>
      </div>
    </footer>
  );
}
