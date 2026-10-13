/// <reference types="vite/client" />

/** Injected by vite.config.ts: true when public/Chandra_Moorthy_Resume.pdf exists at build time. */
declare const __HAS_RESUME__: boolean;

interface ImportMetaEnv {
  /** Set to "true" in Vercel once the chat API is deployed and /api is routed to it. */
  readonly VITE_CHAT_ENABLED?: string;
}
