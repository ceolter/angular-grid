export default {
    template: `
      <div class="ag-status-name-value">
        <span>Row Count Component&nbsp;:</span>
        <span class="ag-status-name-value-value">{{ count }}</span>
      </div>
    `,
    data: function () {
        return {
            count: null,
        };
    },
    beforeMount() {
        this.params.api.addEventListener('gridReady', this.onGridReady.bind(this));
    },
    methods: {
        onGridReady(params) {
            this.count = this.params.api.getDisplayedRowCount();
        },
    },
};
