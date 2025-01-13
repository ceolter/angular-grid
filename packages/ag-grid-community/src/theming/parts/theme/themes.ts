import { createTheme } from '../../Theme';
import { accentColor, accentMix, backgroundColor, foregroundBackgroundMix, foregroundMix } from '../../theme-utils';
import { buttonStyleAlpine, buttonStyleBalham } from '../button-style/button-styles';
import { checkboxStyleDefault } from '../checkbox-style/checkbox-styles';
import { colorSchemeVariable } from '../color-scheme/color-schemes';
import { iconSetBalham } from '../icon-set/balham/icon-set-balham';
import { iconSetAlpine, iconSetQuartzRegular } from '../icon-set/icon-sets';
import { inputStyleBordered } from '../input-style/input-styles';
import { tabStyleAlpine, tabStyleQuartz, tabStyleRolodex } from '../tab-style/tab-styles';

const makeThemeQuartzTreeShakeable = () =>
    createTheme()
        .withPart(checkboxStyleDefault)
        .withPart(colorSchemeVariable)
        .withPart(iconSetQuartzRegular)
        .withPart(tabStyleQuartz)
        .withPart(() => inputStyleBordered)
        .withParams({
            fontFamily: [
                { googleFont: 'IBM Plex Sans' },
                '-apple-system',
                'BlinkMacSystemFont',
                'Segoe UI',
                'Roboto',
                'Oxygen-Sans',
                'Ubuntu',
            ],
        });

export const themeQuartz =
    /*#__PURE__*/
    makeThemeQuartzTreeShakeable();

const makeThemeAlpineTreeShakeable = () =>
    createTheme()
        .withPart(buttonStyleAlpine)
        .withPart(checkboxStyleDefault)
        .withPart(colorSchemeVariable)
        .withPart(iconSetAlpine)
        .withPart(tabStyleAlpine)
        .withPart(inputStyleBordered)
        .withParams({
            accentColor: '#2196f3',
            selectedRowBackgroundColor: accentMix(0.3),
            inputFocusBorder: {
                color: accentMix(0.4),
            },
            focusShadow: { radius: 2, spread: 1.6, color: accentMix(0.4) },
            iconButtonHoverBackgroundColor: 'transparent',
            iconButtonActiveBackgroundColor: 'transparent',
            checkboxUncheckedBorderColor: foregroundBackgroundMix(0.45),
            checkboxIndeterminateBackgroundColor: foregroundBackgroundMix(0.45),
            checkboxIndeterminateBorderColor: foregroundBackgroundMix(0.45),
            checkboxBorderWidth: 2,
            checkboxBorderRadius: 2,
            fontSize: 13,
            dataFontSize: 14,
            headerFontWeight: 700,
            borderRadius: 3,
            wrapperBorderRadius: 3,
            tabSelectedUnderlineColor: accentColor,
            tabSelectedBorderWidth: 0,
            tabSelectedUnderlineTransitionDuration: 0.3,
            sideButtonSelectedUnderlineColor: accentColor,
            sideButtonSelectedUnderlineWidth: 2,
            sideButtonSelectedUnderlineTransitionDuration: 0.3,
            sideButtonBorder: false,
            sideButtonSelectedBorder: false,
            sideButtonBarTopPadding: { calc: 'spacing * 3' },
            sideButtonSelectedBackgroundColor: 'transparent',
            sideButtonHoverTextColor: accentColor,
            iconButtonHoverColor: accentColor,
            toggleButtonWidth: 28,
            toggleButtonHeight: 18,
            toggleButtonSwitchInset: 1,
            toggleButtonOffBackgroundColor: foregroundBackgroundMix(0.45),
        });

export const themeAlpine =
    /*#__PURE__*/
    makeThemeAlpineTreeShakeable();

const makeThemeBalhamTreeShakeable = () =>
    createTheme()
        .withPart(buttonStyleBalham)
        .withPart(checkboxStyleDefault)
        .withPart(colorSchemeVariable)
        .withPart(iconSetBalham)
        .withPart(tabStyleRolodex)
        .withPart(inputStyleBordered)
        .withParams({
            accentColor: '#0091ea',
            borderColor: foregroundMix(0.2),
            spacing: 4,
            widgetVerticalSpacing: { calc: 'max(8px, spacing)' },
            borderRadius: 2,
            wrapperBorderRadius: 2,
            headerColumnResizeHandleColor: 'transparent',
            headerColumnBorder: true,
            headerColumnBorderHeight: '50%',
            oddRowBackgroundColor: {
                ref: 'chromeBackgroundColor',
                mix: 0.5,
            },
            checkboxBorderRadius: 2,
            checkboxBorderWidth: 1,
            checkboxUncheckedBackgroundColor: backgroundColor,
            checkboxUncheckedBorderColor: foregroundBackgroundMix(0.5),
            checkboxCheckedBackgroundColor: backgroundColor,
            checkboxCheckedBorderColor: accentColor,
            checkboxCheckedShapeColor: accentColor,
            checkboxIndeterminateBackgroundColor: backgroundColor,
            checkboxIndeterminateBorderColor: foregroundBackgroundMix(0.5),
            checkboxIndeterminateShapeColor: foregroundBackgroundMix(0.5),
            focusShadow: { radius: 2, spread: 1, color: accentColor },
            headerTextColor: foregroundMix(0.6),
            iconButtonHoverBackgroundColor: 'transparent',
            iconButtonActiveBackgroundColor: 'transparent',
            fontSize: 12,
            tabSelectedBackgroundColor: backgroundColor,
            headerFontWeight: 'bold',
            toggleButtonWidth: 32,
            toggleButtonHeight: 16,
            toggleButtonSwitchInset: 1,
            toggleButtonOffBackgroundColor: foregroundBackgroundMix(0.5),
            sideButtonBorder: true,
            sideButtonBarTopPadding: { calc: 'spacing * 4' },
        });

export const themeBalham =
    /*#__PURE__*/
    makeThemeBalhamTreeShakeable();

// export const themeMaterial =
//     /*#__PURE__*/
//     createThemeWithDefaultWidgets('material')
//         .withPart(iconSetMaterial)
//         .withPart(tabStyleMaterial)
//         .withPart(inputStyleUnderlined)
//         .withParams({
//             spacing: 9,
//             iconSize: 18,
//             borderRadius: 0,
//             wrapperBorderRadius: 0,
//             wrapperBorder: false,
//             sidePanelBorder: false,
//             sideButtonSelectedBorder: false,
//             headerColumnResizeHandleColor: 'none',
//             headerBackgroundColor: {
//                 ref: 'backgroundColor',
//             },
//             rangeSelectionBackgroundColor: {
//                 ref: 'primaryColor',
//                 mix: 0.2,
//             },
//             rangeSelectionBorderColor: {
//                 ref: 'primaryColor',
//             },
//             fontFamily: [
//                 { googleFont: 'Roboto' },
//                 '-apple-system',
//                 'BlinkMacSystemFont',
//                 'Segoe UI',
//                 'Oxygen-Sans',
//                 'Ubuntu',
//                 'Cantarell',
//                 'Helvetica Neue',
//                 'sans-serif',
//             ],
//             inputFocusBorder: {
//                 style: 'solid',
//                 width: 2,
//                 color: { ref: 'primaryColor' },
//             },
//             headerFontWeight: 600,
//         })
//         .withCSS(
//             `
//             .ag-filter-toolpanel-group-level-0-header, .ag-column-drop-horizontal {
//                 background-color: color-mix(in srgb, transparent, var(--ag-foreground-color) 7%);
//             }
//         `
//         );
