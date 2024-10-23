import cssAutoPrefix from 'autoprefixer';
import cssNano from 'cssnano';
import fs from 'fs';
import { globSync } from 'glob';
import { basename, dirname, join } from 'path';
import postcss from 'postcss';
import cssImport from 'postcss-import';
import cssRtl from 'postcss-rtlcss';
import cssUrl from 'postcss-url';

const packageArg = process.argv.indexOf('--package');
const packageFolder = (packageArg >= 0 && process.argv[packageArg + 1]) || '*';

const srcFolders = join(__dirname, '../packages', packageFolder, 'src');
const DEV_MODE = process.env.CSS_DEBUG != null;

const written = new Set<string>();

const generateAllCSSEmbeds = async () => {
    const cssEntryPoints = globSync(join(srcFolders, '**/*.css'));
    for (const cssEntryPoint of cssEntryPoints) {
        await generateCSSEmbed(cssEntryPoint);
    }

    // remove any old generated files not written in this execution
    deleteUntouchedFilesMatching(join(srcFolders, '**/*.css-GENERATED.ts'));

    // generated file name pattern was changed 2024-10-23, remove files matching
    // the old pattern (this can be removed in a few weeks once everybody has
    // run it and the old files are cleaned up)
    deleteUntouchedFilesMatching(join(__dirname, '../packages/ag-grid-community/src/theming/**/GENERATED-*.ts'));
};

const generateCSSEmbed = async (entry: string) => {
    const dir = dirname(entry);
    const entryName = basename(entry, '.css');
    if (entryName.startsWith('_')) {
        return;
    }
    const outputFile = join(dir, `${entryName}.css-GENERATED.ts`);
    const cssString = await loadAndProcessCSSFile(entry);
    const exportName = camelCase(entryName) + 'CSS';
    const result = `export const ${exportName} = /*css*/ \`${cssString.replace(/`/g, '\\`')}\`;\n`;

    await writeTsFile(outputFile, result);
    written.add(outputFile);
};

const loadAndProcessCSSFile = async (cssPath: string) => {
    const css = fs.readFileSync(cssPath, 'utf8');
    const result = await postcss(
        // inline @import(./path.css)
        cssImport(),
        // embed e.g. url(./path.svg) as data uri
        cssUrl({ url: 'inline' }),
        // add vendor prefixes
        cssAutoPrefix(),
        // auto RTL support
        cssRtl({
            ltrPrefix: `.ag-ltr`,
            rtlPrefix: `.ag-rtl`,
            bothPrefix: `:is(.ag-ltr, .ag-rtl)`,
        }),
        cssNano({
            preset: [
                'default',
                {
                    discardComments: !DEV_MODE,
                    normalizeWhitespace: !DEV_MODE,
                    minifySelectors: !DEV_MODE,
                },
            ],
        })
    ).process(css, { from: cssPath, to: cssPath });
    return result.css;
};

const deleteUntouchedFilesMatching = (pattern: string) => {
    const generatedFiles = globSync(pattern);
    for (const generatedFile of generatedFiles) {
        if (!written.has(generatedFile)) {
            fs.rmSync(generatedFile);
        }
    }
};

const writeTsFile = async (path: string, content: string) => {
    const fs = await import('fs');
    // write to a tmp file and rename over the existing file to provide atomic modification
    const tmpFile = path + '.tmp';
    fs.writeFileSync(tmpFile, content);
    fs.renameSync(tmpFile, path);
};

const camelCase = (str: string) => str.replace(/[\W_]+([a-z])/g, (_, letter) => letter.toUpperCase());

generateAllCSSEmbeds();
