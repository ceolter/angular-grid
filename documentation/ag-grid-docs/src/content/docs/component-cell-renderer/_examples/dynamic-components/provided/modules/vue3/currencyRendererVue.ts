import { defineComponent } from 'vue';

export default defineComponent({
    template: `
      <span>{{ formattedValue }}</span>
    `,
    data: function () {
        return {
            formattedValue: undefined,
        };
    },
    beforeMount() {
        this.formattedValue = this.formatValueToCurrency('EUR', this.params.value);
    },
    methods: {
        formatValueToCurrency(currency, value) {
            return `${currency} ${value.toFixed(2)}`;
        },
        refresh(params) {
            this.formattedValue = this.formatValueToCurrency('EUR', params.value);
            return true;
        },
    },
});
