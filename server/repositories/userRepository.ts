import { User } from "@shared/auth";
import { UserModel, IUserDocument } from "../models/User";

/**
 * User repository - abstracts user data storage using MongoDB
 */
class UserRepository {
  /**
   * Convert MongoDB document to User type (with password)
   */
  private toUserWithPassword(doc: IUserDocument): User & { password: string } {
    const userObj = doc.toJSON() as User;
    return {
      ...userObj,
      password: doc.password,
    };
  }

  /**
   * Find a user by email
   */
  async findByEmail(
    email: string,
  ): Promise<(User & { password: string }) | undefined> {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    return user ? this.toUserWithPassword(user) : undefined;
  }

  /**
   * Find a user by ID
   */
  async findById(
    id: string,
  ): Promise<(User & { password: string }) | undefined> {
    const user = await UserModel.findById(id);
    return user ? this.toUserWithPassword(user) : undefined;
  }

  /**
   * Create a new user
   */
  async create(
    user: User & { password: string },
  ): Promise<User & { password: string }> {
    const newUser = await UserModel.create({
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      businessType: user.businessType,
      language: user.language,
      isEmailVerified: user.isEmailVerified,
    });
    return this.toUserWithPassword(newUser);
  }

  /**
   * Check if a user exists by email
   */
  async exists(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({
      email: email.toLowerCase(),
    });
    return count > 0;
  }

  /**
   * Get all users (for admin purposes)
   */
  async findAll(): Promise<User[]> {
    const users = await UserModel.find();
    return users.map((user) => user.toJSON() as User);
  }
}

export const userRepository = new UserRepository();
