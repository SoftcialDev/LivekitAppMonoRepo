/**
 * @file ContactManagerDisconnectApplicationService tests
 */

import * as ServiceModule from '../../../../../shared/application/services/ContactManagerDisconnectApplicationService';

describe('ContactManagerDisconnectApplicationService module', () => {
  it('exports ContactManagerDisconnectApplicationService', () => {
    expect((ServiceModule as any).ContactManagerDisconnectApplicationService).toBeDefined();
  });
});


