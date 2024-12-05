export default {
    template: '<div class="mood-renderer"><img style="width: 20px;" :src="imgForMood" /></div>',
    data() {
        return {
            mood: 'Happy',
            imgForMood: null,
        };
    },
    methods: {
        refresh(params) {
            this.setMood(params);
        },

        setMood(params) {
            this.mood = params.value;
            this.imgForMood =
                'https://www.ag-grid.com/example-assets/smileys/' + (this.mood === 'Happy' ? 'happy.png' : 'sad.png');
        },
    },
    created() {
        this.setMood(this.params);
    },
};
