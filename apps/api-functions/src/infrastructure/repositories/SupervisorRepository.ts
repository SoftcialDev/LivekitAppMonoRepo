/**
 * @fileoverview SupervisorRepository - Infrastructure repository for supervisor data access
 * @description Handles all database operations related to supervisors
 */

import prisma from '../database/PrismaClientService';
import { ISupervisorRepository } from '../../domain/interfaces/ISupervisorRepository';
import { User } from '../../domain/entities/User';
import { wrapPsoFetchError, wrapSupervisorFetchError } from '../../utils/error/ErrorHelpers';

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
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const user = await this.findById(identifier);
        return user;
      }

      // Try to find by Azure AD Object ID
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
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
   * Finds a supervisor by identifier (ID, Azure AD Object ID, or email)
   * @param identifier - The identifier to search for
   * @returns Promise that resolves to supervisor or error message
   */
  async findSupervisorByIdentifier(identifier: string): Promise<User | string> {
    try {
      // Try to find by ID first (UUID format)
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const user = await this.findById(identifier);
        if (user && user.isSupervisor()) {
          return user;
        }
        if (user && !user.isSupervisor()) {
          return "User found but is not a supervisor";
        }
      }

      // Try to find by Azure AD Object ID
      if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const user = await prisma.user.findUnique({
          where: { azureAdObjectId: identifier }
        });
        if (user) {
          const userEntity = User.fromPrisma(user);
          if (userEntity.isSupervisor()) {
            return userEntity;
          }
          return "User found but is not a supervisor";
        }
      }

      // Try to find by email
      if (identifier.includes('@')) {
        const user = await this.findByEmail(identifier);
        if (user && user.isSupervisor()) {
          return user;
        }
        if (user && !user.isSupervisor()) {
          return "User found but is not a supervisor";
        }
      }

      return "User not found";
    } catch (error: unknown) {
      throw wrapSupervisorFetchError('Failed to find supervisor by identifier', error);
    }
  }
}
