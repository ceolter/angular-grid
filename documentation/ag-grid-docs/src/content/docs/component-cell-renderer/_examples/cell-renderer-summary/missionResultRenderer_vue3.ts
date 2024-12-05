export default {
    template: `
    <span class="missionSpan">
      <img
        :alt="params.value"
        :src="'https://www.ag-grid.com/example-assets/icons/' + cellValue + '.png'"
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
        this.cellValue = this.params.value ? 'tick-in-circle' : 'cross-in-circle';
    },
};
