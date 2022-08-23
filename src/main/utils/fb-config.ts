import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import { getPathInFirebotData } from "../utils";

type KeysMatching<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

export class FbConfig<Settings> {
    private defaultSettings: Settings;
    private settings: Settings;
    private jsonDb: JsonDB;

    constructor(filePath: string, defaultSettings: Settings) {
        this.defaultSettings = this.settings = defaultSettings;
        this.load(filePath);
    }

    get<K extends keyof Settings>(key: K): Settings[K] {
        return this.settings[key] ?? this.defaultSettings[key];
    }

    set<K extends keyof Settings, V extends Settings[K]>(
        key: K,
        value: V
    ): void {
        this.settings[key] = value;
        this.jsonDb.push(`/${key as string}`, value);
    }

    load(filePath: string): void {
        this.jsonDb = new JsonDB(
            new Config(getPathInFirebotData(filePath), true, true, "/")
        );
        const settings = this.jsonDb.getData("/") as Settings | null;
        if (settings != null) {
            this.settings = settings;
        }
    }
}
