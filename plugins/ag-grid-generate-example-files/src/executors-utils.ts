import type { ExecutorContext, TaskGraph } from '@nx/devkit';
import { readFileSync } from 'fs';
import * as fs from 'fs/promises';
import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';

export const EXCLUDED_PROPERTIES = ['chartThemeOverrides', 'chartThemes', 'customChartThemes'];

export type TaskResult = {
    success: boolean;
    terminalOutput: string;
    startTime?: number;
    endTime?: number;
};

export type BatchExecutorTaskResult = {
    task: string;
    result: TaskResult;
};

async function exists(filePath: string) {
    try {
        return (await fs.stat(filePath))?.isFile();
    } catch (e) {
        return false;
    }
}

export async function readJSONFile(filePath: string) {
    return (await exists(filePath)) ? JSON.parse(await fs.readFile(filePath, 'utf-8')) : null;
}

export async function readFile(filePath: string) {
    return (await exists(filePath)) ? await fs.readFile(filePath, 'utf-8') : null;
}

export async function writeJSONFile(filePath: string, data: unknown, indent = 2) {
    const dataContent = JSON.stringify(data, null, indent);
    await writeFile(filePath, dataContent);
}

export async function writeFile(filePath: string, newContent: string | Buffer) {
    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(filePath, newContent);
}

export function parseFile(filePath: string) {
    const contents = readFileSync(filePath, 'utf8');
    return ts.createSourceFile('tempFile.ts', contents, ts.ScriptTarget.Latest, true);
}

export function inputGlob(fullPath: string) {
    return glob.sync(`${fullPath}/**/*.ts`, {
        ignore: [`${fullPath}/**/*.test.ts`, `${fullPath}/**/*.spec.ts`],
    });
}

export function batchExecutor<ExecutorOptions>(
    executor: (opts: ExecutorOptions, ctx: ExecutorContext) => Promise<void>
) {
    return async function* (
        _taskGraph: TaskGraph,
        inputs: Record<string, ExecutorOptions>,
        overrides: ExecutorOptions,
        context: ExecutorContext
    ): AsyncGenerator<BatchExecutorTaskResult, any, unknown> {
        const tasks = Object.keys(inputs);

        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
            const task = tasks[taskIndex++];
            const inputOptions = inputs[task];

            let success = false;
            let terminalOutput = '';
            try {
                await executor({ ...inputOptions, ...overrides }, context);
                success = true;
            } catch (e) {
                terminalOutput += `${e}`;
            }

            yield { task, result: { success, terminalOutput } };
        }
    };
}
