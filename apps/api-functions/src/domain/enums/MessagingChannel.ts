/**
 * @fileoverview MessagingChannel - Domain enum for messaging channels
 * @description Defines the available messaging channels for command delivery
 */

/**
 * Available messaging channels for command delivery
 */
export enum MessagingChannel {
  WebSocket = 'ws',
  ServiceBus = 'bus'
}
