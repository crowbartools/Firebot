import { Communicator } from "SharedUtilities";

declare global {
    interface Window {
        fbComm: Communicator;
    }
}

declare type OnlyRequire<T, K extends keyof T> = Required<Pick<T, K>> &
    Partial<Omit<T, K>>;
