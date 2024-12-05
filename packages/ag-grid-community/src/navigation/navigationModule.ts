import type { _KeyboardNavigationGridApi } from '../api/gridApi';
import type { _ModuleWithApi } from '../interfaces/iModule';
import { VERSION } from '../version';
import { CellNavigationService } from './cellNavigationService';
import { HeaderNavigationService } from './headerNavigationService';
import {
    clearFocusedCell,
    getFocusedCell,
    setFocusedCell,
    setFocusedHeader,
    tabToNextCell,
    tabToPreviousCell,
} from './navigationApi';
import { NavigationService } from './navigationService';

/**
 * @feature Interactivity -> Keyboard Navigation
 */
export const KeyboardNavigationModule: _ModuleWithApi<_KeyboardNavigationGridApi> = {
    moduleName: 'KeyboardNavigation',
    version: VERSION,
    beans: [NavigationService, CellNavigationService, HeaderNavigationService],
    apiFunctions: {
        getFocusedCell,
        clearFocusedCell,
        setFocusedCell,
        setFocusedHeader,
        tabToNextCell,
        tabToPreviousCell,
    },
};
