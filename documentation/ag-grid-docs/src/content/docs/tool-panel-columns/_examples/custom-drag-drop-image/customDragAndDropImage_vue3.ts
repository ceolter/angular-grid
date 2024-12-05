export default {
    template: `
        <div class="my-custom-drag-and-drop-cover" ref="eImage">
            <i class="fas fa-2x" ref="eIcon"></i>
            <div ref="eLabel"></div>
        </div>
    `,
    mounted() {
        this.$refs.eImage.style.setProperty('background-color', this.params.accentColour);
    },
    methods: {
        setLabel(label) {
            this.$refs.eLabel.innerHTML = label;
        },

        setIcon(icon) {
            const { dragSource, api } = this.params;
            const { eIcon } = this.$refs;

            if (!icon) {
                icon = dragSource.getDefaultIconName ? dragSource.getDefaultIconName() : 'notAllowed';
            }

            if (icon === 'hide' && api.getGridOption('suppressDragLeaveHidesColumns')) {
                return;
            }

            eIcon.classList.toggle('fa-hand-point-left', icon === 'left');
            eIcon.classList.toggle('fa-hand-point-right', icon === 'right');
            eIcon.classList.toggle('fa-mask', icon === 'hide');
            eIcon.classList.toggle('fa-ban', icon === 'notAllowed');
            eIcon.classList.toggle('fa-thumbtack', icon === 'pinned');
            eIcon.classList.toggle('fa-walking', icon === 'move');
            eIcon.classList.toggle('fa-layer-group', icon === 'group');
            eIcon.classList.toggle('fa-table', icon === 'aggregate');
            eIcon.classList.toggle('fa-ruler-combined', icon === 'pivot');
        },
    },
};
