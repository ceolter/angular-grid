import Code from '@ag-website-shared/components/code/Code';
import { Checkmark, Copy } from '@carbon/icons-react';
import styled from '@emotion/styled';
import { useMemo, useState } from 'react';

import { type RenderedThemeInfo, useRenderedThemeInfo } from '../../model/rendered-theme';
import { UIPopupButton } from './UIPopupButton';

export const GetThemeButton = () => (
    <ButtonWrapper>
        <UIPopupButton allowedPlacements={['right-end']} dropdownContent={<GetThemeDialog />} variant="primary">
            {downloadIcon} Use Theme
        </UIPopupButton>
    </ButtonWrapper>
);

export const installDocsUrl = 'https://www.ag-grid.com/javascript-data-grid/applying-theme-builder-styling-grid/';

const GetThemeDialog = () => {
    const theme = useRenderedThemeInfo();
    const codeSample = useMemo(() => renderThemeCodeSample(theme), [theme]);
    const downloadLink = `data:text/css;charset=utf-8,${encodeURIComponent(codeSample)}`;

    const [copyButtonClicked, setCopyButtonClicked] = useState(false);

    return (
        <DownloadThemeWrapper>
            <Paragraph>
                Copy the code below into your application to use this theme. See the{' '}
                <a href="/react-data-grid/theming/" target="_blank">
                    Theming API documentation
                </a>{' '}
                for more information.
            </Paragraph>
            <Links>
                <DownloadLink className="button-tertiary" href={downloadLink} download="ag-grid-theme-builder.js">
                    <LinkContent>{downloadIcon} Download</LinkContent>
                </DownloadLink>
                <CopyLink
                    className="button-tertiary"
                    onClick={(e) => {
                        e.preventDefault();
                        if (!copyButtonClicked) {
                            setTimeout(() => {
                                setCopyButtonClicked(false);
                            }, 4000);
                        }
                        setCopyButtonClicked(true);
                        navigator.clipboard.writeText(codeSample);
                    }}
                >
                    <LinkContent
                        className={`copy-state-ready ${!copyButtonClicked ? 'copy-state-visible' : 'copy-state-hidden'}`}
                    >
                        {<Copy />} Copy
                    </LinkContent>
                    <LinkContent
                        className={`copy-state-clicked ${copyButtonClicked ? 'copy-state-visible' : 'copy-state-hidden'}`}
                    >
                        {<Checkmark />} Copied
                    </LinkContent>
                </CopyLink>
            </Links>
            <CodeWrapper>
                <Code code={codeSample} language="js" />
            </CodeWrapper>
        </DownloadThemeWrapper>
    );
};

const renderThemeCodeSample = ({ overriddenParams, usedParts }: RenderedThemeInfo): string => {
    const imports = ['themeQuartz'];
    let code = '';
    code += `// to use myTheme in an application, pass it to the theme grid option\n`;
    const paramsJS = JSON.stringify(overriddenParams, null, 4)
        // strip quotes from keys
        .replaceAll(/^(\s+)"([^"]+)":/gm, '$1$2:')
        // replace string pixel values with numbers
        .replaceAll(/(:\s*)"(\d+)px"/gm, '$1$2');
    code += `const myTheme = themeQuartz\n`;
    for (const part of usedParts) {
        const partImport = camelCase(part.id);
        code += `\t.withPart(${partImport})\n`;
        imports.push(partImport);
    }
    code += `\t.withParams(${paramsJS.replaceAll('\n', '\n    ')});\n`;
    code = `import { ${imports.join(', ')} } from 'ag-grid-community';\n\n${code}`;

    return code;
};

const camelCase = (str: string) => str.replace(/[\W_]+([a-z])/g, (_, letter) => letter.toUpperCase());

const CodeWrapper = styled('div')`
    user-select: text;
    cursor: text;

    .code {
        max-height: 500px;
        overflow: auto;
        margin-top: 0;
    }
`;

const Paragraph = styled('div')``;

const Links = styled('div')`
    display: flex;
    gap: 16px;
`;

const DownloadThemeWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 700px;
    width: 1060px;
    max-width: calc(100vw - 100px);

    > * {
        flex: 0;
    }
`;

const ButtonWrapper = styled('div')`
    width: 100%;
    margin-right: 24px;
`;

const DownloadLink = styled('a')`
    & span {
        padding-right: 4px;
    }
`;

const CopyLink = styled('button')`
    position: relative;

    .copy-state-ready {
        position: absolute;
        inset: 0;
    }
    .copy-state-clicked {
        margin-right: 4px;
    }
    .copy-state-visible {
        opacity: 1;
    }
    .copy-state-hidden {
        opacity: 0;
    }
`;

const LinkContent = styled('span')`
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    transition: opacity 0.2s;
`;

const downloadIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="16" fill="none">
        <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M2.5 10c0 1.885 0 2.829.586 3.414C3.671 14 4.615 14 6.5 14h4c1.885 0 2.829 0 3.414-.586.586-.585.586-1.529.586-3.414m-6-8v8.667m0 0 2.667-2.917M8.5 10.667 5.833 7.75"
        />
    </svg>
);
