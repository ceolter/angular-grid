import { OpenInCTA } from '@ag-website-shared/components/open-in-cta/OpenInCTA';
import { cleanIndexHtml } from '@ag-website-shared/utils/cleanIndexHtml';
import type { FileContents } from '@components/example-generator/types';
import { stripOutDarkModeCode } from '@features/example-runner/components/CodeViewer';
import { fetchTextFile } from '@utils/fetchTextFile';
import type { FunctionComponent } from 'react';

import { openPlunker } from '../utils/plunkr';

interface Props {
    title: string;
    files: FileContents;
    htmlUrl: string;
    boilerPlateFiles?: FileContents;
    packageJson: Record<string, any>;
    fileToOpen: string;
    isDev: boolean;
}

export const OpenInPlunkr: FunctionComponent<Props> = ({
    title,
    files,
    htmlUrl,
    boilerPlateFiles,
    packageJson,
    fileToOpen,
    isDev,
}) => {
    return (
        <OpenInCTA
            type="plunker"
            onClick={async () => {
                const html = await fetchTextFile(htmlUrl);
                const indexHtml = isDev ? cleanIndexHtml(html) : html;
                const localFiles = { ...files };
                stripOutDarkModeCode(localFiles);
                const plunkrExampleFiles = {
                    ...localFiles,
                    ...boilerPlateFiles,
                    'package.json': JSON.stringify(packageJson, null, 2),
                    'index.html': indexHtml,
                };
                openPlunker({
                    title,
                    files: plunkrExampleFiles,
                    fileToOpen,
                });
            }}
        />
    );
};
