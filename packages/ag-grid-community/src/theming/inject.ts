import type { Environment } from '../environment';
import { _getAllRegisteredModules } from '../modules/moduleRegistry';
import { FORCE_LEGACY_THEMES } from './Theme';
import { coreCSS } from './core/core.css-GENERATED';

export const IS_SSR = typeof window !== 'object' || !window?.document?.fonts?.forEach;

type Injection = {
    css: Set<string>;
    last?: HTMLStyleElement;
};

let injections = new WeakMap<HTMLElement, Injection>();

export const _injectGlobalCSS = (css: string, container: HTMLElement, debugId: string) => {
    if (IS_SSR) return;
    if (FORCE_LEGACY_THEMES) return;

    // if the container is attached to the main document, inject into the head
    // (only one instance of each stylesheet created per document). Otherwise
    // (and this happens for grids in the shadow root and grids detached form
    // the DOM) inject into the container itself.
    const root = container.getRootNode() === document ? document.head : container;

    let injection = injections.get(root);
    if (!injection) {
        injection = { css: new Set() };
        injections.set(root, injection);
    }
    if (injection.css.has(css)) return;

    const style = document.createElement('style');
    style.dataset.agGlobalCss = debugId;
    style.textContent = css;

    if (injection.last) {
        injection.last.insertAdjacentElement('afterend', style);
    } else {
        root.insertBefore(style, root.querySelector(':not(title, meta)'));
    }

    injection.css.add(css);
    injection.last = style;
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
        injections = new WeakMap();
        for (const style of document.head.querySelectorAll('style[data-ag-global-css]')) {
            style.remove();
        }
    }
};
