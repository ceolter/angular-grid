/*
 * Used for umd bundles with styles
 */
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine-no-font.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';
import '@ag-grid-community/styles/ag-theme-balham-no-font.css';
import '@ag-grid-community/styles/ag-theme-balham.css';
import '@ag-grid-community/styles/ag-theme-material-no-font.css';
import '@ag-grid-community/styles/ag-theme-material.css';
import '@ag-grid-community/styles/ag-theme-quartz-no-font.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import '@ag-grid-community/styles/agGridAlpineFont.css';
import '@ag-grid-community/styles/agGridBalhamFont.css';
import '@ag-grid-community/styles/agGridClassicFont.css';
import '@ag-grid-community/styles/agGridMaterialFont.css';
import '@ag-grid-community/styles/agGridQuartzFont.css';

import { AllCommunityModule, ModuleRegistry } from './main';

ModuleRegistry.registerModules([AllCommunityModule]);

export * from './main';
