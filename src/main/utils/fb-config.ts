import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import { getPathInFirebotData } from "../utils";

export class FbConfig<Settings> {
    private settings: Settings;
    private jsonDb: JsonDB;

    constructor(filePath: string, defaultData: Settings) {
        this.settings = defaultData;
        this.jsonDb = new JsonDB(
            new Config(getPathInFirebotData(filePath), true, true, "/")
        );
        this.load();
    }

    get<K extends keyof Settings>(key: K): Settings[K] {
        return this.settings[key];
    }

    set<K extends keyof Settings, V extends Settings[K]>(
        key: K,
        value: V
    ): void {
        this.settings[key] = value;
        this.jsonDb.push(`/${key}`, value);
    }

    load(): void {
        const settings = this.jsonDb.getData("/") as Settings | null;
        if (settings != null) {
            this.settings = settings;
        }
    }
}
