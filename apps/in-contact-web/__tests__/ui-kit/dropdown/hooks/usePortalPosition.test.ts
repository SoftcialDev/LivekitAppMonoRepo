import { renderHook, waitFor } from '@testing-library/react';
import { useRef } from 'react';
import { usePortalPosition } from '@/ui-kit/dropdown/hooks/usePortalPosition';

describe('usePortalPosition', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      bottom: 100,
      left: 50,
      width: 200,
      height: 30,
      top: 70,
      right: 250,
      x: 50,
      y: 70,
      toJSON: jest.fn(),
    }));
  });

  it('should return null when usePortal is false', () => {
    const containerRef = useRef<HTMLDivElement>(document.createElement('div'));
    const { result } = renderHook(() =>
      usePortalPosition({
        containerRef: containerRef as React.RefObject<HTMLElement>,
        isOpen: true,
        usePortal: false,
      })
    );

    expect(result.current.position).toBeNull();
  });

  it('should return null when isOpen is false', () => {
    const containerRef = useRef<HTMLDivElement>(document.createElement('div'));
    const { result } = renderHook(() =>
      usePortalPosition({
        containerRef: containerRef as React.RefObject<HTMLElement>,
        isOpen: false,
        usePortal: true,
      })
    );

    expect(result.current.position).toBeNull();
  });

  it('should return null when containerRef.current is null', () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { result } = renderHook(() =>
      usePortalPosition({
        containerRef: containerRef as React.RefObject<HTMLElement>,
        isOpen: true,
        usePortal: true,
      })
    );

    expect(result.current.position).toBeNull();
  });

  it('should calculate position when portal is enabled and open', async () => {
    const containerRef = useRef<HTMLDivElement>(document.createElement('div'));
    document.body.appendChild(containerRef.current);

    const { result } = renderHook(() =>
      usePortalPosition({
        containerRef: containerRef as React.RefObject<HTMLElement>,
        isOpen: true,
        usePortal: true,
      })
    );

    await waitFor(() => {
      expect(result.current.position).not.toBeNull();
    });

    expect(result.current.position).toEqual({
      top: 100,
      left: 50,
      width: 200,
    });

    document.body.removeChild(containerRef.current);
  });
});

