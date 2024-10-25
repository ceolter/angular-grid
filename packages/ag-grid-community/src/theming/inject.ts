import { _getAllRegisteredModules } from '../modules/moduleRegistry';
import { coreCSS } from './core/core.css-GENERATED';

export const IS_SSR = typeof window !== 'object' || !window?.document?.fonts?.forEach;

type Injection = {
    css: Set<string>;
    last?: HTMLStyleElement;
};

const injections = new WeakMap<HTMLElement, Injection>();

export const _injectGlobalCSS = (css: string, container: HTMLElement, id = '') => {
    if (IS_SSR) return;
    const root = container.getRootNode() === document ? document.head : container;

    let injection = injections.get(root);
    if (!injection) {
        injection = { css: new Set() };
        injections.set(root, injection);
    }
    if (injection.css.has(css)) return;

    const style = document.createElement('style');
    style.dataset.agGlobalCss = id;
    style.textContent = css;

    if (injection.last) {
        injection.last.insertAdjacentElement('afterend', style);
    } else if (root.firstElementChild) {
        root.firstElementChild.insertAdjacentElement('beforebegin', style);
    } else {
        root.appendChild(style);
    }

    injection.css.add(css);
    injection.last = style;
};

export const _injectCoreAndModuleCSS = (container: HTMLElement) => {
    const moduleCSS = Array.from(_getAllRegisteredModules())
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName))
        .flatMap((module) => module.css || []);

    for (const css of [coreCSS, ...moduleCSS]) {
        _injectGlobalCSS(css, container);
    }
};
