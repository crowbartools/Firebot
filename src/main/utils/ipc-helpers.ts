import IpcEvents from "SharedTypes/ipc/ipc-events";
import IpcMethods from "SharedTypes/ipc/ipc-methods";
import { communicator } from ".";

/**
 * Class method decorator for automatically emitting communicator events
 * Method name must match a known IPC Event and it's argument must
 * match the expected event data.
 */
export const emitIpcEvent = <K extends keyof IpcEvents>(eventName: K) => {
    return (
        _: unknown,
        _methodName: string,
        descriptor: TypedPropertyDescriptor<(data: IpcEvents[K]) => void>
    ) => {
        const originalMethod = descriptor.value;

        descriptor.value = function (data) {
            // emit event to communicator
            if (communicator.ready()) {
                communicator.emit(eventName, data);
            }

            // call original method
            return originalMethod?.apply(this, [data]);
        };
    };
};

type OptionalPromisify<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [P in keyof T]: T[P] extends (...args: any) => any
        ? (
              ...args: Parameters<T[P]>
          ) => Promise<ReturnType<T[P]> | Error> | ReturnType<T[P]>
        : never;
};

// eslint-disable-next-line @typescript-eslint/ban-types
type Constructor = { new (...args: unknown[]): {} };

type IpcMethodConstructor<M extends keyof IpcMethods> = Constructor & {
    new (...args: unknown[]): OptionalPromisify<Pick<IpcMethods, M>>;
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
        constructor: B
    ) {
        // Set the base constructor as a simple constructor to make ts happy
        const CurrentClass = constructor as Constructor;

        // New class that extends the current class with
        class RegisterIpcMethodsExtendedClass extends CurrentClass {
            constructor(...args: unknown[]) {
                // forward any args
                super(...args);

                // set this to any to make ts happy
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const thisClass = this as any;

                // removes any duplicate method names filters out any methods that
                // don't appear to exist on the class, just to be absolutely sure
                const verifiedMethods = Array.from(new Set(methods)).filter(
                    (m) => {
                        return typeof thisClass[m] === "function";
                    }
                );

                // register methods
                for (const method of verifiedMethods) {
                    communicator.register(method, (...data) => {
                        return Promise.resolve(thisClass[method](...data));
                    });
                }
            }
        }

        // Set the ExtendedClass type as the base type to make ts happy again
        return RegisterIpcMethodsExtendedClass as typeof constructor;
    };
};

type IpcEventListenerMethods<T> = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [P in keyof T]-?: (data: T[P]) => void;
};

type IpcEventListenerConstructor<E extends keyof IpcEvents> = Constructor & {
    new (...args: unknown[]): IpcEventListenerMethods<Pick<IpcEvents, E>>;
};

/**
 * Class decorator for registering ipc event listeners with matching methods in a class
 *
 * **IMPORTANT**: Only use this for classes that will be singletons
 * @param events - IPC Event names
 */
export const registerIpcEventListeners = <E extends Array<keyof IpcEvents>>(
    ...events: E
) => {
    return function <B extends IpcEventListenerConstructor<E[number]>>(
        constructor: B
    ) {
        // Set the base constructor as a simple constructor to make ts happy
        const CurrentClass = constructor as Constructor;

        // New class that extends the current class with
        class RegisterIpcEventListenerExtendedClass extends CurrentClass {
            constructor(...args: unknown[]) {
                // forward any args
                super(...args);

                // set this to any to make ts happy
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const thisClass = this as any;

                // removes any duplicate method names filters out any methods that
                // don't appear to exist on the class, just to be absolutely sure
                const verifiedMethods = Array.from(new Set(events)).filter(
                    (m) => {
                        return typeof thisClass[m] === "function";
                    }
                ) as Array<keyof IpcEvents>;

                // setup listeners
                for (const method of verifiedMethods) {
                    communicator.on(method, thisClass[method]);
                }
            }
        }

        // Set the ExtendedClass type as the base type to make ts happy again
        return RegisterIpcEventListenerExtendedClass as typeof constructor;
    };
};
