import { DuckDBConnection, DuckDBInstance } from "@duckdb/node-api";
import fs from "fs/promises";
import path from "path";

import { AppCloseListenerManager } from "../app-management/app-close-listener-manager";
import { ProfileManager } from "../common/profile-manager";
import { LoggerCache } from "../logger-cache";

interface DuckDbHandle {
    instance: DuckDBInstance;
    connection: DuckDBConnection;
    path: string;
}

const DATABASES_DIR = "databases";

/**
 * Registry for DuckDB-backed databases.
 *
 * Each named database lives in its own file under the
 * profile's databases/ dir (ie databases/quotes.db)
 */
class DuckDbConnectionRegistry {
    private logger = LoggerCache.getLogger("DbConnectionRegistry");
    private handles = new Map<string, Promise<DuckDbHandle>>();

    constructor() {
        AppCloseListenerManager.registerListener(() => this.closeAll());
    }

    private getDatabasePath(name: string): string {
        return ProfileManager.getPathInProfile(path.join(DATABASES_DIR, `${name}.db`));
    }

    /**
     * Returns a cached connection for the named database,
     * creating the db file if it doesn't exist
     */
    async getConnection(name: string): Promise<DuckDBConnection> {
        const handle = await this.getHandle(name);
        return handle.connection;
    }

    private getHandle(name: string): Promise<DuckDbHandle> {
        let handle = this.handles.get(name);
        if (handle == null) {
            handle = this.openHandle(name);
            this.handles.set(name, handle);
        }
        return handle;
    }

    private async openHandle(name: string): Promise<DuckDbHandle> {
        const dbPath = this.getDatabasePath(name);

        // ensure parent directory exists
        await fs.mkdir(path.dirname(dbPath), { recursive: true });

        const instance = await DuckDBInstance.create(dbPath);
        const connection = await instance.connect();

        this.logger.debug(`Opened database "${name}" at ${dbPath}`);

        return { instance, connection, path: dbPath };
    }

    /**
     * Attaches another registered database to the given connection so queries
     * can join across files, ie:
     * "SELECT ... FROM quotes q JOIN viewers.viewers v ON ..."
     */
    async attach(connection: DuckDBConnection, name: string, alias: string, readOnly = true): Promise<void> {
        const dbPath = this.getDatabasePath(name).replace(/'/g, "''");
        await connection.run(
            `ATTACH IF NOT EXISTS '${dbPath}' AS ${alias}${readOnly ? " (READ_ONLY)" : ""}`
        );
    }

    /**
     * Trigger a checkpoint to sync data in the write-ahead log (WAL)
     * to the database data file (similar to nedb's compaction)
     */
    async checkpoint(name: string): Promise<void> {
        const handle = this.handles.get(name);
        if (handle == null) {
            return;
        }
        await (await handle).connection.run("CHECKPOINT");
    }

    async checkpointAll(): Promise<void> {
        const names = Array.from(this.handles.keys());
        for (const name of names) {
            try {
                await this.checkpoint(name);
            } catch {}
        }
    }

    private async closeAll(): Promise<void> {
        const handles = Array.from(this.handles.values());
        this.handles.clear();

        for (const handlePromise of handles) {
            try {
                const handle = await handlePromise;
                try {
                    await handle.connection.run("CHECKPOINT");
                } catch {}
                handle.connection.disconnectSync();
                handle.instance.closeSync();
                this.logger.debug(`Closed database at ${handle.path}`);
            } catch (error) {
                const err = error as Error;
                this.logger.warn(`Error closing database: ${err.message}`);
            }
        }
    }
}

const registry = new DuckDbConnectionRegistry();

export { registry as DuckDbConnectionRegistry };
