import type { AgPromise } from '../utils/promise';

export interface UserCompDetails {
    componentClass: any;
    componentFromFramework: boolean;
    params: any;
    type: ComponentType;
    popupFromSelector?: boolean;
    popupPositionFromSelector?: 'over' | 'under';
    newAgStackInstance: () => AgPromise<any>;
}

export interface ComponentType {
    propertyName: string;
    cellRenderer: boolean;
}
