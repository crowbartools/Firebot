import type angular from "angular";

export type BindingsDefinition<Bindings> = {
    [K in keyof Bindings]: {} extends Pick<Bindings, K>
        ? Bindings[K] extends string
            ? "@?" | "<?" | "=?" | `@?${string}` | `<?${string}` | `=?${string}`
            : Bindings[K] extends boolean
                ? "<?" | "=?" | `<?${string}` | `=?${string}`
                : Bindings[K] extends number
                    ? "<?" | "=?" | `<?${string}` | `=?${string}`
                    : Bindings[K] extends (...args: any[]) => any
                        ? "&?" | `&?${string}`
                        : "<?" | "=?" | `<?${string}` | `=?${string}`
        : Bindings[K] extends string
            ? "@" | "<" | "=" | `@${string}` | `<${string}` | `=${string}`
            : Bindings[K] extends boolean
                ? "<" | "=" | `<${string}` | `=${string}`
                : Bindings[K] extends number
                    ? "<" | "=" | `<${string}` | `=${string}`
                    : Bindings[K] extends (...args: any[]) => any
                        ? "&" | `&${string}`
                        : "<" | "=" | `<${string}` | `=${string}`;
};

export type FirebotComponent<Bindings, ExtraControllerProps = {}> = angular.IComponentOptions & {
    bindings: BindingsDefinition<Bindings>;
    controller: (
        this: angular.IController & Bindings & ExtraControllerProps & { [key: string]: unknown },
        ...args: unknown[]
    ) => void;
};