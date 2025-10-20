/**
 * @file CommandAcknowledgmentApplicationService tests
 */

import * as ServiceModule from '../../../../../shared/application/services/CommandAcknowledgmentApplicationService';

describe('CommandAcknowledgmentApplicationService module', () => {
  it('exports CommandAcknowledgmentApplicationService', () => {
    expect((ServiceModule as any).CommandAcknowledgmentApplicationService).toBeDefined();
  });
});


