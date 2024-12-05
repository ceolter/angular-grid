export default {
    template: `
      <span>
        &gt; <input v-bind:style="{ borderColor: params.color, width: '30px' }" type="number" min="0" v-model="currentValue"
             v-on:input="onInputBoxChanged()"/>
      </span>
    `,
    data: function () {
        return {
            currentValue: null,
        };
    },
    methods: {
        onInputBoxChanged() {
            if (this.currentValue === '') {
                // Remove the filter
                this.params.parentFilterInstance((instance) => {
                    instance.onFloatingFilterChanged(null, null);
                });
                return;
            }

            this.params.parentFilterInstance((instance) => {
                instance.onFloatingFilterChanged('greaterThan', this.currentValue);
            });
        },

        onParentModelChanged(parentModel) {
            // When the filter is empty we will receive a null value here
            if (!parentModel) {
                this.currentValue = '';
            } else {
                this.currentValue = parentModel.filter;
            }
        },
    },
};
