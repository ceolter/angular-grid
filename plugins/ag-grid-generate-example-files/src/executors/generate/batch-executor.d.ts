declare const executor: (_taskGraph: import("@nx/devkit").TaskGraph, inputs: Record<string, import("./executor").ExecutorOptions>, overrides: import("./executor").ExecutorOptions, context: import("@nx/devkit").ExecutorContext) => AsyncGenerator<import("../../executors-utils").BatchExecutorTaskResult, any, unknown>;
export default executor;
