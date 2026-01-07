/**
 * @fileoverview PrismaClientService - Infrastructure service for database access
 * @summary Singleton PrismaClient instance for database operations
 * @description Provides a single shared PrismaClient instance for database access across the application
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from '../../index';

/**
 * Singleton class to manage Prisma client instances
 * Prevents multiple connections from being created
 */
class PrismaClientSingleton {
  private static instance: PrismaClient;
  private static connectionCount = 0;

  /**
   * Get the singleton instance of PrismaClient
   * @returns PrismaClient instance
   */
  public static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      // Create connection pool with connection settings
      const connectionString = config.databaseUrl + '?connection_limit=100&pool_timeout=20&connect_timeout=10';
      const pool = new Pool({
        connectionString: connectionString,
        max: 100,
        connectionTimeoutMillis: 10000,
        idleTimeoutMillis: 20000,
      });
      
      // Create Prisma adapter
      const adapter = new PrismaPg(pool);
      
      // Create PrismaClient with adapter
      PrismaClientSingleton.instance = new PrismaClient({
        adapter,
        log: ['error', 'warn'],
        errorFormat: 'pretty'
      });
      
      PrismaClientSingleton.connectionCount++;
    }
    
    return PrismaClientSingleton.instance;
  }

  /**
   * Get current connection count
   * @returns Number of active connections
   */
  public static getConnectionCount(): number {
    return PrismaClientSingleton.connectionCount;
  }

  /**
   * Disconnect the singleton instance
   * @returns Promise that resolves when disconnected
   */
  public static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = undefined as any;
      PrismaClientSingleton.connectionCount = 0;
    }
  }

  /**
   * Check if instance exists
   * @returns True if instance exists
   */
  public static hasInstance(): boolean {
    return !!PrismaClientSingleton.instance;
  }
}

// Export singleton instance
const prisma = PrismaClientSingleton.getInstance();

/**
 * Export the configured Prisma client as the default export.
 *
 * @remarks
 * Consumers of this module should import the same instance
 * to take advantage of automatic connection reuse.
 */
export default prisma;
