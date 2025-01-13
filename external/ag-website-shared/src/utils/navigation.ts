import type { Location, To, Update } from 'history';
import { createBrowserHistory } from 'history';
import { useCallback, useEffect, useState } from 'react';
import type { MouseEventHandler } from 'react';

export const browserHistory = import.meta.env.SSR ? null : createBrowserHistory();

export function useHistory(callback: (data: Update) => void) {
    useEffect(() => browserHistory?.listen(callback), []);
}

export function useLocation() {
    const [location, setLocation] = useState<Location | null>(browserHistory?.location ?? null);
    useHistory(({ location }) => setLocation(location));
    return location;
}

export function useScrollToAnchor() {
    const handleScroll: MouseEventHandler<HTMLAnchorElement> = useCallback((event) => {
        event.preventDefault();
        navigate(event.currentTarget.href);
        const href = event.currentTarget.getAttribute('href');
        if (href?.startsWith('#')) {
            scrollIntoViewById(href.substring(1));
        }
    }, []);

    return handleScroll;
}

export function navigate(to: To, options?: { state?: any; replace?: boolean }) {
    if (options?.replace) {
        browserHistory?.replace(to, options?.state);
    } else {
        browserHistory?.push(to, options?.state);
    }
}

export function scrollIntoView(element?: HTMLElement | null, options?: Parameters<Element['scrollIntoView']>) {
    requestAnimationFrame(() => element?.scrollIntoView({ behavior: 'smooth', ...options }));
}

export function scrollIntoViewById(id: string, options?: Parameters<Element['scrollIntoView']>) {
    scrollIntoView(document.getElementById(id), options);
}
