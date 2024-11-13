import type { ColDef, GridOptions } from 'ag-grid-community';
import { ClientSideRowModelModule, ModuleRegistry, createGrid, createPart, createTheme } from 'ag-grid-community';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const myCheckboxStyle = createPart('checkboxStyle')
    // Add some CSS to this part. If your application is bundled with Vite you
    // can put this in a separate file and import it with
    // `import checkboxCSS "./checkbox.css?inline"`
    .withCSS(
        `
        .ag-checkbox-input-wrapper {
            border-radius: 4px;
            /* Parts' CSS can use new parameters - define support
               for them using withAdditionalParams below */
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
            appearance: none;
            -webkit-appearance: none;
        }
    `
    )
    // Declare parameters added by the custom CSS and provide default values
    .withAdditionalParams({
        checkboxCheckedGlowColor: { ref: 'accentColor' },
        checkboxGlowColor: { ref: 'foregroundColor', mix: 0.5 },
    })
    // If you want to provide new default values for parameters already defined
    // by the grid, use withParams which provides TypeScript checking
    .withParams({ accentColor: 'red' });

const myCustomTheme = createTheme().withPart(myCheckboxStyle);

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
