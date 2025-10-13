export {}

declare global {
  interface ImportMetaEnv {
    readonly DEV?: boolean
    readonly PROD?: boolean
    readonly VITE_API_BASE?: string
  }
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
