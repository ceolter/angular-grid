import type { Environment } from '../environment';
import { _getAllRegisteredModules } from '../modules/moduleRegistry';
import { FORCE_LEGACY_THEMES } from './Theme';
import { coreCSS } from './core/core.css-GENERATED';

export const IS_SSR = typeof window !== 'object' || !window?.document?.fonts?.forEach;

type InjectedStyle = {
    css: string;
    el: HTMLStyleElement;
    priority: number;
};

let injectionsByRoot = new WeakMap<HTMLElement, InjectedStyle[]>();

export const _injectGlobalCSS = (css: string, container: HTMLElement, debugId: string, priority = 0) => {
    if (IS_SSR) return;
    if (FORCE_LEGACY_THEMES) return;

    // if the container is attached to the main document, inject into the head
    // (only one instance of each stylesheet created per document). Otherwise
    // (and this happens for grids in the shadow root and grids detached form
    // the DOM) inject into the container itself.
    const root = container.getRootNode() === document ? document.head : container;

    let injections = injectionsByRoot.get(root);
    if (!injections) {
        injections = [];
        injectionsByRoot.set(root, injections);
    }
    if (injections.find((i) => i.css === css)) return;

    const el = document.createElement('style');
    el.dataset.agGlobalCss = debugId;
    el.textContent = css;
    const newInjection = { css, el, priority };

    let insertAfter: InjectedStyle | undefined;
    for (const injection of injections) {
        if (injection.priority > priority) break;
        insertAfter = injection;
    }
    if (insertAfter) {
        insertAfter.el.insertAdjacentElement('afterend', el);
        const index = injections.indexOf(insertAfter);
        injections.splice(index + 1, 0, newInjection);
    } else {
        root.insertBefore(el, root.querySelector(':not(title, meta)'));
        injections.push(newInjection);
    }
};

export const _injectCoreAndModuleCSS = (container: HTMLElement) => {
    _injectGlobalCSS(coreCSS, container, 'core');
    Array.from(_getAllRegisteredModules())
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName))
        .forEach((module) =>
            module.css?.forEach((css) => _injectGlobalCSS(css, container, `module-${module.moduleName}`))
        );
};

const gridsUsingThemingAPI = new Set<object>();

export const _registerGridUsingThemingAPI = (environment: Environment) => {
    gridsUsingThemingAPI.add(environment);
};
export const _unregisterGridUsingThemingAPI = (environment: Environment) => {
    gridsUsingThemingAPI.delete(environment);
    if (gridsUsingThemingAPI.size === 0) {
        injectionsByRoot = new WeakMap();
        for (const style of document.head.querySelectorAll('style[data-ag-global-css]')) {
            style.remove();
        }
    }
};
