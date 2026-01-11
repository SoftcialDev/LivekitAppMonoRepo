/**
 * @fileoverview Shared error classes
 * @description Base error classes for the application
 */

export { AppError } from './AppError';
export { MediaPermissionError } from './MediaPermissionError';
export {
  ApiError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ServerError,
  RequestTimeoutError,
  NetworkError,
} from './ApiError';
export { ConfigurationError } from './ConfigurationError';
export { ContextError } from './ContextError';
export { BootstrapError } from './BootstrapError';
export {
  WebSocketConnectionActiveError,
  WebSocketConnectionLostError,
  WebSocketHandshakeError,
  WebSocketNotConnectedError,
} from './WebSocketError';

