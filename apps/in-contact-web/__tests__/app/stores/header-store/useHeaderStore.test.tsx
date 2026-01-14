import { renderHook, act } from '@testing-library/react';
import { useHeaderStore } from '@/app/stores/header-store/useHeaderStore';
import { DEFAULT_HEADER } from '@/app/stores/header-store/constants';
import type { IHeaderInfo } from '@/app/providers/types';

describe('useHeaderStore', () => {
  beforeEach(() => {
    const store = useHeaderStore.getState();
    store.resetHeader();
  });

  it('should initialize with default header', () => {
    const { result } = renderHook(() => useHeaderStore());
    expect(result.current.header).toEqual(DEFAULT_HEADER);
  });

  it('should set header with title', () => {
    const { result } = renderHook(() => useHeaderStore());
    const newHeader: IHeaderInfo = {
      title: 'Test Title',
    };

    act(() => {
      result.current.setHeader(newHeader);
    });

    expect(result.current.header).toEqual(newHeader);
  });

  it('should set header with title and iconSrc', () => {
    const { result } = renderHook(() => useHeaderStore());
    const newHeader: IHeaderInfo = {
      title: 'Test Title',
      iconSrc: '/test-icon.png',
      iconAlt: 'Test Icon',
    };

    act(() => {
      result.current.setHeader(newHeader);
    });

    expect(result.current.header).toEqual(newHeader);
  });

  it('should set header with title and iconNode', () => {
    const { result } = renderHook(() => useHeaderStore());
    const iconNode = <div>Custom Icon</div>;
    const newHeader: IHeaderInfo = {
      title: 'Test Title',
      iconNode,
    };

    act(() => {
      result.current.setHeader(newHeader);
    });

    expect(result.current.header).toEqual(newHeader);
  });

  it('should reset header to default', () => {
    const { result } = renderHook(() => useHeaderStore());
    const newHeader: IHeaderInfo = {
      title: 'Test Title',
      iconSrc: '/test-icon.png',
    };

    act(() => {
      result.current.setHeader(newHeader);
    });

    expect(result.current.header).not.toEqual(DEFAULT_HEADER);

    act(() => {
      result.current.resetHeader();
    });

    expect(result.current.header).toEqual(DEFAULT_HEADER);
  });

  it('should update header multiple times', () => {
    const { result } = renderHook(() => useHeaderStore());

    act(() => {
      result.current.setHeader({ title: 'First Title' });
    });
    expect(result.current.header.title).toBe('First Title');

    act(() => {
      result.current.setHeader({ title: 'Second Title' });
    });
    expect(result.current.header.title).toBe('Second Title');

    act(() => {
      result.current.setHeader({ title: 'Third Title', iconSrc: '/icon.png' });
    });
    expect(result.current.header.title).toBe('Third Title');
    expect(result.current.header.iconSrc).toBe('/icon.png');
  });
});

