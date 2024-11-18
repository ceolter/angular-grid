import { _error, _warn } from '../validation/logging';
import type { Part, PartImpl } from './Part';
import { createPart } from './Part';
import type { CoreParams } from './core/core-css';
import { coreDefaults } from './core/core-css';
import { IS_SSR, _injectCoreAndModuleCSS, _injectGlobalCSS } from './inject';
import type { WithParamTypes } from './theme-types';
import { paramValueToCss } from './theme-types';
import { paramToVariableName } from './theme-utils';

export type Theme<TParams = unknown> = {
    /**
     * Return a new theme that uses an theme part. The part will replace any
     * existing part of the same feature
     *
     * @param part a part, or a no-arg function that returns a part
     */
    withPart<TPartParams>(part: Part<TPartParams> | (() => Part<TPartParams>)): Theme<TParams & TPartParams>;

    /**
     * Return a new theme with different default values for the specified
     * params.
     *
     * @param defaults an object containing params e.g. {spacing: 10}
     */
    withParams(defaults: Partial<TParams>, mode?: string): Theme<TParams>;
};

export const asThemeImpl = <TParams>(theme: Theme<TParams>): ThemeImpl => {
    if (!(theme instanceof ThemeImpl)) {
        throw new Error('theme is not an object created by createTheme');
    }
    return theme;
};

/**
 * Create a custom theme containing core grid styles but no parts.
 */
export const createTheme = (): Theme<CoreParams> => new ThemeImpl();

type GridThemeUseArgs = {
    loadThemeGoogleFonts: boolean | undefined;
    container: HTMLElement;
};

export class ThemeImpl {
    constructor(readonly parts: PartImpl[] = []) {}

    withPart(part: Part | (() => Part)): ThemeImpl {
        if (typeof part === 'function') part = part();
        return new ThemeImpl([...this.parts, part as PartImpl]);
    }

    withParams(params: WithParamTypes<unknown>, mode = 'default'): ThemeImpl {
        return this.withPart(
            createPart({
                modeParams: { [mode]: params },
            })
        );
    }

    /**
     * Called by a grid instance when it starts using the theme. This installs
     * the theme's parts into document head, or the shadow DOM if the provided
     * container is within a shadow root.
     */
    _startUse({ container, loadThemeGoogleFonts }: GridThemeUseArgs): void {
        if (IS_SSR) return;

        uninstallLegacyCSS();

        _injectCoreAndModuleCSS(container);

        const googleFontsUsed = getGoogleFontsUsed(this);
        if (googleFontsUsed.length > 0) {
            const googleFontsLoaded = new Set<string>();
            document.fonts.forEach((font) => googleFontsLoaded.add(font.family));
            for (const googleFont of googleFontsUsed) {
                if (loadThemeGoogleFonts) {
                    loadGoogleFont(googleFont);
                } else if (loadThemeGoogleFonts == null && !googleFontsLoaded.has(googleFont)) {
                    _warn(112, { googleFont, googleFontsDomain });
                }
            }
        }

        for (const part of this.parts) {
            (part as PartImpl).use(container);
        }
    }

    private _cssClassCache?: string;
    /**
     * Return CSS that that applies the params of this theme to elements with
     * the provided class name
     */
    _getCssClass(this: ThemeImpl): string {
        return (this._cssClassCache ??= deduplicatePartsByFeature(this.parts)
            .map((part) => part.use())
            .filter(Boolean)
            .join(' '));
    }

    private _paramsCache?: ModalParamValues;
    _getModeParams(): ModalParamValues {
        let paramsCache = this._paramsCache;
        if (!paramsCache) {
            const mergedParams: ModalParamValues = {
                // defining `default` here is important, it ensures that the default
                // mode is first in iteration order, which puts it first in outputted
                // CSS, allowing other modes to override it
                default: { ...coreDefaults },
            };
            for (const part of deduplicatePartsByFeature(this.parts)) {
                for (const [mode, otherParams] of Object.entries(part.modeParams)) {
                    if (otherParams) {
                        const existingParams = mergedParams[mode] ?? {};
                        for (const [name, otherValue] of Object.entries(otherParams)) {
                            if (otherValue !== undefined) {
                                existingParams[name] = otherValue;
                            }
                        }
                        mergedParams[mode] = existingParams;
                    }
                }
            }
            this._paramsCache = paramsCache = mergedParams;
        }
        return paramsCache;
    }

    private _paramsCssCache?: string;
    /**
     * Return the CSS chunk that is inserted into the grid DOM, and will
     * therefore be removed automatically when the grid is destroyed or it
     * starts to use a new theme.
     *
     * @param className a unique class name on the grid wrapper used to scope the returned CSS to the grid instance
     */
    _getPerGridCss(className: string): string {
        const selectorPlaceholder = '##SELECTOR##';
        let innerParamsCss = this._paramsCssCache;
        if (!innerParamsCss) {
            // Ensure that every variable has a value set on root elements ("root"
            // elements are those containing grid UI, e.g. ag-root-wrapper and
            // ag-popup)
            //
            // Simply setting .ag-root-wrapper { --ag-foo: default-value } is not
            // appropriate because it will override any values set on parent
            // elements. An application should be able to set `--ag-spacing: 4px`
            // on the document body and have it picked up by all grids on the page.
            //
            // To allow this we capture the application-provided value of --ag-foo
            // into --ag-inherited-foo on the *parent* element of the root, and then
            // use --ag-inherited-foo as the value for --ag-foo on the root element,
            // applying our own default if it is unset.
            let variablesCss = '';
            let inheritanceCss = '';

            for (const [mode, params] of Object.entries(this._getModeParams())) {
                if (mode !== 'default') {
                    const escapedMode = typeof CSS === 'object' ? CSS.escape(mode) : mode; // check for CSS global in case we're running in tests
                    const wrapPrefix = `:where([data-ag-theme-mode="${escapedMode}"]) & {\n`;
                    variablesCss += wrapPrefix;
                    inheritanceCss += wrapPrefix;
                }
                for (const [key, value] of Object.entries(params)) {
                    const cssValue = paramValueToCss(key, value);
                    if (cssValue === false) {
                        _error(107, { key, value });
                    } else {
                        const cssName = paramToVariableName(key);
                        const inheritedName = cssName.replace('--ag-', '--ag-inherited-');
                        variablesCss += `\t${cssName}: var(${inheritedName}, ${cssValue});\n`;
                        inheritanceCss += `\t${inheritedName}: var(${cssName});\n`;
                    }
                }
                if (mode !== 'default') {
                    variablesCss += '}\n';
                    inheritanceCss += '}\n';
                }
            }
            let css = `${selectorPlaceholder} {\n${variablesCss}}\n`;
            // Create --ag-inherited-foo variable values on the parent element, unless
            // the parent is itself a root (which can happen if popupParent is
            // ag-root-wrapper)
            css += `:has(> ${selectorPlaceholder}):not(${selectorPlaceholder}) {\n${inheritanceCss}}\n`;
            this._paramsCssCache = innerParamsCss = css;
        }
        return innerParamsCss.replaceAll(selectorPlaceholder, `:where(.${className})`);
    }
}

type ParamValues = Record<string, unknown>;

type ModalParamValues = {
    [mode: string]: ParamValues;
};

// Remove parts with the same feature, keeping only the last one
const deduplicatePartsByFeature = (parts: readonly PartImpl[]): PartImpl[] => {
    const lastPartByFeature = new Map<string, PartImpl>();
    for (const part of parts) {
        if (part.feature) {
            lastPartByFeature.set(part.feature, part);
        }
    }
    const result: PartImpl[] = [];
    for (const part of parts) {
        if (!part.feature || lastPartByFeature.get(part.feature) === part) {
            result.push(part);
        }
    }
    return result;
};

const getGoogleFontsUsed = (theme: ThemeImpl): string[] => {
    const googleFontsUsed = new Set<string>();
    const visitParamValue = (paramValue: any) => {
        // font value can be a font object or array of font objects
        if (Array.isArray(paramValue)) {
            paramValue.forEach(visitParamValue);
        } else {
            const googleFont = paramValue?.googleFont;
            if (typeof googleFont === 'string') {
                googleFontsUsed.add(googleFont);
            }
        }
    };
    const allModeValues = Object.values(theme._getModeParams());
    const allValues = allModeValues.flatMap((mv) => Object.values(mv));
    allValues.forEach(visitParamValue);
    return Array.from(googleFontsUsed).sort();
};

let uninstalledLegacyCSS = false;
// Remove the CSS from @ag-grid-community/styles that is automatically injected
// by the UMD bundle
const uninstallLegacyCSS = () => {
    if (uninstalledLegacyCSS) return;
    uninstalledLegacyCSS = true;
    for (const style of Array.from(document.head.querySelectorAll('style[data-ag-scope="legacy"]'))) {
        style.remove();
    }
};

const googleFontsLoaded = new Set<string>();

const loadGoogleFont = async (font: string) => {
    googleFontsLoaded.add(font);
    const css = `@import url('https://${googleFontsDomain}/css2?family=${encodeURIComponent(font)}:wght@100;200;300;400;500;600;700;800;900&display=swap');\n`;
    // fonts are always installed in the document head, they are inherited in
    // shadow DOM without the need for separate installation
    _injectGlobalCSS(css, document.head, `googleFont:${font}`);
};

const googleFontsDomain = 'fonts.googleapis.com';
