/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute origin for canonical URLs and the sitemap. */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
