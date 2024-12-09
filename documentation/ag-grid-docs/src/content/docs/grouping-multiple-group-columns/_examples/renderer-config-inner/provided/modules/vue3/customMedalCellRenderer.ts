import { defineComponent } from 'vue';

import type { RefreshCellsParams } from 'ag-grid-community';

export default defineComponent({
    template: `
        <span class="imgSpan">
            <img v-for="images in arr" :src="src" class="medalIcon" />
        </span>`,
    data: function () {
        return {
            arr: [],
            src: 'https://www.ag-grid.com/example-assets/gold-star.png',
        };
    },
    beforeMount() {
        this.updateDisplay(this.params);
    },
    methods: {
        refresh(params: RefreshCellsParams) {
            this.updateDisplay(params);
        },
        updateDisplay(params) {
            this.arr = new Array(params.value ?? 0);
        },
    },
});
