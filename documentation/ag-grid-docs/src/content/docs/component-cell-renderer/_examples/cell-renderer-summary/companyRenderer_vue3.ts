export default {
    template: `
    <a :href="value" target="_blank">{{ parsedValue }}</a>
  `,
    data: function () {
        return {
            parsedValue: '',
            value: '',
        };
    },
    beforeMount() {
        this.updateDisplay(this.params);
    },
    methods: {
        refresh(params) {
            this.updateDisplay(params);
        },
        updateDisplay(params) {
            this.value = params.value;
            this.parsedValue = new URL(params.value).hostname;
        },
    },
};
