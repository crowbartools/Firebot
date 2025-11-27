export type NoFunctionValue =
    boolean
    | string
    | number
    | null
    | undefined

    | NoFunctionObject

    | NoFunctionArray;

export interface NoFunctionObject {
    [key: string]: NoFunctionValue;
}

export type NoFunctionArray = Array<NoFunctionValue>;

export type Awaitable<T> = T | PromiseLike<T>;

type ObjectOfUnknowns = {
    [key: string]: unknown;
};

export type KeyValuePair<K = string, V = string> = {
    key: K;
    value: V;
};

export type FileFilter = {
    name: string;
    extensions: string[];
};