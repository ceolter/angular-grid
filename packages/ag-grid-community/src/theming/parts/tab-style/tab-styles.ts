import { createPart } from '../../Part';
import type { WithParamTypes } from '../../theme-types';
import { tabStyleBaseCSS } from './tab-style-base.css-GENERATED';
import { tabStyleRolodexCSS } from './tab-style-rolodex.css-GENERATED';

export type TabStyleParams = {
    /**
     * Background color of tabs
     */
    tabBackgroundColor: 'infer';

    /**
     * Background color of the container for tabs
     */
    tabBarBackgroundColor: 'infer';

    /**
     * Border below the container for tabs
     */
    tabBarBorder: 'infer';

    /**
     * Padding at the left and right of the container for tabs
     */
    tabBarHorizontalPadding: 'infer';

    /**
     * Padding at the top of the container for tabs
     */
    tabBarTopPadding: 'infer';

    /**
     * Padding at the bottom of the container for tabs
     */
    tabBottomPadding: 'infer';

    /**
     * Padding inside the top and bottom sides of the container for tabs
     */
    tabHorizontalPadding: 'infer';

    /**
     * Background color of tabs when hovered over
     */
    tabHoverBackgroundColor: 'infer';

    /**
     * Color of text within tabs when hovered over
     */
    tabHoverTextColor: 'infer';

    /**
     * Background color of selected tabs
     */
    tabSelectedBackgroundColor: 'infer';

    /**
     * Color of the border around selected tabs
     */
    tabSelectedBorderColor: 'infer';

    /**
     * Width of the border around selected tabs
     */
    tabSelectedBorderWidth: 'infer';

    /**
     * Color of text within the selected tabs
     */
    tabSelectedTextColor: 'infer';

    /**
     * Color of line drawn under selected tabs
     */
    tabSelectedUnderlineColor: 'infer';

    /**
     * Duration in seconds of the fade in/out transition for the line drawn under selected tabs
     */
    tabSelectedUnderlineTransitionDuration: 'infer';

    /**
     * Width of line drawn under selected tabs
     */
    tabSelectedUnderlineWidth: 'infer';

    /**
     * Spacing between tabs
     */
    tabSpacing: 'infer';

    /**
     * Color of text within tabs
     */
    tabTextColor: 'infer';

    /**
     * Padding at the top of the container for tabs
     */
    tabTopPadding: 'infer';
};

const baseParams: WithParamTypes<TabStyleParams> = {
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
};

/**
 * This base tab style adds no visual styling, it provides a base upon which a
 * tab style can be built by setting the tab-related params
 */
export const tabStyleBase = createPart<TabStyleParams>({
    feature: 'tabStyle',
    params: baseParams,
    css: tabStyleBaseCSS,
});

/**
 * Tabs styled for the Quartz theme
 */
export const tabStyleQuartz = /*#__PURE__*/ createPart({
    feature: 'tabStyle',
    params: {
        ...baseParams,

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
    },
    css: tabStyleBaseCSS,
});

/**
 * Tabs styled for the Material theme
 */
export const tabStyleMaterial = /*#__PURE__*/ createPart({
    feature: 'tabStyle',
    params: {
        ...baseParams,

        tabBarBackgroundColor: {
            ref: 'chromeBackgroundColor',
        },
        tabSelectedUnderlineColor: {
            ref: 'primaryColor',
        },
        tabSelectedUnderlineWidth: 2,
        tabSelectedUnderlineTransitionDuration: 0,
    },
    css: tabStyleBaseCSS,
});

/**
 * Tabs styled for the Alpine theme
 */
export const tabStyleAlpine = /*#__PURE__*/ createPart({
    feature: 'tabStyle',
    params: {
        ...baseParams,

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
    },
    css: tabStyleBaseCSS,
});

/**
 * Tabs where the selected tab appears raised and attached the the active
 * content, like a rolodex or operating system tabs.
 */
export const tabStyleRolodex = /*#__PURE__*/ createPart({
    feature: 'tabStyle',
    params: {
        ...baseParams,

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
    },
    css: () => tabStyleBaseCSS + tabStyleRolodexCSS,
});
