import { ColumnApi } from "../columns/columnApi";
import { GridApi } from "../gridApi";
import { CellPosition } from "./cellPosition";

// Callback interfaces in this file should remain internal to AG Grid. 
// They are used to create the params without the need to have BaseCallbackParams properties 
// repeatedly assigned throughout the code base.

/**
 * Shared properties for all callbacks
 */
export interface BaseCallbackParams {
    api: GridApi;
    columnApi: ColumnApi;
    context: any;
}
export interface ITabToNextCellParams {
    /** True if the Shift key is also down */
    backwards: boolean;
    /** True if the current cell is editing
     * (you may want to skip cells that are not editable, as the grid will enter the next cell in editing mode also if tabbing) */
    editing: boolean;
    /** The cell that currently has focus */
    previousCellPosition: CellPosition;
    /** The cell the grid would normally pick as the next cell for navigation.  */
    nextCellPosition: CellPosition | null;

}

export interface INavigateToNextCellParams {
    /** The keycode for the arrow key pressed:
     *  left = 'ArrowLeft', up = 'ArrowUp', right = 'ArrowRight', down = 'ArrowDown' */
    key: string;
    /** The cell that currently has focus */
    previousCellPosition: CellPosition;
    /** The cell the grid would normally pick as the next cell for navigation */
    nextCellPosition: CellPosition | null;

    event: KeyboardEvent | null;
}