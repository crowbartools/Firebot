/**
 * Deeply clones the given subject; supports circular references
 *
 * @param subject Subject to clone
 * @param freeze If the cloned instance should be frozen. Default is `false`.
 * @param cloning Internal; map of members currently being cloned
 * @returns Cloned instance of subject
 */
export const deepClone = <T extends object>(
    subject: T,
    freeze = false,
    cloning: Map<unknown, unknown> = undefined
): T => {
    if (subject == null || typeof subject !== 'object') {
        return subject;
    }

    if (cloning == null) {
        cloning = new Map();
    }

    const result = (Array.isArray(subject) ? [] : {}) as T;
    for (const [key, value] of Object.entries(subject)) {
        if (value == null || typeof value !== 'object') {
            result[key] = value as unknown;

            // value is in the process of being cloned as a result of circular reference
            // use the cached cloning value
        } else if (cloning.has(value)) {
            result[key] = cloning.get(value);
        } else {
            cloning.set(value, result);
            result[key] = deepClone(value as object, freeze, cloning);
            cloning.delete(value);
        }
    }
    if (freeze) {
        Object.freeze(result);
    }

    return result;
};

/**
 * Deeply freezes the given subject; supports circular references
 *
 * @param subject The subject to deep freeze
 * @returns The frozen subject
 */
export const deepFreeze = (subject: unknown) => {
    if (subject == null || typeof subject !== 'object') {
        return subject;
    }

    // Freeze subject before walking properties to prevent inf-loop
    // caused by circular references
    Object.freeze(subject);
    for (const value of Object.values(subject)) {
        if (!Object.isFrozen(value)) {
            deepFreeze(value);
        }
    }
    return subject;
};


/**
 * Extract a property from an object using a dot-notation property path
 *
 * @param obj Object to traverse
 * @param path Dot notation-based property path (e.g. `prop.subProp`)
 * @param defaultValue Fefault value if no value exists at the specified path
 * @returns Value at the given path, or if path doesn't exist, `defaultValue`. Default is `undefined`.
 */
export const extractPropertyWithPath = <T = unknown>(
    obj: object,
    path: string,
    defaultValue: T = undefined
): T => {
    const propertyPath = path.split(".");
    let data = structuredClone(obj);
    try {
        for (const item of propertyPath) {
            if (data === undefined) {
                return defaultValue;
            }
            data = data[item] as object;
        }
        return (data ?? defaultValue) as T;
    } catch {
        return defaultValue;
    }
};

/**
 * Checks if an object is a plain {@linkcode Object} type
 * @param v Object to check
 * @returns `true` if object is plain {@linkcode Object} or `false` otherwise
 */
export const isPlainObject = (v: unknown): v is Record<string, unknown> =>
    Object.prototype.toString.call(v) === "[object Object]";

/**
 * Creates a simple clone of an object by using `JSON.stringify` then `JSON.parse`
 * @param obj Object to clone
 * @returns Clone of the object
 */
export const simpleClone = <T = unknown>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj)) as T;
};