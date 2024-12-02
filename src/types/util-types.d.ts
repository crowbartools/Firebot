export type NoFunctionValue =
    boolean
    | string
    | number
    | null
    | undefined
    // eslint-disable-next-line no-use-before-define
    | NoFunctionObject
    // eslint-disable-next-line no-use-before-define
    | NoFunctionArray;

export interface NoFunctionObject {
    [key: string]: NoFunctionValue
}

export type NoFunctionArray = Array<NoFunctionValue>;

export type Awaitable<T> = T | PromiseLike<T>;


