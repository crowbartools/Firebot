export interface DataStore<T> {
  get<K extends keyof T>(key: K): T[K];

  set<K extends keyof T, V extends T[K]>(key: K, value: V): void;

  load(): void;
}