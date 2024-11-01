import type { InternalFramework } from '@ag-grid-types';
import { OpenInCTA } from '@ag-website-shared/components/open-in-cta/OpenInCTA';
import { cleanIndexHtml } from '@ag-website-shared/utils/cleanIndexHtml';
import type { FileContents } from '@components/example-generator/types';
import { stripOutDarkModeCode } from '@features/example-runner/components/CodeViewer';
import { fetchTextFile } from '@utils/fetchTextFile';
import type { FunctionComponent } from 'react';

import { openCodeSandbox } from '../utils/codeSandbox';

interface Props {
    title: string;
    internalFramework: InternalFramework;
    files: FileContents;
    htmlUrl: string;
    boilerPlateFiles?: FileContents;
    packageJson: Record<string, any>;
    isDev: boolean;
}

export const OpenInCodeSandbox: FunctionComponent<Props> = ({
    title,
    internalFramework,
    files,
    htmlUrl,
    boilerPlateFiles,
    packageJson,
    isDev,
}) => {
    return (
        <OpenInCTA
            type="codesandbox"
            onClick={async () => {
                const html = await fetchTextFile(htmlUrl);
                const indexHtml = isDev ? cleanIndexHtml(html) : html;
                const localFiles = { ...files };
                stripOutDarkModeCode(localFiles);
                const sandboxFiles = {
                    ...localFiles,
                    'package.json': JSON.stringify(packageJson, null, 2),
                    'index.html': indexHtml,
                };
                openCodeSandbox({
                    title,
                    files: sandboxFiles,
                    boilerPlateFiles,
                    internalFramework,
                });
            }}
        />
    );
};
