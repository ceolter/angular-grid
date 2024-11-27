export type ExecutorOptions = {
    mode: 'dev' | 'prod';
    outputPath: string;
    examplePath: string;
    inputs: string[];
    output: string;
};
export default function (options: ExecutorOptions): Promise<{
    success: boolean;
    terminalOutput: string;
} | {
    success: boolean;
    terminalOutput?: undefined;
}>;
export declare function generateFiles(options: ExecutorOptions): Promise<any>;
