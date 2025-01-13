import { _injectGlobalCSS } from './inject';
import type { Feature, WithParamTypes } from './theme-types';

/**
 * A collection of CSS styles and default parameter values that can be added to
 * a theme. Parts are created with the createPart helper function.
 */
export type Part<TParams = unknown> = {
    readonly feature?: string;
    readonly modeParams: Record<string, TParams>;
    readonly css?: string | (() => string) | undefined;
};

// string & {} used to preserve auto-complete from string union but allow any string
// eslint-disable-next-line @typescript-eslint/ban-types
type AnyString = string & {};

// This utility type is a no-op (Expand<T> === T) but it changes the display of
// the type in the IDE so that it shows something like Part<{myColor: ColorValue}>
// instead of something like Part<WithParamTypes<InputStyleParams>>
export type ExpandTypeKeys<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type CreatePartArgs<T> = {
    /**
     * A string feature, e.g. 'iconSet'. Adding a part to a theme will remove
     * any existing part with the same feature.
     */
    feature?: Feature | AnyString;

    /**
     * Default parameters for the part.
     */
    params?: WithParamTypes<T>;

    /**
     * Parameters for different theme modes, e.g. 'dark' or 'light'. Setting
     * `modeParams: {myMode: {myColor: 'red'}}` on a theme part is the equivalent
     * of `theme.withParams({myColor: 'red'}, 'myMode')`.
     */
    modeParams?: Record<string, WithParamTypes<T>>;

    /**
     * CSS styles associated with this part. The CSS will be injected into the
     * page when the theme is used by a grid.
     *
     * The grid uses CSS nested to wrap this CSS in a selector that ensures it
     * only applies to grids that are using a theme containing this part.
     */
    css?: string | (() => string);

    /**
     * URLs of CSS files to import before the part's CSS.
     */
    cssImports?: string[];
};

/**
 * Create a new empty part.
 *
 * @param feature an The part feature, e.g. 'iconSet'. Adding a part to a theme will remove any existing part with the same feature.
 * @param variant an optional identifier for debugging, if omitted one will be generated
 */
export const createPart = <T = unknown>(args: CreatePartArgs<T>): Part<ExpandTypeKeys<WithParamTypes<T>>> => {
    /*#__PURE__*/
    return new PartImpl(args) as any;
};

export const defaultModeName = '$default';

let partCounter = 0;
export class PartImpl implements Part {
    feature?: string | undefined;
    modeParams: Record<string, Record<string, unknown>>;
    css?: string | (() => string) | undefined;
    cssImports?: string[];

    _inject?: { css: string; class: string } | false;

    constructor({ feature, params, modeParams = {}, css, cssImports }: CreatePartArgs<unknown>) {
        this.feature = feature;
        this.css = css;
        this.cssImports = cssImports;
        this.modeParams = {
            // NOTE: it's important that default is defined first, putting it
            // first in iteration order, because when merging params the default
            // params override any prior modal params, so modal params in this
            // part need to come after default params to prevent them from being
            // immediately overridden.
            [defaultModeName]: {
                ...(modeParams[defaultModeName] ?? {}),
                ...(params ?? {}),
            },
            ...modeParams,
        };
    }

    use(container?: HTMLElement): string | false {
        let inject = this._inject;
        if (inject == null) {
            let { css } = this;
            if (css) {
                const className = `ag-theme-${this.feature ?? 'part'}-${++partCounter}`;
                if (typeof css === 'function') css = css();
                css = `:where(.${className}) {\n${css}\n}\n`;
                for (const cssImport of this.cssImports ?? []) {
                    css = `@import url(${JSON.stringify(cssImport)});\n${css}`;
                }
                inject = { css, class: className };
            } else {
                inject = false;
            }
            this._inject = inject;
        }
        if (inject && container) {
            _injectGlobalCSS(inject.css, container, inject.class);
        }
        return inject ? inject.class : false;
    }
}
