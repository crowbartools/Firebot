export const jsonClone = <T>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};
