import { Context, HttpRequest } from '@azure/functions';
import { ContactManagerFormApplicationService } from '../../src/application/services/ContactManagerFormApplicationService';
import { ContactManagerFormResult } from '../../src/domain/value-objects/ContactManagerFormResult';
import { FormType } from '../../src/domain/enums/FormType';
import { createMockContext, createMockHttpRequest, createMockJwtPayload } from './handlerMocks';
import { setupMiddlewareMocks, createMockServiceContainer } from './handlerTestSetup';

jest.mock('../../src/application/services/ContactManagerFormApplicationService');

jest.mock('../../src/infrastructure/container/ServiceContainer', () => ({
  serviceContainer: {
    initialize: jest.fn(),
    resolve: jest.fn(),
  },
}), { virtual: true });

describe('ContactManagersForm handler', () => {
  let mockContext: Context;
  let mockRequest: HttpRequest;
  let mockApplicationService: jest.Mocked<ContactManagerFormApplicationService>;
  let mockResolve: jest.Mock;
  let mockInitialize: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    setupMiddlewareMocks();

    mockContext = createMockContext();
    mockRequest = createMockHttpRequest({ method: 'POST' });

    const jwtPayload = createMockJwtPayload({ roles: ['PSO'] });
    mockContext.bindings = {
      user: jwtPayload,
      callerId: 'test-azure-ad-id',
      validatedBody: {
        formType: FormType.DISCONNECTIONS,
        rnName: 'RN Test',
        patientInitials: 'AB',
        timeOfDisconnection: '2024-01-01T10:00:00Z',
        reason: 'Test reason',
        hospital: 'Test Hospital',
        totalPatients: 5,
        imageBase64: 'base64image',
      },
    };

    mockApplicationService = {
      processForm: jest.fn(),
    } as any;

    (ContactManagerFormApplicationService as jest.Mock).mockImplementation(() => mockApplicationService);

    const { serviceContainer } = require('../../src/infrastructure/container/ServiceContainer');
    mockResolve = serviceContainer.resolve as jest.Mock;
    mockInitialize = serviceContainer.initialize as jest.Mock;
    mockResolve.mockReturnValue(mockApplicationService);
  });

  it('should successfully process contact manager form', async () => {
    const mockResult = ContactManagerFormResult.fromFormCreation('form-id-123', false, 'https://example.com/image.jpg');
    mockApplicationService.processForm.mockResolvedValue(mockResult);

    const contactManagersFormHandler = (await import('../../src/handlers/ContactManagersForm')).default;
    await contactManagersFormHandler(mockContext, mockRequest);

    expect(mockInitialize).toHaveBeenCalled();
    expect(mockResolve).toHaveBeenCalledWith('ContactManagerFormApplicationService');
    expect(mockApplicationService.processForm).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
    expect(mockContext.res?.body).toEqual({
      formId: 'form-id-123',
      messageSent: false,
      imageUrl: 'https://example.com/image.jpg',
    });
  });

  it('should handle admissions form type', async () => {
    mockContext.bindings.validatedBody = {
      formType: FormType.ADMISSIONS,
      facility: 'Test Facility',
      unit: 'Test Unit',
      imageBase64: 'base64image',
    };

    const mockResult = ContactManagerFormResult.fromFormCreation('form-id-456', false);
    mockApplicationService.processForm.mockResolvedValue(mockResult);

    const contactManagersFormHandler = (await import('../../src/handlers/ContactManagersForm')).default;
    await contactManagersFormHandler(mockContext, mockRequest);

    expect(mockApplicationService.processForm).toHaveBeenCalled();
    expect(mockContext.res?.status).toBe(200);
  });
});

