import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AgGridAngular } from 'ag-grid-angular';
import { ClientSideRowModelModule } from 'ag-grid-community';
import type { ColDef } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import {
    colorSchemeDark,
    colorSchemeDarkBlue,
    colorSchemeDarkWarm,
    colorSchemeLight,
    colorSchemeLightCold,
    colorSchemeLightWarm,
    iconSetAlpine,
    iconSetMaterial,
    iconSetQuartzBold,
    iconSetQuartzLight,
    iconSetQuartzRegular,
    themeAlpine,
    themeBalham,
    themeQuartz,
} from 'ag-grid-community';
import { ColumnsToolPanelModule } from 'ag-grid-enterprise';
import { FiltersToolPanelModule } from 'ag-grid-enterprise';
import { SideBarModule } from 'ag-grid-enterprise';

ModuleRegistry.registerModules([
    AllCommunityModule,
    ClientSideRowModelModule,

    SideBarModule,
    ColumnsToolPanelModule,
    FiltersToolPanelModule,
]);

@Component({
    standalone: true,
    imports: [AgGridAngular, FormsModule, CommonModule],
    selector: 'my-app',
    template: `
        <div style="height: 100%; display: flex; flex-direction: column">
            <p style="flex: 0 1 0%">
                Theme:
                <select style="margin-right: 16px" [(ngModel)]="baseTheme">
                    <option *ngFor="let baseTheme of baseThemes" [ngValue]="baseTheme">{{ baseTheme.id }}</option>
                </select>
                Icons:
                <select style="margin-right: 16px" [(ngModel)]="iconSet">
                    <option *ngFor="let iconSet of iconSets" [ngValue]="iconSet">
                        {{ iconSet ? iconSet.variant : '(unchanged)' }}
                    </option>
                </select>
                Color scheme:
                <select style="margin-right: 16px" [(ngModel)]="colorScheme">
                    <option *ngFor="let colorScheme of colorSchemes" [ngValue]="colorScheme">
                        {{ colorScheme ? colorScheme.variant : '(unchanged)' }}
                    </option>
                </select>
            </p>
            <div style="flex: 1 1 0%">
                <ag-grid-angular
                    style="height: 100%;"
                    [columnDefs]="columnDefs"
                    [defaultColDef]="defaultColDef"
                    [rowData]="rowData"
                    [theme]="theme"
                    [sideBar]="true"
                />
            </div>
        </div>
    `,
})
export class AppComponent {
    baseThemes = [themeQuartz, themeBalham, themeAlpine];
    baseTheme = themeQuartz;

    colorSchemes = [
        null,
        colorSchemeLight,
        colorSchemeLightCold,
        colorSchemeLightWarm,
        colorSchemeDark,
        colorSchemeDarkWarm,
        colorSchemeDarkBlue,
    ];
    colorScheme = null;

    iconSets = [null, iconSetQuartzLight, iconSetQuartzRegular, iconSetQuartzBold, iconSetAlpine, iconSetMaterial];
    iconSet = null;

    get theme() {
        let theme = this.baseTheme;
        if (this.iconSet) {
            theme = theme.withPart(this.iconSet);
        }
        if (this.colorScheme) {
            theme = theme.withPart(this.colorScheme);
        }
        return theme;
    }

    columnDefs: ColDef[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

    defaultColDef: ColDef = {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    };

    rowData: any[] = (() => {
        const rowData: any[] = [];
        for (let i = 0; i < 10; i++) {
            rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
            rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
            rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
        }
        return rowData;
    })();
}
