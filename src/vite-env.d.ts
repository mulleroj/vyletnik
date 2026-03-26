/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_SUBMIT_WEBHOOK_URL?: string;
  /** Volitelná základní URL pro Outlook na webu (výchozí: outlook.office.com deep link compose). */
  readonly VITE_OUTLOOK_COMPOSE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
