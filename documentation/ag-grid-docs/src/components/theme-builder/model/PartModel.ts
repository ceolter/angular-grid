import { atom, useAtom } from 'jotai';

import type { Part } from 'ag-grid-community';
import {
    _asThemeImpl,
    colorSchemeDark,
    colorSchemeDarkBlue,
    colorSchemeDarkWarm,
    colorSchemeLight,
    colorSchemeLightCold,
    colorSchemeLightWarm,
    colorSchemeVariable,
    iconSetAlpine,
    iconSetMaterial,
    iconSetQuartzBold,
    iconSetQuartzLight,
    iconSetQuartzRegular,
    inputStyleBordered,
    inputStyleUnderlined,
    tabStyleAlpine,
    tabStyleMaterial,
    tabStyleQuartz,
    tabStyleRolodex,
    themeQuartz,
} from 'ag-grid-community';

import type { PersistentAtom } from './JSONStorage';
import { atomWithJSONStorage } from './JSONStorage';
import { memoize, titleCase } from './utils';

const partDocs: Record<string, string | undefined> = {
    tabStyle: 'The appearance of tabs in chart settings and legacy column menu',
    inputStyle: 'The appearance of text input fields',
};

const quartzParts = new Set(_asThemeImpl(themeQuartz).parts);

export class FeatureModel {
    readonly label: string;
    readonly docs: string | null;
    readonly parts: PartModel[];
    readonly defaultPart: PartModel;
    readonly selectedPartAtom: PersistentAtom<PartModel>;

    constructor(
        readonly featureName: string,
        parts: Record<string, Part>
    ) {
        this.label = titleCase(featureName);
        this.docs = partDocs[featureName] || null;
        this.parts = Object.entries(parts).map(([variant, part]) => new PartModel(this, variant, part));
        this.defaultPart = this.parts.find((pm) => quartzParts.has(pm.part))!;
        if (!this.defaultPart) {
            throw new Error(`Default part for quartz theme is not one of the options for ${featureName}`);
        }
        this.selectedPartAtom = createSelectedPartAtom(this);
    }

    static for(featureId: string) {
        const featureModel = featureModels[featureId];
        if (!featureModel) throw new Error(`Invalid feature ${featureId}`);
        return featureModel;
    }
}

export const useSelectedPart = (feature: FeatureModel) => useAtom(feature.selectedPartAtom);

const createSelectedPartAtom = (feature: FeatureModel) => {
    const backingAtom = atomWithJSONStorage<string | undefined>(`part.${feature.featureName}`, undefined);
    return atom(
        (get) => {
            const variantName = get(backingAtom);
            return feature.parts.find((v) => v.id === variantName) || feature.defaultPart;
        },
        (_get, set, newVariant: PartModel) =>
            set(backingAtom, newVariant.id === feature.defaultPart.id ? undefined : newVariant.id)
    );
};

export class PartModel {
    readonly label: string;
    readonly id: string;

    constructor(
        readonly feature: FeatureModel,
        readonly variantName: string,
        readonly part: Part<any>
    ) {
        this.label = titleCase(variantName);
        this.id = feature.featureName + '/' + variantName;
    }
}

const allFeatureNames = ['colorScheme', 'iconSet', 'tabStyle', 'inputStyle'];

export const allFeatureModels = memoize(() => allFeatureNames.map(FeatureModel.for));

const featureModels: Record<string, FeatureModel | undefined> = {
    colorScheme: new FeatureModel('colorScheme', {
        lightCold: colorSchemeLightCold,
        light: colorSchemeLight,
        lightWarm: colorSchemeLightWarm,
        darkBlue: colorSchemeDarkBlue,
        dark: colorSchemeDark,
        darkWarm: colorSchemeDarkWarm,
        variable: colorSchemeVariable,
    }),
    iconSet: new FeatureModel('iconSet', {
        alpine: iconSetAlpine,
        material: iconSetMaterial,
        quartzLight: iconSetQuartzLight,
        quartzRegular: iconSetQuartzRegular,
        quartzBold: iconSetQuartzBold,
    }),
    tabStyle: new FeatureModel('tabStyle', {
        quartz: tabStyleQuartz,
        alpine: tabStyleAlpine,
        material: tabStyleMaterial,
        rolodex: tabStyleRolodex,
    }),
    inputStyle: new FeatureModel('inputStyle', {
        bordered: inputStyleBordered,
        underlined: inputStyleUnderlined,
    }),
};
