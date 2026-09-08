/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute origin for canonical URLs and the sitemap. */
  readonly VITE_SITE_URL?: string
  /**
   * Set only by `npm run dev:demo`. A production build never sets it, so the
   * demo overlay is statically false and gets dropped from the bundle.
   */
  readonly VITE_DEMO?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
