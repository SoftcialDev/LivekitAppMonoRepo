import { LiveKitEgressClient } from '../../../src/infrastructure/services/LiveKitEgressClient';
import { EgressClient } from 'livekit-server-sdk';
import { getValidatedStorageCredentials } from '../../../src/infrastructure/services/recordingCredentialValidator';
import { LiveKitOperationError } from '../../../src/domain/errors/InfrastructureErrors';
import { config } from '../../../src/config';

jest.mock('livekit-server-sdk');
jest.mock('../../../src/infrastructure/services/recordingCredentialValidator');
jest.mock('../../../src/config', () => ({
  config: {
    livekitApiUrl: 'https://test.livekit.io',
    livekitApiKey: 'test-key',
    livekitApiSecret: 'test-secret',
  },
}));

const MockEgressClient = EgressClient as jest.MockedClass<typeof EgressClient>;
const mockGetValidatedStorageCredentials = getValidatedStorageCredentials as jest.MockedFunction<typeof getValidatedStorageCredentials>;

describe('LiveKitEgressClient', () => {
  let service: LiveKitEgressClient;
  let mockEgressClient: jest.Mocked<EgressClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEgressClient = {
      startParticipantEgress: jest.fn(),
      stopEgress: jest.fn(),
    } as any;

    MockEgressClient.mockImplementation(() => mockEgressClient);

    mockGetValidatedStorageCredentials.mockReturnValue({
      accountName: 'testaccount',
      accountKey: Buffer.alloc(64).toString('base64'),
      containerName: 'recordings',
      credentialsSource: 'connection_string',
    });

    service = new LiveKitEgressClient();
  });

  describe('constructor', () => {
    it('should create EgressClient with config values', () => {
      expect(MockEgressClient).toHaveBeenCalledWith(
        'https://test.livekit.io',
        'test-key',
        'test-secret'
      );
    });
  });

  describe('startEgress', () => {
    it('should start egress and return egressId and objectKey', async () => {
      const roomName = 'room-123';
      const ownerLabel = 'John Doe';
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomId: roomName,
      };

      mockEgressClient.startParticipantEgress.mockResolvedValue(mockEgressInfo as any);

      const result = await service.startEgress(roomName, ownerLabel);

      expect(mockGetValidatedStorageCredentials).toHaveBeenCalled();
      expect(mockEgressClient.startParticipantEgress).toHaveBeenCalled();
      expect(result.egressId).toBe('egress-123');
      expect(result.objectKey).toBeDefined();
      expect(result.objectKey).toContain('john-doe');
      expect(result.objectKey).toContain(roomName);
    });

    it('should throw LiveKitOperationError when egressId is missing', async () => {
      const roomName = 'room-123';
      const ownerLabel = 'John Doe';
      const mockEgressInfo = {
        roomId: roomName,
      };

      mockEgressClient.startParticipantEgress.mockResolvedValue(mockEgressInfo as any);

      await expect(service.startEgress(roomName, ownerLabel)).rejects.toThrow(LiveKitOperationError);
      await expect(service.startEgress(roomName, ownerLabel)).rejects.toThrow('LiveKit did not return an egressId');
    });

    it('should build object key with slugified owner label', async () => {
      const roomName = 'room-123';
      const ownerLabel = 'Test User Name';
      const mockEgressInfo = {
        egressId: 'egress-123',
        roomId: roomName,
      };

      mockEgressClient.startParticipantEgress.mockResolvedValue(mockEgressInfo as any);

      const result = await service.startEgress(roomName, ownerLabel);

      expect(result.objectKey).toContain('test-user-name');
    });
  });

  describe('stopEgress', () => {
    it('should stop egress and return info with blobUrl', async () => {
      const egressId = 'egress-123';
      const mockEgressInfo = {
        egressId: egressId,
        fileResults: [{
          location: 'https://storage.blob.core.windows.net/container/file.mp4',
        }],
      };

      mockEgressClient.stopEgress.mockResolvedValue(mockEgressInfo as any);

      const result = await service.stopEgress(egressId);

      expect(mockEgressClient.stopEgress).toHaveBeenCalledWith(egressId);
      expect(result.info).toEqual(mockEgressInfo);
      expect(result.blobUrl).toBe('https://storage.blob.core.windows.net/container/file.mp4');
    });

    it('should return undefined blobUrl when fileResults are not available', async () => {
      const egressId = 'egress-123';
      const mockEgressInfo = {
        egressId: egressId,
      };

      mockEgressClient.stopEgress.mockResolvedValue(mockEgressInfo as any);

      const result = await service.stopEgress(egressId);

      expect(result.info).toEqual(mockEgressInfo);
      expect(result.blobUrl).toBeUndefined();
    });

    it('should check result.fileResults when fileResults is not available', async () => {
      const egressId = 'egress-123';
      const mockEgressInfo = {
        egressId: egressId,
        result: {
          fileResults: [{
            location: 'https://storage.blob.core.windows.net/container/file.mp4',
          }],
        },
      };

      mockEgressClient.stopEgress.mockResolvedValue(mockEgressInfo as any);

      const result = await service.stopEgress(egressId);

      expect(result.blobUrl).toBe('https://storage.blob.core.windows.net/container/file.mp4');
    });
  });

  describe('getEgressInfo', () => {
    it('should return egress info when found', async () => {
      const egressId = 'egress-123';
      const mockEgressInfo = {
        egressId: egressId,
        status: 'EGRESS_ACTIVE',
      };

      const mockClient = {
        listEgress: jest.fn().mockResolvedValue({
          items: [mockEgressInfo],
        }),
      };

      (service as any).egressClient = mockClient;

      const result = await service.getEgressInfo(egressId);

      expect(result).toEqual(mockEgressInfo);
    });

    it('should return null when egress is not found', async () => {
      const egressId = 'egress-123';
      const mockClient = {
        listEgress: jest.fn().mockResolvedValue({
          items: [],
        }),
      };

      (service as any).egressClient = mockClient;

      const result = await service.getEgressInfo(egressId);

      expect(result).toBeNull();
    });

    it('should return null when listEgress throws error', async () => {
      const egressId = 'egress-123';
      const mockClient = {
        listEgress: jest.fn().mockRejectedValue(new Error('Failed')),
      };

      (service as any).egressClient = mockClient;

      const result = await service.getEgressInfo(egressId);

      expect(result).toBeNull();
    });

    it('should return null when listEgress is not available', async () => {
      const egressId = 'egress-123';
      const mockClient = {};

      (service as any).egressClient = mockClient;

      const result = await service.getEgressInfo(egressId);

      expect(result).toBeNull();
    });
  });
});

