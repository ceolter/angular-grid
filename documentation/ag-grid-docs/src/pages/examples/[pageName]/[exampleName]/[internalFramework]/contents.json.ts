import type { InternalFramework } from '@ag-grid-types';
import { getDocsExamplePages } from '@components/docs/utils/pageData';
import { getGeneratedContents } from '@components/example-generator';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
    const pages = await getCollection('docs');
    const examples = await getDocsExamplePages({
        pages,
    });

    return examples;
}

export async function GET(context: APIContext) {
    const { internalFramework, pageName, exampleName } = context.params;

    let generatedContents;
    try {
        generatedContents = await getGeneratedContents({
            type: 'docs',
            framework: internalFramework as InternalFramework,
            pageName: pageName!,
            exampleName: exampleName!,
        });
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Error generating contents: ${error.message}`);
        return new Response(JSON.stringify({ error: 'Error generating contents.json file' }), {
            status: 400,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    return new Response(JSON.stringify(generatedContents), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
