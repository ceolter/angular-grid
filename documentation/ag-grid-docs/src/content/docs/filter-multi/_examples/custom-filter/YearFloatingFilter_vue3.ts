export default {
    template: `
      <div>
          <div class="year-filter">
            <label>
              <input type="radio" value="false" v-model="isActive" v-on:change="toggleFilter(false)"/> All
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
            this.params.parentFilterInstance((instance) => instance.onFloatingFilterChanged(isFilterActive));
        },
        onParentModelChanged(model) {
            this.isActive = !!model;
        },
    },
};
