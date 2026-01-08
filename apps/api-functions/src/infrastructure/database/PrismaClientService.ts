/**
 * @fileoverview PrismaClientService - Infrastructure service for database access
 * @summary Singleton PrismaClient instance for database operations
 * @description Provides a single shared PrismaClient instance for database access across the application
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { config } from '../../config';

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

/**
 * Lazy-initialized Prisma client instance
 * @remarks
 * The instance is created only when first accessed, ensuring config is available
 * at module initialization time. This avoids issues with module initialization order.
 */
let prismaInstance: PrismaClient | undefined;

/**
 * Get the singleton Prisma client instance (lazy initialization)
 * @returns PrismaClient instance
 * @remarks
 * This function ensures the Prisma client is only initialized when needed,
 * avoiding issues with module initialization order and config availability.
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = PrismaClientSingleton.getInstance();
  }
  return prismaInstance;
}

/**
 * Create a lazy getter object that proxies all PrismaClient methods
 * @remarks
 * This allows the default export to behave like a PrismaClient instance
 * while deferring initialization until first use.
 */
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const instance = getPrismaClient();
    const value = (instance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

/**
 * Export the Prisma client proxy as default export for backwards compatibility
 * @remarks
 * This provides a lazy-initialized Prisma client instance that behaves
 * exactly like a PrismaClient, but only initializes when first accessed.
 */
export default prismaProxy;
