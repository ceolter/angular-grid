import type { MutableRefObject } from 'react';

import type { Context, UserCompDetails } from 'ag-grid-community';

/**
 * Show a JS Component
 * @returns Effect Cleanup function
 */
export const showJsComp = (
    compDetails: UserCompDetails | undefined | null,
    context: Context,
    eParent: HTMLElement,
    ref?: MutableRefObject<any> | ((ref: any) => void)
) => {
    const doNothing = !compDetails || compDetails.componentFromFramework || context.isDestroyed();
    if (doNothing) {
        return;
    }

    const promise = compDetails.newAgStackInstance();

    // almost all JS Comps are NOT async, however the Floating Multi Filter is Async as it could
    // be wrapping a React filter, so we need to cater for async comps here.

    let comp: any;
    let compGui: HTMLElement;
    let destroyed = false;

    promise.then((c) => {
        if (destroyed) {
            context.destroyBean(c);
            return;
        }

        comp = c;
        compGui = comp.getGui();
        eParent.appendChild(compGui);
        setRef(ref, comp);
    });

    return () => {
        destroyed = true;
        if (!comp) {
            return;
        } // in case we were destroyed before async comp was returned

        compGui?.parentElement?.removeChild(compGui);

        context.destroyBean(comp);

        if (ref) {
            setRef(ref, undefined);
        }
    };
};

const setRef = (ref: MutableRefObject<any> | ((ref: any) => void) | undefined, value: any) => {
    if (!ref) {
        return;
    }

    if (ref instanceof Function) {
        const refCallback = ref as (ref: any) => void;
        refCallback(value);
    } else {
        const refObj = ref as MutableRefObject<any>;
        refObj.current = value;
    }
};
