/**
 * @fileoverview WebSocket message parser utility
 * @summary Parses incoming WebSocket message payloads
 * @description Extracts and parses messages from various Azure WebPubSub event formats
 */

import { logWarn } from '@/shared/utils/logger';

/**
 * WebSocket message parser utility
 * 
 * Handles parsing of messages from Azure WebPubSub which can arrive in different formats:
 * - String payloads
 * - ArrayBuffer payloads
 * - TypedArray payloads
 * - Objects with nested data structures
 */
export class WebSocketMessageParser {
  /**
   * Parses an incoming WebSocket event payload into a JSON object
   * 
   * Handles multiple payload formats from Azure WebPubSub:
   * - { message: { data } }
   * - { data }
   * - Direct payload
   * 
   * @param event - Raw WebSocket event
   * @returns Parsed JSON object or null if parsing fails
   */
  static parse(event: unknown): unknown {
    // Extract raw payload from event structure
    const raw = this.extractRawPayload(event);
    if (!raw) {
      return null;
    }

    // Convert to string if needed
    const text = this.convertToString(raw);
    if (!text) {
      return null;
    }

    // Parse JSON
    const parsed = this.parseJson(text);
    return parsed ?? null;
  }

  /**
   * Extracts raw payload from Azure WebPubSub event structure
   * 
   * @param event - WebSocket event
   * @returns Raw payload or null
   */
  private static extractRawPayload(event: unknown): unknown {
    if (!event || typeof event !== 'object') {
      return event;
    }

    // Azure events can surface as { message: { data } } or directly { data }
    const eventObj = event as Record<string, unknown>;
    const message = eventObj.message as Record<string, unknown> | undefined;
    return message?.data ?? eventObj.data ?? event;
  }

  /**
   * Converts various payload types to string
   * 
   * @param raw - Raw payload
   * @returns String representation or null if conversion fails
   */
  private static convertToString(raw: unknown): string | null {
    if (typeof raw === 'string') {
      return raw;
    }

    if (raw instanceof ArrayBuffer) {
      return this.decodeArrayBuffer(raw);
    }

    if (ArrayBuffer.isView(raw)) {
      return this.decodeArrayBuffer(raw.buffer);
    }

    // Unknown payload type — cannot convert
    return null;
  }

  /**
   * Decodes ArrayBuffer to string using TextDecoder
   * 
   * @param buffer - ArrayBuffer to decode
   * @returns Decoded string
   */
  private static decodeArrayBuffer(buffer: ArrayBuffer): string {
    return new TextDecoder().decode(buffer);
  }

  /**
   * Parses JSON string to object
   * 
   * @param text - JSON string
   * @returns Parsed object or null if parsing fails
   */
  private static parseJson(text: string): unknown {
    try {
      return JSON.parse(text);
    } catch (error) {
      logWarn('Failed to parse WebSocket message as JSON', {
        error,
        textLength: text.length,
      });
      return null;
    }
  }
}

