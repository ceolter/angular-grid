import { createApp, onBeforeMount, ref, shallowRef } from 'vue';

import { ClientSideRowModelModule } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { MenuModule } from 'ag-grid-enterprise';
import { AgGridVue } from 'ag-grid-vue3';

import './styles.css';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule, MenuModule, ExcelExportModule]);

const VueExample = {
    template: `
        <div style="height: 100%">
            <div class="container">
                <form @submit="this.onFormSubmit">
                    <div class="columns">
                        <div class="column">
                            <label class="option" for="pageOrientation">
                                Page Orientation =
                                <select id="pageOrientation">
                                    <option value="Portrait">Portrait</option>
                                    <option value="Landscape">Landscape</option>
                                </select>
                            </label>
                            <label class="option" for="pageSize">
                                Page Size =
                                <select id="pageSize">
                                    <option value="Letter">Letter</option>
                                    <option value="Letter Small">Letter Small</option>
                                    <option value="Tabloid">Tabloid</option>
                                    <option value="Ledger">Ledger</option>
                                    <option value="Legal">Legal</option>
                                    <option value="Statement">Statement</option>
                                    <option value="Executive">Executive</option>
                                    <option value="A3">A3</option>
                                    <option value="A4">A4</option>
                                    <option value="A4 Small">A4 Small</option>
                                    <option value="A5">A5</option>
                                    <option value="A6">A6</option>
                                    <option value="B4">B4</option>
                                    <option value="B5">B5</option>
                                    <option value="Folio">Folio</option>
                                    <option value="Envelope">Envelope</option>
                                    <option value="Envelope DL">Envelope DL</option>
                                    <option value="Envelope C5">Envelope C5</option>
                                    <option value="Envelope B5">Envelope B5</option>
                                    <option value="Envelope C3">Envelope C3</option>
                                    <option value="Envelope C4">Envelope C4</option>
                                    <option value="Envelope C6">Envelope C6</option>
                                    <option value="Envelope Monarch">Envelope Monarch</option>
                                    <option value="Japanese Postcard">Japanese Postcard</option>
                                    <option value="Japanese Double Postcard">Japanese Double Postcard</option>
                                </select>
                            </label>
                        </div>
                        <fieldset class="column margin-container">
                            <legend>Margins</legend>
                            <label for="top">Top = <input type="number" id="top" value="0.75" min="0" step="0.05"></label>
                            <label for="right">Right = <input type="number" id="right" value="0.7" min="0" step="0.05"></label>
                            <label for="bottom">Bottom = <input type="number" id="bottom" value="0.75" min="0" step="0.05"></label>
                            <label for="left">Left = <input type="number" id="left" value="0.7" min="0" step="0.05"></label>
                            <label for="header">Header = <input type="number" id="header" value="0.3" min="0" step="0.05"></label>
                            <label for="footer">Footer = <input type="number" id="footer" value="0.3" min="0" step="0.05"></label>
                        </fieldset>
                    </div>
                    <div>
                        <input type="submit" style="margin: 5px 0px; font-weight: bold;" value="Export to Excel">
                    </div>
                </form>
                <div class="grid-wrapper">
                    <ag-grid-vue
                
                style="width: 100%; height: 100%;"
                :columnDefs="columnDefs"
                @grid-ready="onGridReady"
                :defaultColDef="defaultColDef"
                :popupParent="popupParent"
                :rowData="rowData"></ag-grid-vue>
                </div>
            </div>
        </div>
    `,
    components: {
        'ag-grid-vue': AgGridVue,
    },
    setup(props) {
        const columnDefs = ref([
            {
                field: 'athlete',
                minWidth: 200,
            },
            {
                field: 'country',
                minWidth: 200,
            },
            {
                field: 'sport',
                minWidth: 150,
            },
            {
                field: 'gold',
            },
            {
                field: 'silver',
            },
            {
                field: 'bronze',
            },
            {
                field: 'total',
            },
        ]);

        const gridApi = shallowRef();
        const defaultColDef = ref({
            filter: true,
            minWidth: 100,
            flex: 1,
        });

        const popupParent = ref(null);
        const rowData = ref(null);

        onBeforeMount(() => {
            popupParent.value = document.body;
        });

        const onGridReady = (params) => {
            gridApi.value = params.api;

            const updateData = (data) =>
                params.api.setGridOption(
                    'rowData',
                    data.filter((rec) => rec.country != null)
                );

            fetch('https://www.ag-grid.com/example-assets/small-olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => updateData(data));
        };

        const onFormSubmit = (e) => {
            e.preventDefault();
            const { pageSetup, margins } = getSheetConfig();
            gridApi.value.exportDataAsExcel({ pageSetup, margins });
        };

        return {
            columnDefs,
            gridApi,
            defaultColDef,
            popupParent,
            rowData,
            onGridReady,
            onFormSubmit,
        };
    },
};

window.getNumber = function getNumber(id) {
    var el = document.querySelector(id);
    if (!el || isNaN(el.value)) {
        return 0;
    }
    return parseFloat(el.value);
};

window.getValue = function getValue(id) {
    return document.querySelector(id).value;
};

window.getSheetConfig = function getSheetConfig() {
    return {
        pageSetup: {
            orientation: getValue('#pageOrientation'),
            pageSize: getValue('#pageSize'),
        },
        margins: {
            top: getNumber('#top'),
            right: getNumber('#right'),
            bottom: getNumber('#bottom'),
            left: getNumber('#left'),
            header: getNumber('#header'),
            footer: getNumber('#footer'),
        },
    };
};

createApp(VueExample).mount('#app');
