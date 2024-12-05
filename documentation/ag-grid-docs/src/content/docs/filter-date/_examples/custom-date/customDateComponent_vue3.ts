export default {
    template: `
      <div class="ag-input-wrapper custom-date-filter" role="presentation" ref="flatpickr">
      <input type="text" ref="eInput" data-input style="width: 100%;"/>
      <a class="input-button" title="clear" data-clear>
        <i class="fa fa-times"></i>
      </a>
      </div>
    `,
    data: function () {
        return {
            date: null,
            ariaLabel: undefined,
        };
    },
    mounted() {
        this.picker = flatpickr(this.$refs['flatpickr'], {
            onChange: this.onDateChanged.bind(this),
            dateFormat: 'd/m/Y',
            wrap: true,
        });

        this.eInput = this.$refs['eInput'];

        this.picker.calendarContainer.classList.add('ag-custom-component-popup');

        this.eInput.setAttribute('aria-label', this.ariaLabel);
    },
    methods: {
        onDateChanged(selectedDates) {
            this.date = selectedDates[0] || null;
            this.params.onDateChanged();
        },

        getDate() {
            return this.date;
        },

        setDate(date) {
            this.picker.setDate(date);
            this.date = date || null;
        },

        setInputPlaceholder(placeholder) {
            this.eInput.setAttribute('placeholder', placeholder);
        },

        setInputAriaLabel(label) {
            if (this.eInput) {
                this.eInput.setAttribute('aria-label', label);
            } else {
                this.ariaLabel = label;
            }
        },
    },
};
