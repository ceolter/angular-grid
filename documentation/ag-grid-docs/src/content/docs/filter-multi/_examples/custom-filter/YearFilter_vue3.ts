export default {
    template: `
      <div>
          <div class="year-filter">
            <label>
              <input ref="eFilterAll" type="radio" value="false" v-model="isActive" v-on:change="toggleFilter(false)"/> All
            </label>
            <label>
              <input type="radio" value="true" v-model="isActive" v-on:change="toggleFilter(true)"/> After 2004
            </label>
          </div>
      </div>
    `,
    data: function () {
        return {
            isActive: false,
        };
    },
    methods: {
        toggleFilter(isFilterActive) {
            this.isActive = isFilterActive;
            this.params.filterChangedCallback();
        },
        doesFilterPass(params) {
            return params.data.year > 2004;
        },
        isFilterActive() {
            return this.isActive;
        },
        getModel() {
            return this.isFilterActive() || null;
        },
        setModel(value) {
            this.toggleFilter(value);
        },
        onFloatingFilterChanged(value) {
            this.setModel(value);
        },
        afterGuiAttached(params) {
            if (!params || !params.suppressFocus) {
                this.$refs.eFilterAll.focus();
            }
        },
    },
};
