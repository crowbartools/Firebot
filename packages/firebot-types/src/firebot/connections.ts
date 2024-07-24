import { TypedEmitter } from "tiny-typed-emitter";

export type ConnectionType = "streaming-platform" | "integration" | "overlay";

interface ConnectionEvents {
  connected: () => void;
  disconnected: () => void;
}

export class ConnectionEventEmitter extends TypedEmitter<ConnectionEvents> {}

export interface Connectable extends ConnectionEventEmitter {
  id: string;
  name: string;
  connected?: boolean;
  canConnect: () => boolean;
  connect: () => PromiseLike<boolean>;
  disconnect: () => PromiseLike<void>;
}
