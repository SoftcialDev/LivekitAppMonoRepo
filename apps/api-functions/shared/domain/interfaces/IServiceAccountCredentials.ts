/**
 * Minimal set of fields required to operate with the managed service account.
 */
export interface IServiceAccountCredentials {
  azureAdObjectId: string;
  userPrincipalName: string;
  displayName: string;
  password: string;
}


