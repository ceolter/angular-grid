import type { _KeyboardNavigationGridApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi } from '../interfaces/iModule';
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
    ...baseCommunityModule('KeyboardNavigationModule'),
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
