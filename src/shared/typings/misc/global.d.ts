import { communicator } from "SharedUtils";

declare global {
    interface Window {
        fbComm: typeof communicator;
    }
}

declare type OnlyRequire<T, K extends keyof T> = Required<Pick<T, K>> &
    Partial<Omit<T, K>>;
