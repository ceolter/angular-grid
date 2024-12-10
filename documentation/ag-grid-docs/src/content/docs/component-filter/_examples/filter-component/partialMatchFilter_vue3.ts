export default {
    template: `
      <div style="border-radius: 5px; width: 200px; height: 50px; padding: 10px">
        Partial Match Filter: <input style="height: 20px" :ref="'input'" v-model="text">
      </div>
    `,
    data() {
        return {
            text: '',
        };
    },
    methods: {
        isFilterActive() {
            return this.text !== null && this.text !== undefined && this.text !== '';
        },

        doesFilterPass(params) {
            const { node } = params;
            const value = this.params.getValue(node).toString().toLowerCase();

            return (
                !this.text ||
                this.text
                    .toLowerCase()
                    .split(' ')
                    .every((filterWord) => {
                        return value.indexOf(filterWord) >= 0;
                    })
            );
        },

        getModel() {
            if (!this.isFilterActive()) {
                return null;
            }

            return { value: this.text };
        },

        setModel(model) {
            this.text = model == null ? null : model.value;
        },

        afterGuiAttached() {
            this.$refs.input.focus();
        },

        componentMethod(message) {
            alert(`Alert from PartialMatchFilterComponent ${message}`);
        },
    },
    watch: {
        text: function (val, oldVal) {
            if (val !== oldVal) {
                this.params.filterChangedCallback();
            }
        },
    },
};
