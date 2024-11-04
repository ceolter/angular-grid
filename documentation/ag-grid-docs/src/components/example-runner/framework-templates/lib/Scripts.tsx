import { pathJoin } from '@utils/pathJoin';

interface Props {
    baseUrl: string;
    files: string[];
}

export const Scripts = ({ baseUrl, files = [] }: Props) => {
    return files.map((file) => {
        const srcFile = pathJoin(baseUrl, file);
        return <script key={file} src={srcFile} />;
    });
};
