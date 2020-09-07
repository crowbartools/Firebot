export default interface IpcMethods extends Record<string, { request: unknown, response: unknown }> {
    testMethod: {
        request: {
            foo: string;
        },
        response: {
            bar: boolean;
        }
    },
}