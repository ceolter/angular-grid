/**
 * Retain scroll position between page changes
 *
 * Use session storage to store the scroll position and get it on page load
 */
const SCROLL_POSITION_LOCALSTORAGE_KEY = 'docs-scroll-position';
const RESET_SCROLL_ON_UNLOAD_LOCALSTORAGE_KEY = 'ignore-docs-scroll-position';
// NOTE: Need page nav to be on page on page load (ie, not generated on client side)
const NAV_SCROLL_CONTAINER_SELECTOR = '#docs-nav-scroll';

export function initNavScrollPositionSync() {
    window.addEventListener('load', () => {
        const nav = document.querySelector(NAV_SCROLL_CONTAINER_SELECTOR);
        const top = sessionStorage.getItem(SCROLL_POSITION_LOCALSTORAGE_KEY);

        if (nav && top !== null) {
            nav.scrollTop = parseInt(top, 10);
        }

        // Don't reset on page load - reset should be set after the page has loaded
        sessionStorage.removeItem(RESET_SCROLL_ON_UNLOAD_LOCALSTORAGE_KEY);

        window.addEventListener('beforeunload', () => {
            const resetScroll = sessionStorage.getItem(RESET_SCROLL_ON_UNLOAD_LOCALSTORAGE_KEY) === 'true';
            if (resetScroll) {
                sessionStorage.removeItem(RESET_SCROLL_ON_UNLOAD_LOCALSTORAGE_KEY);
                sessionStorage.removeItem(SCROLL_POSITION_LOCALSTORAGE_KEY);
                return;
            } else if (!nav) {
                return;
            }

            sessionStorage.setItem(SCROLL_POSITION_LOCALSTORAGE_KEY, nav.scrollTop.toString());
        });
    });
}

export function resetScrollPosition() {
    sessionStorage.setItem(RESET_SCROLL_ON_UNLOAD_LOCALSTORAGE_KEY, 'true');
}
