import { Communicator } from "Utilities";

declare global {
    interface Window {
        fbComm: Communicator;
    }
}

declare type OnlyRequire<T, K extends keyof T> = Required<Pick<T, K>> & Partial<Omit<T, K>>;
