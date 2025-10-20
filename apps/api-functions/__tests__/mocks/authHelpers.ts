/**
 * @fileoverview Auth helpers mock
 * @summary Stable getCallerAdId for unit tests
 */

jest.mock('../../shared/utils/authHelpers', () => ({
  getCallerAdId: (_user: any) => 'test-caller-id'
}));


