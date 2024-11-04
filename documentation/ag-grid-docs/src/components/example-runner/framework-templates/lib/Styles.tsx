import { pathJoin } from '@utils/pathJoin';

interface Props {
    baseUrl: string;
    files: string[];
}

export const Styles = ({ baseUrl, files = [] }: Props) =>
    files.map((file) => {
        const srcFile = pathJoin(baseUrl, file);
        return <link key={file} rel="stylesheet" href={srcFile} />;
    });
