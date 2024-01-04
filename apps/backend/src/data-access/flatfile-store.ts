import { DataStore } from "./data-store.interface";
import { LowSync } from "lowdb/lib";
import { JSONFileSyncPreset } from "lowdb/node";


export class FlatFileDataStore<Settings> implements DataStore<Settings>  {
  private db!: LowSync<Settings>;

  constructor(private readonly filePath: string, private readonly defaultSettings: Settings) {
    this.load();
  }

  get<K extends keyof Settings>(key: K): Settings[K] {
    return this.db.data[key];
  }

  set<K extends keyof Settings, V extends Settings[K]>(key: K, value: V): void {
    this.db.data[key] = value
    this.db.write();
  }

  load(): void {
    this.db = JSONFileSyncPreset(this.filePath, this.defaultSettings);
  }
}
