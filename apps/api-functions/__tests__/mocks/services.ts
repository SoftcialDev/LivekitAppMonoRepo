/**
 * @fileoverview Application services mocks
 * @summary Reusable class-based stubs for ctor-constructed services
 */

export function mockUserQueryApplicationService(overrides: Partial<{ getUsersByRole: any }> = {}) {
  const impl = {
    getUsersByRole: jest.fn(),
    ...overrides
  };

  jest.doMock('../../shared/application/services/UserQueryApplicationService', () => ({
    UserQueryApplicationService: jest.fn().mockImplementation(() => impl)
  }));

  return impl;
}


