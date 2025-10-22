/**
 * @fileoverview Tests for LiveKitService
 * @description Tests for LiveKit room management and token generation
 */

import { LiveKitService, LiveKitServiceError } from '../../../../shared/infrastructure/services/LiveKitService';

// Mock dependencies
jest.mock('livekit-server-sdk', () => ({
  RoomServiceClient: jest.fn().mockImplementation(() => ({
    createRoom: jest.fn(),
    deleteRoom: jest.fn(),
    listRooms: jest.fn(),
    getRoom: jest.fn(),
  })),
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn(),
  })),
}));

jest.mock('../../../../shared/config', () => ({
  config: {
    livekitApiUrl: 'https://test-livekit.example.com',
    livekitApiKey: 'test-api-key',
    livekitApiSecret: 'test-api-secret',
  },
}));

describe('LiveKitService', () => {
  let liveKitService: LiveKitService;
  let mockRoomServiceClient: any;
  let mockAccessToken: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    liveKitService = new LiveKitService();
    
    // Get mocked instances
    const { RoomServiceClient, AccessToken } = require('livekit-server-sdk');
    mockRoomServiceClient = new RoomServiceClient();
    mockAccessToken = new AccessToken();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create LiveKitService with config', () => {
      expect(liveKitService).toBeInstanceOf(LiveKitService);
    });

    it('should initialize RoomServiceClient with correct parameters', () => {
      const { RoomServiceClient } = require('livekit-server-sdk');
      expect(RoomServiceClient).toHaveBeenCalledWith(
        'https://test-livekit.example.com',
        'test-api-key',
        'test-api-secret'
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

    it('should create error with message, code, and details', () => {
      const details = { roomId: 'room-123', reason: 'not found' };
      const error = new LiveKitServiceError('Test error', 404, details);
      
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('LiveKitServiceError');
      expect(error.code).toBe(404);
      expect(error.details).toEqual(details);
    });
  });

  describe('ensureRoom', () => {
    const mockRoomName = 'test-room';

    it('should ensure room exists successfully', async () => {
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(mockRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: mockRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle room creation errors', async () => {
      const createError = new Error('Room creation failed');
      mockRoomServiceClient.createRoom.mockRejectedValue(createError);

      await expect(liveKitService.ensureRoom(mockRoomName))
        .rejects.toThrow('Room creation failed');
    });

    it('should handle different room names', async () => {
      const roomNames = [
        'simple-room',
        'room-with-dashes',
        'room_with_underscores',
        'room.with.dots',
        'room with spaces',
        'room-with-special-chars-@#$%',
      ];

      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      for (const roomName of roomNames) {
        await liveKitService.ensureRoom(roomName);
        expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
          name: roomName,
          maxParticipants: 0,
          emptyTimeout: 300,
        });
      }
    });
  });

  describe('listRooms', () => {
    it('should list rooms successfully', async () => {
      const mockRooms = [
        {
          name: 'room-1',
          numParticipants: 2,
          maxParticipants: 10,
          emptyTimeout: 300,
        },
        {
          name: 'room-2',
          numParticipants: 0,
          maxParticipants: 20,
          emptyTimeout: 600,
        },
      ];

      mockRoomServiceClient.listRooms.mockResolvedValue(mockRooms);

      const result = await liveKitService.listRooms();

      expect(result).toEqual(['room-1', 'room-2']);
      expect(mockRoomServiceClient.listRooms).toHaveBeenCalledWith();
    });

    it('should handle empty room list', async () => {
      mockRoomServiceClient.listRooms.mockResolvedValue([]);

      const result = await liveKitService.listRooms();

      expect(result).toEqual([]);
    });

    it('should handle list rooms errors', async () => {
      const listError = new Error('Failed to list rooms');
      mockRoomServiceClient.listRooms.mockRejectedValue(listError);

      await expect(liveKitService.listRooms())
        .rejects.toThrow('Failed to list rooms');
    });
  });

  describe('generateToken', () => {
    const mockIdentity = 'test-identity';
    const mockIsAdmin = true;
    const mockRoom = 'test-room';

    it('should generate token successfully', async () => {
      const mockToken = 'test-jwt-token';
      mockAccessToken.toJwt.mockReturnValue(mockToken);

      const result = await liveKitService.generateToken(mockIdentity, mockIsAdmin, mockRoom);

      expect(result).toBe(mockToken);
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        room: mockRoom,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
      });
      expect(mockAccessToken.toJwt).toHaveBeenCalledWith(
        'test-api-key',
        'test-api-secret'
      );
    });

    it('should handle token generation errors', async () => {
      const tokenError = new Error('Token generation failed');
      mockAccessToken.toJwt.mockRejectedValue(tokenError);

      await expect(liveKitService.generateToken(mockIdentity, mockIsAdmin, mockRoom))
        .rejects.toThrow('Token generation failed');
    });

    it('should handle different identities', async () => {
      const identities = [
        'simple-identity',
        'identity-with-dashes',
        'identity_with_underscores',
        'identity.with.dots',
        'identity with spaces',
        'identity-with-special-chars-@#$%',
      ];

      const mockToken = 'test-jwt-token';
      mockAccessToken.toJwt.mockReturnValue(mockToken);

      for (const identity of identities) {
        await liveKitService.generateToken(identity, mockIsAdmin, mockRoom);
        expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
          room: mockRoom,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
        });
      }
    });

    it('should handle different admin flags', async () => {
      const adminFlags = [true, false];

      const mockToken = 'test-jwt-token';
      mockAccessToken.toJwt.mockReturnValue(mockToken);

      for (const isAdmin of adminFlags) {
        await liveKitService.generateToken(mockIdentity, isAdmin, mockRoom);
        expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
          room: mockRoom,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
        });
      }
    });

    it('should handle different room names', async () => {
      const roomNames = [
        'simple-room',
        'room-with-dashes',
        'room_with_underscores',
        'room.with.dots',
        'room with spaces',
        'room-with-special-chars-@#$%',
      ];

      const mockToken = 'test-jwt-token';
      mockAccessToken.toJwt.mockReturnValue(mockToken);

      for (const room of roomNames) {
        await liveKitService.generateToken(mockIdentity, mockIsAdmin, room);
        expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
          room: room,
          roomJoin: true,
          canPublish: true,
          canSubscribe: true,
        });
      }
    });
  });

  describe('edge cases', () => {
    it('should handle very long room names', async () => {
      const longRoomName = 'A'.repeat(1000);
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(longRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: longRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle special characters in room names', async () => {
      const specialRoomName = 'room-with-special-chars-@#$%^&*()';
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(specialRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: specialRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle unicode characters in room names', async () => {
      const unicodeRoomName = '房间-测试';
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(unicodeRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: unicodeRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle empty room names', async () => {
      const emptyRoomName = '';
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(emptyRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: emptyRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle null room names', async () => {
      const nullRoomName = null as any;
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(nullRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: nullRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });
  });

  describe('validation scenarios', () => {
    it('should handle PSO streaming room scenario', async () => {
      const psoRoomName = 'pso-streaming-room-123';
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(psoRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: psoRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle supervisor monitoring room scenario', async () => {
      const supervisorRoomName = 'supervisor-monitoring-room-456';
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(supervisorRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: supervisorRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle admin conference room scenario', async () => {
      const adminRoomName = 'admin-conference-room-789';
      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      await liveKitService.ensureRoom(adminRoomName);

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledWith({
        name: adminRoomName,
        maxParticipants: 0,
        emptyTimeout: 300,
      });
    });

    it('should handle token generation for PSO scenario', async () => {
      const psoIdentity = 'pso-123';
      const psoRoom = 'pso-room-123';
      const mockToken = 'pso-jwt-token';

      mockAccessToken.toJwt.mockReturnValue(mockToken);

      const result = await liveKitService.generateToken(psoIdentity, false, psoRoom);

      expect(result).toBe(mockToken);
    });

    it('should handle token generation for supervisor scenario', async () => {
      const supervisorIdentity = 'supervisor-456';
      const supervisorRoom = 'supervisor-room-456';
      const mockToken = 'supervisor-jwt-token';

      mockAccessToken.toJwt.mockReturnValue(mockToken);

      const result = await liveKitService.generateToken(supervisorIdentity, true, supervisorRoom);

      expect(result).toBe(mockToken);
    });

    it('should handle bulk room operations scenario', async () => {
      const roomNames = [
        'room-1',
        'room-2',
        'room-3',
      ];

      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);

      for (const roomName of roomNames) {
        await liveKitService.ensureRoom(roomName);
      }

      expect(mockRoomServiceClient.createRoom).toHaveBeenCalledTimes(3);
    });

    it('should handle concurrent operations scenario', async () => {
      const mockRooms = [
        {
          name: 'room-1',
          numParticipants: 0,
          maxParticipants: 10,
          emptyTimeout: 300,
        },
      ];

      const mockToken = 'test-jwt-token';

      mockRoomServiceClient.createRoom.mockResolvedValue(undefined);
      mockRoomServiceClient.listRooms.mockResolvedValue(mockRooms);
      mockAccessToken.toJwt.mockReturnValue(mockToken);

      const promises = [
        liveKitService.ensureRoom('room-1'),
        liveKitService.listRooms(),
        liveKitService.generateToken('participant', false, 'room-1'),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toBeUndefined();
      expect(results[1]).toEqual(['room-1']);
      expect(results[2]).toBe(mockToken);
    });
  });
});