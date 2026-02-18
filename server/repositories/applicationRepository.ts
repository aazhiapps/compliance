import { Application, Document } from "@shared/auth";
import { ApplicationModel, IApplicationDocument } from "../models/Application";

/**
 * Application repository - abstracts application data storage using MongoDB
 */
class ApplicationRepository {
  /**
   * Convert MongoDB document to Application type
   */
  private toApplication(doc: IApplicationDocument): Application {
    return doc.toJSON() as Application;
  }

  /**
   * Find an application by ID
   */
  async findById(id: string): Promise<Application | undefined> {
    const app = await ApplicationModel.findById(id);
    return app ? this.toApplication(app) : undefined;
  }

  /**
   * Find all applications for a user
   */
  async findByUserId(userId: string): Promise<Application[]> {
    const apps = await ApplicationModel.find({ userId }).sort({
      createdAt: -1,
    });
    return apps.map((app) => this.toApplication(app));
  }

  /**
   * Create a new application
   */
  async create(application: Application): Promise<Application> {
    const newApp = await ApplicationModel.create(application);
    return this.toApplication(newApp);
  }

  /**
   * Update an application
   */
  async update(
    id: string,
    updates: Partial<Application>,
  ): Promise<Application | undefined> {
    const app = await ApplicationModel.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date().toISOString() },
      { new: true },
    );
    return app ? this.toApplication(app) : undefined;
  }

  /**
   * Add a document to an application
   */
  async addDocument(
    applicationId: string,
    document: Document,
  ): Promise<Application | undefined> {
    const app = await ApplicationModel.findByIdAndUpdate(
      applicationId,
      {
        $push: { documents: document },
        updatedAt: new Date().toISOString(),
      },
      { new: true },
    );
    return app ? this.toApplication(app) : undefined;
  }

  /**
   * Get all applications (for admin purposes)
   */
  async findAll(): Promise<Application[]> {
    const apps = await ApplicationModel.find().sort({ createdAt: -1 });
    return apps.map((app) => this.toApplication(app));
  }
}

export const applicationRepository = new ApplicationRepository();
