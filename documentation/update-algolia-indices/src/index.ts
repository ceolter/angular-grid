import { program } from 'commander';
import dotenv from 'dotenv';
import assert from 'node:assert/strict';

import { getApiPageData, parseApiPageData } from './generators/api-refs';
import { getAllDocPages, parseDocPage } from './generators/docs-pages';
import type { FlattenedMenuItem } from './generators/docs-pages';
import { SUPPORTED_FRAMEWORKS } from './utils/constants';
import type { SupportedFrameworks } from './utils/constants';
import { enablePrintMode, updateAlgolia, writeResults } from './utils/output';

program
    .option(
        '-d, --debug <debug>',
        "if debug = true (not provided - it'll default to true), the script writes the records it would upload into JSON files for inspection",
        true
    )
    .option(
        '-i, --indexNamePrefix <prefix>',
        'if indexNamePrefix = "ag-grid-dev" we\'ll update development indices, and for "ag-grid" production',
        'ag-grid-dev'
    );
program.parse();
const options = program.opts();
const debug = options.debug === true;
const indexNamePrefix = options.indexNamePrefix;
if (debug) {
    console.log('Running in debug mode, indices will not be updated, output will be logged in /output');
    enablePrintMode();
} else {
    console.log(`Running in live mode, indices for ${indexNamePrefix} will be updated.`);
    // Env variables only required if publishing
    dotenv.config();
}

const indices: Record<SupportedFrameworks, any[]> = {
    react: [],
    angular: [],
    vue: [],
    javascript: [],
};
const prefixPath =
    (framework: SupportedFrameworks) =>
    (record: FlattenedMenuItem): FlattenedMenuItem => ({ ...record, path: `/${framework}-data-grid/${record.path}` });

/**
 * First scrape docs for APIs and generate Algolia records
 */
const apiPages = getApiPageData();

apiPages.forEach((page) => {
    const records = parseApiPageData(page);

    const normalizedText = page.breadcrumbSuffix.replace(/ /g, '-').toLowerCase();

    SUPPORTED_FRAMEWORKS.forEach((framework) => {
        const outputName = `api/${framework}/${normalizedText}.json`;
        const prefixedRecords = records.map(prefixPath(framework));
        writeResults(outputName, prefixedRecords);
        indices[framework].push(...prefixedRecords);
    });
});

/**
 * Then scrape the docs for the content pages and generate Algolia records
 */
const docPages = getAllDocPages();
assert(docPages.length > 0, 'Doc pages should not be empty');
writeResults('docs/menu.json', docPages);

for (let i = 0; i < SUPPORTED_FRAMEWORKS.length; i++) {
    const framework = SUPPORTED_FRAMEWORKS[i];
    console.log('Processing framework:', framework);

    const pages = docPages.map(prefixPath(framework));
    const promises = pages.map((page) => parseDocPage(page));
    const results = await Promise.all(promises);

    // If print mode, try to write the results to disk
    docPages.forEach((page, i) => {
        const normalizedText = page.path.toLowerCase();
        const outputName = `docs/${framework}/${normalizedText}.json`;
        writeResults(outputName, results[i]);
    });

    results.forEach((result) => {
        if (result) {
            indices[framework].push(...result);
        }
    });

    const indexName = `${indexNamePrefix}_${framework}`;
    await updateAlgolia(indexName, indices[framework]);
}
