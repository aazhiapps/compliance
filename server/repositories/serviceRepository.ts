import { Service } from "@shared/service";
import { ServiceModel, IServiceDocument } from "../models/Service";

/**
 * Service repository - abstracts service data storage using MongoDB
 */
class ServiceRepository {
  /**
   * Convert MongoDB document to Service type
   */
  private toService(doc: IServiceDocument): Service {
    return doc.toJSON() as Service;
  }

  /**
   * Find a service by ID
   */
  async findById(id: string): Promise<Service | undefined> {
    const service = await ServiceModel.findById(id);
    return service ? this.toService(service) : undefined;
  }

  /**
   * Get all services
   */
  async findAll(): Promise<Service[]> {
    const services = await ServiceModel.find().sort({ name: 1 });
    return services.map((service) => this.toService(service));
  }

  /**
   * Create a new service
   */
  async create(
    serviceData: Omit<
      Service,
      "id" | "createdAt" | "updatedAt" | "applicationsCount" | "revenue"
    >,
  ): Promise<Service> {
    const newService = await ServiceModel.create({
      ...serviceData,
      applicationsCount: 0,
      revenue: 0,
    });
    return this.toService(newService);
  }

  /**
   * Update a service
   */
  async update(
    id: string,
    updates: Partial<Service>,
  ): Promise<Service | undefined> {
    const service = await ServiceModel.findByIdAndUpdate(
      id,
      {
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      { new: true },
    );
    return service ? this.toService(service) : undefined;
  }

  /**
   * Delete a service
   */
  async delete(id: string): Promise<boolean> {
    const result = await ServiceModel.findByIdAndDelete(id);
    return result !== null;
  }

  /**
   * Check if a service exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await ServiceModel.countDocuments({ _id: id });
    return count > 0;
  }
}

export const serviceRepository = new ServiceRepository();
