
type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export function pick<T, K extends keyof T>(obj: T, keys: K[]): Writeable<Pick<T, K>> {
    return keys.reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {} as Pick<T, K>);
}