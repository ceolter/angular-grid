export default {
    data() {
        return {
            isGroup: null,
            paddingLeft: null,
            rotation: null,
        };
    },
    template: `
        <div
            :style="{ paddingLeft: paddingLeft }"
        >
            <div
                v-if="isGroup"
                :style="{ transform: rotation, cursor: 'pointer', display: 'inline-block' }"
                @click="onExpand"
            >
                &rarr;
            </div>
            &nbsp;
            {{params.value}}
        </div>
    `,
    methods: {
        onExpand() {
            this.params.node.setExpanded(!this.params.node.expanded);
        },
        onExpandedChanged() {
            this.rotation = this.params.node.expanded ? 'rotate(90deg)' : 'rotate(0deg)';
        },
    },
    beforeMount() {
        this.isGroup = this.params.node.group;
        this.paddingLeft = `${this.params.node.level * 15}px`;
        this.rotation = this.params.node.expanded ? 'rotate(90deg)' : 'rotate(0deg)';

        this.params.node.addEventListener('expandedChanged', this.onExpandedChanged);
    },
    beforeDestroy() {
        this.params.node.removeEventListener('expandedChanged', this.onExpandedChanged);
    },
};
