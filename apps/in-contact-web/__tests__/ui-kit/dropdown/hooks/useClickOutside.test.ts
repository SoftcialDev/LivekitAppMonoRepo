import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from '@/ui-kit/dropdown/hooks/useClickOutside';

describe('useClickOutside', () => {
  it('should call handler when clicking outside element', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    document.body.appendChild(ref.current);

    renderHook(() => useClickOutside(ref, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    const event = new MouseEvent('mousedown', { bubbles: true });
    outsideElement.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(ref.current);
    document.body.removeChild(outsideElement);
  });

  it('should not call handler when clicking inside element', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    document.body.appendChild(ref.current);

    renderHook(() => useClickOutside(ref, handler));

    const event = new MouseEvent('mousedown', { bubbles: true });
    ref.current.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(ref.current);
  });

  it('should cleanup event listener on unmount', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    document.body.appendChild(ref.current);

    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useClickOutside(ref, handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    removeEventListenerSpy.mockRestore();
    document.body.removeChild(ref.current);
  });
});



