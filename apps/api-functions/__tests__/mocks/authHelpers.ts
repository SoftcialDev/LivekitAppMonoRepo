/**
 * @fileoverview Auth helpers mock
 * @summary Stable getCallerAdId for unit tests
 */

jest.mock('../../shared/utils/authHelpers', () => ({
  getCallerAdId: (user: any) => (user?.id ?? 'test-caller-id')
}));


