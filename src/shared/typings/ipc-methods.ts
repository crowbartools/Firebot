export default interface IpcMethods {
    testMethod: {
        request: {
            foo: string;
        },
        response: {
            bar: boolean;
        }
    }
}