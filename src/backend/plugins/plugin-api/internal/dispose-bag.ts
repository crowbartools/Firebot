import { LoggerCache } from "../../../logger-cache";

const logger = LoggerCache.getLogger("Plugins");

export type DisposeFn = () => void | Promise<void>;

/**
 * Collects teardown callbacks registered by plugin-api namespaces during plugin
 * startup, and drains them (in reverse order / LIFO) when the plugin is unloaded.
 */
export class DisposeBag {
    private fns: DisposeFn[] = [];
    private drained = false;

    constructor(private readonly label: string) {}

    add(fn: DisposeFn): void {
        if (this.drained) {
            try {
                void fn();
            } catch (error) {
                logger.warn(`DisposeBag(${this.label}): late dispose threw`, error);
            }
            return;
        }
        this.fns.push(fn);
    }

    async drain(): Promise<void> {
        if (this.drained) {
            return;
        }
        this.drained = true;
        const pending = this.fns.splice(0).reverse();
        for (const fn of pending) {
            try {
                await fn();
            } catch (error) {
                logger.warn(`DisposeBag(${this.label}): dispose threw`, error);
            }
        }
    }
}
