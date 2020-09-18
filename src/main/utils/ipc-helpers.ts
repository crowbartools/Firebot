import IpcEvents from "SharedTypes/ipc/ipc-events";
import IpcMethods from "SharedTypes/ipc/ipc-methods";
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

/**
 * Convenience method for registering ipc methods with matching ones in a class
 *
 * **IMPORTANT**: Use this in a constructor of a singleton class
 * @param passedThis - The "this" variable from a class constructor
 * @param methods - IPC Method names
 */
export const registerIpcMethods = <M extends ReadonlyArray<keyof IpcMethods>>(
    passedThis: Pick<IpcMethods, M[number]>,
    ...methods: M
) => {
    for (const method of methods) {
        communicator.register(method, async (...data) => {
            return (passedThis as any)[method](...data);
        });
    }
};

// WIP class decorator
// export const registerIpcMethodsTest = <
//     M extends ReadonlyArray<keyof IpcMethods>
// >(
//     ...methods: M
// ) => {
//     return function <
//         B extends new (...args: any[]) => OnlyRequire<IpcMethods, M[number]>
//     >(Base: B) {
//         return class extends Base {
//             constructor(...args: any[]) {
//                 super(...args);
//                 for (const method of methods) {
//                     communicator.register(method, async (...data) => {
//                         return this[method](...data);
//                     });
//                 }
//             }
//         };
//     };
// };
