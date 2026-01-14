import { GetLivekitRecordingsApplicationService } from '../../../src/application/services/GetLivekitRecordingsApplicationService';
import { IRecordingDomainService } from '../../../src/domain/interfaces/IRecordingDomainService';
import { GetLivekitRecordingsRequest } from '../../../src/domain/value-objects/GetLivekitRecordingsRequest';
import { GetLivekitRecordingsResponse } from '../../../src/domain/value-objects/GetLivekitRecordingsResponse';

describe('GetLivekitRecordingsApplicationService', () => {
  let service: GetLivekitRecordingsApplicationService;
  let mockDomainService: jest.Mocked<IRecordingDomainService>;

  beforeEach(() => {
    mockDomainService = {
      listRecordings: jest.fn(),
    } as any;

    service = new GetLivekitRecordingsApplicationService(mockDomainService);
  });

  it('should successfully get LiveKit recordings', async () => {
    const callerId = 'test-caller-id';
    const request = new GetLivekitRecordingsRequest();
    const mockResponse = new GetLivekitRecordingsResponse([], 0);

    mockDomainService.listRecordings.mockResolvedValue(mockResponse);

    const result = await service.getLivekitRecordings(callerId, request);

    expect(mockDomainService.listRecordings).toHaveBeenCalledWith(request);
    expect(result).toBe(mockResponse);
  });
});

