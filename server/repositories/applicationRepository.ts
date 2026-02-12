import { Application, Document } from "@shared/auth";

/**
 * Application repository - abstracts application data storage
 * In a real application, this would interact with a database
 */
class ApplicationRepository {
  private applications: Map<string, Application>;

  constructor() {
    this.applications = new Map();
  }

  /**
   * Find an application by ID
   */
  findById(id: string): Application | undefined {
    return this.applications.get(id);
  }

  /**
   * Find all applications for a user
   */
  findByUserId(userId: string): Application[] {
    return Array.from(this.applications.values()).filter(
      (app) => app.userId === userId,
    );
  }

  /**
   * Create a new application
   */
  create(application: Application): Application {
    this.applications.set(application.id, application);
    return application;
  }

  /**
   * Update an application
   */
  update(id: string, updates: Partial<Application>): Application | undefined {
    const app = this.applications.get(id);
    if (!app) {
      return undefined;
    }
    const updated = { ...app, ...updates, updatedAt: new Date().toISOString() };
    this.applications.set(id, updated);
    return updated;
  }

  /**
   * Add a document to an application
   */
  addDocument(applicationId: string, document: Document): Application | undefined {
    const app = this.applications.get(applicationId);
    if (!app) {
      return undefined;
    }
    app.documents.push(document);
    app.updatedAt = new Date().toISOString();
    return app;
  }

  /**
   * Get all applications (for admin purposes)
   */
  findAll(): Application[] {
    return Array.from(this.applications.values());
  }
}

export const applicationRepository = new ApplicationRepository();
