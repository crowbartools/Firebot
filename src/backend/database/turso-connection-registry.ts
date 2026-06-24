import { connect, type Database } from "@tursodatabase/database";
import fs from "fs/promises";
import path from "path";

import { AppCloseListenerManager } from "../app-management/app-close-listener-manager";
import { ProfileManager } from "../common/profile-manager";
import { LoggerCache } from "../logger-cache";

const DATABASES_DIR = "databases";

/**
 *  Registry for Turso databases
 *
 * Each named database lives in its own file under the
 * profile's databases/ dir (ie databases/quotes.db)
 */
class TursoConnectionRegistry {
    private logger = LoggerCache.getLogger("Database");
    private connections = new Map<string, Promise<Database>>();

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
    async getConnection(name: string): Promise<Database> {
        let connection = this.connections.get(name);
        if (connection == null) {
            connection = this.open(name);
            this.connections.set(name, connection);
        }
        return connection;
    }

    private async open(name: string): Promise<Database> {
        const dbPath = this.getDatabasePath(name);

        // make sure parent dir exists
        await fs.mkdir(path.dirname(dbPath), { recursive: true });

        const db = await connect(dbPath, { experimental: ["attach"] });

        this.logger.debug(`Opened database "${name}" at ${dbPath}`);
        return db;
    }

    /**
     * Attaches another registered database to the given connection so queries
     * can join across files, ie:
     * "SELECT ... FROM quotes q JOIN viewers.viewers v ON ..."
     */
    async attach(db: Database, name: string, alias: string): Promise<void> {
        const dbPath = this.getDatabasePath(name).replace(/'/g, "''");
        await db.exec(`ATTACH DATABASE '${dbPath}' AS ${alias}`);
    }

    private async closeAll(): Promise<void> {
        const connections = Array.from(this.connections.values());
        this.connections.clear();

        for (const connectionPromise of connections) {
            try {
                const db = await connectionPromise;
                // Checkpoint so the WAL is merged into the main file on a clean exit
                try {
                    await db.pragma("wal_checkpoint(TRUNCATE)", {});
                } catch { }
                await db.close();
            } catch (error) {
                const err = error as Error;
                this.logger.warn(`Error closing database: ${err.message}`);
            }
        }
    }
}

const registry = new TursoConnectionRegistry();

export { registry as TursoConnectionRegistry };
