import type { _EditGridApi, _UndoRedoGridApi } from '../api/gridApi';
import type { DefaultProvidedCellEditorParams } from '../interfaces/iCellEditor';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { UndoRedoService } from '../undoRedo/undoRedoService';
import { VERSION } from '../version';
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
    moduleName: 'EditCore',
    version: VERSION,
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
    moduleName: 'UndoRedoEdit',
    version: VERSION,
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
    moduleName: 'TextEditor',
    version: VERSION,
    userComponents: { agCellEditor: TextCellEditor, agTextCellEditor: TextCellEditor },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Number Editor
 */
export const NumberEditorModule: _ModuleWithoutApi = {
    moduleName: 'NumberEditor',
    version: VERSION,
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
    moduleName: 'DateEditor',
    version: VERSION,
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
    moduleName: 'CheckboxEditor',
    version: VERSION,
    userComponents: {
        agCheckboxCellEditor: CheckboxCellEditor,
    },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Select Editor
 */
export const SelectEditorModule: _ModuleWithoutApi = {
    moduleName: 'SelectEditor',
    version: VERSION,
    userComponents: { agSelectCellEditor: SelectCellEditor },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing -> Large Text Editor
 */
export const LargeTextEditorModule: _ModuleWithoutApi = {
    moduleName: 'LargeTextEditor',
    version: VERSION,
    userComponents: { agLargeTextCellEditor: LargeTextCellEditor },
    dependsOn: [EditCoreModule],
};

/**
 * @feature Editing
 */
export const CustomEditorModule: _ModuleWithoutApi = {
    moduleName: 'CustomEditor',
    version: VERSION,
    dependsOn: [EditCoreModule],
};
