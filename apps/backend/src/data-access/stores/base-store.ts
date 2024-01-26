import { JsonDB } from "node-json-db";
import { Config } from "node-json-db/dist/lib/JsonDBConfig";
import { DataStore } from "../data-store.interface";

export class BaseDataStore<Settings> implements DataStore<Settings> {
  private db!: JsonDB;
  private settings!: Settings;

  constructor(
    private filePath: string,
    private readonly defaultSettings: Settings
  ) {
    this.load(filePath);
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return JSON.parse(JSON.stringify(this.settings[key] ?? this.defaultSettings[key]));
  }

  getRoot(): Settings {
    return JSON.parse(JSON.stringify(this.settings ?? this.defaultSettings));
  }

  set<K extends keyof Settings, V extends Settings[K]>(key: K, value: V): void {
    this.settings[key] = value;
    this.db.push(`/${key as string}`, value);
  }

  load(filePath: string): void {
    this.filePath = filePath;
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
