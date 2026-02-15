import mongoose from "mongoose";

/**
 * MongoDB connection configuration
 */
export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private isConnected = false;

  private constructor() {
    // Register shutdown handlers only once during construction
    process.on("SIGINT", async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  /**
   * Connect to MongoDB database
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("✓ Using existing MongoDB connection");
      return;
    }

    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/compliance";

    try {
      console.log("Connecting to MongoDB...");
      await mongoose.connect(mongoUri);
      this.isConnected = true;
      console.log("✓ MongoDB connected successfully");

      // Handle connection events
      mongoose.connection.on("error", (error) => {
        console.error("MongoDB connection error:", error);
        this.isConnected = false;
      });

      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
        this.isConnected = false;
      });
    } catch (error) {
      console.error("MongoDB connection failed:", error);
      throw new Error("Failed to connect to MongoDB");
    }
  }

  /**
   * Disconnect from MongoDB database
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      await mongoose.connection.close();
      this.isConnected = false;
      console.log("✓ MongoDB disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting from MongoDB:", error);
      throw error;
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const dbConnection = DatabaseConnection.getInstance();
