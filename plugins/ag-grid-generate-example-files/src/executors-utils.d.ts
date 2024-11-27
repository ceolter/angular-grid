/// <reference types="node" />
import type { ExecutorContext, TaskGraph } from '@nx/devkit';
import * as ts from 'typescript';
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
export declare function readJSONFile(filePath: string): Promise<any>;
export declare function readFile(filePath: string): Promise<string>;
export declare function writeJSONFile(filePath: string, data: unknown, indent?: number): Promise<void>;
export declare function writeFile(filePath: string, newContent: string | Buffer): Promise<void>;
export declare function parseFile(filePath: string): ts.SourceFile;
export declare function inputGlob(fullPath: string): string[];
export declare function batchExecutor<ExecutorOptions>(executor: (opts: ExecutorOptions, ctx: ExecutorContext) => Promise<void>): (_taskGraph: TaskGraph, inputs: Record<string, ExecutorOptions>, overrides: ExecutorOptions, context: ExecutorContext) => AsyncGenerator<BatchExecutorTaskResult, any, unknown>;
