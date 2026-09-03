/**
 * Under Next.js, `server-only` throws if a module is pulled into a client
 * bundle — which is exactly the guarantee we want in the app. Vitest has no
 * server/client split, so it resolves to the throwing build. Aliasing it to
 * this empty module lets server modules be tested directly, without
 * weakening the real build-time check.
 */
export {};
