import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useRenameTrack } from './useRenameTrack';
import { api } from '../services/api';

// Mock the whole api module so no HTTP request is ever made.
vi.mock('../services/api', () => ({
  api: {
    renameTrack: vi.fn(),
  },
}));

const mockedRenameTrack = vi.mocked(api.renameTrack);

describe('useRenameTrack', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects an empty title without calling the api', async () => {
    const { result } = renderHook(() => useRenameTrack());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.rename('id-1', 'Old', '   ');
    });

    expect(returned).toBe(false);
    expect(result.current.error).toBe('Title cannot be empty');
    expect(mockedRenameTrack).not.toHaveBeenCalled();
  });

  it('treats an unchanged title as a no-op success without calling the api', async () => {
    const { result } = renderHook(() => useRenameTrack());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.rename('id-1', 'Same Title', 'Same Title');
    });

    expect(returned).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mockedRenameTrack).not.toHaveBeenCalled();
  });

  it('trims whitespace before comparing against the current title (no-op)', async () => {
    const { result } = renderHook(() => useRenameTrack());

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.rename('id-1', 'Same Title', '  Same Title  ');
    });

    expect(returned).toBe(true);
    expect(mockedRenameTrack).not.toHaveBeenCalled();
  });

  it('calls api.renameTrack with the trimmed title, fires onSuccess and returns true', async () => {
    mockedRenameTrack.mockResolvedValueOnce({} as never);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useRenameTrack(onSuccess));

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.rename('id-42', 'Old', '  New Title  ');
    });

    expect(returned).toBe(true);
    expect(mockedRenameTrack).toHaveBeenCalledTimes(1);
    expect(mockedRenameTrack).toHaveBeenCalledWith('id-42', 'New Title');
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.isSaving).toBe(false);
  });

  it('sets an error and returns false when the api rejects', async () => {
    mockedRenameTrack.mockRejectedValueOnce(new Error('Server exploded'));
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useRenameTrack(onSuccess));

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current.rename('id-7', 'Old', 'New Title');
    });

    expect(returned).toBe(false);
    expect(result.current.error).toBe('Server exploded');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it('toggles isSaving true while the request is in flight and false afterwards', async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    mockedRenameTrack.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }) as never
    );

    const { result } = renderHook(() => useRenameTrack());

    let pending: Promise<boolean>;
    act(() => {
      pending = result.current.rename('id-1', 'Old', 'New Title');
    });

    // Request is in flight -> isSaving should be true.
    await waitFor(() => expect(result.current.isSaving).toBe(true));

    await act(async () => {
      resolveRequest({});
      await pending;
    });

    expect(result.current.isSaving).toBe(false);
  });

  it('clearError resets a previously set error', async () => {
    const { result } = renderHook(() => useRenameTrack());

    await act(async () => {
      await result.current.rename('id-1', 'Old', '');
    });
    expect(result.current.error).toBe('Title cannot be empty');

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});
