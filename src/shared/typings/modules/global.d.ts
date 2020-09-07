import { Communicator } from "Utilities"

declare global {
    interface Window {
        fbComm: Communicator
    }
}