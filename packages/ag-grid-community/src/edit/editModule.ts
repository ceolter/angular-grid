import type { _EditGridApi, _UndoRedoGridApi } from '../api/gridApi';
import type { DefaultProvidedCellEditorParams } from '../interfaces/iCellEditor';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { UndoRedoService } from '../undoRedo/undoRedoService';
import { PopupModule } from '../widgets/popupModule';
import { cellEditingCSS } from './cell-editing.css-GENERATED';
import { CheckboxCellEditor } from './cellEditors/checkboxCellEditor';
import { DateCellEditor } from './cellEditors/dateCellEditor';
import { DateStringCellEditor } from './cellEditors/dateStringCellEditor';
import { LargeTextCellEditor } from './cellEditors/largeTextCellEditor';
import { NumberCellEditor } from './cellEditors/numberCellEditor';
import { SelectCellEditor } from './cellEditors/selectCellEditor';
import { TextCellEditor } from './cellEditors/textCellEditor';
import {
    getCellEditorInstances,
    getCurrentRedoSize,
    getCurrentUndoSize,
    getEditingCells,
    redoCellEditing,
    startEditingCell,
    stopEditing,
    undoCellEditing,
} from './editApi';
import { EditService } from './editService';
import { RowEditService } from './rowEditService';

/**
 * @internal
 */
export const EditCoreModule: _ModuleWithApi<_EditGridApi<any>> = {
    ...baseCommunityModule('EditCore'),
    beans: [EditService, RowEditService],
    apiFunctions: {
        getCellEditorInstances,
        getEditingCells,
        stopEditing,
        startEditingCell,
    },
    dependsOn: [PopupModule],
    css: [cellEditingCSS],
};

/**
 * @feature Editing -> Undo / Redo Edits
 */
export const UndoRedoEditModule: _ModuleWithApi<_UndoRedoGridApi> = {
    ...baseCommunityModule('UndoRedoEdit'),
    beans: [UndoRedoService],
    apiFunctions: {
        undoCellEditing,
        redoCellEditing,
        getCurrentUndoSize,
        getCurrentRedoSize,
    },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Text Editor
 */
export const TextEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('TextEditor'),
    userComponents: { agCellEditor: TextCellEditor, agTextCellEditor: TextCellEditor },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Number Editor
 */
export const NumberEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('NumberEditor'),
    userComponents: {
        agNumberCellEditor: {
            classImp: NumberCellEditor,
            params: {
                suppressPreventDefault: true,
            } as DefaultProvidedCellEditorParams,
        },
    },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Date Editor
 */
export const DateEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('DateEditor'),
    userComponents: {
        agDateCellEditor: DateCellEditor,
        agDateStringCellEditor: DateStringCellEditor,
    },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Checkbox Editor
 */
export const CheckboxEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CheckboxEditor'),
    userComponents: {
        agCheckboxCellEditor: CheckboxCellEditor,
    },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Select Editor
 */
export const SelectEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SelectEditor'),
    userComponents: { agSelectCellEditor: SelectCellEditor },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Large Text Editor
 */
export const LargeTextEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('LargeTextEditor'),
    userComponents: { agLargeTextCellEditor: LargeTextCellEditor },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing
 */
export const CustomEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('CustomEditor'),
    dependsOn: [EditCoreModule],
};
