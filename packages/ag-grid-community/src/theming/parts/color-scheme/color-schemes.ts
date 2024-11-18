import { createPart } from '../../Part';
import { defaultLightColorSchemeParams } from '../../core/core-css';

export const colorSchemeLight = /*#__PURE__*/ createPart({
    feature: 'colorScheme',
    params: defaultLightColorSchemeParams,
});

export const colorSchemeLightWarm = /*#__PURE__*/ createPart({
    feature: 'colorScheme',
    params: {
        ...defaultLightColorSchemeParams,
        foregroundColor: '#000000de',
        borderColor: '#60300026',
        chromeBackgroundColor: '#60300005',
    },
});

export const colorSchemeLightCold = /*#__PURE__*/ createPart({
    feature: 'colorScheme',
    params: {
        ...defaultLightColorSchemeParams,
        foregroundColor: '#000',
        chromeBackgroundColor: '#f3f8f8',
    },
});

const darkParams = {
    backgroundColor: 'hsl(217, 0%, 17%)',
    foregroundColor: '#FFF',
    chromeBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.05,
        onto: 'backgroundColor',
    },
    browserColorScheme: 'dark',
} as const;

export const colorSchemeDark = /*#__PURE__*/ createPart({
    feature: 'colorScheme',
    params: darkParams,
});

export const colorSchemeDarkWarm = /*#__PURE__*/ createPart({
    feature: 'colorScheme',
    params: {
        backgroundColor: 'hsl(29, 10%, 17%)',
        foregroundColor: '#FFF',
        chromeBackgroundColor: {
            ref: 'foregroundColor',
            mix: 0.05,
            onto: 'backgroundColor',
        },
        browserColorScheme: 'dark',
    },
});

const darkBlueParams = {
    backgroundColor: '#1f2836',
    foregroundColor: '#FFF',
    chromeBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.07,
        onto: 'backgroundColor',
    },
    browserColorScheme: 'dark',
} as const;

export const colorSchemeDarkBlue = /*#__PURE__*/ createPart({
    feature: 'colorScheme',
    params: darkBlueParams,
});

export const colorSchemeVariable = /*#__PURE__*/ createPart({
    feature: 'colorScheme',
    params: defaultLightColorSchemeParams,
    modeParams: {
        light: defaultLightColorSchemeParams,
        dark: darkParams,
        'dark-blue': darkBlueParams,
    },
});
