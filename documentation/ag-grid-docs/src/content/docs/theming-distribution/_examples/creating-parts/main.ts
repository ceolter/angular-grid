import type { ColDef, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    GridStateModule,
    ModuleRegistry,
    NumberEditorModule,
    RowSelectionModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    colorSchemeVariable,
    createGrid,
    createPart,
    createTheme,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
    TextEditorModule,
    TextFilterModule,
    NumberEditorModule,
    RowSelectionModule,
    GridStateModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const myCheckboxStyle = createPart({
    // By setting the feature, adding this part to a theme will remove the
    // theme's existing checkboxStyle, if any
    feature: 'checkboxStyle',
    params: {
        // Declare parameters added by the custom CSS and provide default values
        checkboxCheckedGlowColor: { ref: 'accentColor' },
        checkboxGlowColor: { ref: 'foregroundColor', mix: 0.5 },
        // If you want to provide new default values for parameters already defined
        // by the grid, you can do so too
        accentColor: 'red',
    },
    // Add some CSS to this part.
    // If your application is bundled with Vite you can put this in a separate
    // file and import it with `import checkboxCSS "./checkbox.css?inline"`
    css: `
        .ag-checkbox-input-wrapper {
            border-radius: 4px;
            /* Here we're referencing the checkboxGlowColor parameter in CSS, we need
               to add the --ag- prefix and use kebab-case */
            box-shadow: 0 0 5px 4px var(--ag-checkbox-glow-color);
            width: 16px;
            height: 16px;
        
            &.ag-checked {
                box-shadow: 0 0 5px 4px var(--ag-checkbox-checked-glow-color);
                &::before {
                    content: '✔';
                    position: absolute;
                    pointer-events: none;
                    inset: 0;
                    text-align: center;
                    line-height: 16px;
                    font-size: 14px;
                }
            }
        }

        .ag-checkbox-input {
            width: 16px;
            height: 16px;
            margin: 0;
            appearance: none;
            -webkit-appearance: none;
            border-radius: 4px;
        
            &:focus {
                box-shadow: 0 0 3px 3px yellow;
                outline: none;
            }
        }
        
        `,
});

const myCustomTheme = createTheme().withPart(myCheckboxStyle).withPart(colorSchemeVariable);

const columnDefs: ColDef[] = [{ field: 'make' }, { field: 'model' }, { field: 'price' }];

const rowData: any[] = (() => {
    const rowData: any[] = [];
    for (let i = 0; i < 10; i++) {
        rowData.push({ make: 'Toyota', model: 'Celica', price: 35000 + i * 1000 });
        rowData.push({ make: 'Ford', model: 'Mondeo', price: 32000 + i * 1000 });
        rowData.push({ make: 'Porsche', model: 'Boxster', price: 72000 + i * 1000 });
    }
    return rowData;
})();

const gridOptions: GridOptions<IOlympicData> = {
    theme: myCustomTheme,
    columnDefs,
    rowData,
    defaultColDef: {
        editable: true,
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    initialState: {
        rowSelection: ['1', '2', '3'],
    },
    rowSelection: { mode: 'multiRow', checkboxes: true },
};

createGrid(document.querySelector<HTMLElement>('#myGrid')!, gridOptions);
