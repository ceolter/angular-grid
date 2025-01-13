import type { Theme } from './Theme';
import type { themeQuartz } from './parts/theme/themes';

type ThemeParams<T> = T extends Theme<infer U> ? keyof U : never;
type AllThemeParams = ThemeParams<typeof themeQuartz>;

/**
 * These docs are used in the Theme Builder UI to describe each theme parameter.
 *
 * Currently they need to be kept in sync with the doc comments in the API types,
 * TODO: use code generation to keep these in sync automatically.
 */
const docs: Record<AllThemeParams, string> = {
    accentColor:
        "The 'brand color' for the grid, used wherever a non-neutral color is required. Selections, focus outlines and checkboxes use the accent color by default.",
    advancedFilterBuilderButtonBarBorder: 'Color of the dividing line above the buttons in the advanced filter builder',
    advancedFilterBuilderColumnPillColor: 'Color of the column pills in the Advanced Filter Builder',
    advancedFilterBuilderIndentSize:
        'Amount that each level of the nesting in the advanced filter builder is indented by',
    advancedFilterBuilderJoinPillColor: 'Color of the join operator pills in the Advanced Filter Builder',
    advancedFilterBuilderOptionPillColor: 'Color of the filter option pills in the Advanced Filter Builder',
    advancedFilterBuilderValuePillColor: 'Color of the value pills in the Advanced Filter Builder',
    backgroundColor:
        'Background color of the grid. Many UI elements are semi-transparent, so their color blends with the background color.',
    borderColor: 'Default color for borders.',
    borderRadius: 'Default corner radius for many UI elements such as menus, dialogs and form widgets.',
    browserColorScheme:
        'The CSS color-scheme to apply to the grid, which affects the default appearance of browser scrollbars form inputs unless these have been styled with CSS.',
    buttonTextColor: 'Text color of standard action buttons (e.g. "Reset" and "Apply")',
    buttonFontWeight: 'Font weight of text in standard action buttons (e.g. "Reset" and "Apply")',
    buttonBackgroundColor: 'Background color of standard action buttons (e.g. "Reset" and "Apply")',
    buttonBorder: 'Border around standard action buttons (e.g. "Reset" and "Apply")',
    buttonBorderRadius: 'Corner radius of standard action buttons (e.g. "Reset" and "Apply")',
    buttonHorizontalPadding: 'Horizontal padding inside standard action buttons (e.g. "Reset" and "Apply")',
    buttonVerticalPadding: 'Vertical padding inside standard action buttons (e.g. "Reset" and "Apply")',
    buttonHoverTextColor: 'Text color of standard action buttons (e.g. "Reset" and "Apply") when hovered',
    buttonHoverBackgroundColor: 'Background color of standard action buttons (e.g. "Reset" and "Apply") when hovered',
    buttonHoverBorder:
        'Border around standard action buttons (e.g. "Reset" and "Apply") when hovered. Only has an effect if a border is enabled with `buttonBorder`.',
    buttonActiveTextColor: 'Text color of standard action buttons (e.g. "Reset" and "Apply") when being clicked',
    buttonActiveBackgroundColor:
        'Background color of standard action buttons (e.g. "Reset" and "Apply") when being clicked',
    buttonActiveBorder:
        'Border around standard action buttons (e.g. "Reset" and "Apply") when being clicked. Only has an effect if a border is enabled with `buttonBorder`.',
    buttonDisabledTextColor: 'Text color of standard action buttons (e.g. "Reset" and "Apply") when disabled',
    buttonDisabledBackgroundColor:
        'Background color of standard action buttons (e.g. "Reset" and "Apply") when disabled',
    buttonDisabledBorder: 'Border around standard action buttons (e.g. "Reset" and "Apply") when disabled.',
    cellEditingBorder: 'Border around cells being edited',
    cellEditingShadow: 'Shadow for cells being edited',
    cellFontFamily: 'Font family of text in grid cells',
    cellHorizontalPadding: 'Padding at the start and end of grid cells and header cells.',
    cellHorizontalPaddingScale: 'Multiply the cell horizontal padding by a number, e.g. 1.5 to increase by 50%',
    cellTextColor: 'Color of text in grid cells.',
    cellWidgetSpacing:
        'Horizontal spacing between widgets inside cells (e.g. row group expand buttons and row selection checkboxes).',
    chartMenuLabelColor: 'Color of form field labels within the chart editing panel for integrated charts',
    chartMenuPanelWidth: 'Width of the chart editing panel for integrated charts',
    checkboxBorderRadius: 'Border radius for checkboxes',
    checkboxBorderWidth: 'Border width for checkboxes',
    checkboxCheckedBackgroundColor: 'Background color of a checked checkbox',
    checkboxCheckedBorderColor: 'Border color of a checked checkbox',
    checkboxCheckedShapeColor: 'The color of the check mark on checked checkboxes.',
    checkboxCheckedShapeImage: 'An image defining the shape of the check mark on checked checkboxes.',
    checkboxIndeterminateBackgroundColor: 'Background color of an indeterminate checkbox',
    checkboxIndeterminateBorderColor: 'Border color of an indeterminate checkbox',
    checkboxIndeterminateShapeColor: 'The color of the dash mark on indeterminate checkboxes',
    checkboxIndeterminateShapeImage: 'An image defining the shape of the dash mark on indeterminate checkboxes',
    checkboxUncheckedBackgroundColor: 'Background color of an unchecked checkbox',
    checkboxUncheckedBorderColor: 'Border color of an unchecked checkbox',
    chromeBackgroundColor:
        'Background color for non-data areas of the grid. Headers, tool panels and menus use this color by default.',
    columnBorder: 'Vertical borders between columns within the grid only, excluding headers.',
    columnDropCellBackgroundColor:
        'Background color of the pill shape representing columns in the column drop component',
    columnDropCellBorder: 'Border for the pill shape representing columns in the column drop component',
    columnDropCellDragHandleColor:
        'Color of the drag grip icon in the pill shape representing columns in the column drop component',
    columnDropCellTextColor: 'Text color for the pill shape representing columns in the column drop component',
    columnHoverColor:
        'Background color when hovering over columns in the grid. This is not visible unless enabled in the grid options.',
    columnSelectIndentSize:
        'Amount of indentation for each level of children when selecting grouped columns in the column select widget.',
    dataFontSize: 'Font size for data in grid rows',
    dialogBorder: 'Border color popup dialogs such as the integrated charts and the advanced filter builder.',
    dialogShadow: 'Shadow for popup dialogs such as the integrated charts and the advanced filter builder.',
    dragAndDropImageBackgroundColor: 'Background color of the cover element when dragging grid parts',
    dragAndDropImageBorder: 'Border color of the cover element when dragging grid parts',
    dragAndDropImageShadow: 'Shadow for the drag cover element when dragging grid parts',
    dragHandleColor: 'Color of the drag handle on draggable rows and column markers',
    dropdownShadow: 'Default shadow for dropdown menus',
    filterToolPanelGroupIndent: 'How much to indent child columns in the filters tool panel relative to their parent',
    focusShadow:
        'Shadow around UI controls that have focus e.g. text inputs and buttons. The value must a valid CSS box-shadow.',
    fontFamily: 'Font family used for all text.',
    fontSize: 'Default font size for text in the grid',
    footerRowBorder: 'Horizontal borders above footer components like the pagination and status bars',
    foregroundColor:
        'Default color for neutral UI elements. Most text, borders and backgrounds are defined as semi-transparent versions of this color, resulting in a blend between the background and foreground colours.',
    headerBackgroundColor: 'Background color for header and header-like.',
    headerCellBackgroundTransitionDuration:
        'Duration of the background color transition if headerCellHoverBackgroundColor or headerCellMovingBackgroundColor is set.',
    headerCellHoverBackgroundColor:
        'Background color of a header cell when hovering over it, or `transparent` for no change.',
    headerCellMovingBackgroundColor:
        'Background color of a header cell when dragging to reposition it, or `transparent` for no change.',
    headerColumnBorder: 'Vertical borders between columns within headers.',
    headerColumnBorderHeight:
        'Height of the vertical border between column headers. Percentage values are relative to the header height.',
    headerColumnResizeHandleColor:
        'Color of the drag handle on resizable header columns. Set this to transparent to hide the resize handle.',
    headerColumnResizeHandleHeight:
        'Height of the drag handle on resizable header columns. Percentage values are relative to the header height.',
    headerColumnResizeHandleWidth: 'Width of the drag handle on resizable header columns.',
    headerFontFamily: 'Font family of text in the header',
    headerFontSize: 'Size of text in the header',
    headerFontWeight: 'Font weight of text in the header',
    headerHeight:
        'Height of header rows. NOTE: by default this value is calculated to leave enough room for text, icons and padding. Most applications should leave it as is and use rowVerticalPaddingScale to change padding.',
    headerRowBorder: 'Borders between and below header rows.',
    headerTextColor: 'Color of text in the header',
    headerVerticalPaddingScale: 'Multiply the header vertical padding by a number, e.g. 1.5 to increase by 50%',
    iconSize: 'The size of square icons and icon-buttons',
    iconColor: 'Color for icons, or `inherit` to take on the text color of the containing component',
    iconButtonColor: 'Default color for clickable icons',
    iconButtonBackgroundColor: 'Default background color for clickable icons',
    iconButtonBackgroundSpread: 'The distance beyond the border of the clickable icons that the background extends to',
    iconButtonBorderRadius: 'Corner radius of clickable icon background',
    iconButtonHoverColor: 'Color of clickable icons when hovered',
    iconButtonHoverBackgroundColor: 'Background color for clickable icons when hovered',
    iconButtonActiveColor:
        'Color of clickable icon buttons when styled as active. This is used for the column filter button when a filter is applied to the column.',
    iconButtonActiveBackgroundColor:
        'Background color of clickable icon buttons when styled as active. This is used for the column filter button when a filter is applied to the column.',
    iconButtonActiveIndicatorColor:
        'Color of the marker dot shown on icon buttons when styled as active. This is used for the column filter button when a filter is applied to the column.',
    inputBackgroundColor: 'Background color for text inputs',
    inputBorder:
        'Border around text inputs. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputBorderRadius: 'Corner radius of the border around text inputs',
    inputDisabledBackgroundColor: 'Background color for disabled text inputs',
    inputDisabledBorder:
        'Border around disabled text inputs. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputDisabledTextColor: 'Color of text within disabled text inputs',
    inputFocusBackgroundColor: 'Background color for focussed text inputs',
    inputFocusBorder:
        'Border around focussed text inputs. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputFocusShadow: 'Shadow around focussed text inputs',
    inputFocusTextColor: 'Color of text within focussed text inputs',
    inputHeight: 'Minimum height of text inputs',
    inputIconColor: 'Color of search icon within search text inputs',
    inputInvalidBackgroundColor: 'Background color for text inputs in an invalid state',
    inputInvalidBorder:
        'Border around text inputs in an invalid state. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputInvalidTextColor: 'Color of text within text inputs in an invalid state',
    inputPaddingStart: 'Padding at the start of text in text inputs',
    inputPlaceholderTextColor:
        'Color of placeholder text in empty inputs describing the purpose of the input e.g. "Search..."',
    inputTextColor: 'Color of text within text inputs',
    invalidColor: 'The color for inputs and UI controls in an invalid state.',
    listItemHeight: 'Height of items in scrolling lists e.g. dropdown select inputs and column menu set filters.',
    menuBackgroundColor: 'Background color for menus e.g. column menu and right-click context menu',
    menuBorder: 'Border around menus e.g. column menu and right-click context menu',
    menuSeparatorColor:
        'Color of the dividing line between sections of menus e.g. column menu and right-click context menu',
    menuShadow: 'Shadow for menus e.g. column menu and right-click context menu',
    menuTextColor: 'Text color for menus e.g. column menu and right-click context menu',
    modalOverlayBackgroundColor: 'Background color of the overlay shown over the grid e.g. a data loading indicator.',
    oddRowBackgroundColor: 'Background color applied to every other row',
    panelBackgroundColor:
        'Background color for panels and dialogs such as the integrated charts and the advanced filter builder.',
    panelTitleBarBackgroundColor:
        'Background color for the title bar of panels and dialogs such as the integrated charts and the advanced filter builder.',
    panelTitleBarBorder:
        'Border below the title bar of panels and dialogs such as the integrated charts and the advanced filter builder.',
    pickerButtonBorder: 'Border around buttons with attached dropdown menus (e.g. select fields)',
    pickerButtonFocusBorder: 'Border around buttons with attached dropdown menus (e.g. select fields) when focussed',
    pickerButtonBackgroundColor: 'Background color for buttons with attached dropdown menus (e.g. select fields)',
    pickerButtonFocusBackgroundColor:
        'Background color for buttons with attached dropdown menus (e.g. select fields) when focussed',
    pickerListBorder: 'Border around dropdown menus attached to buttons (e.g. select fields)',
    pickerListBackgroundColor: 'Background color for dropdown menus attached to buttons (e.g. select fields)',
    pinnedColumnBorder:
        'Vertical borders between columns that are pinned to the left or right and the rest of the grid',
    pinnedRowBorder:
        'Horizontal borders between the grid and rows that are pinned to the top or bottom and the rest of the grid',
    popupShadow:
        'Default shadow for elements that float above the grid and are intended to appear separated from it e.g. dialogs and menus',
    cardShadow:
        'Default shadow for elements that float above the grid and are intended to appear elevated byt still attached e.g. dropdowns and cell editors',
    radioCheckedShapeImage: 'An image defining the shape of the mark on checked radio buttons',
    rangeSelectionBackgroundColor:
        'Background color of selected cell ranges. Choosing a semi-transparent color ensure that multiple overlapping ranges look correct.',
    rangeSelectionBorderColor:
        'The color used for borders around range selections. The selection background defaults to a semi-transparent version of this color.',
    rangeSelectionBorderStyle: 'Border style around range selections.',
    rangeSelectionChartBackgroundColor: 'Background color for cells that provide data to the current range chart',
    rangeSelectionChartCategoryBackgroundColor:
        'Background color for cells that provide categories to the current range chart',
    rangeSelectionHighlightColor:
        'Background color to briefly apply to a cell range when the user copies from or pastes into it.',
    rowBorder: 'Horizontal borders between rows.',
    rowGroupIndentSize:
        'The size of indentation applied to each level of row grouping - deep rows are indented by a multiple of this value.',
    rowHeight:
        'Height of grid rows. NOTE: by default this value is calculated to leave enough room for text, icons and padding. Most applications should leave it as is and use rowVerticalPaddingScale to change padding.',
    rowHoverColor:
        'Background color when hovering over rows in the grid and in dropdown menus. Set to `transparent` to disable the hover effect. Note: if you want a hover effect on one but not the other, use CSS selectors instead of this property.',
    rowLoadingSkeletonEffectColor:
        'Color of the skeleton loading effect used when loading row data with the Server-side Row Model',
    rowVerticalPaddingScale:
        'Multiply the row vertical padding by a number, e.g. 1.5 to increase by 50%. Has no effect if rowHeight is set.',
    selectCellBackgroundColor: 'Background color for selected items within the multiple select widget',
    selectCellBorder: 'Border for selected items within the multiple select widget',
    selectedRowBackgroundColor: 'Background color of selected rows in the grid and in dropdown menus.',
    setFilterIndentSize:
        'Amount of indentation for each level of child items in the Set Filter list when filtering tree data.',
    sideBarBackgroundColor: 'Background color of the sidebar that contains the columns and filters tool panels',
    sideButtonBarBackgroundColor: 'Background color of the row of tab buttons at the edge of the sidebar',
    sideBarPanelWidth: 'Default width of the sidebar that contains the columns and filters tool panels',
    sidePanelBorder:
        'Borders between the grid and side panels including the column and filter tool bars, and chart settings',
    sideButtonBarTopPadding: 'Spacing between the topmost side button and the top of the sidebar',
    sideButtonSelectedUnderlineWidth: 'Width of the underline below the selected tab in the sidebar',
    sideButtonSelectedUnderlineColor:
        "Color of the underline below the selected tab in the sidebar, or 'transparent' to disable the underline effect",
    sideButtonSelectedUnderlineTransitionDuration:
        'Duration of the transition effect for the underline below the selected tab in the sidebar',
    sideButtonBackgroundColor: 'Background color of the tab buttons in the sidebar',
    sideButtonTextColor: 'Text color of the tab buttons in the sidebar',
    sideButtonHoverBackgroundColor: 'Background color of the tab buttons in the sidebar when hovered',
    sideButtonHoverTextColor: 'Text color of the tab buttons in the sidebar when hovered',
    sideButtonSelectedBackgroundColor: 'Background color of the selected tab button in the sidebar',
    sideButtonSelectedTextColor: 'Text color of the selected tab button in the sidebar',
    sideButtonBorder: 'Border drawn above and below tab buttons in the sidebar',
    sideButtonSelectedBorder: 'Border drawn above and below the selected tab button in the sidebar',
    sideButtonLeftPadding:
        'Padding to the left of the text in tab buttons in the sidebar (this is always the padding on the inward facing side of the button, so in right-to-left layout it will be on the right)',
    sideButtonRightPadding:
        'Padding to the right of the text in tab buttons in the sidebar (this is always the padding on the outward facing side of the button, so in right-to-left layout it will be on the left)',
    sideButtonVerticalPadding: 'Padding above and below the text in tab buttons in the sidebar',
    spacing:
        'Amount of spacing around and inside UI elements. All padding and margins in the grid are defined as a multiple of this value.',
    subtleTextColor: 'Color of text and UI elements that should stand out less than the default.',
    tabBackgroundColor: 'Background color of tabs',
    tabBarBackgroundColor: 'Background color of the container for tabs',
    tabBarBorder: 'Border below the container for tabs',
    tabBarHorizontalPadding: 'Padding at the left and right of the container for tabs',
    tabBarTopPadding: 'Padding at the top of the container for tabs',
    tabBottomPadding: 'Padding at the bottom of the container for tabs',
    tabHorizontalPadding: 'Padding inside the top and bottom sides of the container for tabs',
    tabHoverBackgroundColor: 'Background color of tabs when hovered over',
    tabHoverTextColor: 'Color of text within tabs when hovered over',
    tabSelectedBackgroundColor: 'Background color of selected tabs',
    tabSelectedBorderColor: 'Color of the border around selected tabs',
    tabSelectedBorderWidth: 'Width of the border around selected tabs',
    tabSelectedTextColor: 'Color of text within the selected tabs',
    tabSelectedUnderlineColor: 'Color of line drawn under selected tabs',
    tabSelectedUnderlineTransitionDuration:
        'Duration of the fade in/out transition for the line drawn under selected tabs',
    tabSelectedUnderlineWidth: 'Width of line drawn under selected tabs',
    tabSpacing: 'Spacing between tabs',
    tabTextColor: 'Color of text within tabs',
    tabTopPadding: 'Padding at the top of the container for tabs',
    textColor: 'Default color for all text',
    toggleButtonHeight: 'Height of the whole toggle button component',
    toggleButtonOffBackgroundColor: "Color of the toggle button background in its 'off' state",
    toggleButtonOnBackgroundColor: "Color of the toggle button background in its 'on' state",
    toggleButtonSwitchBackgroundColor:
        'Background color of the toggle button switch (the bit that slides from left to right)',
    toggleButtonSwitchInset: 'The amount that the toggle switch is inset from the edge of the button',
    toggleButtonWidth: 'Width of the whole toggle button component',
    toolPanelSeparatorBorder:
        'The dividing line between sections of menus e.g. column menu and right-click context menu',
    tooltipBackgroundColor: 'Background color for tooltips',
    tooltipBorder: 'Border for tooltips',
    tooltipTextColor: 'Text color for tooltips',
    valueChangeDeltaDownColor:
        'Color to temporarily apply to cell data when its value decreases in an agAnimateShowChangeCellRenderer cell',
    valueChangeDeltaUpColor:
        'Color to temporarily apply to cell data when its value increases in an agAnimateShowChangeCellRenderer cell',
    valueChangeValueHighlightBackgroundColor:
        'Background color to apply when a cell value changes and enableCellChangeFlash is enabled',
    widgetContainerHorizontalPadding:
        'The horizontal padding of containers that contain stacked widgets, such as menus and tool panels',
    widgetContainerVerticalPadding:
        'The vertical padding of containers that contain stacked widgets, such as menus and tool panels',
    widgetHorizontalSpacing: 'The spacing between widgets in containers arrange widgets horizontally',
    widgetVerticalSpacing: 'The spacing between widgets in containers arrange widgets vertically',
    wrapperBorder: 'Borders around the outside of the grid',
    wrapperBorderRadius: 'Corner radius of the outermost container around the grid.',
};

export const getParamDocs = (param: string): string | undefined => {
    return (docs as any)[param];
};
