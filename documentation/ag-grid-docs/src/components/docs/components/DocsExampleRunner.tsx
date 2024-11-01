import type { Framework, InternalFramework } from '@ag-grid-types';
import type { GeneratedContents } from '@features/example-generator/types';
import { ExampleRunner } from '@features/example-runner/components/ExampleRunner';
import { ExternalLinks } from '@features/example-runner/components/ExternalLinks';
import { getLoadingIFrameId } from '@features/example-runner/utils/getLoadingLogoId';
import { useStore } from '@nanostores/react';
import { $internalFramework, $internalFrameworkState } from '@stores/frameworkStore';
import { $queryClient, defaultQueryOptions } from '@stores/queryClientStore';
import { QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import {
    type UrlParams,
    getExampleCodeSandboxUrl,
    getExampleContentsUrl,
    getExamplePlunkrUrl,
    getExampleRunnerExampleUrl,
    getExampleUrl,
} from '../utils/urlPaths';

interface Props {
    name: string;
    title: string;
    exampleHeight?: number;
    framework: Framework;
    pageName: string;
    isDev: boolean;
    typescriptOnly?: boolean;
    suppressDarkMode?: boolean;
}

const getInternalFramework = (
    docsInternalFramework: InternalFramework,
    supportedFrameworks: InternalFramework[] | undefined
): InternalFramework => {
    let internalFramework = docsInternalFramework;
    if (supportedFrameworks && supportedFrameworks.length > 0) {
        if (!supportedFrameworks.includes(docsInternalFramework)) {
            const bestAlternative: Record<InternalFramework, InternalFramework[]> = {
                vanilla: ['typescript'],
                typescript: ['vanilla'],
                reactFunctional: ['reactFunctionalTs', 'typescript', 'vanilla'],
                reactFunctionalTs: ['reactFunctional', 'typescript', 'vanilla'],
                angular: ['typescript', 'vanilla'],
                vue3: ['typescript', 'vanilla'],
            };
            const alternatives = bestAlternative[docsInternalFramework];
            const alternative = alternatives.find((alternative) => supportedFrameworks.includes(alternative));
            if (alternative) {
                internalFramework = alternative;
            }
        }
    }

    return internalFramework;
};

const DocsExampleRunnerInner = ({
    name,
    title,
    exampleHeight,
    typescriptOnly,
    suppressDarkMode,
    pageName,
    isDev,
}: Props) => {
    const exampleName = name;
    const id = `example-${name}`;
    const loadingIFrameId = getLoadingIFrameId({ pageName, exampleName: name });

    const [supportedFrameworks, setSupportedFrameworks] = useState<InternalFramework[] | undefined>(undefined);

    const storeInternalFramework = useStore($internalFramework);
    const internalFrameworkState = useStore($internalFrameworkState);
    const internalFramework = typescriptOnly
        ? 'typescript'
        : getInternalFramework(storeInternalFramework, supportedFrameworks);
    const urlConfig: UrlParams = useMemo(
        () => ({ internalFramework, pageName, exampleName }),
        [internalFramework, pageName, exampleName]
    );

    const { data: [contents] = [undefined, undefined], isError } = useQuery({
        queryKey: ['docsExampleContents', pageName, exampleName, internalFramework, internalFrameworkState],

        queryFn: () => {
            if (internalFrameworkState !== 'synced') {
                return [];
            }

            return Promise.all([
                fetch(getExampleContentsUrl(urlConfig))
                    .then((res) => res.json())
                    .then((json) => {
                        if (json.error) {
                            // eslint-disable-next-line no-console
                            console.error('Error getting', getExampleContentsUrl(urlConfig));
                            return {};
                        }

                        const isTs =
                            internalFramework === 'reactFunctionalTs' ||
                            internalFramework === 'typescript' ||
                            internalFramework === 'angular';
                        if (!isTs) {
                            delete json.files['interfaces.ts'];
                        }
                        if (internalFramework.startsWith('vue') || internalFramework.startsWith('react')) {
                            delete json.files['index.html'];
                        }
                        return json;
                    }),
            ]) as Promise<[GeneratedContents]>;
        },

        ...defaultQueryOptions,
    });
    const urls = {
        exampleRunnerExampleUrl: getExampleRunnerExampleUrl(urlConfig),
        exampleUrl: getExampleUrl(urlConfig),
        plunkrHtmlUrl: getExamplePlunkrUrl(urlConfig),
        codeSandboxHtmlUrl: getExampleCodeSandboxUrl(urlConfig),
    };

    useEffect(() => {
        if (isError) {
            setSupportedFrameworks(['typescript']);
        }

        if (!contents) {
            return;
        }

        // If not provided we set to an empty array to finish rendering
        setSupportedFrameworks(contents.supportedFrameworks ?? []);
    }, [contents, isError]);

    const externalLinks = contents ? (
        <ExternalLinks
            title={title}
            internalFramework={internalFramework}
            exampleFiles={contents.files}
            exampleBoilerPlateFiles={contents.boilerPlateFiles}
            packageJson={contents.packageJson}
            initialSelectedFile={contents.mainFileName}
            plunkrHtmlUrl={urls.plunkrHtmlUrl}
            codeSandboxHtmlUrl={urls.codeSandboxHtmlUrl}
            isDev={isDev}
        />
    ) : undefined;

    const validFramework =
        supportedFrameworks &&
        (supportedFrameworks.length == 0 ||
            (supportedFrameworks?.length > 0 && supportedFrameworks?.includes(internalFramework)));
    return validFramework ? (
        <ExampleRunner
            id={id}
            title={title}
            exampleUrl={urls.exampleUrl}
            exampleRunnerExampleUrl={urls.exampleRunnerExampleUrl}
            exampleHeight={exampleHeight}
            exampleFiles={contents?.files}
            initialSelectedFile={contents?.mainFileName}
            internalFramework={internalFramework}
            externalLinks={externalLinks}
            loadingIFrameId={loadingIFrameId}
            supportedFrameworks={supportedFrameworks}
            suppressDarkMode={suppressDarkMode}
        />
    ) : null;
};

export const DocsExampleRunner = (props: Props) => {
    const queryClient = useStore($queryClient);

    return (
        <QueryClientProvider client={queryClient}>
            <DocsExampleRunnerInner {...props} />
        </QueryClientProvider>
    );
};
