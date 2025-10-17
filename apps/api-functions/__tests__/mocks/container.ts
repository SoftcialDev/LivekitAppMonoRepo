/**
 * @fileoverview Shared container mock
 * @summary Mocks both class singleton and object singleton exports for DI container
 * @description Provides initialize/resolve and wires both ServiceContainer.getInstance and serviceContainer
 */

export function mockServiceContainer(serviceMap: Record<string, any>) {
  const initialize = jest.fn();
  const resolve = jest.fn((token: string) => serviceMap[token]);

  jest.mock('../../shared/infrastructure/container/ServiceContainer', () => {
    class ServiceContainerClass {
      static getInstance() {
        return { initialize, resolve };
      }
    }
    const serviceContainer = { initialize, resolve };
    return { ServiceContainer: ServiceContainerClass, serviceContainer };
  });

  return { initialize, resolve };
}


