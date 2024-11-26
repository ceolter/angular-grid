import type { GetElement } from '.';
import {
    AG_CHARTS_CANVAS,
    AG_CHARTS_LEGEND_BUTTONS_SELECTOR,
    AG_CHART_MENU_TOOLBAR_BUTTON_SELECTOR,
    AG_CHART_SERIES_GROUP_TITLE_SELECTOR,
    AG_CHART_THEMES_CONTAINER_SELECTOR,
    AG_CHART_THEME_SELECTOR,
    AG_CHART_TOOL_PANEL_CLOSE_BUTTON_SELECTOR,
    AG_CHART_TOOL_PANEL_TAB_SELECTOR,
    AG_COLUMN_DROP_SELECTOR,
    AG_GROUP_CONTRACTED,
    AG_GROUP_EXPANDED,
    AG_GROUP_ITEM_SELECTOR,
    AG_GROUP_SELECTOR,
    AG_GROUP_TITLE_BAR_SELECTOR,
    AG_HEADER_CELL_SELECTOR,
    AG_HEADER_CELL_TEXT_SELECTOR,
    AG_LABEL_SELECTOR,
    AG_MENU_OPTION_TEXT_SELECTOR,
    AG_PICKER_FIELD_DISPLAY_SELECTOR,
    AG_PICKER_FIELD_SELECTOR,
    AG_PICKER_FIELD_WRAPPER_SELECTOR,
    AG_POPUP_SELECTOR,
    AG_RANGE_FIELD_INPUT_SELECTOR,
    AG_SELECT_LIST_ITEM_SELECTOR,
    AG_SLIDER_SELECTOR,
    AG_TEXT_FIELD,
    AG_TEXT_FIELD_INPUT,
    AG_TOGGLE_LABEL_SELECTOR,
} from '../constants';
import { findElementWithInnerText } from '../dom';

interface BaseConfig {
    /**
     * Requires sending a mouse down and mouse up event to trigger a click
     *
     * Otherwise a normal DOM click event is sent
     */
    useMouseDown?: boolean;
}

export interface AgElementBySelectorConfig extends BaseConfig {
    selector: string;
}

export interface AgElementByInnerTextConfig extends BaseConfig {
    innerTextSelector: string;
}

export interface AgElementByFindConfig<Params> extends BaseConfig {
    find: ({
        getElement,
        containerEl,
        params,
    }: {
        getElement: GetElement;
        containerEl: HTMLElement;
        params: Params;
    }) => HTMLElement | undefined;
}

export type AgElementsConfig = AgElementBySelectorConfig | AgElementByInnerTextConfig | AgElementByFindConfig<any>;

export interface AgElementsConfigItem {
    popup: AgElementBySelectorConfig;
    columnDropArea: AgElementBySelectorConfig;
    chartMenuToolbarButton: AgElementBySelectorConfig;
    chartMenuToolPanelCloseButton: AgElementBySelectorConfig;
    chartsCanvas: AgElementBySelectorConfig;
    chartThemesContainer: AgElementBySelectorConfig;

    contextMenuItem: AgElementByInnerTextConfig;
    chartToolPanelTab: AgElementByInnerTextConfig;
    chartToolPanelGroupTitle: AgElementByInnerTextConfig;
    chartToolPanelGroupItem: AgElementByInnerTextConfig;
    chartToolSeriesGroupTitle: AgElementByInnerTextConfig;
    chartToolPanelSelectListItem: AgElementByInnerTextConfig;

    cell: AgElementByFindConfig<{ colIndex: number; rowIndex: number }>;
    groupCellToggle: AgElementByFindConfig<{ colIndex: number; rowIndex: number }>;
    headerCell: AgElementByFindConfig<{ text: string }>;
    chartToolPanelGroupItemInput: AgElementByFindConfig<{
        groupTitle: string;
        itemTitle: string;
    }>;
    chartSeriesButton: AgElementByFindConfig<{
        groupTitle: string;
        seriesTitle: string;
    }>;
    chartToolPanelPickerField: AgElementByFindConfig<{
        groupTitle: string;
        selectLabel: string;
        usePickerDisplayFieldSelector?: boolean;
        index?: number;
    }>;
    chartToolPanelToggle: AgElementByFindConfig<{
        groupTitle: string;
        toggleLabel: string;
        index?: number;
    }>;
    chartToolPanelSliderInput: AgElementByFindConfig<{
        groupTitle: string;
        sliderLabel: string;
    }>;
    chartToolPanelTextInput: AgElementByFindConfig<{
        groupTitle: string;
        inputLabel: string;
        index?: number;
    }>;
    chartThemeItem: AgElementByFindConfig<{
        index: number;
    }>;
    chartsLegendItem: AgElementByFindConfig<{
        index: number;
    }>;
}
export type AgElementName = keyof AgElementsConfigItem;

/**
 * Configuration object for how to get AG DOM elements
 */
export const agElementsConfig: AgElementsConfigItem = {
    // Find by selector
    popup: {
        selector: AG_POPUP_SELECTOR,
    },
    columnDropArea: {
        selector: AG_COLUMN_DROP_SELECTOR,
    },
    chartMenuToolbarButton: {
        selector: AG_CHART_MENU_TOOLBAR_BUTTON_SELECTOR,
    },
    chartMenuToolPanelCloseButton: {
        selector: AG_CHART_TOOL_PANEL_CLOSE_BUTTON_SELECTOR,
    },
    chartsCanvas: {
        selector: AG_CHARTS_CANVAS,
    },
    chartThemesContainer: {
        selector: AG_CHART_THEMES_CONTAINER_SELECTOR,
    },

    // Find by inner text
    contextMenuItem: {
        innerTextSelector: AG_MENU_OPTION_TEXT_SELECTOR,
    },
    chartToolPanelTab: {
        innerTextSelector: AG_CHART_TOOL_PANEL_TAB_SELECTOR,
    },
    chartToolPanelGroupTitle: {
        innerTextSelector: AG_GROUP_TITLE_BAR_SELECTOR,
    },
    chartToolPanelGroupItem: {
        innerTextSelector: AG_GROUP_ITEM_SELECTOR,
    },
    chartToolSeriesGroupTitle: {
        innerTextSelector: AG_CHART_SERIES_GROUP_TITLE_SELECTOR,
    },
    chartToolPanelSelectListItem: {
        innerTextSelector: AG_SELECT_LIST_ITEM_SELECTOR,
        useMouseDown: true,
    },

    // Find by custom function
    cell: {
        find: ({ containerEl, params }) => {
            const { colIndex, rowIndex } = params;
            const rowEl = containerEl.querySelector(`div[row-index="${rowIndex}"]`);
            if (!rowEl) {
                return;
            }

            const cellEl = rowEl.children[colIndex] as HTMLElement;
            if (!cellEl) {
                return;
            }

            return cellEl;
        },
    },
    groupCellToggle: {
        find: ({ getElement, params }) => {
            const { colIndex, rowIndex } = params;
            const cellEl = getElement('cell', { colIndex, rowIndex })?.get();
            if (!cellEl) {
                return;
            }
            const contractedEl = cellEl.querySelector(`${AG_GROUP_CONTRACTED}:not(.ag-hidden)`);
            const expandedEl = cellEl.querySelector(`${AG_GROUP_EXPANDED}:not(.ag-hidden)`);
            const toggleEl = (contractedEl || expandedEl) as HTMLElement;

            return toggleEl;
        },
    },
    headerCell: {
        find: ({ containerEl, params }) => {
            const { text } = params;
            // Get inner text label element
            const headerTextElem = findElementWithInnerText({
                containerEl,
                selector: AG_HEADER_CELL_TEXT_SELECTOR,
                text,
            });

            // Get parent header cell element
            const parentHeader = headerTextElem?.closest(AG_HEADER_CELL_SELECTOR) as HTMLElement;
            return parentHeader;
        },
    },
    chartToolPanelGroupItemInput: {
        find: ({ getElement, params }) => {
            const { groupTitle, itemTitle } = params;
            const groupTitleEl = getElement('chartToolPanelGroupTitle', {
                text: groupTitle,
            })?.get();

            const groupEl = groupTitleEl?.closest(AG_GROUP_SELECTOR);
            if (!groupEl) {
                console.error(`No group title found: ${groupTitle}`);
                return;
            }

            const groupItemEl = getElement('chartToolPanelGroupItem', {
                containerEl: groupEl as HTMLElement,
                text: itemTitle,
            })?.get();

            return groupItemEl?.querySelector('input') || undefined;
        },
    },
    chartSeriesButton: {
        find: ({ getElement, params }) => {
            const { groupTitle, seriesTitle } = params;
            const groupTitleEl = getElement('chartToolSeriesGroupTitle', {
                text: groupTitle,
            })?.get();
            const groupEl = groupTitleEl?.closest(AG_GROUP_SELECTOR);
            if (!groupEl) {
                console.error(`No group title found: ${groupTitle}`);
                return;
            }

            const seriesImage = groupEl.querySelector(`canvas[title="${seriesTitle}"]`);
            return seriesImage?.parentElement || undefined;
        },
    },
    chartToolPanelPickerField: {
        // Picker element requires mousedown
        useMouseDown: true,
        find: ({ getElement, params }) => {
            const { groupTitle, selectLabel, usePickerDisplayFieldSelector, index } = params;
            const groupTitleEl = getElement('chartToolPanelGroupTitle', {
                text: groupTitle,
            })?.get();
            const groupEl = groupTitleEl?.closest(AG_GROUP_SELECTOR) as HTMLElement;
            if (!groupEl) {
                console.error(`No group title found: ${groupTitle}`);
                return;
            }

            const labelEl = findElementWithInnerText({
                containerEl: groupEl,
                selector: usePickerDisplayFieldSelector ? AG_PICKER_FIELD_DISPLAY_SELECTOR : AG_LABEL_SELECTOR,
                text: selectLabel,
                index,
            });
            if (!labelEl) {
                console.error(`No label title found: ${selectLabel}`);
                return;
            }
            const pickerFieldContainer = labelEl.closest(AG_PICKER_FIELD_SELECTOR);
            if (!pickerFieldContainer) {
                console.error(`No picker field container found: ${selectLabel}`);
                return;
            }

            const picker = pickerFieldContainer.querySelector(AG_PICKER_FIELD_WRAPPER_SELECTOR) as HTMLElement;

            return picker || undefined;
        },
    },
    chartToolPanelToggle: {
        find: ({ getElement, params }) => {
            const { groupTitle, toggleLabel, index } = params;
            const groupTitleEl = getElement('chartToolPanelGroupTitle', {
                text: groupTitle,
            })?.get();
            const groupEl = groupTitleEl?.closest(AG_GROUP_SELECTOR) as HTMLElement;
            if (!groupEl) {
                console.error(`No group title found: ${groupTitle}`);
                return;
            }

            const toggleLabelEl = findElementWithInnerText({
                containerEl: groupEl,
                selector: AG_TOGGLE_LABEL_SELECTOR,
                text: toggleLabel,
                index,
            });
            if (!toggleLabelEl) {
                console.error(`No label title found: ${toggleLabel}`);
                return;
            }
            const { id } = toggleLabelEl;
            const checkbox = document.querySelector(`[aria-labelledby=${id}]`) as HTMLElement;

            return checkbox || undefined;
        },
    },
    chartToolPanelSliderInput: {
        find: ({ getElement, params }) => {
            const { groupTitle, sliderLabel } = params;
            const groupTitleEl = getElement('chartToolPanelGroupTitle', {
                text: groupTitle,
            })?.get();
            const groupEl = groupTitleEl?.closest(AG_GROUP_SELECTOR) as HTMLElement;
            if (!groupEl) {
                console.error(`No group title found: ${groupTitle}`);
                return;
            }

            const labelEl = findElementWithInnerText({
                containerEl: groupEl,
                selector: AG_LABEL_SELECTOR,
                text: sliderLabel,
            });
            if (!labelEl) {
                console.error(`No label title found: ${sliderLabel}`);
                return;
            }

            const sliderContainer = labelEl.closest(AG_SLIDER_SELECTOR);
            if (!sliderContainer) {
                console.error(`No slider found: ${sliderLabel}`);
                return;
            }

            return (sliderContainer.querySelector(AG_RANGE_FIELD_INPUT_SELECTOR) as HTMLElement) || undefined;
        },
    },
    chartToolPanelTextInput: {
        find: ({ getElement, params }) => {
            const { groupTitle, inputLabel, index } = params;
            const groupTitleEl = getElement('chartToolPanelGroupTitle', {
                text: groupTitle,
            })?.get();

            const groupEl = groupTitleEl?.closest(AG_GROUP_SELECTOR) as HTMLElement;
            if (!groupEl) {
                console.error(`No group title found: ${groupTitle}`);
                return;
            }

            const labelEl = findElementWithInnerText({
                containerEl: groupEl,
                selector: AG_LABEL_SELECTOR,
                text: inputLabel,
                index,
            });
            if (!labelEl) {
                console.error(`No label title found: ${groupTitle} > ${inputLabel}`);
                return;
            }

            return labelEl.closest(AG_TEXT_FIELD)?.querySelector(AG_TEXT_FIELD_INPUT) || undefined;
        },
    },
    chartThemeItem: {
        find: ({ getElement, params }) => {
            const { index } = params;

            const chartThemesContainerEl = getElement('chartThemesContainer')?.get();
            if (!chartThemesContainerEl) {
                console.error(`No chart themes container found`);
                return;
            }

            const chartThemes = chartThemesContainerEl.querySelectorAll(AG_CHART_THEME_SELECTOR);
            const chartTheme = chartThemes[index] as HTMLElement;
            if (!chartTheme) {
                console.error(`Chart theme with index ${index} not found`);
                return;
            }

            return chartTheme;
        },
    },
    chartsLegendItem: {
        find: ({ params }) => {
            const { index } = params;
            return (
                (document.querySelectorAll(`${AG_CHARTS_LEGEND_BUTTONS_SELECTOR}`)[index] as HTMLElement) || undefined
            );
        },
    },
};
