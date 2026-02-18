import { ClientModel, IClientDocument } from "../models/Client";
import { Client, CreateClientRequest, UpdateClientRequest } from "@shared/client";

class ClientRepository {
  /**
   * Find all clients
   */
  async findAll(): Promise<Client[]> {
    const clients = await ClientModel.find().sort({ createdAt: -1 });
    return clients.map((client) => client.toJSON() as Client);
  }

  /**
   * Find clients by user ID
   */
  async findByUserId(userId: string): Promise<Client[]> {
    const clients = await ClientModel.find({ userId }).sort({ createdAt: -1 });
    return clients.map((client) => client.toJSON() as Client);
  }

  /**
   * Find client by ID
   */
  async findById(id: string): Promise<Client | null> {
    const client = await ClientModel.findById(id);
    return client ? (client.toJSON() as Client) : null;
  }

  /**
   * Find client by PAN number
   */
  async findByPan(panNumber: string): Promise<Client | null> {
    const client = await ClientModel.findOne({ panNumber: panNumber.toUpperCase() });
    return client ? (client.toJSON() as Client) : null;
  }

  /**
   * Find client by GSTIN
   */
  async findByGstin(gstin: string): Promise<Client | null> {
    const client = await ClientModel.findOne({ gstin: gstin.toUpperCase() });
    return client ? (client.toJSON() as Client) : null;
  }

  /**
   * Find client by email
   */
  async findByEmail(email: string): Promise<Client | null> {
    const client = await ClientModel.findOne({ email: email.toLowerCase() });
    return client ? (client.toJSON() as Client) : null;
  }

  /**
   * Check if client exists for a user
   */
  async existsForUser(userId: string): Promise<boolean> {
    const count = await ClientModel.countDocuments({ userId, status: "active" });
    return count > 0;
  }

  /**
   * Get active client for a user (for KYC reuse)
   */
  async getActiveClientForUser(userId: string): Promise<Client | null> {
    const client = await ClientModel.findOne({ 
      userId, 
      status: "active" 
    }).sort({ createdAt: -1 });
    return client ? (client.toJSON() as Client) : null;
  }

  /**
   * Create a new client
   */
  async create(clientData: CreateClientRequest & { userId: string; createdBy: string }): Promise<Client> {
    const client = new ClientModel({
      ...clientData,
      status: "active",
      kycStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await client.save();
    return client.toJSON() as Client;
  }

  /**
   * Update a client
   */
  async update(id: string, updates: UpdateClientRequest & { lastModifiedBy?: string }): Promise<Client | null> {
    const client = await ClientModel.findByIdAndUpdate(
      id,
      { 
        ...updates, 
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );
    return client ? (client.toJSON() as Client) : null;
  }

  /**
   * Update KYC status
   */
  async updateKycStatus(
    id: string,
    kycStatus: "pending" | "verified" | "rejected" | "expired",
    modifiedBy: string
  ): Promise<Client | null> {
    const client = await ClientModel.findByIdAndUpdate(
      id,
      { 
        kycStatus,
        lastModifiedBy: modifiedBy,
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );
    return client ? (client.toJSON() as Client) : null;
  }

  /**
   * Delete a client (soft delete by setting status to inactive)
   */
  async delete(id: string, deletedBy: string): Promise<boolean> {
    const result = await ClientModel.findByIdAndUpdate(
      id,
      { 
        status: "inactive",
        lastModifiedBy: deletedBy,
        updatedAt: new Date().toISOString() 
      }
    );
    return !!result;
  }

  /**
   * Get clients by status
   */
  async findByStatus(status: "active" | "inactive" | "suspended"): Promise<Client[]> {
    const clients = await ClientModel.find({ status }).sort({ createdAt: -1 });
    return clients.map((client) => client.toJSON() as Client);
  }

  /**
   * Get clients by KYC status
   */
  async findByKycStatus(kycStatus: "pending" | "verified" | "rejected" | "expired"): Promise<Client[]> {
    const clients = await ClientModel.find({ kycStatus }).sort({ createdAt: -1 });
    return clients.map((client) => client.toJSON() as Client);
  }

  /**
   * Search clients by name, email, or PAN
   */
  async search(query: string): Promise<Client[]> {
    const searchRegex = new RegExp(query, "i");
    const clients = await ClientModel.find({
      $or: [
        { clientName: searchRegex },
        { businessName: searchRegex },
        { email: searchRegex },
        { panNumber: query.toUpperCase() },
        { gstin: query.toUpperCase() },
      ],
    }).sort({ createdAt: -1 });
    return clients.map((client) => client.toJSON() as Client);
  }

  /**
   * Get client statistics
   */
  async getStatistics() {
    const [total, active, inactive, suspended, kycPending, kycVerified] = await Promise.all([
      ClientModel.countDocuments(),
      ClientModel.countDocuments({ status: "active" }),
      ClientModel.countDocuments({ status: "inactive" }),
      ClientModel.countDocuments({ status: "suspended" }),
      ClientModel.countDocuments({ kycStatus: "pending" }),
      ClientModel.countDocuments({ kycStatus: "verified" }),
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
      kycPending,
      kycVerified,
    };
  }
}

export const clientRepository = new ClientRepository();
