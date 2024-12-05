export default {
    template: `
        <div class="custom-element">        
            <button>Age: {{params.data.age ? params.data.age : '?'}}</button>
            <input :value="params.data.country ? params.data.country : ''" />
            <a :href="'https://www.google.com/search?q=' + params.data.sport" target="_blank">{{params.data.sport}}</a>
        </div>`,
};
