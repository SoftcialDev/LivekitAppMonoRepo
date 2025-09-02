import prisma from "../services/prismaClienService";

/**
 * Repository for user lookups.
 */
export class UserRepository {
  /**
   * Finds a user by Azure AD object id (OID).
   *
   * @param oid - Azure AD object id.
   * @returns The user or null.
   */
  static async findByAzureAdOid(oid: string) {
    return prisma.user.findUnique({ where: { azureAdObjectId: oid } });
  }

  /**
   * Finds a user by id or by Azure AD object id (OID).
   *
   * @param idOrOid - Either the internal user id or the Azure AD object id.
   * @returns The user or null.
   */
  static async findByIdOrOid(idOrOid: string) {
    return prisma.user.findFirst({
      where: {
        OR: [{ id: idOrOid }, { azureAdObjectId: idOrOid }],
      },
    });
  }
}
