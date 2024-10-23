import { createPart, createPartVariant } from '../../Part';
import type { BorderValue, ColorValue, DurationValue, LengthValue } from '../../theme-types';
import { tabStyleBaseCSS } from './tab-style-base.css-GENERATED';
import { tabStyleRolodexCSS } from './tab-style-rolodex.css-GENERATED';

export type TabStyleParams = {
    /**
     * Background color of tabs
     */
    tabBackgroundColor: ColorValue;

    /**
     * Background color of the container for tabs
     */
    tabBarBackgroundColor: ColorValue;

    /**
     * Border below the container for tabs
     */
    tabBarBorder: BorderValue;

    /**
     * Padding at the left and right of the container for tabs
     */
    tabBarHorizontalPadding: LengthValue;

    /**
     * Padding at the top of the container for tabs
     */
    tabBarTopPadding: LengthValue;

    /**
     * Padding at the bottom of the container for tabs
     */
    tabBottomPadding: LengthValue;

    /**
     * Padding inside the top and bottom sides of the container for tabs
     */
    tabHorizontalPadding: LengthValue;

    /**
     * Background color of tabs when hovered over
     */
    tabHoverBackgroundColor: ColorValue;

    /**
     * Color of text within tabs when hovered over
     */
    tabHoverTextColor: ColorValue;

    /**
     * Background color of selected tabs
     */
    tabSelectedBackgroundColor: ColorValue;

    /**
     * Color of the border around selected tabs
     */
    tabSelectedBorderColor: ColorValue;

    /**
     * Width of the border around selected tabs
     */
    tabSelectedBorderWidth: LengthValue;

    /**
     * Color of text within the selected tabs
     */
    tabSelectedTextColor: ColorValue;

    /**
     * Color of line drawn under selected tabs
     */
    tabSelectedUnderlineColor: ColorValue;

    /**
     * Duration in seconds of the fade in/out transition for the line drawn under selected tabs
     */
    tabSelectedUnderlineTransitionDuration: DurationValue;

    /**
     * Width of line drawn under selected tabs
     */
    tabSelectedUnderlineWidth: LengthValue;

    /**
     * Spacing between tabs
     */
    tabSpacing: LengthValue;

    /**
     * Color of text within tabs
     */
    tabTextColor: ColorValue;

    /**
     * Padding at the top of the container for tabs
     */
    tabTopPadding: LengthValue;
};

/**
 * This base tab style adds no visual styling, it provides a base upon which a
 * tab style can be built by setting the tab-related params
 */
// prettier-ignore
export const tabStyleBase =
    /*#__PURE__*/
    createPart('tabStyle', 'base')
        .withAdditionalParams<TabStyleParams>({
            tabBarBackgroundColor: 'transparent',
            tabBarHorizontalPadding: 0,
            tabBarTopPadding: 0,

            tabBackgroundColor: 'transparent',
            tabTextColor: {
                ref: 'textColor',
            },
            tabHorizontalPadding: {
                ref: 'spacing',
            },
            tabTopPadding: {
                ref: 'spacing',
            },
            tabBottomPadding: {
                ref: 'spacing',
            },
            tabSpacing: '0',

            tabHoverBackgroundColor: {
                ref: 'tabBackgroundColor',
            },
            tabHoverTextColor: {
                ref: 'tabTextColor',
            },

            tabSelectedBackgroundColor: {
                ref: 'tabBackgroundColor',
            },
            tabSelectedTextColor: {
                ref: 'tabTextColor',
            },
            tabSelectedBorderWidth: 1,
            tabSelectedBorderColor: 'transparent',
            tabSelectedUnderlineColor: 'transparent',
            tabSelectedUnderlineWidth: '0',
            tabSelectedUnderlineTransitionDuration: '0',
            tabBarBorder: false,
        })
        .withCSS(tabStyleBaseCSS);

/**
 * Tabs styled for the Quartz theme
 */
// prettier-ignore
export const tabStyleQuartz =
    /*#__PURE__*/
    createPartVariant(tabStyleBase, 'quartz')
        .withParams({
            tabBarBorder: true,
            tabBarBackgroundColor: {
                ref: 'foregroundColor',
                mix: 0.05,
            },
            tabTextColor: {
                ref: 'textColor',
                mix: 0.7,
            },
            tabSelectedTextColor: {
                ref: 'textColor',
            },
            tabHoverTextColor: {
                ref: 'textColor',
            },
            tabSelectedBorderColor: {
                ref: 'borderColor',
            },
            tabSelectedBackgroundColor: {
                ref: 'backgroundColor',
            },
        });

/**
 * Tabs styled for the Material theme
 */
// prettier-ignore
export const tabStyleMaterial =
    /*#__PURE__*/
    createPartVariant(tabStyleBase, 'material')
        .withParams({
            tabBarBackgroundColor: {
                ref: 'chromeBackgroundColor',
            },
            tabSelectedUnderlineColor: {
                ref: 'primaryColor',
            },
            tabSelectedUnderlineWidth: 2,
            tabSelectedUnderlineTransitionDuration: '0',
        });

/**
 * Tabs styled for the Alpine theme
 */
// prettier-ignore
export const tabStyleAlpine =
    /*#__PURE__*/
    createPartVariant(tabStyleBase, 'alpine')
        .withParams({
            tabBarBorder: true,
            tabBarBackgroundColor: {
                ref: 'chromeBackgroundColor',
            },
            tabHoverTextColor: {
                ref: 'accentColor',
            },
            tabSelectedTextColor: {
                ref: 'accentColor',
            },
            tabSelectedUnderlineColor: {
                ref: 'accentColor',
            },
            tabSelectedUnderlineWidth: 2,
            tabSelectedUnderlineTransitionDuration: '0.3s',
        });

/**
 * Tabs where the selected tab appears raised and attached the the active
 * content, like a rolodex or operating system tabs.
 */
// prettier-ignore
export const tabStyleRolodex =
    /*#__PURE__*/
    createPartVariant(tabStyleBase, 'rolodex')
        .withParams({
            tabBarBackgroundColor: {
                ref: 'chromeBackgroundColor',
            },
            tabBarHorizontalPadding: {
                ref: 'spacing',
            },
            tabBarTopPadding: {
                ref: 'spacing',
            },
            tabBarBorder: true,
            tabHorizontalPadding: { calc: 'spacing * 2' },
            tabTopPadding: {
                ref: 'spacing',
            },
            tabBottomPadding: {
                ref: 'spacing',
            },
            tabSpacing: {
                ref: 'spacing',
            },
            tabSelectedBorderColor: {
                ref: 'borderColor',
            },
            tabSelectedBackgroundColor: {
                ref: 'backgroundColor',
            },
        })
        .withCSS(tabStyleRolodexCSS);
