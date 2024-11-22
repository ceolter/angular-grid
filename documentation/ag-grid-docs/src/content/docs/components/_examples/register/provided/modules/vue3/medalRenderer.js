export default {
    template: `
            <span class="total-value-renderer">
             <span>{{country}}</span>
             <button @click="buttonClicked($event)">Push For Total</button>
        </span>
`,
    data: function () {
        return {
            country: '',
            total: '',
        };
    },
    beforeMount() {
        this.country = this.params.valueFormatted ? this.params.valueFormatted : this.params.value;
        this.total = this.params.data.total;
    },
    methods: {
        buttonClicked() {
            alert(`${this.total} medals won!`);
        },
    },
};
