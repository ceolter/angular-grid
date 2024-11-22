import type { _ValueApi, _ValueCacheApi } from '../api/gridApi';
import { baseCommunityModule } from '../interfaces/iModule';
import type { _ModuleWithApi, _ModuleWithoutApi } from '../interfaces/iModule';
import { expireValueCache, getCellValue } from './cellApi';
import { ChangeDetectionService } from './changeDetectionService';
import { ExpressionService } from './expressionService';
import { ValueCache } from './valueCache';

/**
 * @feature Performance -> Value Cache
 * @gridOption valueCache
 */
export const ValueCacheModule: _ModuleWithApi<_ValueCacheApi> = {
    ...baseCommunityModule('ValueCache'),
    beans: [ValueCache],
    apiFunctions: {
        expireValueCache,
    },
};

/**
 * @feature Cells -> Expression
 */
export const ExpressionModule: _ModuleWithoutApi = {
    ...baseCommunityModule('Expression'),
    beans: [ExpressionService],
};

/**
 * @feature Change Detection
 * @gridOption suppressChangeDetection
 */
export const ChangeDetectionModule: _ModuleWithoutApi = {
    ...baseCommunityModule('ChangeDetection'),
    beans: [ChangeDetectionService],
};

/**
 * @feature Cells -> API
 */
export const CellApiModule: _ModuleWithApi<_ValueApi<any>> = {
    ...baseCommunityModule('CellApi'),
    apiFunctions: {
        getCellValue,
    },
};
