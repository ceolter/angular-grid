import type { Theme, themeQuartz } from 'ag-grid-community';

type ThemeParams<T> = T extends Theme<infer U> ? keyof U : never;
type AllThemeParams = ThemeParams<typeof themeQuartz>;

const docs: Record<AllThemeParams, string> = {
    backgroundColor:
        'Background color of the grid. Many UI elements are semi-transparent, so their color blends with the background color.',
    foregroundColor:
        'Default color for neutral UI elements. Most text, borders and backgrounds are defined as semi-transparent versions of this color, resulting in a blend between the background and foreground colours.',
    textColor: 'Default color for all text',
    accentColor:
        "The 'brand color' for the grid, used wherever a non-neutral color is required. Selections, focus outlines and checkboxes use the accent color by default.",
    invalidColor: 'The color for inputs and UI controls in an invalid state.',
    browserColorScheme:
        'The CSS color-scheme to apply to the grid, which affects the default appearance of browser scrollbars form inputs unless these have been styled with CSS.',
    borderColor: 'Default color for borders.',
    wrapperBorder: 'Borders around the outside of the grid',
    headerRowBorder: 'Borders between and below header rows.',
    rowBorder: 'Horizontal borders between rows.',
    footerRowBorder: 'Horizontal borders above footer components like the pagination and status bars',
    columnBorder: 'Vertical borders between columns within the grid only, excluding headers.',
    headerColumnBorder: 'Vertical borders between columns within headers.',
    headerColumnBorderHeight:
        'Height of the vertical border between column headers. Percentage values are relative to the header height.',
    pinnedColumnBorder:
        'Vertical borders between columns that are pinned to the left or right and the rest of the grid',
    pinnedRowBorder:
        'Horizontal borders between the grid and rows that are pinned to the top or bottom and the rest of the grid',
    sidePanelBorder:
        'Borders between the grid and side panels including the column and filter tool bars, and chart settings',
    sideBarBackgroundColor:
        'Background color for non-data areas of the grid. Headers, tool panels and menus use this color by default.',
    fontFamily: 'Font family used for all text.',
    dataFontSize: 'Font size for data in grid rows',
    chromeBackgroundColor:
        'Background color for non-data areas of the grid. Headers, tool panels and menus use this color by default.',
    headerBackgroundColor: 'Background color for header and header-like.',
    headerFontWeight: 'Font weight of text in the header',
    headerFontFamily: 'Font family of text in the header',
    headerFontSize: 'Size of text in the header',
    headerVerticalPaddingScale: 'Multiply the header vertical padding by a number, e.g. 1.5 to increase by 50%',
    headerTextColor: 'Color of text in the header',
    headerCellHoverBackgroundColor:
        'Background color of a header cell when hovering over it, or `transparent` for no change.',
    headerCellMovingBackgroundColor:
        'Background color of a header cell when dragging to reposition it, or `transparent` for no change.',
    headerCellBackgroundTransitionDuration:
        'Duration of the background color transition if headerCellHoverBackgroundColor or headerCellMovingBackgroundColor is set.',
    cellTextColor: 'Color of text in grid cells.',
    cellEditingBorder: 'Border around cells being edited',
    cellEditingShadow: 'Shadow for cells being edited',
    cellFontFamily: 'Font family of text in grid cells',
    subtleTextColor: 'Color of text and UI elements that should stand out less than the default.',
    rangeSelectionBorderStyle: 'Border style around range selections.',
    rangeSelectionBorderColor:
        'The color used for borders around range selections. The selection background defaults to a semi-transparent version of this color.',
    rangeSelectionBackgroundColor:
        'Background color of selected cell ranges. Choosing a semi-transparent color ensure that multiple overlapping ranges look correct.',
    rangeSelectionChartBackgroundColor: 'Background color for cells that provide data to the current range chart',
    rangeSelectionChartCategoryBackgroundColor:
        'Background color for cells that provide categories to the current range chart',
    rangeSelectionHighlightColor:
        'Background color to briefly apply to a cell range when the user copies from or pastes into it.',
    rowHoverColor:
        'Background color when hovering over rows in the grid and in dropdown menus. Set to `transparent` to disable the hover effect. Note: if you want a hover effect on one but not the other, use CSS selectors instead of this property.',
    columnHoverColor:
        'Background color when hovering over columns in the grid. This is not visible unless enabled in the grid options.',
    selectedRowBackgroundColor: 'Background color of selected rows in the grid and in dropdown menus.',
    modalOverlayBackgroundColor: 'Background color of the overlay shown over the grid e.g. a data loading indicator.',
    oddRowBackgroundColor: 'Background color applied to every other row',
    borderRadius: 'Default corner radius for many UI elements such as menus, dialogs and form widgets.',
    wrapperBorderRadius: 'Corner radius of the outermost container around the grid.',
    cellWidgetSpacing:
        'Horizontal spacing between widgets inside cells (e.g. row group expand buttons and row selection checkboxes).',
    rowGroupIndentSize:
        'The size of indentation applied to each level of row grouping - deep rows are indented by a multiple of this value.',
    valueChangeDeltaUpColor:
        'Color to temporarily apply to cell data when its value increases in an agAnimateShowChangeCellRenderer cell',
    valueChangeDeltaDownColor:
        'Color to temporarily apply to cell data when its value decreases in an agAnimateShowChangeCellRenderer cell',
    valueChangeValueHighlightBackgroundColor:
        'Background color to apply when a cell value changes and enableCellChangeFlash is enabled',
    spacing:
        'Amount of spacing around and inside UI elements. All padding and margins in the grid are defined as a multiple of this value.',
    cellHorizontalPadding: 'Padding at the start and end of grid cells and header cells.',
    cellHorizontalPaddingScale: 'Multiply the cell horizontal padding by a number, e.g. 1.5 to increase by 50%',
    fontSize: 'Default font size for text in the grid',
    rowHeight:
        'Height of grid rows. NOTE: by default this value is calculated to leave enough room for text, icons and padding. Most applications should leave it as is and use rowVerticalPaddingScale to change padding.',
    rowVerticalPaddingScale:
        'Multiply the row vertical padding by a number, e.g. 1.5 to increase by 50%. Has no effect if rowHeight is set.',
    headerHeight:
        'Height of header rows. NOTE: by default this value is calculated to leave enough room for text, icons and padding. Most applications should leave it as is and use rowVerticalPaddingScale to change padding.',
    popupShadow: 'Default shadow for elements that float above the grid e.g. dialogs and menus',
    dropdownShadow: 'Default shadow for dropdown menus',
    dragAndDropImageBackgroundColor: 'Background color of the cover element when dragging grid parts',
    dragAndDropImageBorder: 'Border color of the cover element when dragging grid parts',
    dragAndDropImageShadow: 'Shadow for the drag cover element when dragging grid parts',
    dragHandleColor: 'Color of the drag handle on draggable rows and column markers',
    focusShadow:
        'Shadow around UI controls that have focus e.g. text inputs and buttons. The value must a valid CSS box-shadow.',
    sideBarPanelWidth: 'Default width of the sidebar that contains the columns and filters tool panels',
    headerColumnResizeHandleHeight:
        'Height of the drag handle on resizable header columns. Percentage values are relative to the header height.',
    headerColumnResizeHandleWidth: 'Width of the drag handle on resizable header columns.',
    headerColumnResizeHandleColor:
        'Color of the drag handle on resizable header columns. Set this to transparent to hide the resize handle.',
    widgetContainerHorizontalPadding:
        'The horizontal padding of containers that contain stacked widgets, such as menus and tool panels',
    widgetContainerVerticalPadding:
        'The vertical padding of containers that contain stacked widgets, such as menus and tool panels',
    widgetHorizontalSpacing: 'The spacing between widgets in containers arrange widgets horizontally',
    widgetVerticalSpacing: 'The spacing between widgets in containers arrange widgets vertically',
    listItemHeight: 'Height of items in scrolling lists e.g. dropdown select inputs and column menu set filters.',
    toggleButtonWidth: 'Width of the whole toggle button component',
    toggleButtonHeight: 'Height of the whole toggle button component',
    toggleButtonSwitchInset: 'The amount that the toggle switch is inset from the edge of the button',
    toggleButtonOnBackgroundColor: "Color of the toggle button background in its 'on' state",
    toggleButtonOffBackgroundColor: "Color of the toggle button background in its 'off' state",
    toggleButtonSwitchBackgroundColor:
        'Background color of the toggle button switch (the bit that slides from left to right)',
    checkboxBorderWidth: 'Border width for checkboxes',
    checkboxBorderRadius: 'Border radius for checkboxes',
    checkboxUncheckedBackgroundColor: 'Background color of an unchecked checkbox',
    checkboxUncheckedBorderColor: 'Border color of an unchecked checkbox',
    checkboxCheckedBackgroundColor: 'Background color of a checked checkbox',
    checkboxCheckedBorderColor: 'Border color of a checked checkbox',
    checkboxCheckedShapeImage: 'An image defining the shape of the check mark on checked checkboxes.',
    checkboxCheckedShapeColor: 'The color of the check mark on checked checkboxes.',
    checkboxIndeterminateBackgroundColor: 'Background color of an indeterminate checkbox',
    checkboxIndeterminateBorderColor: 'Border color of an indeterminate checkbox',
    checkboxIndeterminateShapeImage: 'An image defining the shape of the dash mark on indeterminate checkboxes',
    checkboxIndeterminateShapeColor: 'The color of the dash mark on indeterminate checkboxes',
    radioCheckedShapeImage: 'An image defining the shape of the mark on checked radio buttons',
    menuBorder: 'Border around menus e.g. column menu and right-click context menu',
    menuBackgroundColor: 'Background color for menus e.g. column menu and right-click context menu',
    menuTextColor: 'Text color for menus e.g. column menu and right-click context menu',
    menuShadow: 'Shadow for menus e.g. column menu and right-click context menu',
    menuSeparatorColor:
        'Color of the dividing line between sections of menus e.g. column menu and right-click context menu',
    setFilterIndentSize:
        'Amount of indentation for each level of child items in the Set Filter list when filtering tree data.',
    chartMenuPanelWidth: 'Width of the chart editing panel for integrated charts',
    chartMenuLabelColor: 'Color of form field labels within the chart editing panel for integrated charts',
    iconButtonHoverColor: 'Hover color for clickable icons',
    dialogShadow: 'Shadow for popup dialogs such as the integrated charts and the advanced filter builder.',
    dialogBorder: 'Border color popup dialogs such as the integrated charts and the advanced filter builder.',
    panelBackgroundColor:
        'Background color for panels and dialogs such as the integrated charts and the advanced filter builder.',
    panelTitleBarBackgroundColor:
        'Background color for the title bar of panels and dialogs such as the integrated charts and the advanced filter builder.',
    panelTitleBarBorder:
        'Border below the title bar of panels and dialogs such as the integrated charts and the advanced filter builder.',
    columnSelectIndentSize:
        'Amount of indentation for each level of children when selecting grouped columns in the column select widget.',
    toolPanelSeparatorBorder:
        'The dividing line between sections of menus e.g. column menu and right-click context menu',
    tooltipBackgroundColor: 'Background color for tooltips',
    tooltipTextColor: 'Text color for tooltips',
    tooltipBorder: 'Border for tooltips',
    columnDropCellBackgroundColor:
        'Background color for the representation of columns within the column drop component',
    columnDropCellBorder: 'Border for the representation of columns within the column drop component',
    selectCellBackgroundColor: 'Background color for selected items within the multiple select widget',
    selectCellBorder: 'Border for selected items within the multiple select widget',
    advancedFilterBuilderButtonBarBorder: 'Color of the dividing line above the buttons in the advanced filter builder',
    advancedFilterBuilderIndentSize:
        'Amount that each level of the nesting in the advanced filter builder is indented by',
    advancedFilterBuilderJoinPillColor: 'Color of the join operator pills in the Advanced Filter Builder',
    advancedFilterBuilderColumnPillColor: 'Color of the column pills in the Advanced Filter Builder',
    advancedFilterBuilderOptionPillColor: 'Color of the filter option pills in the Advanced Filter Builder',
    advancedFilterBuilderValuePillColor: 'Color of the value pills in the Advanced Filter Builder',
    filterToolPanelGroupIndent: 'How much to indent child columns in the filters tool panel relative to their parent',
    iconButtonHoverBackgroundColor: 'Background color of clickable icons when hovered',
    iconSize: 'The size of square icons and icon-buttons',

    //
    // TABS
    //
    tabBarBackgroundColor: 'Background color of the container for tabs',
    tabBarBorder: 'Border below the container for tabs',
    tabBarTopPadding: 'Padding at the top of the container for tabs',
    tabBarHorizontalPadding: 'Padding at the left and right of the container for tabs',

    tabBackgroundColor: 'Background color of tabs',
    tabTextColor: 'Color of text within tabs',
    tabSpacing: 'Spacing between tabs',
    tabHorizontalPadding: 'Padding inside the top and bottom sides of the container for tabs',
    tabTopPadding: 'Padding at the top of the container for tabs',
    tabBottomPadding: 'Padding at the bottom of the container for tabs',

    tabHoverBackgroundColor: 'Background color of tabs when hovered over',
    tabHoverTextColor: 'Color of text within tabs when hovered over',

    tabSelectedTextColor: 'Color of text within the selected tabs',
    tabSelectedBackgroundColor: 'Background color of selected tabs',
    tabSelectedBorderWidth: 'Width of the border around selected tabs',
    tabSelectedBorderColor: 'Color of the border around selected tabs',
    tabSelectedUnderlineColor: 'Color of line drawn under selected tabs',
    tabSelectedUnderlineWidth: 'Width of line drawn under selected tabs',
    tabSelectedUnderlineTransitionDuration:
        'Duration of the fade in/out transition for the line drawn under selected tabs',

    //
    // INPUTS
    //
    inputBackgroundColor: 'Background color for text inputs',
    inputBorder:
        'Border around text inputs. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputBorderRadius: 'Corner radius of the border around text inputs',
    inputTextColor: 'Color of text within text inputs',
    inputPaddingStart: 'Padding at the start of text in text inputs',
    inputHeight: 'Minimum height of text inputs',
    inputFocusBackgroundColor: 'Background color for focussed text inputs',
    inputFocusBorder:
        'Border around focussed text inputs. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputFocusShadow: 'Shadow around focussed text inputs',
    inputFocusTextColor: 'Color of text within focussed text inputs',
    inputDisabledBackgroundColor: 'Background color for disabled text inputs',
    inputDisabledBorder:
        'Border around disabled text inputs. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputDisabledTextColor: 'Color of text within disabled text inputs',
    inputInvalidBackgroundColor: 'Background color for text inputs in an invalid state',
    inputInvalidBorder:
        'Border around text inputs in an invalid state. By default the border is drawn all around the input, when using Material Design inputs the border is drawn underneath',
    inputInvalidTextColor: 'Color of text within text inputs in an invalid state',
    inputIconColor: 'Color of search icon within search text inputs',
    inputPlaceholderTextColor:
        'Color of placeholder text in empty inputs describing the purpose of the input e.g. "Search..."',
    rowLoadingSkeletonEffectColor:
        'Color of the skeleton loading effect used when loading row data with the Server-side Row Model',
};

export const getParamDocs = (param: string): string | undefined => {
    return (docs as any)[param];
};
