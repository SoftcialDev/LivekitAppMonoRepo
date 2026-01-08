/**
 * @fileoverview BlobUrlService - Infrastructure service for blob URL generation
 * @summary Implements IBlobUrlService for blob URL and SAS URL generation
 * @description Infrastructure implementation of blob URL service
 */

import { IBlobUrlService } from '../../domain/interfaces/IBlobUrlService';
import { buildBlobHttpsUrl, generateReadSasUrl } from './blobSigner';

/**
 * Infrastructure service for blob URL generation operations
 * @description Implements IBlobUrlService using blobSigner utilities
 */
export class BlobUrlService implements IBlobUrlService {
  buildBlobHttpsUrl(blobPath: string): string {
    return buildBlobHttpsUrl(blobPath);
  }

  generateReadSasUrl(blobPath: string, minutes: number): string {
    return generateReadSasUrl(blobPath, minutes);
  }
}

