const WrappedFunctionMarker = Symbol('WrappedFunctionMarker');

type FunctionParams = (...args: any[]) => any;
type WrapperFunctionParams = (fn: FunctionParams, ...args: any[]) => any;

export const wrapFn = (fn: FunctionParams, wrapperFn: WrapperFunctionParams) => {
    if ((fn as any)[WrappedFunctionMarker]) {
        return fn;
    }

    const wrapped = (...args: any[]) => wrapperFn(fn, ...args);

    wrapped[WrappedFunctionMarker] = WrappedFunctionMarker;

    return wrapped;
};
