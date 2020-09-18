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

export const registerIpcMethods = <M extends Array<keyof IpcMethods>>(
    methods: M,
    passedThis: {
        [P in M[0]]: (
            request: IpcMethods[M[0]]["request"]
        ) => IpcMethods[M[0]]["response"];
    }
) => {
    for (const method of methods) {
        communicator.register(method, async (data) => {
            return (passedThis as any)[method](data);
        });
    }
};

// WIP class decorator
// export const registerIpcMethods = <M extends keyof IpcMethods>(
//     methods: Array<keyof IpcMethods>
// ) => {
//     return function (
//         constructor: new (...args: any[]) => {
//             [P in M]: void;0
//         }
//     ) {
//         return class extends constructor {
//             constructor(...args: any[]) {
//                 super(...args);
//                 for (const method of methods) {
//                     communicator.register(method, async (data) => {
//                         return this[method](data);
//                     });
//                 }
//             }
//         };
//     };
// }
