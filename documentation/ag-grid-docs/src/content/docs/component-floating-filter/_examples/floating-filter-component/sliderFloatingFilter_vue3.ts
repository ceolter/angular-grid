export default {
    template: `
      <input type="range"
             :value="currentValue"
             min="0"
             :max="maxValue"
             step="1"
             @change="valueChanged($event)"/>
    `,
    data: function () {
        return {
            maxValue: 0,
            currentValue: 0,
        };
    },
    beforeMount() {
        this.maxValue = this.params.maxValue;
    },
    methods: {
        valueChanged(event) {
            this.currentValue = event.target.value;
            let valueToUse = this.currentValue === '0' ? null : this.currentValue;
            this.params.parentFilterInstance(function (instance) {
                instance.onFloatingFilterChanged('greaterThan', valueToUse);
            });
        },

        onParentModelChanged(parentModel) {
            // note that the filter could be anything here, but our purposes we're assuming a greater than filter only,
            // so just read off the value and use that
            this.currentValue = !parentModel ? 0 : parentModel.filter;
        },
    },
};
