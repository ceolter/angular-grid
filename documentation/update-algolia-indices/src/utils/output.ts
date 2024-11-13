import algoliasearch from 'algoliasearch';
import fs from 'fs';
import { dirname } from 'path';

const outputDir = './output';
// in print mode, the results are stored in /output/*.json files, otherwise logged in algolia.
let printMode = false;
export const enablePrintMode = () => {
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true });
    }

    printMode = true;
};

export const writeResults = (path: string, records: any) => {
    if (!printMode) {
        return;
    }

    const fileName = `${outputDir}/${path}`;
    const dirName = dirname(fileName);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }
    fs.writeFileSync(fileName, JSON.stringify(records, null, 2));
};

export const logWarning = (warning: any) => {
    if (!printMode) {
        return;
    }

    const fileName = `${outputDir}/warnings.json`;
    const dirName = dirname(fileName);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    const contents = `${JSON.stringify(warning, null, 2)}\n`;
    if (fs.existsSync(fileName)) {
        fs.appendFileSync(fileName, contents);
    } else {
        fs.writeFileSync(fileName, contents);
    }
};

export const updateAlgolia = async (indexName: string, records: Record<string, any>[]) => {
    if (printMode) {
        return;
    }

    const algoliaClient = algoliasearch(process.env.PUBLIC_ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);
    const index = algoliaClient.initIndex(indexName);

    index.setSettings({
        searchableAttributes: ['metaTag', 'title', 'heading', 'subHeading'], // attributes used for searching
        disableExactOnAttributes: ['text'], // don't allow "exact matches" in the text
        attributesToSnippet: ['text:40'], // configure snippet length shown in results
        distinct: 1, // only allow each page to appear in the results once
        attributeForDistinct: 'breadcrumb', // configure what is used to decide if a page is the same
        customRanking: ['asc(rank)', 'asc(positionInPage)'], // custom tweaks to the ranking
        camelCaseAttributes: ['heading', 'subHeading'], // split camelCased text so it can match regular text
        hitsPerPage: 10, // how many results should be returned per page
        snippetEllipsisText: '…', // the character used when truncating content for snippets
    });

    try {
        await index.clearObjects();
        const result = await index.saveObjects(records);

        console.log(`Response from Algolia:`, result);
    } catch (e) {
        console.error(`Failed to save records.`, e);
    }
};
