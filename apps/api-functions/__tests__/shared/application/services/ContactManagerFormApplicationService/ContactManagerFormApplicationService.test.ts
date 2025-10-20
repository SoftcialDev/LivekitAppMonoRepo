/**
 * @file ContactManagerFormApplicationService tests
 */

import * as ServiceModule from '../../../../../shared/application/services/ContactManagerFormApplicationService';

describe('ContactManagerFormApplicationService module', () => {
  it('exports ContactManagerFormApplicationService', () => {
    expect((ServiceModule as any).ContactManagerFormApplicationService).toBeDefined();
  });
});


