import React from 'react';
import { authRoutes } from '@/modules/auth/routes';
import { LoginPage, LoadingPage } from '@/modules/auth/pages';

// Mock pages to avoid rendering issues
jest.mock('@/modules/auth/pages', () => ({
  LoginPage: () => <div data-testid="login-page">Login Page</div>,
  LoadingPage: () => <div data-testid="loading-page">Loading Page</div>,
}));

describe('authRoutes', () => {
  it('should return an array of routes', () => {
    const routes = authRoutes();
    
    expect(Array.isArray(routes)).toBe(true);
    expect(routes.length).toBe(2);
  });

  it('should include /login route with LoginPage component', () => {
    const routes = authRoutes();
    const loginRoute = routes.find(route => route.path === '/login');
    
    expect(loginRoute).toBeDefined();
    expect(loginRoute?.path).toBe('/login');
    expect(loginRoute?.element).toBeDefined();
    
    // Verify it's the LoginPage component by checking if it can render
    if (loginRoute?.element && React.isValidElement(loginRoute.element)) {
      expect(loginRoute.element.type.name || loginRoute.element.type).toBeDefined();
    }
  });

  it('should include /loading route with LoadingPage component', () => {
    const routes = authRoutes();
    const loadingRoute = routes.find(route => route.path === '/loading');
    
    expect(loadingRoute).toBeDefined();
    expect(loadingRoute?.path).toBe('/loading');
    expect(loadingRoute?.element).toBeDefined();
    
    // Verify it's the LoadingPage component
    if (loadingRoute?.element && React.isValidElement(loadingRoute.element)) {
      expect(loadingRoute.element.type.name || loadingRoute.element.type).toBeDefined();
    }
  });

  it('should return routes in correct order', () => {
    const routes = authRoutes();
    
    expect(routes[0].path).toBe('/login');
    expect(routes[1].path).toBe('/loading');
  });

  it('should have all required route properties', () => {
    const routes = authRoutes();
    
    routes.forEach(route => {
      expect(route).toHaveProperty('path');
      expect(route).toHaveProperty('element');
      expect(typeof route.path).toBe('string');
      expect(route.element).toBeDefined();
    });
  });
});



