export default {
    template: `<span>
        <button style="height: 30px;" @click="onClick">✎</button>
        <span style="padding-left: 4px;">{{displayValue}}</span>
    </span>`,

    data() {
        return {
            displayValue: '',
        };
    },
    beforeMount() {
        this.displayValue = this.params.value;
    },
    methods: {
        onClick() {
            this.params.api.startEditingCell({
                rowIndex: this.params.node.rowIndex,
                colKey: this.params.column.getId(),
            });
        },
    },
};
