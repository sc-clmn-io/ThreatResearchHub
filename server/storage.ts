import { 
  xsiamContent,
  contentCollections,
  useCaseDefinitions,
  type XSIAMContent,
  type ContentCollection,
  type InsertXSIAMContent,
  type InsertContentCollection,
  type UseCaseDefinition as UseCase,
  type InsertUseCaseDefinition as InsertUseCase
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // Basic storage operations for now - keeping it simple
  store(key: string, data: any): Promise<void>;
  retrieve(key: string): Promise<any>;
  delete(key: string): Promise<void>;
  list(pattern?: string): Promise<string[]>;

  // Use Cases
  getUseCase(id: string): Promise<UseCase | undefined>;
  getAllUseCases(): Promise<UseCase[]>;
  getUseCasesByThreatReport(threatReportId: string): Promise<UseCase[]>;
  createUseCase(useCase: InsertUseCase): Promise<UseCase>;
  updateUseCase(id: string, updates: Partial<InsertUseCase>): Promise<UseCase>;
  deleteUseCase(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Basic storage operations
  async store(key: string, data: any): Promise<void> {
    // Simple key-value storage using PostgreSQL JSON column
    await db.execute({
      sql: "INSERT INTO storage (key, data) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data",
      args: [key, JSON.stringify(data)]
    });
  }

  async retrieve(key: string): Promise<any> {
    const result = await db.execute({
      sql: "SELECT data FROM storage WHERE key = ?",
      args: [key]
    });
    return result.rows[0] ? JSON.parse(result.rows[0].data as string) : null;
  }

  async delete(key: string): Promise<void> {
    await db.execute({
      sql: "DELETE FROM storage WHERE key = ?",
      args: [key]
    });
  }

  async list(pattern?: string): Promise<string[]> {
    const sql = pattern 
      ? "SELECT key FROM storage WHERE key LIKE ?"
      : "SELECT key FROM storage";
    const args = pattern ? [`%${pattern}%`] : [];
    
    const result = await db.execute({ sql, args });
    return result.rows.map(row => row.key as string);
  }
  // Threat Reports
  async getThreatReport(id: string): Promise<ThreatReport | undefined> {
    const [report] = await db.select().from(threatReports).where(eq(threatReports.id, id));
    return report || undefined;
  }

  async getAllThreatReports(): Promise<ThreatReport[]> {
    return await db.select().from(threatReports).orderBy(desc(threatReports.extractedAt));
  }

  async createThreatReport(report: InsertThreatReport): Promise<ThreatReport> {
    const id = nanoid();
    const [created] = await db
      .insert(threatReports)
      .values({ ...report, id })
      .returning();
    return created;
  }

  async updateThreatReport(id: string, updates: Partial<InsertThreatReport>): Promise<ThreatReport> {
    const [updated] = await db
      .update(threatReports)
      .set(updates)
      .where(eq(threatReports.id, id))
      .returning();
    return updated;
  }

  async deleteThreatReport(id: string): Promise<void> {
    await db.delete(threatReports).where(eq(threatReports.id, id));
  }

  // Use Cases
  async getUseCase(id: string): Promise<UseCase | undefined> {
    const [useCase] = await db.select().from(useCaseDefinitions).where(eq(useCaseDefinitions.id, id));
    return useCase || undefined;
  }

  async getAllUseCases(): Promise<UseCase[]> {
    return await db.select().from(useCaseDefinitions).orderBy(desc(useCaseDefinitions.createdAt));
  }

  async getUseCasesByThreatReport(threatReportId: string): Promise<UseCase[]> {
    return await db.select().from(useCaseDefinitions).where(eq(useCaseDefinitions.sourceDetails, threatReportId));
  }

  async createUseCase(useCase: InsertUseCase): Promise<UseCase> {
    const id = nanoid();
    const now = new Date();
    const [created] = await db
      .insert(useCaseDefinitions)
      .values({ 
        ...useCase, 
        id,
        createdAt: now,
        updatedAt: now 
      })
      .returning();
    return created;
  }

  async updateUseCase(id: string, updates: Partial<InsertUseCase>): Promise<UseCase> {
    const [updated] = await db
      .update(useCaseDefinitions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(useCaseDefinitions.id, id))
      .returning();
    return updated;
  }

  async deleteUseCase(id: string): Promise<void> {
    await db.delete(useCaseDefinitions).where(eq(useCaseDefinitions.id, id));
  }

  // Training Paths
  async getTrainingPath(id: string): Promise<TrainingPath | undefined> {
    const [path] = await db.select().from(trainingPaths).where(eq(trainingPaths.id, id));
    return path || undefined;
  }

  async getAllTrainingPaths(): Promise<TrainingPath[]> {
    return await db.select().from(trainingPaths).orderBy(desc(trainingPaths.createdAt));
  }

  async getTrainingPathsByUseCase(useCaseId: string): Promise<TrainingPath[]> {
    return await db.select().from(trainingPaths).where(eq(trainingPaths.useCaseId, useCaseId));
  }

  async createTrainingPath(path: InsertTrainingPath): Promise<TrainingPath> {
    const id = nanoid();
    const now = new Date();
    const [created] = await db
      .insert(trainingPaths)
      .values({ 
        ...path, 
        id,
        createdAt: now,
        updatedAt: now 
      })
      .returning();
    return created;
  }

  async updateTrainingPath(id: string, updates: Partial<InsertTrainingPath>): Promise<TrainingPath> {
    const [updated] = await db
      .update(trainingPaths)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(trainingPaths.id, id))
      .returning();
    return updated;
  }

  async deleteTrainingPath(id: string): Promise<void> {
    await db.delete(trainingPaths).where(eq(trainingPaths.id, id));
  }

  // Validation Items
  async getValidationItem(id: string): Promise<ValidationItem | undefined> {
    const [item] = await db.select().from(validationItems).where(eq(validationItems.id, id));
    return item || undefined;
  }

  async getAllValidationItems(): Promise<ValidationItem[]> {
    return await db.select().from(validationItems).orderBy(desc(validationItems.createdAt));
  }

  async getPendingValidationItems(): Promise<ValidationItem[]> {
    return await db.select().from(validationItems).where(eq(validationItems.status, 'pending'));
  }

  async createValidationItem(item: InsertValidationItem): Promise<ValidationItem> {
    const id = nanoid();
    const [created] = await db
      .insert(validationItems)
      .values({ ...item, id })
      .returning();
    return created;
  }

  async updateValidationItem(id: string, updates: Partial<InsertValidationItem>): Promise<ValidationItem> {
    const [updated] = await db
      .update(validationItems)
      .set(updates)
      .where(eq(validationItems.id, id))
      .returning();
    return updated;
  }

  async deleteValidationItem(id: string): Promise<void> {
    await db.delete(validationItems).where(eq(validationItems.id, id));
  }

  // Progress Tracking
  async getProgressTracking(id: string): Promise<ProgressTracking | undefined> {
    const [progress] = await db.select().from(progressTracking).where(eq(progressTracking.id, id));
    return progress || undefined;
  }

  async getProgressByTrainingPath(trainingPathId: string): Promise<ProgressTracking[]> {
    return await db.select().from(progressTracking).where(eq(progressTracking.trainingPathId, trainingPathId));
  }

  async createProgressTracking(progress: InsertProgressTracking): Promise<ProgressTracking> {
    const id = nanoid();
    const [created] = await db
      .insert(progressTracking)
      .values({ ...progress, id })
      .returning();
    return created;
  }

  async updateProgressTracking(id: string, updates: Partial<InsertProgressTracking>): Promise<ProgressTracking> {
    const [updated] = await db
      .update(progressTracking)
      .set(updates)
      .where(eq(progressTracking.id, id))
      .returning();
    return updated;
  }

  async deleteProgressTracking(id: string): Promise<void> {
    await db.delete(progressTracking).where(eq(progressTracking.id, id));
  }

  // Template Sharing Methods
  async getSharedTemplate(id: string): Promise<SharedTemplate | undefined> {
    const [template] = await db.select().from(sharedTemplates).where(eq(sharedTemplates.id, id));
    return template || undefined;
  }

  async getAllSharedTemplates(): Promise<SharedTemplate[]> {
    return await db.select().from(sharedTemplates).orderBy(desc(sharedTemplates.createdAt));
  }

  async getSharedTemplatesByCategory(category: string): Promise<SharedTemplate[]> {
    return await db.select().from(sharedTemplates)
      .where(eq(sharedTemplates.category, category))
      .orderBy(desc(sharedTemplates.createdAt));
  }

  async createSharedTemplate(template: InsertSharedTemplate): Promise<SharedTemplate> {
    const id = nanoid();
    const [created] = await db
      .insert(sharedTemplates)
      .values({ ...template, id })
      .returning();
    return created;
  }

  async updateSharedTemplate(id: string, updates: Partial<InsertSharedTemplate>): Promise<SharedTemplate> {
    const [updated] = await db
      .update(sharedTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(sharedTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSharedTemplate(id: string): Promise<void> {
    await db.delete(sharedTemplates).where(eq(sharedTemplates.id, id));
  }

  async incrementTemplateDownload(id: string): Promise<void> {
    await db
      .update(sharedTemplates)
      .set({ 
        downloadCount: db.raw('download_count + 1'),
        updatedAt: new Date()
      })
      .where(eq(sharedTemplates.id, id));
  }

  // Template Ratings Methods
  async getTemplateRating(id: string): Promise<TemplateRating | undefined> {
    const [rating] = await db.select().from(templateRatings).where(eq(templateRatings.id, id));
    return rating || undefined;
  }

  async getTemplateRatingsByTemplate(templateId: string): Promise<TemplateRating[]> {
    return await db.select().from(templateRatings)
      .where(eq(templateRatings.templateId, templateId))
      .orderBy(desc(templateRatings.createdAt));
  }

  async createTemplateRating(rating: InsertTemplateRating): Promise<TemplateRating> {
    const id = nanoid();
    const [created] = await db
      .insert(templateRatings)
      .values({ ...rating, id })
      .returning();
    
    // Update template rating summary
    const template = await this.getSharedTemplate(rating.templateId);
    if (template) {
      await db
        .update(sharedTemplates)
        .set({
          ratingSum: template.ratingSum + rating.rating,
          ratingCount: template.ratingCount + 1,
          updatedAt: new Date()
        })
        .where(eq(sharedTemplates.id, rating.templateId));
    }
    
    return created;
  }

  async updateTemplateRating(id: string, updates: Partial<InsertTemplateRating>): Promise<TemplateRating> {
    const [updated] = await db
      .update(templateRatings)
      .set(updates)
      .where(eq(templateRatings.id, id))
      .returning();
    return updated;
  }

  async deleteTemplateRating(id: string): Promise<void> {
    await db.delete(templateRatings).where(eq(templateRatings.id, id));
  }

  // Template Comments Methods
  async getTemplateComment(id: string): Promise<TemplateComment | undefined> {
    const [comment] = await db.select().from(templateComments).where(eq(templateComments.id, id));
    return comment || undefined;
  }

  async getTemplateCommentsByTemplate(templateId: string): Promise<TemplateComment[]> {
    return await db.select().from(templateComments)
      .where(eq(templateComments.templateId, templateId))
      .orderBy(desc(templateComments.createdAt));
  }

  async createTemplateComment(comment: InsertTemplateComment): Promise<TemplateComment> {
    const id = nanoid();
    const [created] = await db
      .insert(templateComments)
      .values({ ...comment, id })
      .returning();
    return created;
  }

  async updateTemplateComment(id: string, updates: Partial<InsertTemplateComment>): Promise<TemplateComment> {
    const [updated] = await db
      .update(templateComments)
      .set(updates)
      .where(eq(templateComments.id, id))
      .returning();
    return updated;
  }

  async deleteTemplateComment(id: string): Promise<void> {
    await db.delete(templateComments).where(eq(templateComments.id, id));
  }
}

export const storage = new DatabaseStorage();
