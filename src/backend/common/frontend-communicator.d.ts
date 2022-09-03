export function send(eventName: string, data: unknown): void;

export function on<ExpectedArgs extends Array<any> = [], ReturnPayload = void>(
  eventName: string,
  callback: (...args: ExpectedArgs[]) => ReturnPayload
): void;

export function onAsync<
  ExpectedArgs extends Array<any> = [],
  ReturnPayload = void
>(
  eventName: string,
  callback: (...args: ExpectedArgs[]) => Promise<ReturnPayload>
): void;

export function fireEventAsync<ReturnPayload = void>(
  eventName: string,
  data: unknown
): Promise<ReturnPayload>;
