import { getDocsExamplePages } from '@components/docs/utils/pageData';
import { getCollection } from 'astro:content';

export async function getAllExamples() {
    const pages = await getCollection('docs');
    const examples = await getDocsExamplePages({
        pages,
    });

    return examples;
}

export async function GET() {
    const examples = await getAllExamples();

    const cleanerExamples = examples.map((example) => {
        return {
            pageName: example.params.pageName,
            exampleName: example.params.exampleName,
            internalFramework: example.params.internalFramework,
        };
    });

    return new Response(JSON.stringify(cleanerExamples), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}
