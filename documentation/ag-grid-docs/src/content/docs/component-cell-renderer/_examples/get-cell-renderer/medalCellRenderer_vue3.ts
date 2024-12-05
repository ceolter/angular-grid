export default {
    template: `<span>{{ displayValue }}</span>`,
    data: function () {
        return {
            displayValue: '',
        };
    },
    beforeMount() {
        this.displayValue = new Array(this.params.value).fill('#').join('');
    },
    methods: {
        medalUserFunction() {
            console.log(
                `user function called for medal column: row = ${this.params.node.rowIndex}, column = ${this.params.column.getId()}`
            );
        },
    },
};
