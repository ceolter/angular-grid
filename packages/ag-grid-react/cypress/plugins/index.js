// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

// eslint-disable-next-line @typescript-eslint/no-var-requires
const preprocessor = require('cypress-react-unit-test/plugins/babelrc');
module.exports = (on, config) => {
    preprocessor(on, config);

    on(`task`, {
        // bubble up errors...so we can fail tests on console.errors
        error(message) {
            // eslint-disable-next-line no-console
            console.error('CONSOLE ERROR: ', message);
            return null;
        },
    });

    // IMPORTANT to return the config object
    return config;
};
