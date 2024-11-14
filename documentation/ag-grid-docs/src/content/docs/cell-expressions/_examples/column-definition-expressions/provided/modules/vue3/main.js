import { createApp } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const VueExample = {
    template: `
      <div style="height: 100%">
      <ag-grid-vue
          style="width: 100%; height: 100%;"
          id="myGrid"
          :gridOptions="gridOptions"
          @grid-ready="onGridReady"
          :columnDefs="columnDefs"
          :defaultColDef="defaultColDef"
          :rowData="rowData"
          @cell-value-changed="onCellValueChanged"></ag-grid-vue>
      </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    data: function () {
        return {
            gridOptions: {},
            gridApi: null,
            columnDefs: [
                {
                    headerName: 'String (editable)',
                    field: 'simple',
                    editable: true,
                },
                {
                    headerName: 'Number (editable)',
                    field: 'number',
                    editable: true,
                    valueFormatter: `"£" + Math.floor(value).toString().replace(/(\\d)(?=(\\d{3})+(?!\\d))/g, "$1,")`,
                },
                {
                    headerName: 'Name (editable)',
                    editable: true,
                    valueGetter: 'data.firstName + " " + data.lastName',
                    valueSetter:
                        // an expression can span multiple lines!!!
                        `var nameSplit = newValue.split(" ");
                         var newFirstName = nameSplit[0];
                         var newLastName = nameSplit[1];
                         if (data.firstName !== newFirstName || data.lastName !== newLastName) {  
                            data.firstName = newFirstName;  
                            data.lastName = newLastName;  
                            return true;
                        } else {  
                            return false;
                        }`,
                },
                { headerName: 'A', field: 'a', minWidth: 100 },
                { headerName: 'B', field: 'b', minWidth: 100 },
                { headerName: 'A + B', valueGetter: 'data.a + data.b', maxWidth: 120 },
            ],
            defaultColDef: {
                flex: 1,
                minWidth: 150,
                sortable: false,
            },
            rowData: this.createRowData(),
        };
    },
    mounted() {},
    methods: {
        onCellValueChanged(event) {
            console.log('data after changes is: ', event.data);
        },
        onGridReady(params) {
            this.gridApi = params.api;
        },
        createRowData() {
            const rowData = [];
            const words = [
                'One',
                'Apple',
                'Moon',
                'Sugar',
                'Grid',
                'Banana',
                'Sunshine',
                'Stars',
                'Black',
                'White',
                'Salt',
                'Beach',
            ];
            const firstNames = ['Niall', 'John', 'Rob', 'Alberto', 'Bas', 'Dimple', 'Sean'];
            const lastNames = ['Pink', 'Black', 'White', 'Brown', 'Smith', 'Smooth', 'Anderson'];
            for (let i = 0; i < 100; i++) {
                const randomWords = words[i % words.length] + ' ' + words[(i * 17) % words.length];
                rowData.push({
                    simple: randomWords,
                    number: Math.floor(((i + 2) * 476321) % 10000),
                    a: Math.floor(i % 4),
                    b: Math.floor(i % 7),
                    firstName: firstNames[i % firstNames.length],
                    lastName: lastNames[i % lastNames.length],
                });
            }
            return rowData;
        },
    },
};

createApp(VueExample).mount('#app');
