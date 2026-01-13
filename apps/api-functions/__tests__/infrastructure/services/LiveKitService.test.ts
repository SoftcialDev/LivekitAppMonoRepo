import { LiveKitService, LiveKitServiceError } from '../../../src/infrastructure/services/LiveKitService';
import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { config } from '../../../src/config';
import { extractHttpStatusCode, extractErrorMessage } from '../../../src/utils/error/ErrorHelpers';

jest.mock('livekit-server-sdk');
jest.mock('../../../src/config', () => ({
  config: {
    livekitApiUrl: 'https://test.livekit.io',
    livekitApiKey: 'test-key',
    livekitApiSecret: 'test-secret',
  },
}));
jest.mock('../../../src/utils/error/ErrorHelpers');

const MockRoomServiceClient = RoomServiceClient as jest.MockedClass<typeof RoomServiceClient>;
const MockAccessToken = AccessToken as jest.MockedClass<typeof AccessToken>;
const mockExtractHttpStatusCode = extractHttpStatusCode as jest.MockedFunction<typeof extractHttpStatusCode>;
const mockExtractErrorMessage = extractErrorMessage as jest.MockedFunction<typeof extractErrorMessage>;

describe('LiveKitService', () => {
  let service: LiveKitService;
  let mockAdminClient: jest.Mocked<RoomServiceClient>;
  let mockAccessToken: jest.Mocked<AccessToken>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAdminClient = {
      createRoom: jest.fn(),
      listRooms: jest.fn(),
    } as any;

    mockAccessToken = {
      addGrant: jest.fn(),
      toJwt: jest.fn(),
    } as any;

    MockRoomServiceClient.mockImplementation(() => mockAdminClient);
    MockAccessToken.mockImplementation(() => mockAccessToken);

    service = new LiveKitService();
  });

  describe('constructor', () => {
    it('should create RoomServiceClient with config values', () => {
      expect(MockRoomServiceClient).toHaveBeenCalledWith(
        'https://test.livekit.io',
        'test-key',
        'test-secret'
      );
    });
  });

  describe('ensureRoom', () => {
    it('should create room successfully', async () => {
      const roomName = 'test-room';
      mockAdminClient.createRoom.mockResolvedValue({} as any);

      await service.ensureRoom(roomName);

      expect(mockAdminClient.createRoom).toHaveBeenCalledWith({
        name: roomName,
        emptyTimeout: 0,
      });
    });

    it('should return silently when room already exists (409)', async () => {
      const roomName = 'test-room';
      const error = { status: 409 };
      mockAdminClient.createRoom.mockRejectedValue(error);
      mockExtractHttpStatusCode.mockReturnValue(409);

      await service.ensureRoom(roomName);

      expect(mockAdminClient.createRoom).toHaveBeenCalled();
    });

    it('should throw LiveKitServiceError when creation fails with non-409 error', async () => {
      const roomName = 'test-room';
      const error = { status: 500, message: 'Internal error' };
      mockAdminClient.createRoom.mockRejectedValue(error);
      mockExtractHttpStatusCode.mockReturnValue(500);
      mockExtractErrorMessage.mockReturnValue('Internal error');

      await expect(service.ensureRoom(roomName)).rejects.toThrow(LiveKitServiceError);
      await expect(service.ensureRoom(roomName)).rejects.toThrow(`Failed to ensure room "${roomName}"`);
    });
  });

  describe('listRooms', () => {
    it('should return list of room names', async () => {
      const mockRooms = [
        { name: 'room-1', sid: 'sid-1' },
        { name: 'room-2', sid: 'sid-2' },
        { sid: 'sid-3' }, // room without name
      ];
      mockAdminClient.listRooms.mockResolvedValue(mockRooms as any);

      const result = await service.listRooms();

      expect(mockAdminClient.listRooms).toHaveBeenCalled();
      expect(result).toEqual(['room-1', 'room-2', 'sid-3']);
    });

    it('should throw LiveKitServiceError when listing fails', async () => {
      const error = { status: 500, message: 'Failed to list' };
      mockAdminClient.listRooms.mockRejectedValue(error);
      mockExtractHttpStatusCode.mockReturnValue(500);
      mockExtractErrorMessage.mockReturnValue('Failed to list');

      await expect(service.listRooms()).rejects.toThrow(LiveKitServiceError);
      await expect(service.listRooms()).rejects.toThrow('Failed to list rooms');
    });
  });

  describe('generateToken', () => {
    it('should generate token for admin user', async () => {
      const identity = 'admin-user';
      const isAdmin = true;
      const room = 'test-room';
      const expectedToken = 'jwt-token';

      mockAccessToken.toJwt.mockResolvedValue(expectedToken);

      const result = await service.generateToken(identity, isAdmin, room);

      expect(MockAccessToken).toHaveBeenCalledWith(
        'test-key',
        'test-secret',
        { identity }
      );
      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        roomJoin: true,
        room,
        canSubscribe: true,
        canPublish: true,
        canPublishData: true,
        publishSources: ['microphone'],
      });
      expect(result).toBe(expectedToken);
    });

    it('should generate token for non-admin user', async () => {
      const identity = 'regular-user';
      const isAdmin = false;
      const room = 'test-room';
      const expectedToken = 'jwt-token';

      mockAccessToken.toJwt.mockResolvedValue(expectedToken);

      const result = await service.generateToken(identity, isAdmin, room);

      expect(mockAccessToken.addGrant).toHaveBeenCalledWith({
        roomJoin: true,
        room,
        canSubscribe: true,
        canPublish: true,
        canPublishData: true,
        publishSources: ['camera', 'microphone', 'screen_share', 'screen_share_audio'],
      });
      expect(result).toBe(expectedToken);
    });

    it('should throw LiveKitServiceError when token generation fails', async () => {
      const identity = 'user';
      const isAdmin = false;
      const room = 'test-room';
      const error = new Error('Token generation failed');
      mockAccessToken.toJwt.mockRejectedValue(error);
      mockExtractErrorMessage.mockReturnValue('Token generation failed');

      await expect(service.generateToken(identity, isAdmin, room)).rejects.toThrow(LiveKitServiceError);
      await expect(service.generateToken(identity, isAdmin, room)).rejects.toThrow(`Failed to generate token for "${identity}"`);
    });
  });
});

