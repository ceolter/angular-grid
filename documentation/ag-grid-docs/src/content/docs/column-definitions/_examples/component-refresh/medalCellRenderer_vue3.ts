export default {
    template: `<span>{{ displayValue }}</span>`,
    data: function () {
        return {
            displayValue: '',
        };
    },
    beforeMount() {
        console.log('renderer created');
        this.updateDisplayValue(this.params);
    },
    methods: {
        refresh(params) {
            console.log('renderer refreshed');
            this.updateDisplayValue(params);
        },
        updateDisplayValue(params) {
            this.displayValue = new Array(parseInt(params.value, 10)).fill('#').join('');
        },
    },
};
