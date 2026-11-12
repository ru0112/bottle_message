import Link from "next/link";

type LegalDocumentProps = {
  title: string;
  englishTitle: string;
  content: string;
};

const publicationDate = "2026年11月12日";

export default function LegalDocument({
  title,
  englishTitle,
  content,
}: LegalDocumentProps) {
  const lines = content.split(/\r?\n/);
  const bodyLines = lines[0]?.trim() === title ? lines.slice(1) : lines;

  return (
    <main className="min-h-screen px-5 py-8 text-slate-100 sm:px-8 sm:py-12">
      <div className="ocean-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem]" />
      <div className="mx-auto w-full max-w-3xl">
        <Link
          className="flex w-fit items-center gap-3"
          href="/"
          aria-label="漂流瓶 ホーム"
        >
          <span className="brand-mark" aria-hidden="true">
            瓶
          </span>
          <span className="text-lg font-semibold tracking-[0.14em]">
            漂流瓶
          </span>
        </Link>

        <header className="mt-12 border-b border-white/10 pb-7">
          <p className="text-xs tracking-[0.18em] text-cyan-100/65">
            {englishTitle}
          </p>
          <h1 className="mt-3 text-3xl font-medium tracking-wider text-white sm:text-4xl">
            {title}
          </h1>
          <dl className="mt-6 flex flex-col gap-2 text-xs text-slate-300/60 sm:flex-row sm:gap-8">
            <div className="flex gap-2">
              <dt>発行日</dt>
              <dd>{publicationDate}</dd>
            </div>
            <div className="flex gap-2">
              <dt>最終更新日</dt>
              <dd>{publicationDate}</dd>
            </div>
          </dl>
        </header>

        <article className="mt-8 break-words text-sm leading-8 text-slate-200/80 sm:text-base">
          {bodyLines.map((line, index) => {
            if (!line.trim()) {
              return <div key={index} aria-hidden="true" className="h-4" />;
            }

            if (/^第\d+条（.*）$/.test(line.trim())) {
              return (
                <h2
                  key={index}
                  className="mb-2 mt-8 text-base font-semibold leading-7 text-cyan-50 sm:text-lg"
                >
                  {line}
                </h2>
              );
            }

            return (
              <p key={index} className="whitespace-pre-wrap">
                {line}
              </p>
            );
          })}
        </article>
      </div>
    </main>
  );
}
