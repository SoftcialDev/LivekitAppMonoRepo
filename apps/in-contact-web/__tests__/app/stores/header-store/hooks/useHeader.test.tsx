import { renderHook, act } from '@testing-library/react';
import { useHeader } from '@/app/stores/header-store/hooks/useHeader';
import { useHeaderStore } from '@/app/stores/header-store/useHeaderStore';
import { DEFAULT_HEADER } from '@/app/stores/header-store/constants';
import type { IHeaderInfo } from '@/app/providers/types';

describe('useHeader', () => {
  beforeEach(() => {
    const store = useHeaderStore.getState();
    store.resetHeader();
  });

  it('should set header when component mounts', () => {
    const headerInfo: IHeaderInfo = {
      title: 'Test Page',
    };

    renderHook(() => useHeader(headerInfo));

    const store = useHeaderStore.getState();
    expect(store.header).toEqual(headerInfo);
  });

  it('should reset header when component unmounts', () => {
    const headerInfo: IHeaderInfo = {
      title: 'Test Page',
    };

    const { unmount } = renderHook(() => useHeader(headerInfo));

    let store = useHeaderStore.getState();
    expect(store.header).toEqual(headerInfo);

    unmount();

    store = useHeaderStore.getState();
    expect(store.header).toEqual(DEFAULT_HEADER);
  });

  it('should update header when title changes', () => {
    const { rerender } = renderHook(
      ({ info }) => useHeader(info),
      {
        initialProps: { info: { title: 'Initial Title' } },
      }
    );

    let store = useHeaderStore.getState();
    expect(store.header.title).toBe('Initial Title');

    rerender({ info: { title: 'Updated Title' } });

    store = useHeaderStore.getState();
    expect(store.header.title).toBe('Updated Title');
  });

  it('should update header when iconSrc changes', () => {
    const { rerender } = renderHook(
      ({ info }) => useHeader(info),
      {
        initialProps: { info: { title: 'Test', iconSrc: '/icon1.png' } },
      }
    );

    let store = useHeaderStore.getState();
    expect(store.header.iconSrc).toBe('/icon1.png');

    rerender({ info: { title: 'Test', iconSrc: '/icon2.png' } });

    store = useHeaderStore.getState();
    expect(store.header.iconSrc).toBe('/icon2.png');
  });

  it('should update header when iconAlt changes', () => {
    const { rerender } = renderHook(
      ({ info }) => useHeader(info),
      {
        initialProps: { info: { title: 'Test', iconAlt: 'Alt 1' } },
      }
    );

    let store = useHeaderStore.getState();
    expect(store.header.iconAlt).toBe('Alt 1');

    rerender({ info: { title: 'Test', iconAlt: 'Alt 2' } });

    store = useHeaderStore.getState();
    expect(store.header.iconAlt).toBe('Alt 2');
  });

  it('should update header when iconNode changes', () => {
    const iconNode1 = <div>Icon 1</div>;
    const iconNode2 = <div>Icon 2</div>;

    const { rerender } = renderHook(
      ({ info }) => useHeader(info),
      {
        initialProps: { info: { title: 'Test', iconNode: iconNode1 } },
      }
    );

    let store = useHeaderStore.getState();
    expect(store.header.iconNode).toBe(iconNode1);

    rerender({ info: { title: 'Test', iconNode: iconNode2 } });

    store = useHeaderStore.getState();
    expect(store.header.iconNode).toBe(iconNode2);
  });

  it('should handle multiple header updates', () => {
    const { rerender } = renderHook(
      ({ info }) => useHeader(info),
      {
        initialProps: { info: { title: 'First' } },
      }
    );

    rerender({ info: { title: 'Second' } });
    rerender({ info: { title: 'Third', iconSrc: '/icon.png' } });

    const store = useHeaderStore.getState();
    expect(store.header.title).toBe('Third');
    expect(store.header.iconSrc).toBe('/icon.png');
  });
});

