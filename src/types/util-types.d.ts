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

/**
 * Converts a camelCase string type into its snake_case equivalent.
 * Uppercase letters and digits are prefixed with an underscore.
 */
type CamelToSnake<S extends string, Acc extends string = ""> = S extends `${infer H}${infer T}`
    ? H extends Uppercase<H>
        ? H extends Lowercase<H>
            ? CamelToSnake<T, `${Acc}_${H}`>
            : CamelToSnake<T, `${Acc}_${Lowercase<H>}`>
        : CamelToSnake<T, `${Acc}${H}`>
    : Acc;

export type SnakeCased<T> = T extends Date
    ? string
    : T extends Array<infer U>
        ? Array<SnakeCased<U>>
        : T extends object
            ? { [K in keyof T as K extends string ? CamelToSnake<K> : K]: SnakeCased<T[K]> }
            : T;