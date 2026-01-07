/**
 * Minimal type definitions for the `jwks-rsa` module.
 *
 * Provides interfaces for configuring a JWKS client,
 * handling signing keys, and the main factory function.
 */
declare module "jwks-rsa" {
  /**
   * Options for configuring a JWKS client instance.
   */
  interface JwksClientOptions {
    /**
     * The URI where the JSON Web Key Set can be fetched.
     */
    jwksUri: string;

    /**
     * Enable in-memory caching of keys.
     * @default false
     */
    cache?: boolean;

    /**
     * Enable rate limiting for JWKS requests.
     * @default false
     */
    rateLimit?: boolean;

    /**
     * Maximum number of JWKS HTTP requests per minute when rate limiting.
     */
    jwksRequestsPerMinute?: number;

    /**
     * Maximum number of entries to keep in the cache.
     */
    cacheMaxEntries?: number;

    /**
     * Maximum age (in milliseconds) for cached entries.
     */
    cacheMaxAge?: number;

    /**
     * Custom HTTP headers to include with each JWKS request.
     */
    requestHeaders?: Record<string, string>;

    /**
     * Timeout (in milliseconds) for HTTP requests to the JWKS endpoint.
     */
    timeout?: number;

    // Add other options here if your use case requires them
  }

  /**
   * Represents a retrieved signing key.
   */
  interface SigningKey {
    /**
     * Returns the public key as a PEM-formatted string.
     */
    getPublicKey(): string;

    /**
     * Synchronous variant of `getPublicKey`, if supported.
     */
    getPublicKeySync?(): string;
  }

  /**
   * Callback signature used when fetching a signing key.
   *
   * @param err - Error object if the request failed, otherwise null.
   * @param key - The retrieved signing key (as string or Buffer).
   */
  interface SigningKeyCallback {
    (err: Error | null, key?: string | Buffer): void;
  }

  /**
   * A client for fetching and caching signing keys from a JWKS endpoint.
   */
  interface JwksClient {
    /**
     * Fetches a signing key by its Key ID (kid).
     *
     * @param kid - The Key ID to look up.
     * @param callback - Called with an error or the found signing key.
     */
    getSigningKey(
      kid: string,
      callback: (err: Error | null, key: SigningKey) => void
    ): void;

    // You can add other methods here (e.g. getSigningKeys) if needed
  }

  /**
   * Creates a new JWKS client instance.
   *
   * @param options - Configuration options for the JWKS client.
   * @returns A configured JwksClient.
   */
  function jwksClient(options: JwksClientOptions): JwksClient;

  export = jwksClient;
}
