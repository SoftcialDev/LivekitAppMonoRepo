/**
 * @fileoverview LiveKitService tests
 * @description Unit tests for LiveKitService
 */

import { LiveKitService, LiveKitServiceError } from '../../../../shared/infrastructure/services/LiveKitService';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';

// Mock LiveKit SDK
jest.mock('livekit-server-sdk', () => ({
  RoomServiceClient: jest.fn().mockImplementation(() => ({
    createRoom: jest.fn(),
    listRooms: jest.fn()
  })),
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn()
  }))
}));

// Mock config
jest.mock('../../../../shared/config', () => ({
  config: {
    livekitApiUrl: 'https://test.livekit.com',
    livekitApiKey: 'test-key',
    livekitApiSecret: 'test-secret'
  }
}));

// Mock console methods
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('LiveKitService', () => {
  let service: LiveKitService;
  let mockRoomServiceClient: jest.Mocked<RoomServiceClient>;
  let mockAccessToken: jest.Mocked<AccessToken>;

  beforeEach(() => {
    // Reset console mocks
    Object.assign(console, mockConsole);
    jest.clearAllMocks();
    
    service = new LiveKitService();
    
    // Get the mocked instances
    mockRoomServiceClient = (RoomServiceClient as jest.MockedClass<typeof RoomServiceClient>).mock.results[0].value as jest.Mocked<RoomServiceClient>;
    
    // Create a fresh mock for AccessToken for each test
    const MockedAccessToken = AccessToken as jest.MockedClass<typeof AccessToken>;
    mockAccessToken = {
      addGrant: jest.fn(),
      toJwt: jest.fn()
    } as any;
    MockedAccessToken.mockImplementation(() => mockAccessToken);
  });

  describe('constructor', () => {
    it('should create LiveKitService with correct configuration', () => {
      expect(RoomServiceClient).toHaveBeenCalledWith(
        'https://test.livekit.com',
        'test-key',
        'test-secret'
      );
    });
  });

  describe('ensureRoom', () => {
    it('should create room successfully', async () => {
      mockRoomServiceClient.createRoom.mockResolvedValue({ name: 'test-room' } as any);

      await service.ensureRoom('test-room');

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: 'test-room',
        emptyTimeout: 0
      });
      expect(mockConsole.debug).toHaveBeenCalledWith('[LiveKit] ensureRoom: creating room "test-room"');
      expect(mockConsole.info).toHaveBeenCalledWith('[LiveKit] ensureRoom: room "test-room" created');
    });

    it('should handle room already exists error (409)', async () => {
      const error = { code: 409, message: 'Room already exists' };
      mockRoomServiceClient.createRoom.mockRejectedValue(error);

      await service.ensureRoom('test-room');

      expect(mockConsole.warn).toHaveBeenCalledWith('[LiveKit] ensureRoom: room "test-room" already exists (409)');
    });

    it('should throw LiveKitServiceError for other errors', async () => {
      const error = { code: 500, message: 'Internal server error', data: { details: 'Server error' } };
      mockRoomServiceClient.createRoom.mockRejectedValue(error);

      await expect(service.ensureRoom('test-room'))
        .rejects.toThrow(LiveKitServiceError);

      await expect(service.ensureRoom('test-room'))
        .rejects.toThrow('Failed to ensure room "test-room": Internal server error');
    });

    it('should handle error with statusCode property', async () => {
      const error = { statusCode: 404, message: 'Not found' };
      mockRoomServiceClient.createRoom.mockRejectedValue(error);

      await expect(service.ensureRoom('test-room'))
        .rejects.toThrow(LiveKitServiceError);
    });

    it('should handle error with status property', async () => {
      const error = { status: 403, message: 'Forbidden' };
      mockRoomServiceClient.createRoom.mockRejectedValue(error);

      await expect(service.ensureRoom('test-room'))
        .rejects.toThrow(LiveKitServiceError);
    });

    it('should handle error without code', async () => {
      const error = { message: 'Unknown error' };
      mockRoomServiceClient.createRoom.mockRejectedValue(error);

      await expect(service.ensureRoom('test-room'))
        .rejects.toThrow(LiveKitServiceError);
    });
  });

  describe('listRooms', () => {
    it('should list rooms successfully', async () => {
      const mockRooms = [
        { name: 'room1', sid: 'sid1' },
        { name: 'room2', sid: 'sid2' },
        { name: null, sid: 'sid3' } // Room without name
      ];
      mockRoomServiceClient.listRooms.mockResolvedValue(mockRooms as any);

      const result = await service.listRooms();

      expect(result).toEqual(['room1', 'room2', 'sid3']);
      expect(mockConsole.debug).toHaveBeenCalledWith('[LiveKit] listRooms: fetching rooms');
      expect(mockConsole.info).toHaveBeenCalledWith('[LiveKit] listRooms: retrieved 3 rooms');
    });

    it('should throw LiveKitServiceError when listRooms fails', async () => {
      const error = { code: 500, message: 'Internal server error' };
      mockRoomServiceClient.listRooms.mockRejectedValue(error);

      await expect(service.listRooms())
        .rejects.toThrow(LiveKitServiceError);

      await expect(service.listRooms())
        .rejects.toThrow('Failed to list rooms: Internal server error');
    });

    it('should handle empty rooms list', async () => {
      mockRoomServiceClient.listRooms.mockResolvedValue([]);

      const result = await service.listRooms();

      expect(result).toEqual([]);
      expect(mockConsole.info).toHaveBeenCalledWith('[LiveKit] listRooms: retrieved 0 rooms');
    });
  });

  describe('generateToken', () => {
    it('should generate token for admin user', async () => {
      const mockToken = 'jwt-token-string';
      mockAccessToken.toJwt.mockResolvedValue(mockToken);

      const result = await service.generateToken('admin-user', true, 'test-room');

      expect(result).toBe(mockToken);
      expect(AccessToken).toHaveBeenCalledWith(
        'test-key',
        'test-secret',
        { identity: 'admin-user' }
      );
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        roomJoin: true,
        room: 'test-room',
        canSubscribe: true,
        canPublish: true,
        canPublishData: true,
        publishSources: ['microphone']
      });
      expect(mockConsole.debug).toHaveBeenCalledWith(
        '[LiveKit] generateToken: identity=admin-user, isAdmin=true, room=test-room'
      );
      expect(mockConsole.info).toHaveBeenCalledWith('[LiveKit] generateToken: token generated successfully');
    });

    it('should generate token for regular user', async () => {
      const mockToken = 'jwt-token-string';
      mockAccessToken.toJwt.mockResolvedValue(mockToken);

      const result = await service.generateToken('regular-user', false, 'test-room');

      expect(result).toBe(mockToken);
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        roomJoin: true,
        room: 'test-room',
        canSubscribe: true,
        canPublish: true,
        canPublishData: true,
        publishSources: ['camera', 'microphone', 'screen_share', 'screen_share_audio']
      });
      expect(mockConsole.debug).toHaveBeenCalledWith(
        '[LiveKit] generateToken: identity=regular-user, isAdmin=false, room=test-room'
      );
    });

    it('should throw LiveKitServiceError when token generation fails', async () => {
      const error = { message: 'Token generation failed' };
      mockAccessToken.toJwt.mockRejectedValue(error);

      await expect(service.generateToken('user', false, 'room'))
        .rejects.toThrow(LiveKitServiceError);

      await expect(service.generateToken('user', false, 'room'))
        .rejects.toThrow('Failed to generate token for "user": Token generation failed');
    });

    it('should handle different user identities', async () => {
      const mockToken = 'jwt-token-string';
      mockAccessToken.toJwt.mockResolvedValue(mockToken);

      await service.generateToken('user-123', false, 'room-456');

      expect(AccessToken).toHaveBeenCalledWith(
        'test-key',
        'test-secret',
        { identity: 'user-123' }
      );
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith(
        expect.objectContaining({
          room: 'room-456'
        })
      );
    });
  });

  describe('LiveKitServiceError', () => {
    it('should create error with message only', () => {
      const error = new LiveKitServiceError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('LiveKitServiceError');
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });

    it('should create error with message and code', () => {
      const error = new LiveKitServiceError('Test error', 404);
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('LiveKitServiceError');
      expect(error.code).toBe(404);
      expect(error.details).toBeUndefined();
    });

    it('should create error with message, code and details', () => {
      const details = { additional: 'info' };
      const error = new LiveKitServiceError('Test error', 500, details);
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('LiveKitServiceError');
      expect(error.code).toBe(500);
      expect(error.details).toBe(details);
    });

    it('should be instance of Error', () => {
      const error = new LiveKitServiceError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LiveKitServiceError);
    });
  });
});