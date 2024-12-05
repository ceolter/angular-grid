export default {
    template: `
      <div style="padding: 4px">
          <div style="font-weight: bold;">Greater than:</div>
          <div>
            <input style="margin: 4px 0 4px 0;" type="number" min="0" v-model="filterText" placeholder="Number of medals..."/>
          </div>
      </div>
    `,
    data: function () {
        return {
            filterText: null,
        };
    },
    watch: {
        filterText(newFilterText, oldFilterText) {
            this.params.filterChangedCallback();
        },
    },
    methods: {
        isFilterActive() {
            return (
                this.filterText !== null &&
                this.filterText !== undefined &&
                this.filterText !== '' &&
                this.isNumeric(this.filterText)
            );
        },

        doesFilterPass(params) {
            const value = this.params.getValue(params.node);

            if (this.isFilterActive()) {
                if (value == null) return false;
                return Number(value) > Number(this.filterText);
            }
        },

        isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        getModel() {
            return this.isFilterActive() ? Number(this.filterText) : null;
        },

        setModel(model) {
            this.filterText = model;
        },

        myMethodForTakingValueFromFloatingFilter(value) {
            this.filterText = value;
        },
    },
};
