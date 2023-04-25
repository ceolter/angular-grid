// Type definitions for @ag-grid-community/core v29.3.3
// Project: https://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { IRowNode } from "./iRowNode";
export interface RowNodeTransaction<TData = any> {
    /** Row nodes added */
    add: IRowNode<TData>[];
    /** Row nodes removed */
    remove: IRowNode<TData>[];
    /** Row nodes updated */
    update: IRowNode<TData>[];
}
