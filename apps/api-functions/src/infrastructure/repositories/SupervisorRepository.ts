/**
 * @fileoverview SupervisorRepository - Infrastructure repository for supervisor data access
 * @description Handles all database operations related to supervisors
 */

import prisma from '../database/PrismaClientService';
import { ISupervisorRepository } from '../../domain/interfaces/ISupervisorRepository';
import { User } from '../../domain/entities/User';
import { wrapPsoFetchError, wrapSupervisorFetchError } from '../../utils/error/ErrorHelpers';

/**
 * Result type for supervisor find operations
 */
type SupervisorFindResult = User | string | null;

/**
 * Repository for supervisor data access operations
 */
export class SupervisorRepository implements ISupervisorRepository {
  /**
   * Finds a supervisor by email
   * @param email - Supervisor email address
   * @returns Promise that resolves to supervisor entity or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    return prismaUser ? User.fromPrisma(prismaUser) : null;
  }

  /**
   * Checks if a user is a supervisor
   * @param email - User email address
   * @returns Promise that resolves to true if user is a supervisor
   */
  async isSupervisor(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user ? user.isSupervisor() : false;
  }

  /**
   * Finds a supervisor by ID
   * @param id - Supervisor ID
   * @returns Promise that resolves to supervisor entity or null
   */
  async findById(id: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { id }
    });
    return prismaUser ? User.fromPrisma(prismaUser) : null;
  }

  /**
   * Validates if a supervisor exists and is active
   * @param email - Supervisor email address
   * @returns Promise that resolves to true if supervisor exists and is active
   */
  async validateSupervisor(email: string): Promise<boolean> {
    const supervisor = await this.findByEmail(email);
    return supervisor ? supervisor.isSupervisor() : false;
  }

  /**
   * Finds a PSO by identifier (ID, Azure AD Object ID, or email)
   * @param identifier - The identifier to search for
   * @returns Promise that resolves to PSO or null
   */
  async findPsoByIdentifier(identifier: string): Promise<User | null> {
    try {
      // Try to find by ID first (UUID format)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.exec(identifier)) {
        const user = await this.findById(identifier);
        return user;
      }

      // Try to find by Azure AD Object ID
      if (uuidRegex.exec(identifier)) {
        const user = await prisma.user.findUnique({
          where: { azureAdObjectId: identifier }
        });
        if (user) {
          return User.fromPrisma(user);
        }
      }

      // Try to find by email
      if (identifier.includes('@')) {
        const user = await this.findByEmail(identifier);
        return user;
      }

      return null;
    } catch (error: unknown) {
      throw wrapPsoFetchError('Failed to find PSO by identifier', error);
    }
  }

  /**
   * Validates if a user is a supervisor and returns appropriate result
   * @param user - User entity to validate
   * @returns User if supervisor, error message otherwise
   */
  private validateSupervisorUser(user: User | null): User | string {
    if (!user) {
      return "User not found";
    }
    return user.isSupervisor() ? user : "User found but is not a supervisor";
  }

  /**
   * Attempts to find supervisor by ID
   * @param identifier - UUID identifier
   * @returns User if found and is supervisor, error message, or null if not found
   */
  private async findSupervisorById(identifier: string): Promise<SupervisorFindResult> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.exec(identifier)) {
      return null;
    }
    const user = await this.findById(identifier);
    return this.validateSupervisorUser(user);
  }

  /**
   * Attempts to find supervisor by Azure AD Object ID
   * @param identifier - Azure AD Object ID
   * @returns User if found and is supervisor, error message, or null if not found
   */
  private async findSupervisorByAzureAdObjectId(identifier: string): Promise<SupervisorFindResult> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.exec(identifier)) {
      return null;
    }
    const user = await prisma.user.findUnique({
      where: { azureAdObjectId: identifier }
    });
    return user ? this.validateSupervisorUser(User.fromPrisma(user)) : null;
  }

  /**
   * Attempts to find supervisor by email
   * @param identifier - Email address
   * @returns User if found and is supervisor, error message, or null if not found
   */
  private async findSupervisorByEmail(identifier: string): Promise<SupervisorFindResult> {
    if (!identifier.includes('@')) {
      return null;
    }
    const user = await this.findByEmail(identifier);
    return this.validateSupervisorUser(user);
  }

  /**
   * Finds a supervisor by identifier (ID, Azure AD Object ID, or email)
   * @param identifier - The identifier to search for
   * @returns Promise that resolves to supervisor or error message
   */
  async findSupervisorByIdentifier(identifier: string): Promise<User | string> {
    try {
      const resultById = await this.findSupervisorById(identifier);
      if (resultById !== null) {
        return resultById;
      }

      const resultByAzureAd = await this.findSupervisorByAzureAdObjectId(identifier);
      if (resultByAzureAd !== null) {
        return resultByAzureAd;
      }

      const resultByEmail = await this.findSupervisorByEmail(identifier);
      if (resultByEmail !== null) {
        return resultByEmail;
      }

      return "User not found";
    } catch (error: unknown) {
      throw wrapSupervisorFetchError('Failed to find supervisor by identifier', error);
    }
  }
}
