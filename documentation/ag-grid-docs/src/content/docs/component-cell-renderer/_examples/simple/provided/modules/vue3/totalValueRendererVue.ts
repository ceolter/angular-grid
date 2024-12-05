import { defineComponent } from 'vue';

export default defineComponent({
    template: `
        <span>
              <span>{{ cellValue }}</span>
              <button @click="buttonClicked()">Push For Total</button>
          </span>
    `,
    setup(props) {
        const cellValue = props.params.valueFormatted ? props.params.valueFormatted : props.params.value;
        const buttonClicked = () => alert(`${cellValue} medals won!`);

        // props.params contains the cell and row information and is made available to this component at creation time
        // see ICellRendererParams for more details
        return {
            cellValue,
            buttonClicked,
        };
    },
});
