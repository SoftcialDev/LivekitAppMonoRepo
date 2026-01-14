import { DeleteRecordingApplicationService } from '../../../src/application/services/DeleteRecordingApplicationService';
import { DeleteRecordingDomainService } from '../../../src/domain/services';
import { DeleteRecordingRequest } from '../../../src/domain/value-objects/DeleteRecordingRequest';
import { DeleteRecordingResponse } from '../../../src/domain/value-objects/DeleteRecordingResponse';

describe('DeleteRecordingApplicationService', () => {
  let service: DeleteRecordingApplicationService;
  let mockDomainService: jest.Mocked<DeleteRecordingDomainService>;

  beforeEach(() => {
    mockDomainService = {
      deleteRecording: jest.fn(),
    } as any;

    service = new DeleteRecordingApplicationService(mockDomainService);
  });

  it('should successfully delete recording', async () => {
    const callerId = 'test-caller-id';
    const request = new DeleteRecordingRequest('recording-id');
    const mockResponse = new DeleteRecordingResponse('Recording deleted successfully', 'recording-id');

    mockDomainService.deleteRecording.mockResolvedValue(mockResponse);

    const result = await service.deleteRecording(callerId, request);

    expect(mockDomainService.deleteRecording).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

