import { createPart } from '../../Part';
import { createTheme } from '../../Theme';
import {
    accentColor,
    accentMix,
    backgroundColor,
    foregroundBackgroundMix,
    foregroundColor,
    foregroundMix,
} from '../../theme-utils';
import { buttonStyleAlpine, buttonStyleBalham, buttonStyleBase } from '../button-style/button-styles';
import { checkboxStyleDefault } from '../checkbox-style/checkbox-styles';
import { colorSchemeVariable } from '../color-scheme/color-schemes';
import { iconSetBalham } from '../icon-set/balham/icon-set-balham';
import { iconSetAlpine, iconSetMaterial, iconSetQuartzRegular } from '../icon-set/icon-sets';
import { inputStyleBordered, inputStyleUnderlined } from '../input-style/input-styles';
import { tabStyleAlpine, tabStyleMaterial, tabStyleQuartz, tabStyleRolodex } from '../tab-style/tab-styles';
import { materialAdjustmentsCSS } from './material-adjustments.css-GENERATED';

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

const makeThemeMaterialTreeShakeable = () =>
    /*#__PURE__*/
    createTheme()
        .withPart(buttonStyleBase)
        .withPart(checkboxStyleDefault)
        .withPart(colorSchemeVariable)
        .withPart(iconSetMaterial)
        .withPart(tabStyleMaterial)
        .withPart(inputStyleUnderlined)
        .withPart(
            createPart({
                css: materialAdjustmentsCSS,
                params: { primaryColor: '#3f51b5' },
            })
        )
        .withParams({
            foregroundColor: 'rgba(0, 0, 0, 0.87)',
            headerTextColor: 'rgba(0, 0, 0, 0.54)',
            accentColor: '#ff4081',
            rowHeight: {
                calc: 'max(iconSize, dataFontSize) + spacing * 3.75 * rowVerticalPaddingScale',
            },
            headerHeight: {
                calc: 'max(iconSize, dataFontSize) + spacing * 4.75 * headerVerticalPaddingScale',
            },
            widgetVerticalSpacing: {
                calc: 'spacing * 1.75',
            },
            cellHorizontalPadding: { calc: 'spacing * 3' },
            widgetContainerHorizontalPadding: { calc: 'spacing * 1.5' },
            widgetContainerVerticalPadding: { calc: 'spacing * 2' },
            iconSize: 18,
            borderRadius: 0,
            wrapperBorderRadius: 0,
            wrapperBorder: false,
            sidePanelBorder: false,
            sideButtonSelectedBorder: false,
            headerColumnResizeHandleColor: 'none',
            headerBackgroundColor: {
                ref: 'backgroundColor',
            },
            buttonTextColor: { ref: 'primaryColor' },
            rangeSelectionBackgroundColor: {
                ref: 'primaryColor',
                mix: 0.2,
            },
            rangeSelectionBorderColor: {
                ref: 'primaryColor',
            },
            rangeSelectionHighlightColor: {
                ref: 'primaryColor',
                mix: 0.5,
            },
            rowHoverColor: foregroundMix(0.08),
            columnHoverColor: {
                ref: 'primaryColor',
                mix: 0.05,
            },
            selectedRowBackgroundColor: {
                ref: 'primaryColor',
                mix: 0.12,
            },
            focusShadow: {
                spread: 4,
                color: foregroundMix(0.16),
            },
            fontFamily: [
                { googleFont: 'Roboto' },
                '-apple-system',
                'BlinkMacSystemFont',
                'Segoe UI',
                'Oxygen-Sans',
                'Ubuntu',
                'Cantarell',
                'Helvetica Neue',
                'sans-serif',
            ],
            inputFocusBorder: {
                width: 2,
                color: { ref: 'primaryColor' },
            },
            pickerButtonFocusBorder: {
                width: 1,
                color: { ref: 'primaryColor' },
            },
            cellEditingBorder: {
                color: { ref: 'primaryColor' },
            },
            headerFontWeight: 600,
            headerCellHoverBackgroundColor: foregroundMix(0.05),
            inputBackgroundColor: { ref: 'chromeBackgroundColor' },
            checkboxBorderWidth: 2,
            checkboxBorderRadius: 2,
            checkboxUncheckedBorderColor: foregroundColor,
            checkboxIndeterminateBackgroundColor: foregroundColor,
        });

export const themeMaterial = /*#__PURE__*/ makeThemeMaterialTreeShakeable();
