import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "TEVO — Photographic Works" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col bg-paper text-ink">
        <Masthead />
        <div className="flex-1">{children}</div>
        <Colophon />
        <Scripts />
      </body>
    </html>
  );
}

function Masthead() {
  return (
    <header className="flex items-stretch justify-between border-b-2 border-ink">
      <a href="/" className="lk flex items-baseline gap-1.5 border-r-2 border-ink px-4 py-3">
        <span className="display text-2xl leading-none">TEVO</span>
        <span className="mono text-[9px] leading-none">®</span>
      </a>
      <div className="mono hidden flex-1 items-center px-4 text-[10px] text-ink-soft md:flex">
        PHOTOGRAPHIC&nbsp;WORKS&nbsp;&nbsp;///&nbsp;&nbsp;INDEX&nbsp;OF&nbsp;FRAMES
      </div>
      <div className="mono flex items-center border-l-2 border-ink px-4 text-[10px]">
        EST&nbsp;·&nbsp;MMXXVI
      </div>
    </header>
  );
}

function Colophon() {
  return (
    <footer className="mono mt-20 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t-2 border-ink px-4 py-4 text-[10px] text-ink-soft">
      <span>© MMXXVI&nbsp;&nbsp;TEVO®</span>
      <span>ALL&nbsp;FRAMES&nbsp;RESERVED</span>
      <span className="text-hazard">///&nbsp;END&nbsp;OF&nbsp;TRANSMISSION</span>
    </footer>
  );
}
