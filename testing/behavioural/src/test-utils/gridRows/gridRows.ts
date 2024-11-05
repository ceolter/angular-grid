import util from 'util';
import { expect } from 'vitest';

import type { Column, GridApi, IRowNode } from 'ag-grid-community';
import type { RowNode } from 'ag-grid-community';

import { TestGridsManager } from '../testGridsManager';
import { log, unindentText } from '../utils';
import { GridRowsDiagramTree } from './gridRowsDiagramTree';
import { GridRowsErrors } from './gridRowsErrors';
import { GridRowsDomValidator } from './validation/gridRowsDomValidator';
import { GridRowsValidator } from './validation/gridRowsValidator';

export interface GridRowsOptions<TData = any> {
    /** If true, selected nodes will be tested. Default is true */
    checkSelectedNodes?: boolean;

    /** If true, the DOM will be checked as well. Default is true. */
    checkDom?: boolean;

    /**
     * Columns to include when making the diagram. If true, all columns will be included.
     * If an array, it must contain the id of the columns to include. Default is false, no columns.
     */
    columns?: (string | Column)[] | boolean;

    /** If false, the id will not be shown in the diagram. Default is true */
    printIds?: boolean;

    /** If true, the diagram will show hidden rows, like the children of collapsed groups, also if they do not appear in the displayed rows. Default is true */
    printHiddenRows?: boolean;

    errors?: GridRowsErrors<TData>;

    /** Forces treeData to be checked as true or false */
    treeData?: boolean;
}

export class GridRows<TData = any> {
    public readonly treeData: boolean;
    public readonly rowNodes: RowNode<TData>[];
    public readonly displayedRows: RowNode<TData>[];
    public readonly rootRowNodes: RowNode<TData>[];
    public readonly rootRowNode: RowNode<TData> | null;
    public readonly rootAllLeafChildren: RowNode<TData>[];
    public readonly errors: GridRowsErrors<TData>;

    #gridHtmlElement: HTMLElement | null | undefined = undefined;
    #byIdMap: Map<string, RowNode<TData>> | null = null;
    #indexMap: Map<IRowNode<TData>, number> | null = null;
    #displayedRowsSet: Set<RowNode<TData>> | null = null;
    #rowsHtmlElements: HTMLElement[] | null = null;
    #rowsHtmlElementsMap: Map<string, HTMLElement> | null = null;
    readonly #detailGridRows: Map<IRowNode<TData> | GridApi, GridRows<any>>;

    public constructor(
        public readonly api: GridApi<TData>,
        public readonly label: string = '',
        public readonly options: GridRowsOptions<TData> = {}
    ) {
        const errors = options.errors || new GridRowsErrors<TData>();
        this.errors = errors;
        this.treeData = options.treeData ?? !!api.getGridOption('treeData');
        const rowNodes: RowNode<TData>[] = [];
        const displayedRows: RowNode<TData>[] = [];
        const rootNodesSet = new Set<RowNode<TData>>();
        const detailGridRows = new Map<IRowNode<TData> | GridApi, GridRows<any>>();
        this.#detailGridRows = detailGridRows;
        api.forEachNode((row: RowNode) => {
            rowNodes.push(row);
            const parent = row.parent;
            if (parent && !parent.parent) {
                rootNodesSet.add(parent);
            }
        });
        this.rowNodes = rowNodes;
        this.displayedRows = displayedRows;
        for (let i = 0, len = api.getDisplayedRowCount(); i < len; ++i) {
            const row = api.getDisplayedRowAtIndex(i) as RowNode<TData> | undefined;
            if (row) {
                displayedRows.push(row);
                if (row.detail) {
                    const api = row.detailGridInfo?.api;
                    if (api && !detailGridRows.has(api)) {
                        const detailGridRow = new GridRows(api, label, {
                            ...options,
                            errors,
                            columns: !!options.columns,
                        });
                        detailGridRows.set(row, detailGridRow);
                        detailGridRows.set(api, detailGridRow);
                    }
                }

                const parent = row.parent;
                if (parent && !parent.parent) {
                    rootNodesSet.add(parent);
                }
            }
        }
        this.rootRowNodes = Array.from(rootNodesSet);
        this.rootRowNode = this.rootRowNodes[0] ?? null;
        this.rootAllLeafChildren = this.rootRowNode?.allLeafChildren ?? [];
    }

    public getDetailGridRows(row: IRowNode<TData> | GridApi | null | undefined): GridRows<any> | undefined {
        return row ? this.#detailGridRows.get(row) : undefined;
    }

    public get gridHtmlElement(): HTMLElement | null {
        let element = this.#gridHtmlElement;
        if (element === undefined) {
            element = TestGridsManager.getHTMLElement(this.api);
            if (!element) {
                // hack: we are accessing the beans here to obtain the html element
                element = ((this.rootRowNode ?? this.rowNodes[0]) as any)?.beans?.eGridDiv ?? null;
                if (element) {
                    TestGridsManager.registerHTMLElement(this.api, element);
                }
            }
            this.#gridHtmlElement = element;
        }
        return element ?? null;
    }

    public get rowsHtmlElements(): HTMLElement[] {
        return (this.#rowsHtmlElements ??= Array.from(this.gridHtmlElement?.querySelectorAll('[row-id]') ?? []));
    }

    public getAllRowNodesData(): (TData | undefined)[] {
        return this.rowNodes.map((node) => node.data);
    }

    public getAllDisplayedRowsData(): (TData | undefined)[] {
        return this.displayedRows.map((node) => node.data);
    }

    public getById(id: string | null | undefined): RowNode<TData> | undefined {
        return (this.#byIdMap ??= this.#makeByIdMap()).get(String(id));
    }

    public getIndexInRowNodes(row: IRowNode<TData> | null | undefined): number {
        return row ? (this.#indexMap ??= this.#makeIndexMap()).get(row) ?? -1 : -1;
    }

    public isDuplicateIdRow(row: IRowNode<TData> | null | undefined): boolean {
        if (!row || !('id' in row)) return false;
        const found = this.getById(String(row.id));
        return !found || found !== row;
    }

    public isInRowNodes(row: IRowNode<TData> | null | undefined): boolean {
        return (this.#indexMap ??= this.#makeIndexMap()).has(row as RowNode<TData>);
    }

    public isRowDisplayed(row: IRowNode<TData> | null | undefined): boolean {
        return (this.#displayedRowsSet ??= new Set(this.displayedRows)).has(row as RowNode<TData>);
    }

    public getRowHtmlElement(id: string | { readonly id: string | null } | null | undefined): HTMLElement | null {
        if (typeof id === 'object') {
            id = id?.id ?? null;
            if (id === null) {
                return null;
            }
        }
        id = String(id);
        let map = this.#rowsHtmlElementsMap;
        if (!map) {
            map = new Map<string, HTMLElement>();
            for (const rowElement of this.rowsHtmlElements) {
                const rowId = rowElement.getAttribute('row-id');
                if (rowId !== null) {
                    map.set(rowId, rowElement);
                }
            }
            this.#rowsHtmlElementsMap = map;
        }
        return map.get(id) ?? null;
    }

    public loadErrors(): this {
        if (!this.errors.validated) {
            this.errors.validated = true;
            new GridRowsValidator(this.errors).validate(this);

            if (this.options.checkDom ?? true) {
                new GridRowsDomValidator(this.errors).validate(this);
            }
        }
        return this;
    }

    public makeDiagram(printErrors = false): string {
        let columns: Column[] | null = null;
        if (this.options.columns) {
            columns = this.api.getAllGridColumns();
            if (Array.isArray(this.options.columns)) {
                const set = new Set(this.options.columns);
                columns = columns.filter((column) => set.has(column) || set.has(column.getColId()));
            }
        }
        if (printErrors) {
            this.loadErrors();
        }
        return new GridRowsDiagramTree(this).diagramToString(printErrors, columns);
    }

    [util.inspect.custom](): string {
        return this.makeDiagram(true);
    }

    public printDiagram(): this {
        log(this.makeDiagram(true));
        return this;
    }

    public async check(diagramSnapshot?: string | string[] | 'empty' | true): Promise<this> {
        this.loadErrors();
        if (this.errors.totalErrorsCount > 0) {
            throw this.#makeError(this.check);
        }
        if (diagramSnapshot === true) {
            this.printDiagram();
        } else if (diagramSnapshot !== undefined) {
            const diagram = this.makeDiagram(false);
            try {
                if (diagramSnapshot === 'empty') {
                    expect(this.displayedRows.length).toBe(0);
                } else {
                    expect(unindentText(diagram)).toEqual(unindentText(diagramSnapshot));
                }
            } catch (e: any) {
                addDiagramToError(e, diagram, this.label);
                Error.captureStackTrace(e, this.check);
                throw e;
            }
        }
        return this;
    }

    #makeByIdMap(): Map<string, RowNode<TData>> {
        const map = new Map<string, RowNode<TData>>();
        const addRow = (row: RowNode<TData> | null | undefined) => {
            if (row && 'id' in row) {
                const id = String(row.id);
                if (!map.has(id)) {
                    map.set(id, row);
                }
                if (row.detailNode) {
                    addRow(row.detailNode);
                }
            }
        };
        this.rowNodes.forEach(addRow);
        this.displayedRows.forEach(addRow);
        return map;
    }

    #makeIndexMap(): Map<IRowNode<TData>, number> {
        const map = new Map<IRowNode<TData>, number>();
        const rowNodes = this.rowNodes;
        for (let index = 0; index < rowNodes.length; ++index) {
            map.set(rowNodes[index], index);
        }
        return map;
    }

    #makeError(callerFn: Function, message = 'Grid errors:'): Error {
        let diagram: string | undefined;
        try {
            diagram = this.makeDiagram(true);
        } catch (error) {
            this.errors.default.add('Error making diagram: ' + error.message);
            this.errors.throwIfAny(callerFn);
            return error;
        }
        const error = new Error(message);
        addDiagramToError(error, diagram, this.label);
        Error.captureStackTrace(error, callerFn);
        return error;
    }
}

/** This is used to add the diagram to print to a vitest assertion error. */
function addDiagramToError(error: any, diagram: string | null | undefined, label: string | null | undefined): void {
    if (typeof error !== 'object' || error === null) {
        return;
    }
    if (diagram) {
        diagram = '\n\n' + diagram;
    }
    let diagramText = '';
    if (label) {
        diagramText += '\n⬢ ' + label;
    }
    diagramText += diagram;

    error.message = (error.message ?? '') + diagramText;

    if (typeof error.toJSON === 'function') {
        const oldToJSON = error.toJSON;

        Reflect.defineProperty(error, 'toJSON', {
            value: function (this: any, ...args: any[]) {
                const json = oldToJSON.call(this, ...args);
                if (typeof json !== 'object' || json === null) {
                    return json;
                }
                if (typeof json.diff === 'string') {
                    json.diff = json.diff + diagramText;
                }
                return json;
            },
            configurable: true,
            writable: true,
            enumerable: false,
        });
    }
}
