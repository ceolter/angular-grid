export default {
    template: `
        <div :class="cssClass">
            <button @click="clicked()">Click</button>
            {{message}}
        </div>    `,
    data() {
        return {
            cssClass: '',
            message: '',
        };
    },
    beforeMount() {
        this.cssClass = this.params.node.rowPinned ? 'example-full-width-pinned-row' : 'example-full-width-row';
        this.message = this.params.node.rowPinned
            ? `Pinned full width row at index ${this.params.node.rowIndex}`
            : `Normal full width row at index ${this.params.node.rowIndex}`;
    },
    methods: {
        clicked() {
            alert('button clicked');
        },
    },
};
