export default {
    template: `
        <div class="year-filter">
            <div>Select Year Range</div>
            <label>
                <input type="radio" name="year" v-model="year" v-on:change="updateFilter()" value="All"/> All
            </label>
            <label>
                <input type="radio" name="year" v-model="year" v-on:change="updateFilter()" value="2010"/> Since 2010
            </label>
        </div>
    `,
    data: function () {
        return {
            year: 'All',
        };
    },
    methods: {
        updateFilter() {
            this.params.filterChangedCallback();
        },

        doesFilterPass(params) {
            return params.data.year >= 2010;
        },

        isFilterActive() {
            return this.year === '2010';
        },

        // this example isn't using getModel() and setModel(),
        // so safe to just leave these empty. don't do this in your code!!!
        getModel() {},

        setModel() {},
    },
};
