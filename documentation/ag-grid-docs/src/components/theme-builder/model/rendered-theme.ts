import { atom, useAtomValue } from 'jotai';

import { type Theme, _theming, themeQuartz } from 'ag-grid-community';

import { allParamModels } from './ParamModel';
import type { PartModel } from './PartModel';
import { FeatureModel } from './PartModel';
import { enabledAdvancedParamsAtom } from './advanced-params';

export type RenderedThemeInfo = {
    theme: Theme;
    overriddenParams: Record<string, unknown>;
    usedParts: PartModel[];
};

const renderedThemeInfoAtom = atom((get): RenderedThemeInfo => {
    const enabledAdvancedParams = get(enabledAdvancedParamsAtom);

    let theme = themeQuartz;

    const usedParts: PartModel[] = [];
    for (const featureName of ['iconSet']) {
        const feature = FeatureModel.for(featureName);
        const partModel = get(feature.selectedPartAtom);
        if (partModel.part !== feature.defaultPart.part) {
            usedParts.push(partModel);
            theme = theme.withPart(partModel.part);
        }
    }

    const overriddenParams = Object.fromEntries(
        allParamModels()
            // filter out params where we still have a value saved in
            // localStorage, but the param is turned off so the value is not
            // added to the current theme
            .filter((param) => enabledAdvancedParams.has(param.property) || !param.onlyEditableAsAdvancedParam)
            .map((param) => [param.property, get(param.valueAtom)])
    );
    theme = theme.withParams(overriddenParams);

    // globally install the theme CSS, because form widgets use reinterpretCSSValue
    // which requires that the CSS variable values are available
    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync(_theming.asThemeImpl(theme)._getPerGridCss('apply-current-theme-params'));
    document.adoptedStyleSheets = [stylesheet];

    return {
        theme,
        overriddenParams,
        usedParts,
    };
});

export const useRenderedTheme = () => _theming.asThemeImpl(useAtomValue(renderedThemeInfoAtom).theme);

export const useRenderedThemeInfo = () => useAtomValue(renderedThemeInfoAtom);
