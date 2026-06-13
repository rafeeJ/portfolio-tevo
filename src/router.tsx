import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => (
      <main className="px-4 py-24 sm:px-6">
        <p className="mono mb-3 text-[11px] text-hazard">[ ERR / 404 — NO SIGNAL ]</p>
        <h1 className="display text-[clamp(3rem,15vw,9rem)]">Not Found</h1>
        <p className="mono mt-5 text-sm text-ink-soft">
          FRAME NOT ON RECORD.&nbsp;&nbsp;
          <a href="/" className="lk text-ink">
            ← RETURN TO INDEX
          </a>
        </p>
      </main>
    ),
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
