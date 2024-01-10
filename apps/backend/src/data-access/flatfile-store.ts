import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import { DataStore } from "./data-store.interface";

export class FlatFileDataStore<Settings> implements DataStore<Settings> {
  private db!: JsonDB;
  private settings!: Settings;

  constructor(
    private readonly filePath: string,
    private readonly defaultSettings: Settings
  ) {
    this.load();
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.settings[key] ?? this.defaultSettings[key];
  }

  set<K extends keyof Settings, V extends Settings[K]>(key: K, value: V): void {
    this.settings[key] = value;
    this.db.push(`/${key as string}`, value);
  }

  load(): void {
    this.db = new JsonDB(new Config(this.filePath, true, true, "/"));
    const settings = this.db.getData("/") as Settings | null;
    if (settings != null && Object.keys(settings ?? {}).length) {
      this.settings = settings;
    } else {
      this.db.push("/", this.defaultSettings);
      this.settings = this.defaultSettings;
    }
  }
}
