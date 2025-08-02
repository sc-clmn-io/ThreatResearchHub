import type { 
  ThreatReport, 
  UseCase, 
  TrainingPath, 
  ValidationItem, 
  ProgressTracking,
  ExportData 
} from "@shared/schema";

class LocalStorage {
  private dbName = "security-research-platform-db";
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('threatReports')) {
          db.createObjectStore('threatReports', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('useCases')) {
          const useCaseStore = db.createObjectStore('useCases', { keyPath: 'id' });
          useCaseStore.createIndex('threatReportId', 'threatReportId');
        }
        
        if (!db.objectStoreNames.contains('trainingPaths')) {
          const trainingStore = db.createObjectStore('trainingPaths', { keyPath: 'id' });
          trainingStore.createIndex('useCaseId', 'useCaseId');
        }
        
        if (!db.objectStoreNames.contains('validationItems')) {
          db.createObjectStore('validationItems', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('progressTracking')) {
          const progressStore = db.createObjectStore('progressTracking', { keyPath: 'id' });
          progressStore.createIndex('trainingPathId', 'trainingPathId');
        }
      };
    });
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly') {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // Threat Reports
  private lastSavedReports = new Map<string, number>();
  
  async saveThreatReport(report: ThreatReport): Promise<void> {
    // Prevent duplicate saves within 1 second
    const now = Date.now();
    const lastSaved = this.lastSavedReports.get(report.id);
    if (lastSaved && (now - lastSaved) < 1000) {
      return; // Skip duplicate save
    }
    
    this.lastSavedReports.set(report.id, now);
    
    const store = await this.getStore('threatReports', 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.put(report);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getThreatReports(): Promise<ThreatReport[]> {
    const store = await this.getStore('threatReports');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Use Cases
  async saveUseCase(useCase: UseCase): Promise<void> {
    const store = await this.getStore('useCases', 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.put(useCase);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getUseCases(): Promise<UseCase[]> {
    const store = await this.getStore('useCases');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getUseCasesByThreatReport(threatReportId: string): Promise<UseCase[]> {
    const store = await this.getStore('useCases');
    const index = store.index('threatReportId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(threatReportId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Training Paths
  async saveTrainingPath(path: TrainingPath): Promise<void> {
    const store = await this.getStore('trainingPaths', 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.put(path);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getTrainingPaths(): Promise<TrainingPath[]> {
    const store = await this.getStore('trainingPaths');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTrainingPathByUseCase(useCaseId: string): Promise<TrainingPath | null> {
    const store = await this.getStore('trainingPaths');
    const index = store.index('useCaseId');
    return new Promise((resolve, reject) => {
      const request = index.get(useCaseId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Validation Items
  async saveValidationItem(item: ValidationItem): Promise<void> {
    const store = await this.getStore('validationItems', 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getValidationItems(): Promise<ValidationItem[]> {
    const store = await this.getStore('validationItems');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Progress Tracking
  async saveProgress(progress: ProgressTracking): Promise<void> {
    const store = await this.getStore('progressTracking', 'readwrite');
    await new Promise((resolve, reject) => {
      const request = store.put(progress);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  async getProgressByTrainingPath(trainingPathId: string): Promise<ProgressTracking[]> {
    const store = await this.getStore('progressTracking');
    const index = store.index('trainingPathId');
    return new Promise((resolve, reject) => {
      const request = index.getAll(trainingPathId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Export functionality
  async exportAllData(): Promise<ExportData> {
    const [threatReports, useCases, trainingPaths, validationItems, progressTracking] = await Promise.all([
      this.getThreatReports(),
      this.getUseCases(),
      this.getTrainingPaths(),
      this.getValidationItems(),
      this.getAllProgress()
    ]);

    return {
      threatReports,
      useCases,
      trainingPaths,
      validationItems,
      progressTracking,
      exportedAt: new Date(),
      version: "1.0"
    };
  }

  private async getAllProgress(): Promise<ProgressTracking[]> {
    const store = await this.getStore('progressTracking');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllData(): Promise<void> {
    const stores = ['threatReports', 'useCases', 'trainingPaths', 'validationItems', 'progressTracking'];
    
    for (const storeName of stores) {
      const store = await this.getStore(storeName, 'readwrite');
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve(undefined);
        request.onerror = () => reject(request.error);
      });
    }
  }
}

export const localStorage = new LocalStorage();
