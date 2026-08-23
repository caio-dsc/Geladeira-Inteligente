/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RECAPTCHA_ENTERPRISE_SITE_KEY?: string;
  readonly VITE_RECAPTCHA_SITE_KEY?: string;
  readonly VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
