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

const partsByFeatureName: Record<string, Part<any>[] | undefined> = {
    colorScheme: [
        colorSchemeLightCold,
        colorSchemeLight,
        colorSchemeLightWarm,
        colorSchemeDarkBlue,
        colorSchemeDark,
        colorSchemeDarkWarm,
    ],
    iconSet: [iconSetAlpine, iconSetMaterial, iconSetQuartzLight, iconSetQuartzRegular, iconSetQuartzBold],
    tabStyle: [tabStyleQuartz, tabStyleAlpine, tabStyleMaterial, tabStyleRolodex],
    inputStyle: [inputStyleBordered, inputStyleUnderlined],
};

export const getPartsByFeature = (featureName: string) => partsByFeatureName[featureName];

const featureModels: Record<string, FeatureModel> = {};

const partDocs: Record<string, string | undefined> = {
    tabStyle: 'The appearance of tabs in chart settings and legacy column menu',
    inputStyle: 'The appearance of text input fields',
};

const defaultPartIds = new Set(_asThemeImpl(themeQuartz).parts.map((dep) => dep.id));

export class FeatureModel {
    readonly label: string;
    readonly docs: string | null;
    readonly parts: PartModel[];
    readonly defaultPart: PartModel;
    readonly selectedPartAtom: PersistentAtom<PartModel>;

    private constructor(readonly featureName: string) {
        this.label = titleCase(featureName);
        this.docs = partDocs[featureName] || null;
        const parts = partsByFeatureName[featureName];
        if (!parts) throw new Error(`Invalid feature "${featureName}"`);
        this.parts = parts.map((part) => new PartModel(this, part));
        this.defaultPart = this.parts.find((v) => defaultPartIds.has(v.id)) || this.parts[0];
        this.selectedPartAtom = createSelectedPartAtom(this);
    }

    static for(partID: string) {
        return featureModels[partID] || (featureModels[partID] = new FeatureModel(partID));
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
    readonly variantName: string;

    constructor(
        readonly feature: FeatureModel,
        readonly part: Part<any>
    ) {
        this.label = titleCase(part.variant);
        this.variantName = part.variant;
        this.id = part.id;
    }
}

const allFeatureNames = ['colorScheme', 'iconSet', 'tabStyle', 'inputStyle'];

export const allFeatureModels = memoize(() => allFeatureNames.map(FeatureModel.for));
