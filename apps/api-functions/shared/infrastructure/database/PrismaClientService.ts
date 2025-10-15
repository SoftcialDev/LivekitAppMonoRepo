/**
 * @fileoverview PrismaClientService - Infrastructure service for database access
 * @summary Singleton PrismaClient instance for database operations
 * @description Provides a single shared PrismaClient instance for database access across the application
 */

import { PrismaClient } from "@prisma/client";

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
      console.log('[PrismaClientService] Creating new singleton instance');
      
      PrismaClientSingleton.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL + '?connection_limit=1&pool_timeout=20&connect_timeout=10'
          }
        },
        log: ['error', 'warn'],
        errorFormat: 'pretty'
      });
      
      PrismaClientSingleton.connectionCount++;
      console.log(`[PrismaClientService] Singleton created. Total instances: ${PrismaClientSingleton.connectionCount}`);
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
      console.log('[PrismaClientService] Disconnecting singleton instance');
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
