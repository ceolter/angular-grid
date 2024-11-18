import { createTheme } from '../../Theme';
import { checkboxStyleDefault } from '../checkbox-style/checkbox-styles';
import { colorSchemeVariable } from '../color-scheme/color-schemes';
import { iconSetAlpine, iconSetQuartzRegular } from '../icon-set/icon-sets';
import { inputStyleBordered } from '../input-style/input-styles';
import { tabStyleAlpine, tabStyleQuartz, tabStyleRolodex } from '../tab-style/tab-styles';

export const themeQuartz =
    /*#__PURE__*/
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

export const themeAlpine =
    /*#__PURE__*/
    createTheme()
        .withPart(checkboxStyleDefault)
        .withPart(colorSchemeVariable)
        .withPart(iconSetAlpine)
        .withPart(tabStyleAlpine)
        .withPart(inputStyleBordered)
        .withParams({
            accentColor: '#2196f3',
            selectedRowBackgroundColor: {
                ref: 'accentColor',
                mix: 0.3,
            },
            inputFocusBorder: {
                color: { ref: 'accentColor', mix: 0.4 },
            },
            fontSize: 13,
            dataFontSize: 14,
            headerFontWeight: 700,
            borderRadius: 3,
            wrapperBorderRadius: 3,
            tabSelectedUnderlineColor: { ref: 'accentColor' },
            tabSelectedBorderWidth: 2,
            tabSelectedUnderlineTransitionDuration: 0.3,
        });

export const themeBalham =
    /*#__PURE__*/
    createTheme()
        .withPart(checkboxStyleDefault)
        .withPart(colorSchemeVariable)
        .withPart(iconSetAlpine)
        .withPart(tabStyleRolodex)
        .withPart(inputStyleBordered)
        .withParams({
            spacing: 4,
            borderRadius: 2,
            wrapperBorderRadius: 2,
            headerColumnResizeHandleColor: 'transparent',
            headerColumnBorder: true,
            headerColumnBorderHeight: '50%',
            oddRowBackgroundColor: {
                ref: 'chromeBackgroundColor',
                mix: 0.5,
            },
            headerTextColor: {
                ref: 'foregroundColor',
                mix: 0.5,
            },
            fontSize: 12,
            headerFontWeight: 'bold',
        });

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
