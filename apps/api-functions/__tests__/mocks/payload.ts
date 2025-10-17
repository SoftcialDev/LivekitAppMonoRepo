/**
 * @fileoverview Payload helper
 * @summary Adds toPayload() to returned objects for handler success paths
 * @description Used by unit tests to simulate domain/application responses
 */

export function toPayloadify<T>(data: T | null | undefined): any {
  return {
    ...(data as any),
    toPayload: () => data
  };
}


