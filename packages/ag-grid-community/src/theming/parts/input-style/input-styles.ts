import { createPart, createPartVariant } from '../../Part';
import type { BorderValue, ColorValue, LengthValue, ShadowValue } from '../../theme-types';
import { inputStyleBaseCSS } from './input-style-base.css-GENERATED';
import { inputStyleUnderlinedCSS } from './input-style-underlined.css-GENERATED';

export type InputStyleParams = {
    /**
     * Background color for text inputs
     */
    inputBackgroundColor: ColorValue;

    /**
     * Border around text inputs (or underneath, if using the underlined input style)
     */
    inputBorder: BorderValue;

    /**
     * Corner radius of text inputs
     */
    inputBorderRadius: LengthValue;

    /**
     * Background color for disabled text inputs
     */
    inputDisabledBackgroundColor: ColorValue;

    /**
     * Border around disabled text inputs (or underneath, if using the underlined input style)
     */
    inputDisabledBorder: BorderValue;

    /**
     * Color of text within disabled text inputs
     */
    inputDisabledTextColor: ColorValue;

    /**
     * Background color for focussed text inputs
     */
    inputFocusBackgroundColor: ColorValue;

    /**
     * Border around focussed text inputs (or underneath, if using the underlined input style)
     */
    inputFocusBorder: BorderValue;

    /**
     * Shadow around focussed text inputs
     */
    inputFocusShadow: ShadowValue;

    /**
     * Color of text within focussed text inputs
     */
    inputFocusTextColor: ColorValue;

    /**
     * Minimum height of text inputs
     */
    inputHeight: LengthValue;

    /**
     * Background color for text inputs in an invalid state
     */
    inputInvalidBackgroundColor: ColorValue;

    /**
     * Border around text inputs in an invalid state (or underneath, if using the underlined input style)
     */
    inputInvalidBorder: BorderValue;

    /**
     * Color of text within text inputs in an invalid state
     */
    inputInvalidTextColor: ColorValue;

    /**
     * Padding at the start of text in text inputs
     */
    inputPaddingStart: LengthValue;

    /**
     * Color of text within text inputs
     */
    inputTextColor: ColorValue;
};

// prettier-ignore
export const inputStyleBase =
    /*#__PURE__*/
    createPart('inputStyle', 'base')
        .withAdditionalParams<InputStyleParams>({
            inputBackgroundColor: 'transparent',
            inputBorder: false,
            inputBorderRadius: 0,
            inputTextColor: {
                ref: 'textColor',
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
        })
        .withCSS(inputStyleBaseCSS);

// prettier-ignore
export const inputStyleBordered =
    /*#__PURE__*/
    createPartVariant(inputStyleBase, 'bordered')
        .withParams({
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
        });

// prettier-ignore
export const inputStyleUnderlined =
    /*#__PURE__*/
    createPartVariant(inputStyleBase, 'underlined')
        .withParams({
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
        })
        .withCSS(inputStyleUnderlinedCSS);
