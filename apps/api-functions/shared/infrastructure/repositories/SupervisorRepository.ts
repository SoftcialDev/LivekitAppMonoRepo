/**
 * @fileoverview SupervisorRepository - Infrastructure repository for supervisor data access
 * @description Handles all database operations related to supervisors
 */

import prisma from '../../services/prismaClienService';
import { ISupervisorRepository } from '../../domain/interfaces/ISupervisorRepository';
import { User } from '../../domain/entities/User';

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
}
