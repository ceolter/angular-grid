import type { InternalFramework } from '@ag-grid-types';
import type { FileContents } from '@components/example-generator/types';
import { isReactInternalFramework } from '@utils/framework';
import { getParameters } from 'codesandbox/lib/api/define';

type SandboxFiles = Parameters<typeof getParameters>[0]['files'];

const CREATE_CODE_SANDBOX_URL = 'https://codesandbox.io/api/v1/sandboxes/define';

const getCodeSandboxTemplate = (config: object) => {
    return { ...config, tags: ['ag-grid', 'ag-charts', 'example'], published: false };
};

const getPathForFile = ({
    fileName,
    internalFramework,
}: {
    fileName: string;
    internalFramework: InternalFramework;
}) => {
    if (!isReactInternalFramework(internalFramework)) {
        return fileName;
    }

    if (fileName === 'index.html') {
        return `public/index.html`;
    }

    if (/(.js|.jsx|.tsx|.ts|.css)$/.test(fileName)) {
        if (fileName.endsWith('.js')) {
            return `public/${fileName}`;
        }

        if (fileName.startsWith('index.')) {
            return `src/${fileName === 'index.jsx' ? 'index.js' : fileName}`;
        }

        return `src/${fileName}`;
    }

    return fileName;
};

const getCodeSandboxRuntime = (internalFramework: InternalFramework) => {
    switch (internalFramework) {
        case 'reactFunctional':
            return 'create-react-app';
        case 'reactFunctionalTs':
            return 'create-react-app-typescript';
        default:
            return 'static';
    }
};

const getCodeSandboxFiles = ({
    files,
    boilerPlateFiles,
    internalFramework,
}: {
    files: FileContents;
    boilerPlateFiles: FileContents;
    internalFramework: InternalFramework;
}) => {
    const sandboxFiles: SandboxFiles = {};
    const allFiles = isReactInternalFramework(internalFramework)
        ? {
              ...files,
          }
        : { ...boilerPlateFiles, ...files };

    if (allFiles['package.json'] == undefined) {
        // don't include undefined package.json
        delete allFiles['package.json'];
    }

    for (const [name, content] of Object.entries(allFiles)) {
        const key = getPathForFile({ fileName: name, internalFramework });
        sandboxFiles[key] = {
            content: content as string,
            isBinary: false,
        };
    }

    return sandboxFiles;
};

const createHiddenInputFactory =
    (form: HTMLFormElement) =>
    ({ name, value }: { name: string; value: string }) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;

        form.appendChild(input);
    };

const getCodeSandboxFilesToSubmit = ({
    title,
    files,
    boilerPlateFiles,
    internalFramework,
}: {
    title: string;
    files: FileContents;
    boilerPlateFiles: FileContents;
    internalFramework: InternalFramework;
}) => {
    const runtime = getCodeSandboxRuntime(internalFramework);
    const configFiles: SandboxFiles = {
        '.codesandbox/template.json': {
            content: JSON.stringify(getCodeSandboxTemplate({ title, runtime }), null, 2),
            isBinary: false,
        },
    };
    const sandboxFiles: SandboxFiles = {
        ...configFiles,
        ...getCodeSandboxFiles({
            files,
            boilerPlateFiles,
            internalFramework,
        }),
    };

    return sandboxFiles;
};

/**
 * Open example in code sandbox
 *
 * NOTE: Creating a form and submitting parameters instead of using the JSON API so
 * that there is no pop up warning
 */
export const openCodeSandbox = ({
    title,
    files,
    boilerPlateFiles,
    internalFramework,
}: {
    title: string;
    files: FileContents;
    boilerPlateFiles: FileContents;
    internalFramework: InternalFramework;
}) => {
    const form = document.createElement('form');
    form.method = 'post';
    form.style.display = 'none';
    form.action = CREATE_CODE_SANDBOX_URL;
    form.target = '_blank';

    const addHiddenInput = createHiddenInputFactory(form);
    const parameters = getParameters({
        files: getCodeSandboxFilesToSubmit({
            title,
            files,
            boilerPlateFiles,
            internalFramework,
        }),
        template: getCodeSandboxRuntime(internalFramework),
    });

    addHiddenInput({ name: 'tags[0]', value: 'ag-grid' });
    addHiddenInput({ name: 'tags[1]', value: 'ag-charts' });
    addHiddenInput({ name: 'tags[2]', value: 'example' });
    addHiddenInput({ name: 'published', value: 'false' });
    addHiddenInput({ name: 'title', value: title });
    addHiddenInput({ name: 'parameters', value: parameters });

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
};
