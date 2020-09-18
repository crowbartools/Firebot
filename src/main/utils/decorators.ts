import IpcEvents from "SharedTypes/ipc/ipc-events";
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
