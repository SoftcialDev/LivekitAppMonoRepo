export interface ServiceAccountCredentialRecord {
  id: string;
  azureAdObjectId: string;
  userPrincipalName: string;
  displayName: string;
  encryptedPassword: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IServiceAccountCredentialRepository {
  /**
   * Retrieves the stored service account credential if available.
   */
  findLatest(): Promise<ServiceAccountCredentialRecord | null>;

  /**
   * Creates or updates the stored service account credential.
   */
  upsert(credential: {
    azureAdObjectId: string;
    userPrincipalName: string;
    displayName: string;
    encryptedPassword: string;
  }): Promise<ServiceAccountCredentialRecord>;
}
