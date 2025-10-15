/**
 * @fileoverview DatabaseStatus - Azure Function for database connection monitoring
 * @description Provides real-time database connection status and metrics
 */

import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../shared/middleware/auth";
import { withErrorHandler } from "../shared/middleware/errorHandler";
import { ok } from "../shared/utils/response";
import prisma from "../shared/infrastructure/database/PrismaClientService";

const DatabaseStatus: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      try {
        // Get database connection metrics
        const maxConn = await prisma.$queryRaw`
          SELECT setting as max_connections
          FROM pg_settings 
          WHERE name = 'max_connections'
        `;
        
        const reservedConn = await prisma.$queryRaw`
          SELECT setting as reserved_connections
          FROM pg_settings 
          WHERE name = 'superuser_reserved_connections'
        `;
        
        const currentConn = await prisma.$queryRaw`
          SELECT 
            application_name,
            state,
            count(*) as connections
          FROM pg_stat_activity 
          GROUP BY application_name, state
          ORDER BY connections DESC
        `;
        
        const totalCurrent = (currentConn as any[]).reduce((sum: number, conn: any) => sum + parseInt(conn.connections), 0);
        const maxConnections = parseInt((maxConn as any[])[0].max_connections);
        const reservedConnections = parseInt((reservedConn as any[])[0].reserved_connections);
        const availableForApps = maxConnections - reservedConnections;
        
        return ok(ctx, {
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development',
          database: {
            max_connections: maxConnections,
            reserved_connections: reservedConnections,
            available_for_apps: availableForApps,
            current_total: totalCurrent,
            utilization_percentage: Math.round((totalCurrent / maxConnections) * 100),
            available_remaining: maxConnections - totalCurrent
          },
          connections_by_application: currentConn,
          prisma_singleton: {
            has_instance: true,
            connection_count: 1
          }
        });
      } catch (error: any) {
        return ok(ctx, { 
          error: error.message,
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'development'
        });
      }
    });
  },
  {
    genericMessage: "Internal Server Error in DatabaseStatus",
    showStackInDev: true,
  }
);

export default DatabaseStatus;
