import IpcEvents from "SharedTypes/ipc/ipc-events";
import IpcMethods from "SharedTypes/ipc/ipc-methods";
import { OnlyRequire } from "SharedTypes/misc/global";
import { communicator } from ".";

/**
 * Class method decorator for automatically emitting communicator events
 * Method name must match a known IPC Event and it's argument must
 * match the expected event data.
 */
export const emitIpcEvent = <K extends keyof IpcEvents>(
    _: unknown,
    methodName: K,
    descriptor: TypedPropertyDescriptor<(data: IpcEvents[K]) => void>
) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (data) {
        // emit event to communicator
        if (communicator.ready()) {
            communicator.emit(methodName, data);
        }

        // call original method
        return originalMethod.apply(this, [data]);
    };
};

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor = { new (...args: unknown[]): {} };

type IpcMethodConstructor<M extends keyof IpcMethods> = Constructor & {
    new (...args: unknown[]): Pick<IpcMethods, M>;
};

/**
 * Class decorator for registering ipc methods with matching ones in a class
 *
 * **IMPORTANT**: Only use this for classes that will be singletons
 * @param methods - IPC Method names
 */
export const registerIpcMethods = <M extends Array<keyof IpcMethods>>(
    ...methods: M
) => {
    return function <B extends IpcMethodConstructor<M[number]>>(
        baseConstructor: B
    ) {
        // Set the base constructor as a simple constructor to make ts happy
        const CurrentClass = baseConstructor as Constructor;

        // New class that extends the current class with
        class ExtendedClass extends CurrentClass {
            constructor(...args: unknown[]) {
                super(...args);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const thisClass = this as any;

                const verifiedMethods = Array.from(new Set(methods)).filter(
                    (m) => {
                        return typeof thisClass[m] === "function";
                    }
                );

                for (const method of verifiedMethods) {
                    communicator.register(method, async (...data) => {
                        return thisClass[method](...data);
                    });
                }
            }
        }

        // Set the ExtendedClass type as the base type to make ts happy again
        return ExtendedClass as typeof baseConstructor;
    };
};
