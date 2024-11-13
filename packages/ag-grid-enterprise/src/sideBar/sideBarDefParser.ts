import type { SideBarDef, ToolPanelDef } from 'ag-grid-community';
import { _warn } from 'ag-grid-community';

const DEFAULT_COLUMN_COMP: ToolPanelDef = {
    id: 'columns',
    labelDefault: 'Columns',
    labelKey: 'columns',
    iconKey: 'columnsToolPanel',
    toolPanel: 'agColumnsToolPanel',
};

const DEFAULT_FILTER_COMP: ToolPanelDef = {
    id: 'filters',
    labelDefault: 'Filters',
    labelKey: 'filters',
    iconKey: 'filtersToolPanel',
    toolPanel: 'agFiltersToolPanel',
};

const DEFAULT_BY_KEY: { [p: string]: ToolPanelDef } = {
    columns: DEFAULT_COLUMN_COMP,
    filters: DEFAULT_FILTER_COMP,
};

export function parseSideBarDef(
    toParse: SideBarDef | string | string[] | boolean | null | undefined
): SideBarDef | undefined {
    if (!toParse) {
        return undefined;
    }
    if (toParse === true) {
        return {
            toolPanels: [DEFAULT_COLUMN_COMP, DEFAULT_FILTER_COMP],
            defaultToolPanel: 'columns',
        };
    }

    if (typeof toParse === 'string') {
        return parseSideBarDef([toParse]);
    }

    if (Array.isArray(toParse)) {
        const comps: ToolPanelDef[] = [];
        toParse.forEach((key) => {
            const lookupResult = DEFAULT_BY_KEY[key];
            if (!lookupResult) {
                _warn(215, { key, defaultByKey: DEFAULT_BY_KEY });
                return;
            }

            comps.push(lookupResult);
        });

        if (comps.length === 0) {
            return undefined;
        }

        return {
            toolPanels: comps,
            defaultToolPanel: comps[0].id,
        };
    }

    const result: SideBarDef = {
        toolPanels: parseComponents(toParse.toolPanels),
        defaultToolPanel: toParse.defaultToolPanel,
        hiddenByDefault: toParse.hiddenByDefault,
        position: toParse.position,
    };

    return result;
}

function parseComponents(from?: (ToolPanelDef | string)[]): ToolPanelDef[] {
    const result: ToolPanelDef[] = [];

    if (!from) {
        return result;
    }

    from.forEach((it: ToolPanelDef | string) => {
        let toAdd: ToolPanelDef | null = null;
        if (typeof it === 'string') {
            const lookupResult = DEFAULT_BY_KEY[it];
            if (!lookupResult) {
                _warn(215, { key: it, defaultByKey: DEFAULT_BY_KEY });
                return;
            }

            toAdd = lookupResult;
        } else {
            toAdd = it;
        }

        result.push(toAdd);
    });

    return result;
}
