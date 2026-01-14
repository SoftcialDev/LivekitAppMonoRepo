import { render } from '@testing-library/react';
import { WebSocketProvider } from '@/app/providers/WebSocketProvider';
import { webSocketService } from '@/shared/services/webSocket/index';
import { PresenceMessageHandler } from '@/shared/services/webSocket/handlers/presence/PresenceMessageHandler';
import {
  SupervisorChangeNotificationHandler,
  SupervisorListChangedHandler,
} from '@/modules/supervisor/services';
import { logDebug } from '@/shared/utils/logger';

jest.mock('@/shared/services/webSocket/index');
jest.mock('@/shared/services/webSocket/handlers/presence/PresenceMessageHandler');
jest.mock('@/modules/supervisor/services');
jest.mock('@/shared/utils/logger');

describe('WebSocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children', () => {
    const { getByText } = render(
      <WebSocketProvider>
        <div>Test Content</div>
      </WebSocketProvider>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('should register WebSocket handlers on mount', () => {
    render(
      <WebSocketProvider>
        <div>Test</div>
      </WebSocketProvider>
    );

    expect(logDebug).toHaveBeenCalledWith('Registering WebSocket handlers');
    expect(webSocketService.registerHandler).toHaveBeenCalledWith(
      expect.any(PresenceMessageHandler)
    );
    expect(webSocketService.registerHandler).toHaveBeenCalledWith(
      expect.any(SupervisorChangeNotificationHandler)
    );
    expect(webSocketService.registerHandler).toHaveBeenCalledWith(
      expect.any(SupervisorListChangedHandler)
    );
    expect(logDebug).toHaveBeenCalledWith('WebSocket handlers registered successfully');
    expect(webSocketService.registerHandler).toHaveBeenCalledTimes(3);
  });

  it('should register handlers only once', () => {
    const { rerender } = render(
      <WebSocketProvider>
        <div>Test</div>
      </WebSocketProvider>
    );

    jest.clearAllMocks();

    rerender(
      <WebSocketProvider>
        <div>Test</div>
      </WebSocketProvider>
    );

    expect(webSocketService.registerHandler).not.toHaveBeenCalled();
  });
});

