import { createPart } from '../../Part';
import { accentColor, backgroundColor, foregroundBackgroundMix } from '../../theme-utils';
import { checkboxStyleDefaultCSS } from './checkbox-style-default.css-GENERATED';

type CheckboxStyleDefaultParams = {
    /**
     * Border radius for checkboxes
     */
    checkboxBorderRadius: never;

    /**
     * Border width for checkboxes
     */
    checkboxBorderWidth: never;

    /**
     * Background color of a checked checkbox
     */
    checkboxCheckedBackgroundColor: never;

    /**
     * Border color of a checked checkbox
     */
    checkboxCheckedBorderColor: never;

    /**
     * The color of the check mark on checked checkboxes.
     */
    checkboxCheckedShapeColor: never;

    /**
     * An image defining the shape of the check mark on checked checkboxes.
     */
    checkboxCheckedShapeImage: never;

    /**
     * Background color of an indeterminate checkbox
     */
    checkboxIndeterminateBackgroundColor: never;

    /**
     * Border color of an indeterminate checkbox
     */
    checkboxIndeterminateBorderColor: never;

    /**
     * The color of the dash mark on indeterminate checkboxes
     */
    checkboxIndeterminateShapeColor: never;

    /**
     * An image defining the shape of the dash mark on indeterminate checkboxes
     */
    checkboxIndeterminateShapeImage: never;

    /**
     * Background color of an unchecked checkbox
     */
    checkboxUncheckedBackgroundColor: never;

    /**
     * Border color of an unchecked checkbox
     */
    checkboxUncheckedBorderColor: never;

    /**
     * An image defining the shape of the mark on checked radio buttons
     */
    radioCheckedShapeImage: never;
};

const makeCheckboxStyleDefaultTreeShakeable = () =>
    createPart<CheckboxStyleDefaultParams>({
        feature: 'checkboxStyle',
        params: {
            checkboxBorderWidth: 1,
            checkboxBorderRadius: {
                ref: 'borderRadius',
            },
            checkboxUncheckedBackgroundColor: backgroundColor,
            checkboxUncheckedBorderColor: foregroundBackgroundMix(0.3),
            checkboxCheckedBackgroundColor: accentColor,
            checkboxCheckedBorderColor: accentColor,
            checkboxCheckedShapeImage: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="7" fill="none"><path stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M1 3.5 3.5 6l5-5"/></svg>',
            },
            checkboxCheckedShapeColor: backgroundColor,
            checkboxIndeterminateBackgroundColor: foregroundBackgroundMix(0.3),
            checkboxIndeterminateBorderColor: foregroundBackgroundMix(0.3),
            checkboxIndeterminateShapeImage: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="2" fill="none"><rect width="10" height="2" fill="#000" rx="1"/></svg>',
            },
            checkboxIndeterminateShapeColor: backgroundColor,
            radioCheckedShapeImage: {
                svg: '<svg xmlns="http://www.w3.org/2000/svg" width="6" height="6" fill="none"><circle cx="3" cy="3" r="3" fill="#000"/></svg>',
            },
        },
        css: checkboxStyleDefaultCSS,
    });

export const checkboxStyleDefault = /*#__PURE__*/ makeCheckboxStyleDefaultTreeShakeable();
