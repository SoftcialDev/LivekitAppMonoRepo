/**
 * @file FetchPendingCommandsApplicationService tests
 */

import * as ServiceModule from '../../../../../shared/application/services/FetchPendingCommandsApplicationService';

describe('FetchPendingCommandsApplicationService module', () => {
  it('exports FetchPendingCommandsApplicationService', () => {
    expect((ServiceModule as any).FetchPendingCommandsApplicationService).toBeDefined();
  });
});


