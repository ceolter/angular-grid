import { defineComponent } from 'vue';

export default defineComponent({
    template: `
        <div>
            <span class="ag-menu-option-part ag-menu-option-icon" role="presentation"></span>
            <span class="ag-menu-option-part ag-menu-option-text">{{params.name}}</span>
            <span class="ag-menu-option-part ag-menu-option-shortcut"><button @click="onClick()">{{params.buttonValue}}</button></span>
            <span class="ag-menu-option-part ag-menu-option-popup-pointer">
                <span v-if="params.subMenu" class="ag-icon ag-icon-small-right" unselectable="on" role="presentation"></span>
            </span>
        </div>
    `,
    methods: {
        configureDefaults() {
            return true;
        },
        onClick() {
            alert(`${this.params.name} clicked`);
        },
    },
});
