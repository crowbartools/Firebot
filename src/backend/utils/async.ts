/**
 * Pause between lines of execution
 * @param ms Time to pause, in milliseconds
 */
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));