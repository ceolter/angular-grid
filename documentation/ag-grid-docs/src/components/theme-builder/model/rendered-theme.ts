import { atom, useAtomValue } from 'jotai';

import { type Part, type Theme, _asThemeImpl, themeQuartz } from 'ag-grid-community';

import { allParamModels } from './ParamModel';
import { FeatureModel } from './PartModel';
import { enabledAdvancedParamsAtom } from './advanced-params';
import { setCurrentThemeCssClass } from './utils';

export type RenderedThemeInfo = {
    theme: Theme;
    overriddenParams: Record<string, unknown>;
    usedParts: Part[];
};

const renderedThemeInfoAtom = atom((get): RenderedThemeInfo => {
    const enabledAdvancedParams = get(enabledAdvancedParamsAtom);

    let theme = themeQuartz;

    const usedParts: Part[] = [];
    for (const featureName of ['iconSet'] as const) {
        const feature = FeatureModel.for(featureName);
        const part = get(feature.selectedPartAtom).part;
        if (part !== feature.defaultPart.part) {
            usedParts.push(part);
            theme = theme.withPart(part);
        }
    }

    const overriddenParams = Object.fromEntries(
        allParamModels()
            .filter((param) => enabledAdvancedParams.has(param.property) || !param.onlyEditableAsAdvancedParam)
            .map((param) => [param.property, get(param.valueAtom)])
    );
    theme = theme.withParams(overriddenParams);

    // globally install the theme CSS, because form widgets use reinterpretCSSValue
    // which requires that the CSS variable values are available
    setCurrentThemeCssClass(theme.getCssClass());
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(_asThemeImpl(theme).getParamsCSS());
    document.adoptedStyleSheets = [stylesheet];

    return {
        theme,
        overriddenParams,
        usedParts,
    };
});

export const useRenderedTheme = () => _asThemeImpl(useAtomValue(renderedThemeInfoAtom).theme);

export const useRenderedThemeInfo = () => useAtomValue(renderedThemeInfoAtom);
