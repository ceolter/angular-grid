import type { Column, IRowNode, RowNode } from 'ag-grid-community';

import { optionalEscapeString, rowIdAndIndexToString, rowIdToString } from '../grid-test-utils';
import type { GridRows } from './gridRows';

export class GridRowsDiagramNode {
    public parent: GridRowsDiagramNode | null = null;
    public children = new Map<RowNode | null, GridRowsDiagramNode>();
    public hiddenChildren: Set<GridRowsDiagramNode> | null = null;
    public prefix: string = '';

    public constructor(
        public readonly gridRows: GridRows,
        public readonly row: RowNode | null
    ) {}
}

export class GridRowsDiagramTree {
    public readonly diagramRoots = new Map<GridRows, GridRowsDiagramNode>();
    public readonly diagramNodes = new Map<RowNode, GridRowsDiagramNode>();
    #processedHiddenRows = new Set<RowNode>();

    public constructor(public readonly gridRows: GridRows) {
        const diagramRoot = this.getDiagramRoot(gridRows)!;
        this.#updateDiagramTree(diagramRoot, '', new Set());
    }

    private processHiddenRows(gridRows: GridRows, row: RowNode) {
        if (this.#processedHiddenRows.has(row)) {
            return;
        }
        this.#processedHiddenRows.add(row);
        const node = this.getDiagramNode(gridRows, row);
        if (!node) {
            return;
        }
        const children =
            row.childrenAfterSort ?? row.childrenAfterAggFilter ?? row.childrenAfterFilter ?? row.childrenAfterGroup;
        if (!children) {
            return;
        }
        node.hiddenChildren ??= new Set();
        for (const child of children) {
            if (typeof child !== 'object' || child === null || this.diagramNodes.has(child)) {
                continue;
            }
            const diagramChild = this.getDiagramNode(gridRows, child);
            if (diagramChild) {
                node.hiddenChildren.add(diagramChild);
                this.processHiddenRows(gridRows, child);
            }
        }
    }

    public getNodeType(gridRows: GridRows, row: IRowNode): string {
        if (row.level === -1 && row === gridRows.rootRowNode) {
            return 'ROOT';
        }
        if (row.footer) {
            return 'footer';
        }
        if (!row.data) {
            return 'filler';
        }
        if (row.detail) {
            return 'detail';
        }
        if (row.master) {
            return 'master';
        }
        if (row.childrenAfterGroup?.length) {
            return 'GROUP';
        }
        return 'LEAF';
    }

    public getDiagramRoot(gridRows: GridRows): GridRowsDiagramNode {
        let diagramRoot = this.diagramRoots.get(gridRows);
        if (!diagramRoot) {
            const rootRowNode = gridRows.rootRowNode;
            diagramRoot = new GridRowsDiagramNode(gridRows, gridRows.rootRowNode);
            this.diagramRoots.set(gridRows, diagramRoot);
            if (rootRowNode) {
                this.diagramNodes.set(rootRowNode, diagramRoot);
            }
            const displayedRows = gridRows.displayedRows;
            for (const row of displayedRows) {
                this.getDiagramNode(gridRows, row);
            }

            if (gridRows.options.printHiddenRows ?? true) {
                for (const row of displayedRows) {
                    this.processHiddenRows(gridRows, row);
                }
            }
        }
        return diagramRoot;
    }

    public getDiagramNode = (gridRows: GridRows, row: RowNode | null): GridRowsDiagramNode | null => {
        if (typeof row !== 'object') {
            return null;
        }
        let diagramNode = row ? this.diagramNodes.get(row) : this.getDiagramRoot(gridRows);
        if (!diagramNode) {
            diagramNode = new GridRowsDiagramNode(gridRows, row);
            if (row) {
                this.diagramNodes.set(row, diagramNode);
                let parent: RowNode | null | undefined;
                if (row.footer && typeof row.id === 'string' && row.id?.startsWith('rowGroupFooter_')) {
                    parent = gridRows.getById(row.id!.slice('rowGroupFooter_'.length));
                }
                if (!parent) {
                    parent = row.parent ?? null;
                }
                const parentNode = this.getDiagramNode(gridRows, parent);
                if (parentNode && !diagramNode.parent) {
                    diagramNode.parent = parentNode;
                    parentNode.children.set(row, diagramNode);
                }
                const detailGridRows = gridRows.getDetailGridRows(row);
                if (detailGridRows) {
                    const detailRoot = this.getDiagramRoot(detailGridRows);
                    if (detailRoot) {
                        detailRoot.parent = diagramNode;
                        diagramNode.children.set(null, detailRoot);
                    }

                    for (const displayedRow of detailGridRows.displayedRows) {
                        const detailChild = this.getDiagramNode(detailGridRows, displayedRow);
                        if (detailChild) {
                            detailChild.parent = detailRoot;
                            detailRoot.children.set(displayedRow, detailChild);
                        }
                    }
                }
            }
        }
        return diagramNode;
    };

    public diagramToString(printErrors: boolean, inputColumns: Column[] | null): string {
        const processedRows = new Set<RowNode>();
        const rootRowNode = this.gridRows.rootRowNode;
        let result =
            (rootRowNode ? this.#rowDiagram(this.gridRows, rootRowNode, inputColumns) : '[no root row]') + '\n';

        const processRow = (gridRows: GridRows, row: RowNode, columns: Column[] | null) => {
            if (processedRows.has(row)) {
                result += '[duplicate row ' + rowIdAndIndexToString(row) + ']\n';
                return;
            }
            processedRows.add(row);
            if (typeof row !== 'object' || !row) {
                result += '[' + row + ']\n';
                return;
            }

            const diagramNode = this.getDiagramNode(gridRows, row);
            const prefix = diagramNode?.prefix ?? '';

            result += prefix + this.#rowDiagram(gridRows, row, columns);
            result += '\n';

            if (printErrors) {
                const rowErrors = gridRows.errors.get(row);
                if (rowErrors.errors.size > 0) {
                    result += rowErrors.toString(' '.repeat(prefix.length + 1));
                }
            }

            if (diagramNode?.hiddenChildren) {
                for (const child of diagramNode.hiddenChildren) {
                    processRow(gridRows, child.row!, columns);
                }
            }

            const detailGridRows = gridRows.getDetailGridRows(row);
            if (detailGridRows) {
                const detailColumns = detailGridRows.api.getAllGridColumns();
                const detailRoot = this.getDiagramRoot(detailGridRows);
                if (detailRoot.row) {
                    processRow(detailGridRows, detailRoot.row, detailColumns);
                }
                for (const displayedRow of detailGridRows.displayedRows) {
                    processRow(detailGridRows, displayedRow, detailColumns);
                }
            }
        };

        for (const displayedRow of this.gridRows.displayedRows) {
            processRow(this.gridRows, displayedRow, inputColumns);
        }

        const additionalErrors = this.gridRows.errors.toString({ exclude: processedRows });
        if (additionalErrors.length > 0) {
            result += '\n' + additionalErrors;
        }

        if (this.gridRows.errors.totalErrorsCount > 0) {
            result += '\n❌ GRID HAS ' + this.gridRows.errors.totalErrorsCount + ' ERRORS\n';
        }

        return result;
    }

    #rowDiagram(gridRows: GridRows, row: RowNode, columns: Column[] | null): string {
        let result = '';
        let typeAdded = false;
        if (
            gridRows.treeData &&
            row.key &&
            !row.footer &&
            (row.data || (typeof row.id === 'string' && row.id.startsWith('row-group-')))
        ) {
            result += optionalEscapeString(row.key) + ' ';
            result += this.getNodeType(gridRows, row) + ' ';
            typeAdded = true;
        }

        if (!typeAdded) {
            result += this.getNodeType(gridRows, row) + ' ';
        }

        const selectionState = row.isSelected();
        if (selectionState) {
            result += 'selected ';
        } else if (selectionState === undefined) {
            result += 'indeterminate ';
        }
        if (row.level >= 0 && !row.expanded && (row.group || row.master)) {
            result += 'collapsed ';
        }
        if (!gridRows.isRowDisplayed(row) && row !== gridRows.rootRowNode) {
            result += 'hidden ';
        }

        if (gridRows.options.printIds !== false) {
            result += 'id:' + rowIdToString(row) + ' ';
        }

        if (gridRows.options.printRowIndices) {
            result += 'rowIndex:' + row.rowIndex + ' ';
        }

        if (columns) {
            for (const column of columns) {
                const value = gridRows.api.getCellValue({ rowNode: row, colKey: column });
                if (value !== undefined || row.data) {
                    result += column.getColId() + ':' + JSON.stringify(value) + ' ';
                }
            }
        }

        return result;
    }

    #updateDiagramTree(node: GridRowsDiagramNode, branch: string, updated: Set<GridRowsDiagramNode>) {
        if (updated.has(node)) {
            return;
        }
        updated.add(node);
        const branchPrefix = branch.length ? (node.children.size > 0 ? '┬ ' : '─ ') : '';
        node.prefix = branch + branchPrefix;
        if (branch.length > 0) {
            branch = branch.slice(0, -2) + (branch.endsWith('└─') || branch.endsWith('└') ? '· ' : '│ ');
        }
        let index = 0;
        const indexOfLastChild = node.children.size - 1;
        for (const child of node.children.values()) {
            let childBranch = branch + (index === indexOfLastChild ? '└' : '├');
            if (!child.row?.footer) {
                childBranch += '─';
            }
            this.#updateDiagramTree(child, childBranch, updated);
            ++index;
        }
    }
}
