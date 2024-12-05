export default {
    template: `
    <span class="missionSpan">
      <img
        :alt="params.value"
        :src="cellValue"
        class="missionIcon"
      />
    </span>
    `,
    data: function () {
        return {
            cellValue: '',
        };
    },
    beforeMount() {
        if (this.params.src) {
            this.cellValue = this.params.src(this.params.value);
        } else {
            this.cellValue = `https://www.ag-grid.com/example-assets/icons/${
                this.params.value ? 'tick-in-circle' : 'cross-in-circle'
            }.png`;
        }
    },
};
