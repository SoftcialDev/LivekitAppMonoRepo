/**
 * @fileoverview Manages creation, licensing, and credential storage for the Teams service account.
 */

import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { config } from '../../config';
import { EncryptionService } from './EncryptionService';
import {
  IServiceAccountCredentialRepository,
} from '../../domain/interfaces/IServiceAccountCredentialRepository';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IServiceAccountCredentials } from '../../domain/interfaces/IServiceAccountCredentials';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

const INVALID_UPN_MESSAGE_FRAGMENT = 'domain portion of the userprincipalname property is invalid';

export class ServiceAccountManager {
  private readonly tenantId = config.azureTenantId;
  private readonly clientId = config.azureClientId;
  private readonly clientSecret = config.azureClientSecret;
  private serviceAccountUpn = config.serviceAccountUpn;
  private readonly displayName = config.serviceAccountDisplayName || 'InContact Notifications';
  private readonly usageLocation = config.serviceAccountUsageLocation || 'US';
  private readonly licenseSkuId = config.serviceAccountLicenseSkuId;
  private readonly preferredSkuPartNumbers = config.serviceAccountPreferredSkuPartNumbers;
  private readonly encryptionService: EncryptionService;
  private readonly credentialRepository: IServiceAccountCredentialRepository;
  private readonly userRepository: IUserRepository;
  private readonly cca: ConfidentialClientApplication;
  private cache: IServiceAccountCredentials | null = null;
  private readonly localPart: string;
  private resolvedLicenseSkuId: string | null = null;

  /**
   * @param credentialRepository - Persistence layer for encrypted service-account secrets.
   * @param encryptionService - Handles encryption of stored passwords.
   * @param userRepository - Provides access to the local user table for RBAC alignment.
   */
  constructor(
    credentialRepository: IServiceAccountCredentialRepository,
    encryptionService: EncryptionService,
    userRepository: IUserRepository
  ) {
    this.credentialRepository = credentialRepository;
    this.encryptionService = encryptionService;
    this.userRepository = userRepository;
    this.cca = new ConfidentialClientApplication({
      auth: {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        authority: `https://login.microsoftonline.com/${this.tenantId}`
      }
    });
    this.localPart = this.serviceAccountUpn.split('@')[0] || 'incontact.service';
  }

  /**
   * Ensures the service account exists both in Azure AD and in local persistence.
   * @returns Cached or freshly created service-account credentials.
   */
  async ensureServiceAccount(): Promise<IServiceAccountCredentials> {
    if (this.cache) {
      return this.cache;
    }

    const stored = await this.credentialRepository.findLatest();
    if (stored) {
      const password = this.encryptionService.decrypt(stored.encryptedPassword);
      this.serviceAccountUpn = stored.userPrincipalName;
      config.serviceAccountUpn = stored.userPrincipalName;
      this.cache = {
        azureAdObjectId: stored.azureAdObjectId,
        userPrincipalName: stored.userPrincipalName,
        displayName: stored.displayName,
        password
      };

      await this.ensureLocalUser(stored.azureAdObjectId, stored.userPrincipalName, stored.displayName);
      await this.assignLicenseIfConfigured(null, stored.azureAdObjectId);

      return this.cache;
    }

    const graph = this.initGraphClient();
    const password = this.generatePassword();
    const account = await this.createOrResetAccount(graph, password);

    await this.credentialRepository.upsert({
      azureAdObjectId: account.id,
      userPrincipalName: account.userPrincipalName,
      displayName: account.displayName,
      encryptedPassword: this.encryptionService.encrypt(password)
    });

    await this.ensureLocalUser(account.id, account.userPrincipalName, account.displayName);

    this.cache = {
      azureAdObjectId: account.id,
      userPrincipalName: account.userPrincipalName,
      displayName: account.displayName,
      password
    };

    return this.cache;
  }

  /**
   * Retrieves a delegated access token via username/password for the service account.
   * @param scopes - Graph scopes requested for the token acquisition.
   * @returns OAuth access token usable against Graph.
   */
  async getDelegatedToken(scopes: string[]): Promise<string> {
    const credentials = await this.ensureServiceAccount();
    const result = await this.cca.acquireTokenByUsernamePassword({
      scopes,
      username: credentials.userPrincipalName,
      password: credentials.password
    });

    if (!result || !result.accessToken) {
      throw new Error('Failed to acquire delegated token for service account');
    }

    return result.accessToken;
  }

  /**
   * Upserts the service account into the local user repository so it is available for RBAC checks.
   * @param azureAdObjectId - Azure AD object identifier for the account.
   * @param upn - User principal name to persist as email.
   * @param displayName - Friendly name stored as full name.
   */
  private async ensureLocalUser(azureAdObjectId: string, upn: string, displayName: string): Promise<void> {
    await this.userRepository.upsertUser({
      azureAdObjectId: azureAdObjectId.toLowerCase(),
      email: upn.toLowerCase(),
      fullName: displayName,
      role: UserRole.SuperAdmin
    });
  }

  /**
   * Creates a Graph client authenticated with application credentials.
   * @returns Graph client authenticated with client credentials.
   */
  private initGraphClient(): Client {
    const credential = new ClientSecretCredential(this.tenantId, this.clientId, this.clientSecret);
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default']
    });
    return Client.initWithMiddleware({ authProvider });
  }

  /**
   * Creates the service account when missing or resets its password when it already exists.
   * @param graph - Graph client authenticated as the application.
   * @param password - Password to set on the service account.
   * @returns The Graph user representation for the account.
   */
  private async createOrResetAccount(
    graph: Client,
    password: string
  ): Promise<{ id: string; userPrincipalName: string; displayName: string }> {
    const existing = await this.getUserByUpn(graph, this.serviceAccountUpn);
    if (existing) {
      await graph.api(`/users/${existing.id}`).patch({
        passwordProfile: {
          password,
          forceChangePasswordNextSignIn: false,
          forceChangePasswordNextSignInWithMfa: false
        }
      });
      await this.ensureUsageLocation(graph, existing.id, existing.usageLocation);

      this.serviceAccountUpn = existing.userPrincipalName;
      config.serviceAccountUpn = existing.userPrincipalName;
      await this.assignLicenseIfConfigured(graph, existing.id);

      return {
        id: existing.id,
        userPrincipalName: existing.userPrincipalName,
        displayName: existing.displayName || this.displayName
      };
    }

    const created = await this.createAccount(graph, this.serviceAccountUpn, password);
    if (created) {
      this.serviceAccountUpn = created.userPrincipalName;
      config.serviceAccountUpn = created.userPrincipalName;
      await this.ensureUsageLocation(graph, created.id, undefined);
      await this.assignLicenseIfConfigured(graph, created.id);
      return created;
    }

    const fallbackUpn = await this.resolveFallbackUpn(graph);
    if (!fallbackUpn) {
      throw new Error('Unable to determine a verified domain for the service account');
    }

    console.warn(
      '[ServiceAccountManager] Falling back to verified domain for service account UPN',
      { fallbackUpn }
    );

    const fallbackAccount = await this.createAccount(graph, fallbackUpn, password);
    if (!fallbackAccount) {
      throw new Error('Failed to create service account with fallback domain');
    }

    this.serviceAccountUpn = fallbackAccount.userPrincipalName;
    config.serviceAccountUpn = fallbackAccount.userPrincipalName;
    await this.ensureUsageLocation(graph, fallbackAccount.id, undefined);
    await this.assignLicenseIfConfigured(graph, fallbackAccount.id);

    return fallbackAccount;
  }

  /**
   * Retrieves an Azure AD user by userPrincipalName, returning null when not found.
   * @param graph - Graph client instance.
   * @param upn - User principal name to look up.
   * @returns The Graph user or null when not found/invalid.
   */
  private async getUserByUpn(graph: Client, upn: string): Promise<any | null> {
    try {
      return await graph.api(`/users/${upn}`).get();
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.statusCode === 400) {
        return null;
      }
      throw error;
    }
  }

  private createMailNickname(upn: string): string {
    return upn.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '');
  }

  /**
   * Creates a new Azure AD user with the configured service account attributes.
   * @param graph - Graph client.
   * @param userPrincipalName - UPN to use for the new account.
   * @param password - Password to set.
   * @returns Graph response metadata or null when validation fails.
   */
  private async createAccount(
    graph: Client,
    userPrincipalName: string,
    password: string
  ): Promise<{ id: string; userPrincipalName: string; displayName: string } | null> {
    try {
      const response = await graph.api('/users').post({
        accountEnabled: true,
        displayName: this.displayName,
        mailNickname: this.createMailNickname(userPrincipalName),
        userPrincipalName,
        usageLocation: this.usageLocation,
        passwordProfile: {
          password,
          forceChangePasswordNextSignIn: false,
          forceChangePasswordNextSignInWithMfa: false
        }
      });

      return {
        id: response.id,
        userPrincipalName: response.userPrincipalName,
        displayName: response.displayName || this.displayName
      };
    } catch (error: any) {
      const message = (error?.message || '').toString().toLowerCase();
      if (message.includes(INVALID_UPN_MESSAGE_FRAGMENT)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Assigns a Teams-capable license to the service account when configuration allows it.
   * @param graph - Optional Graph client; a new one is created when not provided.
   * @param userId - Azure AD identifier of the service account.
   */
  private async assignLicenseIfConfigured(graph: Client | null, userId: string): Promise<void> {
    const client = graph ?? this.initGraphClient();
    await this.ensureUsageLocation(client, userId, null);
    const skuId = await this.getLicenseSkuId(client);
    if (!skuId) {
      console.warn('[ServiceAccountManager] No suitable license SKU available for service account');
      return;
    }

    try {
      await client
        .api(`/users/${userId}/assignLicense`)
        .post({ addLicenses: [{ skuId }], removeLicenses: [] });
      console.log('[ServiceAccountManager] License ensured for service account', {
        userId,
        skuId
      });
    } catch (error: any) {
      const message = (error?.message || '').toString().toLowerCase();
      if (message.includes('licensealreadyassigned') || message.includes('already assigned')) {
        console.log('[ServiceAccountManager] License already assigned to service account', {
          userId,
          skuId
        });
        return;
      }

      console.error('[ServiceAccountManager] Failed to assign license to service account', {
        userId,
        skuId,
        error: error?.message ?? error
      });
    }
  }

  /**
   * Resolves which SKU should be assigned to the account, honoring explicit configuration first.
   * @param client - Graph client used to query subscribed SKUs.
   * @returns The SKU identifier to assign or null when none is appropriate.
   */
  private async getLicenseSkuId(client: Client): Promise<string | null> {
    if (this.licenseSkuId) {
      return this.licenseSkuId;
    }

    if (this.resolvedLicenseSkuId) {
      return this.resolvedLicenseSkuId;
    }

    const resolved = await this.resolvePreferredLicenseSkuId(client);
    if (resolved) {
      this.resolvedLicenseSkuId = resolved;
    }
    return resolved;
  }

  /**
   * Makes sure the account has a usageLocation set, required before attempting license assignment.
   * @param graph - Graph client.
   * @param userId - Azure AD identifier of the service account.
   * @param existingUsageLocation - Optional usageLocation already fetched to reduce calls.
   */
  private async ensureUsageLocation(
    graph: Client,
    userId: string,
    existingUsageLocation?: string | null
  ): Promise<void> {
    const desired = this.usageLocation?.toUpperCase();
    if (!desired) {
      return;
    }

    let current = existingUsageLocation?.toUpperCase();
    try {
      if (!current) {
        const data = await graph.api(`/users/${userId}?$select=usageLocation`).get();
        current = (data?.usageLocation as string | undefined)?.toUpperCase();
      }
    } catch (error: any) {
      console.warn('[ServiceAccountManager] Unable to read current usageLocation for service account', {
        userId,
        error: error?.message ?? error
      });
    }

    if (current === desired) {
      return;
    }

    try {
      await graph.api(`/users/${userId}`).patch({ usageLocation: desired });
      console.log('[ServiceAccountManager] Updated usageLocation for service account', {
        userId,
        usageLocation: desired
      });
    } catch (error: any) {
      console.error('[ServiceAccountManager] Failed to update usageLocation for service account', {
        userId,
        desired,
        error: error?.message ?? error
      });
    }
  }

  /**
   * Looks for an available SKU that includes Teams, preferring the configured list.
   * @param client - Graph client.
   * @returns SKU identifier or null when nothing is available.
   */
  private async resolvePreferredLicenseSkuId(client: Client): Promise<string | null> {
    try {
      const response = await client.api('/subscribedSkus').get();
      const skus: Array<{
        skuId?: string;
        skuPartNumber?: string;
        prepaidUnits?: { enabled?: number };
        consumedUnits?: number;
        servicePlans?: Array<{ servicePlanName?: string; capabilityStatus?: string }>;
      }> = response?.value || [];

      const availableSkus = skus.filter((sku) => {
        const enabled = sku.prepaidUnits?.enabled ?? 0;
        const consumed = sku.consumedUnits ?? 0;
        return enabled > consumed && this.hasTeamsCapability(sku.servicePlans);
      });

      for (const preferred of this.preferredSkuPartNumbers) {
        const match = availableSkus.find(
          (sku) => sku.skuPartNumber?.toUpperCase() === preferred.toUpperCase()
        );
        if (match?.skuId) {
          console.log('[ServiceAccountManager] Using preferred license SKU for service account', {
            skuPartNumber: match.skuPartNumber,
            skuId: match.skuId
          });
          return match.skuId;
        }
      }

      const fallback = availableSkus[0];
      if (fallback?.skuId) {
        console.warn(
          '[ServiceAccountManager] Preferred license SKUs unavailable. Falling back to first Teams-capable SKU',
          { skuPartNumber: fallback.skuPartNumber, skuId: fallback.skuId }
        );
        return fallback.skuId;
      }

      console.error('[ServiceAccountManager] No Teams-capable license SKUs with available seats found');
      return null;
    } catch (error: any) {
      console.error('[ServiceAccountManager] Failed to resolve license SKU from directory', {
        error: error?.message ?? error
      });
      return null;
    }
  }

  /**
   * Determines whether the provided service plans include an enabled Teams workload.
   * @param servicePlans - Service plans included in a SKU.
   */
  private hasTeamsCapability(
    servicePlans: Array<{ servicePlanName?: string; capabilityStatus?: string }> | undefined
  ): boolean {
    if (!servicePlans?.length) {
      return false;
    }

    return servicePlans.some((plan) => {
      if (plan.capabilityStatus && plan.capabilityStatus.toLowerCase() !== 'enabled') {
        return false;
      }
      const planName = plan.servicePlanName?.toLowerCase() ?? '';
      return planName.includes('teams');
    });
  }

  /**
   * Finds a verified domain in the tenant to build a fallback UPN when the configured one is invalid.
   * @param graph - Graph client.
   * @returns Fallback UPN or null when none can be determined.
   */
  private async resolveFallbackUpn(graph: Client): Promise<string | null> {
    try {
      const domainsResponse = await graph.api('/domains').get();
      const domains: Array<{ id?: string; isVerified?: boolean; isDefault?: boolean }> = domainsResponse.value || [];

      const verified = domains.filter((domain) => domain.isVerified);
      if (!verified.length) {
        return null;
      }

      const preferred = verified.find((domain) => domain.isDefault) || verified[0];
      const domainName = preferred.id;
      if (!domainName) {
        return null;
      }

      return `${this.localPart}@${domainName}`.toLowerCase();
    } catch (error) {
      console.error('[ServiceAccountManager] Failed to resolve fallback domain', error);
      return null;
    }
  }

  /**
   * Generates a random password that satisfies Azure AD complexity requirements.
   * @returns Generated password string.
   */
  private generatePassword(): string {
    const length = 20;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let password = '';
    for (let i = 0; i < length; i += 1) {
      const index = crypto.randomInt(0, charset.length);
      password += charset[index];
    }
    return password;
  }
}
