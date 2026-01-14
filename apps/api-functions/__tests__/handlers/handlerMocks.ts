import { Context, HttpRequest } from '@azure/functions';

export const createMockContext = (overrides: Partial<Context> = {}): Context => {
  return {
    invocationId: 'test-invocation-id',
    executionContext: {
      invocationId: 'test-invocation-id',
      functionName: 'TestFunction',
      functionDirectory: '/test',
    },
    bindings: {},
    bindingData: {},
    traceContext: {
      traceparent: '00-test-trace',
      tracestate: '',
    },
    log: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      verbose: jest.fn(),
    },
    done: jest.fn(),
    res: {},
    ...overrides,
  } as Context;
};

export const createMockHttpRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => {
  return {
    method: 'GET',
    url: 'https://test.example.com/api/test',
    headers: {
      'content-type': 'application/json',
      authorization: 'Bearer test-token',
    },
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as HttpRequest;
};

export const createMockJwtPayload = (overrides = {}) => ({
  oid: 'test-azure-ad-id',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['PSO'],
  ...overrides,
});

