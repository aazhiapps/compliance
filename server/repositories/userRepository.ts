import { User } from "@shared/auth";

/**
 * User repository - abstracts user data storage
 * In a real application, this would interact with a database
 */
class UserRepository {
  private users: Map<string, User & { password: string }>;

  constructor() {
    this.users = new Map();
  }

  /**
   * Find a user by email
   */
  findByEmail(email: string): (User & { password: string }) | undefined {
    return this.users.get(email);
  }

  /**
   * Find a user by ID
   */
  findById(id: string): (User & { password: string }) | undefined {
    for (const user of this.users.values()) {
      if (user.id === id) {
        return user;
      }
    }
    return undefined;
  }

  /**
   * Create a new user
   */
  create(user: User & { password: string }): User & { password: string } {
    this.users.set(user.email, user);
    return user;
  }

  /**
   * Check if a user exists by email
   */
  exists(email: string): boolean {
    return this.users.has(email);
  }

  /**
   * Get all users (for admin purposes)
   */
  findAll(): User[] {
    return Array.from(this.users.values()).map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
}

export const userRepository = new UserRepository();
