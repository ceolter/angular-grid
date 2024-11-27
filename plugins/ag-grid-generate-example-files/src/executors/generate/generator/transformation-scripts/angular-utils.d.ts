import type { EventHandler, Property } from '../types';
export declare const toInput: (property: Property) => string;
export declare const toConst: (property: Property) => string;
export declare const toOutput: (event: EventHandler) => string;
export declare const toMember: (property: Property) => string;
export declare const toMemberWithValue: (property: Property) => string;
export declare const toAssignment: (property: Property) => string;
export declare function convertTemplate(template: string): string;
export declare function getImport(filename: string): string;
