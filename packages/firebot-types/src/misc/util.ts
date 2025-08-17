export type OnlyRequire<T, K extends keyof T> = Required<Pick<T, K>> &
    Partial<Omit<T, K>>;

export type Awaitable<T> = T | Promise<T>;
