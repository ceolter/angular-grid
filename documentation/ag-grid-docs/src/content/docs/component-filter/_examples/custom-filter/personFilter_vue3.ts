export default {
    template: `
      <div class="person-filter">
        <div>Custom Athlete Filter</div>
        <div>
            <input type="text" ref="eFilterText" v-model="filterText" v-on:keyup="updateFilter($event)" placeholder="Full name search..."/>
        </div>
        <div>This filter does partial word search on multiple words, eg "mich phel" still brings back Michael Phelps.</div>
      </div>
    `,
    data: function () {
        return {
            filterText: null,
        };
    },
    methods: {
        updateFilter() {
            this.params.filterChangedCallback();
        },

        doesFilterPass(params) {
            const { api, colDef, column, context } = this.params;
            const { node } = params;

            // make sure each word passes separately, ie search for firstname, lastname
            let passed = true;
            this.filterText
                .toLowerCase()
                .split(' ')
                .forEach((filterWord) => {
                    const value = this.params.getValue(node);

                    if (value.toString().toLowerCase().indexOf(filterWord) < 0) {
                        passed = false;
                    }
                });

            return passed;
        },

        isFilterActive() {
            return this.filterText != null && this.filterText !== '';
        },

        getModel() {
            if (!this.isFilterActive()) {
                return null;
            }

            return { value: this.filterText };
        },

        setModel(model) {
            this.filterText = model == null ? null : model.value;
        },

        afterGuiAttached(params) {
            if (!params || !params.suppressFocus) {
                // focus the input element for keyboard navigation
                this.$refs.eFilterText.focus();
            }
        },
    },
};
