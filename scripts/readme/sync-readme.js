// Framework Code Snippets
const {
    quickStartReact,
    quickStartReactModule,
    quickStartAngular,
    quickStartAngularModule,
    quickStartVue3,
    quickStartVue3Module,
} = require('./readme-framework-content');

// README Files
const patterns = [
    // Framework Packages
    'packages/ag-grid-angular/README.md',
    'packages/ag-grid-angular/projects/ag-grid-angular/README.md',
    'packages/ag-grid-react/README.md',
    'packages/ag-grid-community/README.md',
    'packages/ag-grid-vue3/README.md',
    // Top-Level Framework Modules
    'community-modules/react/README.md',
    'community-modules/angular/README.md',
    'community-modules/angular/projects/ag-grid-angular/README.md',
    'community-modules/vue3/README.md',
];

// Dependencies
const fs = require('fs');
const path = require('path');
const glob = require('glob');
const prettier = require('prettier');
const rootReadme = fs.readFileSync('./README.md').toString();
const libraries = ['ag-grid-community', 'ag-grid-enterprise'];
const packageReadmeList = patterns.flatMap((pattern) => glob.sync(pattern));

function titleCase(name) {
    return `${name.substring(0, 1).toLocaleUpperCase()}${name.substring(1)}`;
}

const getPackageName = (readme) => {
    const directoryName = path.dirname(readme).split('/').at(-1);
    if (!directoryName.includes('ag-grid')) {
        return `ag-grid-${directoryName}`;
    }

    return directoryName;
};

const updateContent = (readme) => {
    let newReadme = '';
    const packageName = getPackageName(readme);
    const isModule = readme.includes('community-modules');
    const isLibrary = libraries.includes(packageName);
    const framework = isLibrary ? 'javascript' : packageName.split('-').at(-1).replace('vue3', 'vue');
    const packageTitle = packageName
        .replaceAll('-', ' ')
        .replaceAll('ag grid', '')
        .split(' ')
        .map((s) => titleCase(s))
        .join(' ')
        .trim();

    // Don't alter ag-charts-community README
    if (packageName === 'ag-grid-community') {
        return rootReadme.replaceAll('./readme-assets/', '../../readme-assets/');
    }

    // Update Content
    newReadme = rootReadme
        .replaceAll('https://www.ag-grid.com/javascript/', `https://www.ag-grid.com/${framework}/`)
        .replaceAll('/ag-grid-community', isModule ? `/@ag-grid-community/${framework}` : `/${packageName}`)
        .replaceAll('/javascript-data-grid/', `/${framework}-data-grid/`)
        .replaceAll('$ npm install --save ag-grid-community', `$ npm install --save ${packageName}`)
        .replaceAll('./readme-assets/', '../../readme-assets/')
        .replaceAll(
            '?utm_source=ag-grid-readme',
            isModule
                ? `?utm_source=@ag-grid-community/${framework}-readme`
                : `?utm_source=ag-grid-${packageTitle.toLowerCase()}-readme`
        )
        .replaceAll('JavaScript', `${packageTitle}`);

    // Update Main Description
    newReadme = updateMainDescription(newReadme, packageTitle);

    // Update Quick Start Desc
    newReadme = updateQuickStartDescription(newReadme, packageTitle);

    // Update Setup for Frameworks
    newReadme = updateSetup(newReadme, packageTitle, isModule);

    // Update Installation for Modules
    if (isModule) {
        newReadme = newReadme.replaceAll(
            `npm install --save ag-grid-${framework}`,
            `npm install --save @ag-grid-community/core @ag-grid-community/${framework}`
        );
    }

    return newReadme;
};

const updateMainDescription = (content, packageTitle) => {
    const newContent = `\t<p>AG Grid is a <strong>fully-featured</strong> and <strong>highly customizable</strong> ${packageTitle} Data Grid. It delivers <strong>outstanding performance</strong> and has <strong>no third-party dependencies</strong>.</p>\t`;

    // Define the start and end markers
    const startMarker = '<!-- START MAIN DESCRIPTION -->';
    const endMarker = '<!-- END MAIN DESCRIPTION -->';

    // Construct the new content to be inserted
    const newSection = `${startMarker}\n${newContent}\n${endMarker}`;

    // Use regular expressions to find and replace the content between the markers
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
    return content.replace(regex, newSection);
};

const updateQuickStartDescription = (content, packageTitle) => {
    let newContent;
    const normalizedTitle = packageTitle.trim().toLowerCase();
    switch (normalizedTitle) {
        case 'react':
        case 'angular':
        case 'vue3':
            newContent =
                'AG Grid is easy to set up - all you need to do is provide your data and define your column structure.';
            break;
        default:
            return content;
    }

    // Define the start and end markers
    const startMarker = '<!-- START QUICK START DESCRIPTION -->';
    const endMarker = '<!-- END QUICK START DESCRIPTION -->';

    // Construct the new content to be inserted
    const newSection = `${startMarker}\n${newContent}\n${endMarker}`;

    // Use regular expressions to find and replace the content between the markers
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
    return content.replace(regex, newSection);
};

const updateSetup = (content, packageTitle, isModule) => {
    let newContent;
    const normalizedTitle = packageTitle.trim().toLowerCase();
    switch (normalizedTitle) {
        case 'react':
            newContent = isModule ? quickStartReactModule : quickStartReact;
            break;
        case 'angular':
            newContent = isModule ? quickStartAngularModule : quickStartAngular;
            break;
        case 'vue3':
            newContent = isModule ? quickStartVue3Module : quickStartVue3;
            break;
        default:
            return content;
    }

    // Define the start and end markers
    const startMarker = '<!-- START SETUP -->';
    const endMarker = '<!-- END SETUP -->';

    // Construct the new content to be inserted
    const newSection = `${startMarker}\n${newContent}\n${endMarker}`;

    // Use regular expressions to find and replace the content between the markers
    const regex = new RegExp(`${startMarker}[\\s\\S]*?${endMarker}`, 'g');
    return content.replace(regex, newSection);
};

for (const readme of packageReadmeList) {
    prettier
        .format(updateContent(readme), { filepath: './README.md', tabWidth: 4, singleQuote: true })
        .then((result) => fs.writeFileSync(readme, result))
        .catch((error) => {
            console.error(error);
            process.exitCode = 1;
        });
}
