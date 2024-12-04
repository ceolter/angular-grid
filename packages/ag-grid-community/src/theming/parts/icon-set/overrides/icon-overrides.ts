import { createPart } from '../../../Part';
import { colorValueToCss, fontFamilyValueToCss, fontWeightValueToCss, imageValueToCss } from '../../../theme-types';
import type { ColorValue, FontFamilyValue, FontWeightValue, ImageValue } from '../../../theme-types';
import { sharedIconStylesCSS } from '../shared-icon-styles.css-GENERATED';

type IconSetOverridesImage = {
    type: 'image';
    mask?: boolean;
    cssImports?: string[];
    icons: {
        [key: string]: ImageValue;
    };
};

type IconSetOverridesFont = {
    type: 'font';
    weight?: FontWeightValue;
    family?: FontFamilyValue;
    color?: ColorValue;
    cssImports?: string[];
    icons: {
        [key: string]: string;
    };
};

type IconSetOverridesArgs = IconSetOverridesImage | IconSetOverridesFont;

export const iconOverrides = (args: IconSetOverridesArgs) => {
    const cssParts = [sharedIconStylesCSS];
    if (args.type === 'image') {
        for (const [key, value] of Object.entries(args.icons)) {
            const imageCssValue = imageValueToCss(value);
            if (args.mask) {
                cssParts.push(`.ag-icon-${key}::before { mask-image: ${imageCssValue}; }`);
            } else {
                cssParts.push(`.ag-icon-${key}::before { background-image: ${imageCssValue}; ${unsetMaskIcon} }`);
            }
        }
    }
    if (args.type === 'font') {
        let properties = unsetMaskIcon;
        if (args.family) {
            properties += ` font-family: ${fontFamilyValueToCss(args.family)};`;
        }
        if (args.weight) {
            properties += ` font-weight: ${fontWeightValueToCss(args.weight)};`;
        }
        if (args.color) {
            properties += ` color: ${colorValueToCss(args.color)};`;
        }
        for (const [key, value] of Object.entries(args.icons)) {
            cssParts.push(`.ag-icon-${key}::before { content: ${JSON.stringify(value)}; ${properties} }`);
        }
    }
    return createPart({
        css: cssParts.join(';\n'),
        cssImports: args.cssImports,
    });
};

const unsetMaskIcon = `background-color: unset; mask-image: unset; -webkit-mask-image: unset;`;
