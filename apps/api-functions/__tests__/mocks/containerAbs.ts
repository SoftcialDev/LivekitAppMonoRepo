/**
 * @fileoverview Absolute container mock helper
 * @summary Mocks ServiceContainer via absolute module path so handlers resolve it consistently
 */

import path from 'path';

export function mockServiceContainerAbs(serviceMap: Record<string, any>) {
  const initialize = jest.fn();
  const resolve = jest.fn((token: string) => serviceMap[token]);

  const modulePath = path.join(
    process.cwd(),
    'shared',
    'infrastructure',
    'container',
    'ServiceContainer'
  );

  jest.doMock(modulePath, () => ({
    ServiceContainer: {
      getInstance: () => ({ initialize, resolve })
    },
    serviceContainer: { initialize, resolve }
  }));

  return { initialize, resolve };
}


