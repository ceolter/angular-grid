import { createApp } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { AgGridVue } from 'ag-grid-vue3';

import GenderRenderer from './genderRendererVue.js';
import MoodRenderer from './moodRendererVue.js';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

const VueExample = {
    template: `
      <div style="height: 100%">
      <ag-grid-vue
          style="width: 100%; height: 100%;"
          id="myGrid"
          :columnDefs="columnDefs"
          :rowData="rowData"
          :defaultColDef="defaultColDef"
        ></ag-grid-vue>
      </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
        genderCellRenderer: GenderRenderer,
        moodCellRenderer: MoodRenderer,
    },
    data: function () {
        return {
            columnDefs: [
                { field: 'value' },
                {
                    headerName: 'Rendered Value',
                    field: 'value',
                    cellRendererSelector: (params) => {
                        const moodDetails = { component: 'moodCellRenderer' };
                        const genderDetails = {
                            component: 'genderCellRenderer',
                            params: {
                                values: ['Male', 'Female'],
                            },
                        };
                        if (params.data.type === 'gender') return genderDetails;
                        else if (params.data.type === 'mood') return moodDetails;
                        else return undefined;
                    },
                },
                { field: 'type' },
            ],
            defaultColDef: {
                flex: 1,
                cellDataType: false,
            },
            rowData: [
                {
                    value: 14,
                    type: 'age',
                },
                {
                    value: 'Female',
                    type: 'gender',
                },
                {
                    value: 'Happy',
                    type: 'mood',
                },
                {
                    value: 21,
                    type: 'age',
                },
                {
                    value: 'Male',
                    type: 'gender',
                },
                {
                    value: 'Sad',
                    type: 'mood',
                },
            ],
        };
    },
};

createApp(VueExample).mount('#app');
