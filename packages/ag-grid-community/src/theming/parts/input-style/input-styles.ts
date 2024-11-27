import { createPart } from '../../Part';
import type { WithParamTypes } from '../../theme-types';
import { inputStyleBaseCSS } from './input-style-base.css-GENERATED';
import { inputStyleBorderedCSS } from './input-style-bordered.css-GENERATED';
import { inputStyleUnderlinedCSS } from './input-style-underlined.css-GENERATED';

export type InputStyleParams = {
    /**
     * Background color for text inputs
     */
    inputBackgroundColor: 'infer';

    /**
     * Border around text inputs (or underneath, if using the underlined input style)
     */
    inputBorder: 'infer';

    /**
     * Corner radius of text inputs
     */
    inputBorderRadius: 'infer';

    /**
     * Background color for disabled text inputs
     */
    inputDisabledBackgroundColor: 'infer';

    /**
     * Border around disabled text inputs (or underneath, if using the underlined input style)
     */
    inputDisabledBorder: 'infer';

    /**
     * Color of text within disabled text inputs
     */
    inputDisabledTextColor: 'infer';

    /**
     * Background color for focussed text inputs
     */
    inputFocusBackgroundColor: 'infer';

    /**
     * Border around focussed text inputs (or underneath, if using the underlined input style)
     */
    inputFocusBorder: 'infer';

    /**
     * Shadow around focussed text inputs
     */
    inputFocusShadow: 'infer';

    /**
     * Color of text within focussed text inputs
     */
    inputFocusTextColor: 'infer';

    /**
     * Minimum height of text inputs
     */
    inputHeight: 'infer';

    /**
     * Background color for text inputs in an invalid state
     */
    inputInvalidBackgroundColor: 'infer';

    /**
     * Border around text inputs in an invalid state (or underneath, if using the underlined input style)
     */
    inputInvalidBorder: 'infer';

    /**
     * Color of text within text inputs in an invalid state
     */
    inputInvalidTextColor: 'infer';

    /**
     * Padding at the start of text in text inputs
     */
    inputPaddingStart: 'infer';

    /**
     * Color of text within text inputs
     */
    inputTextColor: 'infer';

    /**
     * Color of placeholder text in empty inputs describing the purpose of the input e.g. "Search..."
     */
    inputPlaceholderTextColor: 'infer';

    /**
     * Color of search icon within search text inputs
     */
    inputIconColor: 'infer';
};

const baseParams: WithParamTypes<InputStyleParams> = {
    inputBackgroundColor: 'transparent',
    inputBorder: false,
    inputBorderRadius: 0,
    inputTextColor: {
        ref: 'textColor',
    },
    inputPlaceholderTextColor: {
        ref: 'inputTextColor',
        mix: 0.5,
    },
    inputPaddingStart: 0,
    inputHeight: {
        calc: 'max(iconSize, fontSize) + spacing * 2',
    },
    inputFocusBackgroundColor: {
        ref: 'inputBackgroundColor',
    },
    inputFocusBorder: {
        ref: 'inputBorder',
    },
    inputFocusShadow: 'none',
    inputFocusTextColor: {
        ref: 'inputTextColor',
    },
    inputDisabledBackgroundColor: {
        ref: 'inputBackgroundColor',
    },
    inputDisabledBorder: {
        ref: 'inputBorder',
    },
    inputDisabledTextColor: {
        ref: 'inputTextColor',
    },
    inputInvalidBackgroundColor: {
        ref: 'inputBackgroundColor',
    },
    inputInvalidBorder: {
        ref: 'inputBorder',
    },
    inputInvalidTextColor: {
        ref: 'inputTextColor',
    },
    inputIconColor: {
        ref: 'inputTextColor',
    },
};

export const inputStyleBase = createPart<InputStyleParams>({
    feature: 'inputStyle',
    params: baseParams,
    css: inputStyleBaseCSS,
});

export const inputStyleBordered = /*#__PURE__*/ createPart({
    feature: 'inputStyle',
    params: {
        ...baseParams,

        inputBackgroundColor: {
            ref: 'backgroundColor',
        },
        inputBorder: true,
        inputBorderRadius: {
            ref: 'borderRadius',
        },
        inputPaddingStart: {
            ref: 'spacing',
        },
        inputFocusBorder: {
            color: { ref: 'accentColor' },
        },
        inputFocusShadow: {
            ref: 'focusShadow',
        },
        inputDisabledBackgroundColor: {
            ref: 'foregroundColor',
            mix: 0.06,
            onto: 'backgroundColor',
        },
        inputDisabledTextColor: {
            ref: 'textColor',
            mix: 0.5,
        },
        inputInvalidBorder: {
            color: { ref: 'invalidColor' },
        },
    },
    css: () => inputStyleBaseCSS + inputStyleBorderedCSS,
});

export const inputStyleUnderlined = /*#__PURE__*/ createPart({
    feature: 'inputStyle',
    params: {
        ...baseParams,

        inputBorder: {
            width: 2,
            color: {
                ref: 'foregroundColor',
                mix: 0.3,
            },
        },
        inputPaddingStart: {
            ref: 'spacing',
        },
        inputFocusBorder: 'solid 2px var(--ag-accent-color)',
        inputDisabledTextColor: {
            ref: 'textColor',
            mix: 0.5,
        },
        inputDisabledBorder: 'solid 1px var(--ag-border-color)',
        inputInvalidBorder: {
            width: 2,
            color: {
                ref: 'invalidColor',
                mix: 0.3,
            },
        },
    },
    css: () => inputStyleBaseCSS + inputStyleUnderlinedCSS,
});
