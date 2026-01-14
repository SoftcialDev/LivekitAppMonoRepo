import { PresenceUpdateApplicationService } from '../../../src/application/services/PresenceUpdateApplicationService';
import { PresenceDomainService } from '../../../src/domain/services/PresenceDomainService';
import { AuthorizationService } from '../../../src/domain/services/AuthorizationService';
import { PresenceUpdateRequest } from '../../../src/domain/value-objects/PresenceUpdateRequest';
import { PresenceUpdateResponse } from '../../../src/domain/value-objects/PresenceUpdateResponse';
import { Status } from '../../../src/domain/enums/Status';

describe('PresenceUpdateApplicationService', () => {
  let service: PresenceUpdateApplicationService;
  let mockDomainService: jest.Mocked<PresenceDomainService>;
  let mockAuthorizationService: jest.Mocked<AuthorizationService>;

  beforeEach(() => {
    mockDomainService = {
      setUserOnline: jest.fn(),
      setUserOffline: jest.fn(),
    } as any;

    mockAuthorizationService = {
      authorizeUserQuery: jest.fn(),
    } as any;

    service = new PresenceUpdateApplicationService(
      mockDomainService,
      mockAuthorizationService
    );
  });

  it('should set user online when status is Online', async () => {
    const callerId = 'test-caller-id';
    const request = new PresenceUpdateRequest(callerId, Status.Online);

    mockDomainService.setUserOnline.mockResolvedValue(undefined);

    const result = await service.updatePresence(callerId, request);

    expect(mockDomainService.setUserOnline).toHaveBeenCalledWith(callerId);
    expect(mockDomainService.setUserOffline).not.toHaveBeenCalled();
    expect(result).toEqual(new PresenceUpdateResponse('Presence set to online'));
  });

  it('should set user offline when status is not Online', async () => {
    const callerId = 'test-caller-id';
    const request = new PresenceUpdateRequest(callerId, Status.Offline);

    mockDomainService.setUserOffline.mockResolvedValue(undefined);

    const result = await service.updatePresence(callerId, request);

    expect(mockDomainService.setUserOffline).toHaveBeenCalledWith(callerId);
    expect(mockDomainService.setUserOnline).not.toHaveBeenCalled();
    expect(result).toEqual(new PresenceUpdateResponse('Presence set to offline'));
  });
});

