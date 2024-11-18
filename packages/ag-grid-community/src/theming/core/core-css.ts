import type { ExpandTypeKeys } from '../Part';
import type { WithParamTypes } from '../theme-types';

export { coreCSS } from './core.css-GENERATED';

/**
 * All possible theme param types - the actual params available will be a subset of this type depending on the parts in use by the theme.
 */
type CoreParamsDefinitions = {
    /**
     * The 'brand color' for the grid, used wherever a non-neutral color is required. Selections, focus outlines and checkboxes use the accent color by default.
     */
    accentColor: 'infer';

    /**
     * Color of the dividing line above the buttons in the advanced filter builder
     */
    advancedFilterBuilderButtonBarBorder: 'infer';

    /**
     * Color of the column pills in the Advanced Filter Builder
     */
    advancedFilterBuilderColumnPillColor: 'infer';

    /**
     * Amount that each level of the nesting in the advanced filter builder is indented by
     */
    advancedFilterBuilderIndentSize: 'infer';

    /**
     * Color of the join operator pills in the Advanced Filter Builder
     */
    advancedFilterBuilderJoinPillColor: 'infer';

    /**
     * Color of the filter option pills in the Advanced Filter Builder
     */
    advancedFilterBuilderOptionPillColor: 'infer';

    /**
     * Color of the value pills in the Advanced Filter Builder
     */
    advancedFilterBuilderValuePillColor: 'infer';

    /**
     * Background color of the grid. Many UI elements are semi-transparent, so their color blends with the background color.
     */
    backgroundColor: 'infer';

    /**
     * Default color for borders.
     */
    borderColor: 'infer';

    /**
     * Default corner radius for many UI elements such as menus, dialogs and form widgets.
     */
    borderRadius: 'infer';

    /**
     * The CSS color-scheme to apply to the grid, which affects the default appearance of browser scrollbars form inputs unless these have been styled with CSS.
     */
    browserColorScheme: 'infer';

    /**
     * Padding at the start and end of grid cells and header cells.
     */
    cellHorizontalPadding: 'infer';

    /**
     * Multiply the cell horizontal padding by a number, e.g. 1.5 to increase by 50%
     */
    cellHorizontalPaddingScale: 'infer';

    /**
     * Color of text in grid cells.
     */
    cellTextColor: 'infer';

    /**
     * Horizontal spacing between widgets inside cells (e.g. row group expand buttons and row selection checkboxes).
     */
    cellWidgetSpacing: 'infer';

    /**
     * Color of form field labels within the chart editing panel for integrated charts
     */
    chartMenuLabelColor: 'infer';

    /**
     * Width of the chart editing panel for integrated charts
     */
    chartMenuPanelWidth: 'infer';

    /**
     * Background color for non-data areas of the grid. Headers, tool panels and menus use this color by default.
     */
    chromeBackgroundColor: 'infer';

    /**
     * Vertical borders between columns within the grid only, excluding headers.
     */
    columnBorder: 'infer';

    /**
     * Background color for the representation of columns within the column drop component
     */
    columnDropCellBackgroundColor: 'infer';

    /**
     * Border for the representation of columns within the column drop component
     */
    columnDropCellBorder: 'infer';

    /**
     * Background color when hovering over columns in the grid. This is not visible unless enabled in the grid options.
     */
    columnHoverColor: 'infer';

    /**
     * Amount of indentation for each level of children when selecting grouped columns in the column select widget.
     */
    columnSelectIndentSize: 'infer';

    /**
     * Border color popup dialogs such as the integrated charts and the advanced filter builder.
     */
    dialogBorder: 'infer';

    /**
     * Shadow for popup dialogs such as the integrated charts and the advanced filter builder.
     */
    dialogShadow: 'infer';

    /**
     * Border around cells being edited
     */
    cellEditingBorder: 'infer';

    /**
     * Shadow for cells being edited
     */
    cellEditingShadow: 'infer';

    /**
     * Background color of the drag and drop image component element when dragging columns
     */
    dragAndDropImageBackgroundColor: 'infer';

    /**
     * Border color of the drag and drop image component element when dragging columns
     */
    dragAndDropImageBorder: 'infer';

    /**
     * Shadow for the drag and drop image component element when dragging columns
     */
    dragAndDropImageShadow: 'infer';

    /**
     * Color of the drag handle on draggable rows and column markers
     */
    dragHandleColor: 'infer';

    /**
     * Default shadow for dropdown menus
     */
    dropdownShadow: 'infer';

    /**
     * How much to indent child columns in the filters tool panel relative to their parent
     */
    filterToolPanelGroupIndent: 'infer';

    /**
     * Shadow around UI controls that have focus e.g. text inputs and buttons. The value must a valid CSS box-shadow.
     */
    focusShadow: 'infer';

    /**
     * Default font family for all text. Can be overridden by more specific parameters like `headerFontFamily`
     */
    fontFamily: 'infer';

    /**
     * Default font size for text throughout the grid UI
     */
    fontSize: 'infer';

    /**
     * Font size for data in grid rows
     */
    dataFontSize: 'infer';

    /**
     * Horizontal borders above footer components like the pagination and status bars
     */
    footerRowBorder: 'infer';

    /**
     * Default color for neutral UI elements. Most text, borders and backgrounds are defined as semi-transparent versions of this color, resulting in a blend between the background and foreground colours.
     */
    foregroundColor: 'infer';

    /**
     * Amount of spacing around and inside UI elements. All padding and margins in the grid are defined as a multiple of this value.
     */
    spacing: 'infer';

    /**
     * Background color for header and header-like.
     */
    headerBackgroundColor: 'infer';

    /**
     * Duration in seconds of the background color transition if headerCellHoverBackgroundColor or headerCellMovingBackgroundColor is set.
     */
    headerCellBackgroundTransitionDuration: 'infer';

    /**
     * Background color of a header cell when hovering over it, or `transparent` for no change.
     */
    headerCellHoverBackgroundColor: 'infer';

    /**
     * Background color of a header cell when dragging to reposition it, or `transparent` for no change.
     */
    headerCellMovingBackgroundColor: 'infer';

    /**
     * Vertical borders between columns within headers.
     */
    headerColumnBorder: 'infer';

    /**
     * Height of the vertical border between column headers. Percentage values are relative to the header height.
     */
    headerColumnBorderHeight: 'infer';

    /**
     * Color of the drag handle on resizable header columns. Set this to transparent to hide the resize handle.
     */
    headerColumnResizeHandleColor: 'infer';

    /**
     * Height of the drag handle on resizable header columns. Percentage values are relative to the header height.
     */
    headerColumnResizeHandleHeight: 'infer';

    /**
     * Width of the drag handle on resizable header columns.
     */
    headerColumnResizeHandleWidth: 'infer';

    /**
     * Font family of text in the header
     */
    headerFontFamily: 'infer';

    /**
     * Font family of text in grid cells
     */
    cellFontFamily: 'infer';

    /**
     * Size of text in the header
     */
    headerFontSize: 'infer';

    /**
     * Font weight of text in the header
     */
    headerFontWeight: 'infer';

    /**
     * Height of header rows. NOTE: by default this value is calculated to leave enough room for text, icons and padding. Most applications should leave it as is and use rowVerticalPaddingScale to change padding.
     */
    headerHeight: 'infer';

    /**
     * Borders between and below header rows.
     */
    headerRowBorder: 'infer';

    /**
     * Color of text in the header
     */
    headerTextColor: 'infer';

    /**
     * Multiply the header vertical padding by a number, e.g. 1.5 to increase by 50%
     */
    headerVerticalPaddingScale: 'infer';

    /**
     * Background color of clickable icons when hovered
     */
    iconButtonHoverBackgroundColor: 'infer';

    /**
     * Hover color for clickable icons
     */
    iconButtonHoverColor: 'infer';

    /**
     * The size of square icons and icon-buttons
     */
    iconSize: 'infer';

    /**
     * The color for inputs and UI controls in an invalid state.
     */
    invalidColor: 'infer';

    /**
     * Height of items in scrolling lists e.g. dropdown select inputs and column menu set filters.
     */
    listItemHeight: 'infer';

    /**
     * Background color for menus e.g. column menu and right-click context menu
     */
    menuBackgroundColor: 'infer';

    /**
     * Border around menus e.g. column menu and right-click context menu
     */
    menuBorder: 'infer';

    /**
     * Color of the dividing line between sections of menus e.g. column menu and right-click context menu
     */
    menuSeparatorColor: 'infer';

    /**
     * Shadow for menus e.g. column menu and right-click context menu
     */
    menuShadow: 'infer';

    /**
     * Text color for menus e.g. column menu and right-click context menu
     */
    menuTextColor: 'infer';

    /**
     * Background color of the overlay shown over the grid e.g. a data loading indicator.
     */
    modalOverlayBackgroundColor: 'infer';

    /**
     * Background color applied to every other row
     */
    oddRowBackgroundColor: 'infer';

    /**
     * Background color for panels and dialogs such as the integrated charts and the advanced filter builder.
     */
    panelBackgroundColor: 'infer';

    /**
     * Background color for the title bar of panels and dialogs such as the integrated charts and the advanced filter builder.
     */
    panelTitleBarBackgroundColor: 'infer';

    /**
     * Border below the title bar of panels and dialogs such as the integrated charts and the advanced filter builder.
     */
    panelTitleBarBorder: 'infer';

    /**
     * Vertical borders between columns that are pinned to the left or right and the rest of the grid
     */
    pinnedColumnBorder: 'infer';

    /**
     * Horizontal borders between the grid and rows that are pinned to the top or bottom and the rest of the grid
     */
    pinnedRowBorder: 'infer';

    /**
     * Default shadow for elements that float above the grid e.g. dialogs and menus
     */
    popupShadow: 'infer';

    /**
     * Background color of selected cell ranges. Choosing a semi-transparent color ensure that multiple overlapping ranges look correct.
     */
    rangeSelectionBackgroundColor: 'infer';

    /**
     * The color used for borders around range selections. The selection background defaults to a semi-transparent version of this color.
     */
    rangeSelectionBorderColor: 'infer';

    /**
     * Border style around range selections.
     */
    rangeSelectionBorderStyle: 'infer';

    /**
     * Background color for cells that provide data to the current range chart
     */
    rangeSelectionChartBackgroundColor: 'infer';

    /**
     * Background color for cells that provide categories to the current range chart
     */
    rangeSelectionChartCategoryBackgroundColor: 'infer';

    /**
     * Background color to briefly apply to a cell range when the user copies from or pastes into it.
     */
    rangeSelectionHighlightColor: 'infer';

    /**
     * Horizontal borders between rows.
     */
    rowBorder: 'infer';

    /**
     * The size of indentation applied to each level of row grouping - deep rows are indented by a multiple of this value.
     */
    rowGroupIndentSize: 'infer';

    /**
     * Height of grid rows. NOTE: by default this value is calculated to leave enough room for text, icons and padding. Most applications should leave it as is and use rowVerticalPaddingScale to change padding.
     */
    rowHeight: 'infer';

    /**
     * Background color when hovering over rows in the grid and in dropdown menus. Set to `transparent` to disable the hover effect. Note: if you want a hover effect on one but not the other, use CSS selectors instead of this property.
     */
    rowHoverColor: 'infer';

    /**
     * Color of the skeleton loading effect used when loading row data with the Server-side Row Model
     */
    rowLoadingSkeletonEffectColor: 'infer';

    /**
     * Multiply the row vertical padding by a number, e.g. 1.5 to increase by 50%. Has no effect if rowHeight is set.
     */
    rowVerticalPaddingScale: 'infer';

    /**
     * Background color for selected items within the multiple select widget
     */
    selectCellBackgroundColor: 'infer';

    /**
     * Border for selected items within the multiple select widget
     */
    selectCellBorder: 'infer';

    /**
     * Background color of selected rows in the grid and in dropdown menus.
     */
    selectedRowBackgroundColor: 'infer';

    /**
     * Amount of indentation for each level of child items in the Set Filter list when filtering tree data.
     */
    setFilterIndentSize: 'infer';

    /**
     * Background color for non-data areas of the grid. Headers, tool panels and menus use this color by default.
     */
    sideBarBackgroundColor: 'infer';

    /**
     * Default width of the sidebar that contains the columns and filters tool panels
     */
    sideBarPanelWidth: 'infer';

    /**
     * Borders between the grid and side panels including the column and filter tool bars, and chart settings
     */
    sidePanelBorder: 'infer';

    /**
     * Color of text and UI elements that should stand out less than the default.
     */
    subtleTextColor: 'infer';

    /**
     * Default color for all text
     */
    textColor: 'infer';

    /**
     * Width of the toggle button outer border
     */
    toggleButtonBorderWidth: 'infer';

    /**
     * Height of the whole toggle button component
     */
    toggleButtonHeight: 'infer';

    /**
     * Color of the toggle button background in its 'off' state
     */
    toggleButtonOffBackgroundColor: 'infer';

    /**
     * Color of the toggle button's outer border in its 'off' state
     */
    toggleButtonOffBorderColor: 'infer';

    /**
     * Color of the toggle button background in its 'on' state
     */
    toggleButtonOnBackgroundColor: 'infer';

    /**
     * Color of the toggle button outer border in its 'on' state
     */
    toggleButtonOnBorderColor: 'infer';

    /**
     * Background color of the toggle button switch (the bit that slides from left to right)
     */
    toggleButtonSwitchBackgroundColor: 'infer';

    /**
     * Border color of the toggle button switch (the bit that slides from left to right)
     */
    toggleButtonSwitchBorderColor: 'infer';

    /**
     * Width of the whole toggle button component
     */
    toggleButtonWidth: 'infer';

    /**
     * The dividing line between sections of menus e.g. column menu and right-click context menu
     */
    toolPanelSeparatorBorder: 'infer';

    /**
     * Background color for tooltips
     */
    tooltipBackgroundColor: 'infer';

    /**
     * Border for tooltips
     */
    tooltipBorder: 'infer';

    /**
     * Text color for tooltips
     */
    tooltipTextColor: 'infer';

    /**
     * Color to temporarily apply to cell data when its value decreases in an agAnimateShowChangeCellRenderer cell
     */
    valueChangeDeltaDownColor: 'infer';

    /**
     * Color to temporarily apply to cell data when its value increases in an agAnimateShowChangeCellRenderer cell
     */
    valueChangeDeltaUpColor: 'infer';

    /**
     * Background color to apply when a cell value changes and enableCellChangeFlash is enabled
     */
    valueChangeValueHighlightBackgroundColor: 'infer';

    /**
     * The horizontal padding of containers that contain stacked widgets, such as menus and tool panels
     */
    widgetContainerHorizontalPadding: 'infer';

    /**
     * The vertical padding of containers that contain stacked widgets, such as menus and tool panels
     */
    widgetContainerVerticalPadding: 'infer';

    /**
     * The spacing between widgets in containers arrange widgets horizontally
     */
    widgetHorizontalSpacing: 'infer';

    /**
     * The spacing between widgets in containers arrange widgets vertically
     */
    widgetVerticalSpacing: 'infer';

    /**
     * Borders around the outside of the grid
     */
    wrapperBorder: 'infer';

    /**
     * Corner radius of the outermost container around the grid.
     */
    wrapperBorderRadius: 'infer';
};

export type CoreParams = ExpandTypeKeys<WithParamTypes<CoreParamsDefinitions>>;

export const defaultLightColorSchemeParams = {
    backgroundColor: '#fff',
    foregroundColor: '#181d1f',
    borderColor: {
        ref: 'foregroundColor',
        mix: 0.15,
    },
    chromeBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.02,
        onto: 'backgroundColor',
    },
    browserColorScheme: 'light',
} as const;

export const coreDefaults: Readonly<CoreParams> = {
    ...defaultLightColorSchemeParams,
    textColor: {
        ref: 'foregroundColor',
    },
    accentColor: '#2196f3',
    invalidColor: '#e02525',
    wrapperBorder: true,
    rowBorder: true,
    headerRowBorder: {
        ref: 'rowBorder',
    },
    footerRowBorder: {
        ref: 'rowBorder',
    },
    columnBorder: {
        style: 'solid',
        width: 1,
        color: 'transparent',
    },
    headerColumnBorder: false,
    headerColumnBorderHeight: '100%',
    pinnedColumnBorder: true,
    pinnedRowBorder: true,
    sidePanelBorder: true,
    fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen-Sans',
        'Ubuntu',
        'Cantarell',
        'Helvetica Neue',
        'sans-serif',
    ],
    headerBackgroundColor: {
        ref: 'chromeBackgroundColor',
    },
    headerFontFamily: {
        ref: 'fontFamily',
    },
    cellFontFamily: {
        ref: 'fontFamily',
    },
    headerFontWeight: 500,
    headerFontSize: {
        ref: 'fontSize',
    },
    dataFontSize: {
        ref: 'fontSize',
    },
    headerTextColor: {
        ref: 'textColor',
    },
    headerCellHoverBackgroundColor: 'transparent',
    headerCellMovingBackgroundColor: { ref: 'backgroundColor' },
    headerCellBackgroundTransitionDuration: '0.2s',
    cellTextColor: {
        ref: 'textColor',
    },
    subtleTextColor: {
        ref: 'textColor',
        mix: 0.5,
    },
    rangeSelectionBorderStyle: 'solid',
    rangeSelectionBorderColor: {
        ref: 'accentColor',
    },
    rangeSelectionBackgroundColor: {
        ref: 'accentColor',
        mix: 0.2,
    },
    rangeSelectionChartBackgroundColor: '#0058FF1A',
    rangeSelectionChartCategoryBackgroundColor: '#00FF841A',
    rangeSelectionHighlightColor: {
        ref: 'accentColor',
        mix: 0.5,
    },
    rowHoverColor: {
        ref: 'accentColor',
        mix: 0.08,
    },
    columnHoverColor: {
        ref: 'accentColor',
        mix: 0.05,
    },
    selectedRowBackgroundColor: {
        ref: 'accentColor',
        mix: 0.12,
    },
    modalOverlayBackgroundColor: {
        ref: 'backgroundColor',
        mix: 0.66,
    },
    oddRowBackgroundColor: {
        ref: 'backgroundColor',
    },
    borderRadius: 4,
    wrapperBorderRadius: 8,
    cellHorizontalPadding: {
        calc: 'spacing * 2 * cellHorizontalPaddingScale',
    },
    cellWidgetSpacing: {
        calc: 'spacing * 1.5',
    },
    cellHorizontalPaddingScale: 1,
    rowGroupIndentSize: {
        calc: 'cellWidgetSpacing + iconSize',
    },
    valueChangeDeltaUpColor: '#43a047',
    valueChangeDeltaDownColor: '#e53935',
    valueChangeValueHighlightBackgroundColor: '#16a08580',
    spacing: 8,
    fontSize: 14,
    rowHeight: {
        calc: 'max(iconSize, dataFontSize) + spacing * 3.25 * rowVerticalPaddingScale',
    },
    rowVerticalPaddingScale: 1,
    headerHeight: {
        calc: 'max(iconSize, dataFontSize) + spacing * 4 * headerVerticalPaddingScale',
    },
    headerVerticalPaddingScale: 1,
    popupShadow: {
        radius: 16,
        color: '#00000026',
    },
    dropdownShadow: {
        radius: 4,
        spread: 1,
        offsetY: 1,
        color: '#babfc766',
    },
    dragAndDropImageBackgroundColor: {
        ref: 'backgroundColor',
    },
    dragAndDropImageBorder: true,
    dragAndDropImageShadow: {
        ref: 'popupShadow',
    },
    dragHandleColor: {
        ref: 'foregroundColor',
        mix: 0.7,
    },
    focusShadow: {
        spread: 3,
        color: { ref: 'accentColor', mix: 0.5 },
    },
    sideBarPanelWidth: 250,
    sideBarBackgroundColor: {
        ref: 'chromeBackgroundColor',
    },
    headerColumnResizeHandleHeight: '30%',
    headerColumnResizeHandleWidth: 2,
    headerColumnResizeHandleColor: {
        ref: 'borderColor',
    },
    widgetContainerHorizontalPadding: {
        calc: 'spacing * 1.5',
    },
    widgetContainerVerticalPadding: {
        calc: 'spacing * 1.5',
    },
    widgetHorizontalSpacing: {
        calc: 'spacing * 1.5',
    },
    widgetVerticalSpacing: {
        ref: 'spacing',
    },
    listItemHeight: {
        calc: 'iconSize + widgetVerticalSpacing',
    },
    iconSize: 16,
    toggleButtonWidth: 28,
    toggleButtonHeight: 18,
    toggleButtonBorderWidth: 2,
    toggleButtonOnBorderColor: {
        ref: 'accentColor',
    },
    toggleButtonOnBackgroundColor: {
        ref: 'accentColor',
    },
    toggleButtonOffBorderColor: {
        ref: 'foregroundColor',
        mix: 0.3,
        onto: 'backgroundColor',
    },
    toggleButtonOffBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.3,
        onto: 'backgroundColor',
    },
    toggleButtonSwitchBorderColor: {
        ref: 'toggleButtonOffBorderColor',
    },
    toggleButtonSwitchBackgroundColor: {
        ref: 'backgroundColor',
    },
    menuBorder: {
        color: {
            ref: 'foregroundColor',
            mix: 0.2,
        },
    },
    menuBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.03,
        onto: 'backgroundColor',
    },
    menuTextColor: {
        ref: 'foregroundColor',
        mix: 0.95,
        onto: 'backgroundColor',
    },
    menuShadow: {
        ref: 'popupShadow',
    },
    menuSeparatorColor: {
        ref: 'borderColor',
    },
    setFilterIndentSize: {
        ref: 'iconSize',
    },
    chartMenuPanelWidth: 260,
    chartMenuLabelColor: {
        ref: 'foregroundColor',
        mix: 0.8,
    },
    iconButtonHoverColor: {
        ref: 'foregroundColor',
        mix: 0.1,
    },
    dialogShadow: {
        ref: 'popupShadow',
    },
    cellEditingBorder: {
        color: { ref: 'accentColor' },
    },
    cellEditingShadow: {
        radius: 4,
        spread: 1,
        offsetY: 1,
        color: '#babfc766',
    },
    dialogBorder: {
        color: {
            ref: 'foregroundColor',
            mix: 0.2,
        },
    },
    panelBackgroundColor: {
        ref: 'backgroundColor',
    },
    panelTitleBarBackgroundColor: {
        ref: 'headerBackgroundColor',
    },
    panelTitleBarBorder: true,
    columnSelectIndentSize: {
        ref: 'iconSize',
    },
    toolPanelSeparatorBorder: true,
    tooltipBackgroundColor: {
        ref: 'chromeBackgroundColor',
    },
    tooltipTextColor: {
        ref: 'textColor',
    },
    tooltipBorder: true,

    columnDropCellBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.07,
    },
    columnDropCellBorder: {
        color: {
            ref: 'foregroundColor',
            mix: 0.13,
        },
    },
    selectCellBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.07,
    },
    selectCellBorder: {
        color: {
            ref: 'foregroundColor',
            mix: 0.13,
        },
    },
    advancedFilterBuilderButtonBarBorder: true,
    advancedFilterBuilderIndentSize: {
        calc: 'spacing * 2 + iconSize',
    },
    advancedFilterBuilderJoinPillColor: '#f08e8d',
    advancedFilterBuilderColumnPillColor: '#a6e194',
    advancedFilterBuilderOptionPillColor: '#f3c08b',
    advancedFilterBuilderValuePillColor: '#85c0e4',
    filterToolPanelGroupIndent: {
        ref: 'spacing',
    },
    iconButtonHoverBackgroundColor: {
        ref: 'foregroundColor',
        mix: 0.1,
    },
    rowLoadingSkeletonEffectColor: 'rgba(66, 66, 66, 0.2)',
};
