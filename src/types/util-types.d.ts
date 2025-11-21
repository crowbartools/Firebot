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