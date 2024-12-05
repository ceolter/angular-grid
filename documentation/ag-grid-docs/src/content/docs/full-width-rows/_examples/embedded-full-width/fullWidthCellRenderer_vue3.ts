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
        this.cssClass = this.params.pinned ? 'example-full-width-pinned' : 'example-full-width-row';
        this.message = this.params.pinned
            ? `Pinned full width on ${this.params.pinned} - index ${this.params.node.rowIndex}`
            : `Non pinned full width row at index ${this.params.node.rowIndex}`;
    },
    methods: {
        clicked() {
            alert('button clicked');
        },
    },
};
