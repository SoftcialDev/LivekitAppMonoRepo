/**
 * @file DeleteRecordingApplicationService tests
 */

import * as ServiceModule from '../../../../../shared/application/services/DeleteRecordingApplicationService';

describe('DeleteRecordingApplicationService module', () => {
  it('exports DeleteRecordingApplicationService', () => {
    expect((ServiceModule as any).DeleteRecordingApplicationService).toBeDefined();
  });
});


