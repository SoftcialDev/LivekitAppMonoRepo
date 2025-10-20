/**
 * @file DeleteSnapshotApplicationService tests
 */

import * as ServiceModule from '../../../../../shared/application/services/DeleteSnapshotApplicationService';

describe('DeleteSnapshotApplicationService module', () => {
  it('exports DeleteSnapshotApplicationService', () => {
    expect((ServiceModule as any).DeleteSnapshotApplicationService).toBeDefined();
  });
});


