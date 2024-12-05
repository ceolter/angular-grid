import type { _ColumnGroupGridApi } from '../../api/gridApi';
import { HeaderGroupCellCtrl } from '../../headerRendering/cells/columnGroup/headerGroupCellCtrl';
import type { _ModuleWithApi } from '../../interfaces/iModule';
import { VERSION } from '../../version';
import {
    getAllDisplayedColumnGroups,
    getCenterDisplayedColumnGroups,
    getColumnGroup,
    getColumnGroupState,
    getDisplayNameForColumnGroup,
    getLeftDisplayedColumnGroups,
    getProvidedColumnGroup,
    getRightDisplayedColumnGroups,
    resetColumnGroupState,
    setColumnGroupOpened,
    setColumnGroupState,
} from './columnGroupApi';
import { ColumnGroupService } from './columnGroupService';

/**
 * @feature Columns -> Column Groups
 * @colGroupDef
 */
export const ColumnGroupModule: _ModuleWithApi<_ColumnGroupGridApi> = {
    moduleName: 'ColumnGroup',
    version: VERSION,
    dynamicBeans: { headerGroupCellCtrl: HeaderGroupCellCtrl as any },
    beans: [ColumnGroupService],
    apiFunctions: {
        getAllDisplayedColumnGroups,
        getCenterDisplayedColumnGroups,
        getColumnGroup,
        getColumnGroupState,
        getDisplayNameForColumnGroup,
        getLeftDisplayedColumnGroups,
        getProvidedColumnGroup,
        getRightDisplayedColumnGroups,
        resetColumnGroupState,
        setColumnGroupOpened,
        setColumnGroupState,
    },
};
