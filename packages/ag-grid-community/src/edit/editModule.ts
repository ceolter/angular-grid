import type { _EditGridApi } from '../api/gridApi';
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

export const EditCoreModule: _ModuleWithoutApi = {
    ...baseCommunityModule('EditCoreModule'),
    beans: [EditService],
    dependsOn: [PopupModule],

    css: [cellEditingCSS],
};

export const EditApiModule: _ModuleWithApi<_EditGridApi<any>> = {
    ...baseCommunityModule('EditApiModule'),
    apiFunctions: {
        undoCellEditing,
        redoCellEditing,
        getCellEditorInstances,
        getEditingCells,
        stopEditing,
        startEditingCell,
        getCurrentUndoSize,
        getCurrentRedoSize,
    },
    dependsOn: [EditCoreModule],
};

export const UndoRedoEditModule: _ModuleWithoutApi = {
    ...baseCommunityModule('UndoRedoEditModule'),
    beans: [UndoRedoService],
    dependsOn: [EditCoreModule],
};

export const FullRowEditModule: _ModuleWithoutApi = {
    ...baseCommunityModule('FullRowEditModule'),
    beans: [RowEditService],
    dependsOn: [EditCoreModule],
};

export const DefaultEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('DefaultEditorModule'),
    userComponents: { agCellEditor: TextCellEditor },
    dependsOn: [EditCoreModule],
};

export const DataTypeEditorsModule: _ModuleWithoutApi = {
    ...baseCommunityModule('DataTypeEditorsModule'),
    userComponents: {
        agTextCellEditor: TextCellEditor,

        agNumberCellEditor: {
            classImp: NumberCellEditor,
            params: {
                suppressPreventDefault: true,
            } as DefaultProvidedCellEditorParams,
        },
        agDateCellEditor: DateCellEditor,
        agDateStringCellEditor: DateStringCellEditor,
        agCheckboxCellEditor: CheckboxCellEditor,
    },
    dependsOn: [DefaultEditorModule],
};

export const SelectEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('SelectEditorModule'),
    userComponents: { agSelectCellEditor: SelectCellEditor },
    dependsOn: [EditCoreModule],
};

export const LargeTextEditorModule: _ModuleWithoutApi = {
    ...baseCommunityModule('LargeTextEditorModule'),
    userComponents: { agLargeTextCellEditor: LargeTextCellEditor },
    dependsOn: [EditCoreModule],
};

const AllCommunityEditorsModule: _ModuleWithoutApi = {
    ...baseCommunityModule('AllCommunityEditorsModule'),
    dependsOn: [DefaultEditorModule, DataTypeEditorsModule, SelectEditorModule, LargeTextEditorModule],
};

export const EditModule: _ModuleWithoutApi = {
    ...baseCommunityModule('EditModule'),
    dependsOn: [EditCoreModule, UndoRedoEditModule, FullRowEditModule, AllCommunityEditorsModule, EditApiModule],
};
