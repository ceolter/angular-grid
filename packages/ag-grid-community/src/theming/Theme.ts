import type { GridTheme, GridThemeUseArgs } from '../entities/gridOptions';
import { _error, _warn } from '../validation/logging';
import { Params } from './Params';
import type { Part } from './Part';
import { asPartImpl } from './Part';
import type { CoreParams } from './core/core-css';
import { coreDefaults } from './core/core-css';
import { IS_SSR, _injectCoreAndModuleCSS, _injectGlobalCSS } from './inject';
import type { CssFragment } from './theme-types';
import { paramValueToCss } from './theme-types';
import { paramToVariableName } from './theme-utils';

export type Theme<TParams = unknown> = GridTheme & {
    readonly id: string;

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

let customThemeCounter = 0;
/**
 * Create a custom theme containing core grid styles but no parts.
 *
 * @param id an optional identifier for debugging, if omitted one will be generated
 */
export const createTheme = (id: string = `customTheme${++customThemeCounter}`): Theme<CoreParams> =>
    /*#__PURE__*/ new ThemeImpl(id);

let themeClassCounter = 0;
let uninstalledLegacyCSS = false;

class ThemeImpl<TParams = unknown> implements Theme {
    constructor(
        readonly id: string,
        readonly dependencies: readonly Part[] = [],
        readonly params: Params = new Params()
    ) {}

    withPart<TPartParams>(part: Part<TPartParams> | (() => Part<TPartParams>)): Theme<TParams & TPartParams> {
        if (typeof part === 'function') {
            part = part();
        }
        return new ThemeImpl<TParams & TPartParams>(this.id, this.dependencies.concat(part), this.params);
    }

    withParams(params: Partial<TParams>, mode?: string): Theme<TParams> {
        return new ThemeImpl(this.id, this.dependencies, this.params.withParams(params, mode));
    }

    getParamsCSS(): string {
        return makeParamsChunk(this).css;
    }

    private useCount = 0;

    startUse(args: GridThemeUseArgs): void {
        if (IS_SSR) return;
        ++this.useCount;
        if (this.useCount === 1) {
            void this._install(args);
        }
    }

    stopUse(): void {
        if (IS_SSR) return;
        --this.useCount;
        if (this.useCount === 0) {
            // delay slightly to give the new theme time to load before removing the old styles
            // TODO restore removal of unused theme CSS after refactoring parts to use global CSS
            // setTimeout(() => {
            //     // theme might have been used again while we were waiting
            //     if (this.useCount === 0) {
            //         uninstallThemeCSS(this.getCssClass(), this._installRoot);
            //     }
            // }, 1000);
        }
    }

    private _cssClass: string | undefined;
    getCssClass(): string {
        if (this._cssClass == null) {
            this._cssClass = `ag-theme-${++themeClassCounter}`;
        }
        return this._cssClass;
    }

    private _getParamsCache?: Params;
    public getParams(): Params {
        if (this._getParamsCache) return this._getParamsCache;

        let mergedParams = new Params().withParams(coreDefaults());
        for (const part of this._getFlatUnits()) {
            mergedParams = mergedParams.mergedWith(part.params);
        }

        return (this._getParamsCache = mergedParams);
    }

    private async _install({ container, loadThemeGoogleFonts }: GridThemeUseArgs) {
        if (!uninstalledLegacyCSS) {
            uninstalledLegacyCSS = true;
            uninstallLegacyCSS();
        }

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

        for (const chunk of this._getCSSChunks()) {
            _injectGlobalCSS(chunk.css, container, chunk.id);
        }
    }

    private _getFlatUnitsCache?: PartOrTheme[];
    private _getFlatUnits(): PartOrTheme[] {
        if (this._getFlatUnitsCache) return this._getFlatUnitsCache;

        const accumulator: Record<string, PartOrTheme> = {};
        for (const part of this.dependencies) {
            const partImpl = asPartImpl(part);
            // remove any existing item before overwriting, so that the newly added
            // part is ordered at the end of the list
            delete accumulator[partImpl.feature];
            accumulator[partImpl.feature] = partImpl;
        }
        const flatUnits: PartOrTheme[] = [
            ...Object.values(accumulator),
            // add `this` at the end so that CSS and params added to the theme override anything added to parts
            this,
        ];

        return (this._getFlatUnitsCache = flatUnits);
    }

    private _getCssChunksCache?: ThemeCssChunk[];
    private _getCSSChunks(): ThemeCssChunk[] {
        if (this._getCssChunksCache) return this._getCssChunksCache;

        const chunks: ThemeCssChunk[] = [];

        chunks.push(makeParamsChunk(this));

        for (const part of this._getFlatUnits()) {
            if (part.css && part.css.length > 0) {
                let css = `/* Part ${part.id} */`;
                css += part.css.map((p) => (typeof p === 'function' ? p() : p)).join('\n') + '\n';
                css = `.${this.getCssClass()} {\n\t${css}\n}`;
                chunks.push({ css, id: part.id });
            }
        }

        return (this._getCssChunksCache = chunks);
    }
}

export const asThemeImpl = (theme: Theme): ThemeImpl => {
    if (theme instanceof ThemeImpl) {
        return theme;
    }
    throw new Error(
        'expected theme to be an object created by createTheme' +
            (theme && typeof theme === 'object' ? '' : `, got ${theme}`)
    );
};

type PartOrTheme = {
    readonly id: string;
    readonly params: Params;
    readonly css?: ReadonlyArray<CssFragment>;
};

const makeParamsChunk = (themeArg: Theme): ThemeCssChunk => {
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

    const theme = asThemeImpl(themeArg);
    const params = theme.getParams();
    // always put default mode first to that more specific color schemes can override it
    const modes = ['default', ...params.getModes().filter((mode) => mode !== 'default')];
    for (const mode of modes) {
        if (mode !== 'default') {
            const escapedMode = typeof CSS === 'object' ? CSS.escape(mode) : mode; // check for CSS global in case we're running in tests
            const wrapPrefix = `:where([data-ag-theme-mode="${escapedMode}"]) & {\n`;
            variablesCss += wrapPrefix;
            inheritanceCss += wrapPrefix;
        }
        for (const [key, value] of Object.entries(params.getValues(mode))) {
            const cssValue = paramValueToCss(key, value);
            if (cssValue === false) {
                _error(107, { key, value: describeValue(value) });
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
    const rootSelector = `:where(.${theme.getCssClass()})`;
    let css = `${rootSelector} {\n${variablesCss}}\n`;
    // Create --ag-inherited-foo variable values on the parent element, unless
    // the parent is itself a root (which can happen if popupParent is
    // ag-root-wrapper)
    css += `:has(> ${rootSelector}):not(${rootSelector}) {\n${inheritanceCss}}\n`;
    return {
        css,
        id: 'variables:' + theme.getCssClass(),
    };
};

const getGoogleFontsUsed = (theme: ThemeImpl): string[] =>
    Array.from(
        new Set(
            theme
                .getParams()
                .getModes()
                .flatMap((mode) => Object.values(theme.getParams().getValues(mode)))
                .flat()
                .map((value: any) => value?.googleFont)
                .filter((value) => typeof value === 'string') as string[]
        )
    ).sort();

// Remove the CSS from @ag-grid-community/styles that is automatically injected
// by the UMD bundle
const uninstallLegacyCSS = () => {
    for (const style of Array.from(document.head.querySelectorAll('style[data-ag-scope="legacy"]'))) {
        style.remove();
    }
};

const googleFontsLoaded = new Set<string>();

const loadGoogleFont = async (font: string) => {
    if (googleFontsLoaded.has(font)) return;
    googleFontsLoaded.add(font);
    const css = `@import url('https://${googleFontsDomain}/css2?family=${encodeURIComponent(font)}:wght@100;200;300;400;500;600;700;800;900&display=swap');\n`;
    // fonts are always installed in the document head, they are inherited in
    // shadow DOM without the need for separate installation
    _injectGlobalCSS(css, document.head, `googleFont:${font}`);
};

const googleFontsDomain = 'fonts.googleapis.com';

type ThemeCssChunk = {
    css: string;
    id: string;
};

const describeValue = (value: any): string => {
    if (value == null) return String(value);
    return `${typeof value} ${value}`;
};
