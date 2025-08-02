// Simplified storage interface for content management
export interface IContentStorage {
  store(key: string, data: any): Promise<void>;
  retrieve(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(pattern?: string): Promise<string[]>;
}

export class MemContentStorage implements IContentStorage {
  private data: Map<string, any> = new Map();

  async store(key: string, data: any): Promise<void> {
    this.data.set(key, JSON.parse(JSON.stringify(data)));
  }

  async retrieve(key: string): Promise<any> {
    return this.data.get(key);
  }

  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }

  async list(pattern?: string): Promise<string[]> {
    const keys = Array.from(this.data.keys());
    if (pattern) {
      return keys.filter(k => k.includes(pattern));
    }
    return keys;
  }
}

export const contentStorage = new MemContentStorage();