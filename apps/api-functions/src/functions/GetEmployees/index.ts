import { Context, HttpRequest } from "@azure/functions";
import { withAuth } from "../../middleware/auth";
import { withErrorHandler } from "../../middleware/errorHandler";
import { ok, unauthorized, badRequest } from "../../utils/response";
import prisma from "../../services/prismaClienService";
import { getPresenceStatus } from "../../services/presenceService";
import { JwtPayload } from "jsonwebtoken";

 /**
  * Represents an employee record as stored in the database,
  * guaranteed to have a non-null assignedAt date.
  */
 interface EmployeeRecord {
   email: string;
   fullName: string;
   assignedAt: Date;
 }

 /**
  * Response shape for an employee with presence status.
  */
 interface EmployeeWithPresence extends EmployeeRecord {
   presenceStatus: "online" | "offline";
 }

 /**
  * Azure Function: GetEmployees
  *
  * Retrieves all users assigned to the calling Admin/SuperAdmin,
  * excluding deleted users. For each, returns:
  *  - email
  *  - fullName
  *  - assignedAt
  *  - presenceStatus ("online" | "offline")
  *
  * @param ctx - Azure Functions execution context containing the HTTP request.
  * @returns 200 OK with `{ employees: EmployeeWithPresence[] }`,
  *          or 401/400 on error.
  */
 export default withErrorHandler(async (ctx: Context) => {
   const req: HttpRequest = ctx.req!;
   await withAuth(ctx, async () => {
     const claims = (ctx as any).bindings.user as JwtPayload;
     const azureAdId = (claims.oid || claims.sub) as string;
     if (!azureAdId) {
       return unauthorized(ctx, "Cannot determine user identity");
     }

     // 1. Fetch the admin user record
     const adminUser = await prisma.user.findUnique({
       where: { azureAdObjectId: azureAdId },
     });
     if (!adminUser || adminUser.deletedAt) {
       return unauthorized(ctx, "User not found or deleted");
     }
     const { role, id: adminId } = adminUser;
     if (role !== "Admin" && role !== "SuperAdmin") {
       return unauthorized(ctx, "Insufficient privileges");
     }

     try {
       // 2. Fetch employees assigned to this admin
       const employees = await prisma.user.findMany({
         where: { adminId, deletedAt: null },
         select: { email: true, fullName: true, assignedAt: true },
       });

       // 3. Filter out any records where assignedAt is null
       const validEmployees: EmployeeRecord[] = employees.filter(
         (emp): emp is EmployeeRecord => emp.assignedAt !== null
       );

       // 4. For each valid employee, resolve presence status
       const result: EmployeeWithPresence[] = await Promise.all(
         validEmployees.map(async (emp) => {
           let presenceStatus: "online" | "offline";
           try {
             presenceStatus = await getPresenceStatus(emp.email);
           } catch {
             presenceStatus = "offline";
           }
           return {
             ...emp,
             presenceStatus,
           };
         })
       );

       return ok(ctx, { employees: result });
     } catch (err: any) {
       ctx.log.error("GetEmployees error:", err);
       return badRequest(ctx, `Failed to get employees: ${err.message}`);
     }
   });
 });
