/**
 * Recover a tab that was open across a deploy.
 *
 * Every route in this app is `lazy()`, so a running page holds the hashed
 * chunk names from the build it was loaded with — 45 of them. A deploy
 * replaces `assets/` with new hashes and removes the old files, so a tab left
 * open across one asks for a chunk that no longer exists the moment someone
 * opens a route they had not already visited. Apache answers a missing path
 * with index.html, and the browser refuses HTML where it expected a module:
 *
 *   Expected a JavaScript-or-Wasm module script but the server responded
 *   with a MIME type of "text/html"
 *   Failed to fetch dynamically imported module: .../AdminWarranties-*.js
 *
 * The page cannot repair itself in place — the code it wants is gone from the
 * server. Reloading fetches the current index.html and the hashes that belong
 * to it, which is why a manual refresh already fixes this. This does that for
 * the user instead of leaving them on a dead screen.
 *
 * Capped at two reloads per tab, and never reset. If reloading does not fix
 * it — a half-uploaded assets folder, a genuinely broken build — looping
 * would replace one broken screen with an unusable tab and bury the real
 * fault. After the cap the error is left to surface as it does today.
 */

const ATTEMPT_KEY = 'chunk-reload-attempts';
const MAX_ATTEMPTS = 2;

/**
 * Browsers word this differently, and the MIME refusal and the failed import
 * are reported as separate errors, so both spellings have to be recognised.
 */
const CHUNK_ERROR =
    /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|expected a javascript(-or-wasm)? module script|failed to load module script/i;

/**
 * sessionStorage is the only thing that survives the reload we are about to
 * do, so it is what stops a loop. If it throws — private browsing, blocked
 * site data — we have no way to count attempts, and reloading blind could
 * loop forever. Better to leave the error alone than to trap the tab.
 */
function attemptStore(): Storage | null {
    try {
        const store = window.sessionStorage;
        const probe = '__chunk_reload_probe__';
        store.setItem(probe, '1');
        store.removeItem(probe);
        return store;
    } catch {
        return null;
    }
}

let reloading = false;

function recover(error: unknown): boolean {
    const message =
        error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    if (!CHUNK_ERROR.test(message)) return false;

    if (reloading) return true;

    const store = attemptStore();
    if (!store) return false;

    const attempts = Number(store.getItem(ATTEMPT_KEY) || 0);
    if (attempts >= MAX_ATTEMPTS) return false;

    store.setItem(ATTEMPT_KEY, String(attempts + 1));
    reloading = true;
    window.location.reload();
    return true;
}

/*
 * Vite's preload helper wraps every dynamic import and fires this before it
 * rethrows, so it is the earliest and most reliable signal. preventDefault()
 * stops the rethrow, since we are reloading rather than handling it.
 */
window.addEventListener('vite:preloadError', event => {
    if (recover((event as ErrorEvent & { payload?: unknown }).payload)) {
        event.preventDefault();
    }
});

/*
 * React catches a rejected lazy() import during render and rethrows it, which
 * arrives here rather than at the preload helper. The two overlap; `reloading`
 * makes the second one a no-op.
 */
window.addEventListener('error', event => {
    recover(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', event => {
    recover(event.reason);
});
