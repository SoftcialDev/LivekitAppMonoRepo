import { renderHook } from '@testing-library/react';
import React from 'react';
import { useClickOutsideMultiple } from '@/ui-kit/dropdown/hooks/useClickOutsideMultiple';

describe('useClickOutsideMultiple', () => {
  it('should not call handler when hook is disabled', () => {
    const handler = jest.fn();
    const ref1 = React.createRef<HTMLDivElement>();
    ref1.current = document.createElement('div');
    const ref2 = React.createRef<HTMLDivElement>();
    ref2.current = document.createElement('div');
    document.body.appendChild(ref1.current);
    document.body.appendChild(ref2.current);

    renderHook(() =>
      useClickOutsideMultiple({
        refs: [ref1, ref2],
        handler,
        enabled: false,
      })
    );

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(ref1.current);
    document.body.removeChild(ref2.current);
    document.body.removeChild(outsideElement);
  });

  it('should call handler when clicking outside all refs', () => {
    const handler = jest.fn();
    const ref1 = React.createRef<HTMLDivElement>();
    ref1.current = document.createElement('div');
    const ref2 = React.createRef<HTMLDivElement>();
    ref2.current = document.createElement('div');
    document.body.appendChild(ref1.current);
    document.body.appendChild(ref2.current);

    renderHook(() =>
      useClickOutsideMultiple({
        refs: [ref1, ref2],
        handler,
        enabled: true,
      })
    );

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(ref1.current);
    document.body.removeChild(ref2.current);
    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside first ref', () => {
    const handler = jest.fn();
    const ref1 = React.createRef<HTMLDivElement>();
    ref1.current = document.createElement('div');
    const ref2 = React.createRef<HTMLDivElement>();
    ref2.current = document.createElement('div');
    document.body.appendChild(ref1.current);
    document.body.appendChild(ref2.current);

    renderHook(() =>
      useClickOutsideMultiple({
        refs: [ref1, ref2],
        handler,
        enabled: true,
      })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    ref1.current.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(ref1.current);
    document.body.removeChild(ref2.current);
  });

  it('should not call handler when clicking inside second ref', () => {
    const handler = jest.fn();
    const ref1 = React.createRef<HTMLDivElement>();
    ref1.current = document.createElement('div');
    const ref2 = React.createRef<HTMLDivElement>();
    ref2.current = document.createElement('div');
    document.body.appendChild(ref1.current);
    document.body.appendChild(ref2.current);

    renderHook(() =>
      useClickOutsideMultiple({
        refs: [ref1, ref2],
        handler,
        enabled: true,
      })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    ref2.current.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(ref1.current);
    document.body.removeChild(ref2.current);
  });

  it('should not call handler when clicking on button inside ref', () => {
    const handler = jest.fn();
    const ref1 = React.createRef<HTMLDivElement>();
    ref1.current = document.createElement('div');
    const button = document.createElement('button');
    ref1.current.appendChild(button);
    document.body.appendChild(ref1.current);

    renderHook(() =>
      useClickOutsideMultiple({
        refs: [ref1],
        handler,
        enabled: true,
      })
    );

    const event = new MouseEvent('mousedown', { bubbles: true });
    button.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(ref1.current);
  });

  it('should cleanup event listener on unmount', () => {
    const handler = jest.fn();
    const ref1 = React.createRef<HTMLDivElement>();
    ref1.current = document.createElement('div');
    document.body.appendChild(ref1.current);

    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useClickOutsideMultiple({
        refs: [ref1],
        handler,
        enabled: true,
      })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true);

    removeEventListenerSpy.mockRestore();
    document.body.removeChild(ref1.current);
  });
});

