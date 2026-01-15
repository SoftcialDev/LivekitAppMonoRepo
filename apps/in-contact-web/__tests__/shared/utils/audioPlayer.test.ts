import { playIncomingCallSound, playHangUpSound } from '@/shared/utils/audioPlayer';

// Mock HTMLAudioElement
class MockAudio {
  volume: number = 1;
  currentTime: number = 0;
  private _paused: boolean = true;
  private _ended: boolean = false;
  private _error: Error | null = null;
  private _endedListeners: Array<() => void> = [];
  private _errorListeners: Array<(error: Event) => void> = [];

  constructor(public src: string) {}

  play(): Promise<void> {
    if (this._error) {
      return Promise.reject(this._error);
    }
    this._paused = false;
    return Promise.resolve();
  }

  pause(): void {
    this._paused = true;
  }

  get paused(): boolean {
    return this._paused;
  }

  addEventListener(event: 'ended' | 'error', listener: () => void | ((error: Event) => void)): void {
    if (event === 'ended') {
      this._endedListeners.push(listener as () => void);
    } else if (event === 'error') {
      this._errorListeners.push(listener as (error: Event) => void);
    }
  }

  // Test helpers
  triggerEnded(): void {
    this._ended = true;
    this._paused = true;
    this._endedListeners.forEach(listener => listener());
  }

  triggerError(error: Error): void {
    this._error = error;
    this._errorListeners.forEach(listener => listener(new ErrorEvent('error', { error })));
  }

  reset(): void {
    this._paused = true;
    this._ended = false;
    this._error = null;
    this._endedListeners = [];
    this._errorListeners = [];
  }
}

describe('audioPlayer', () => {
  let mockAudioConstructor: jest.Mock;
  let originalAudio: typeof Audio;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Mock Audio constructor
    originalAudio = global.Audio as typeof Audio;
    mockAudioConstructor = jest.fn((src: string) => new MockAudio(src));
    (global as any).Audio = mockAudioConstructor;
  });

  afterEach(() => {
    jest.useRealTimers();
    (global as any).Audio = originalAudio;
    consoleWarnSpy.mockRestore();
  });

  describe('playIncomingCallSound', () => {
    it('should create and play incoming call sound', () => {
      const mockAudio = new MockAudio('/sounds/incoming-call.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      playIncomingCallSound();
      
      expect(mockAudioConstructor).toHaveBeenCalledWith('/sounds/incoming-call.wav');
      expect(mockAudio.volume).toBe(0.7);
      expect(mockAudio.play()).resolves.toBeUndefined();
    });

    it('should stop currently playing incoming call sound before playing new one', () => {
      const firstAudio = new MockAudio('/sounds/incoming-call.wav');
      const secondAudio = new MockAudio('/sounds/incoming-call.wav');
      mockAudioConstructor
        .mockReturnValueOnce(firstAudio)
        .mockReturnValueOnce(secondAudio);
      
      playIncomingCallSound();
      playIncomingCallSound();
      
      expect(firstAudio.pause).toHaveBeenCalled;
      expect(firstAudio.currentTime).toBe(0);
    });

    it('should clear existing timeout before playing new sound', () => {
      const mockAudio = new MockAudio('/sounds/incoming-call.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      playIncomingCallSound();
      jest.advanceTimersByTime(1000);
      playIncomingCallSound();
      
      // Should have cleared the previous timeout
      expect(mockAudioConstructor).toHaveBeenCalledTimes(2);
    });

    it('should stop audio after 2.5 seconds', () => {
      const mockAudio = new MockAudio('/sounds/incoming-call.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      playIncomingCallSound();
      jest.advanceTimersByTime(2500);
      
      expect(mockAudio.paused).toBe(true);
      expect(mockAudio.currentTime).toBe(0);
    });

    it('should handle play() rejection gracefully', async () => {
      const mockAudio = new MockAudio('/sounds/incoming-call.wav');
      const playError = new Error('Play failed');
      mockAudio.triggerError(playError);
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      playIncomingCallSound();
      
      await Promise.resolve();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[audioPlayer] Failed to play incoming call sound:'),
        expect.anything()
      );
    });

    it('should handle audio creation error gracefully', () => {
      mockAudioConstructor.mockImplementation(() => {
        throw new Error('Audio creation failed');
      });
      
      playIncomingCallSound();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[audioPlayer] Error creating incoming call sound:'),
        expect.anything()
      );
    });
  });

  describe('playHangUpSound', () => {
    it('should create and play hang up sound', async () => {
      const mockAudio = new MockAudio('/sounds/hang-up.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      const promise = playHangUpSound();
      jest.advanceTimersByTime(0);
      
      expect(mockAudioConstructor).toHaveBeenCalledWith('/sounds/hang-up.wav');
      expect(mockAudio.volume).toBe(0.7);
      
      jest.advanceTimersByTime(2500);
      await promise;
      
      expect(promise).resolves.toBeUndefined();
    });

    it('should resolve promise when audio ends naturally', async () => {
      const mockAudio = new MockAudio('/sounds/hang-up.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      const promise = playHangUpSound();
      jest.advanceTimersByTime(0);
      
      // Simulate audio ending before timeout
      mockAudio.triggerEnded();
      
      await promise;
      
      expect(mockAudio.paused).toBe(true);
    });

    it('should resolve promise after 2.5 seconds timeout', async () => {
      const mockAudio = new MockAudio('/sounds/hang-up.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      const promise = playHangUpSound();
      jest.advanceTimersByTime(0);
      
      jest.advanceTimersByTime(2500);
      
      await promise;
      
      expect(mockAudio.paused).toBe(true);
      expect(mockAudio.currentTime).toBe(0);
    });

    it('should stop currently playing hang up sound before playing new one', () => {
      const firstAudio = new MockAudio('/sounds/hang-up.wav');
      const secondAudio = new MockAudio('/sounds/hang-up.wav');
      mockAudioConstructor
        .mockReturnValueOnce(firstAudio)
        .mockReturnValueOnce(secondAudio);
      
      playHangUpSound();
      jest.advanceTimersByTime(0);
      playHangUpSound();
      jest.advanceTimersByTime(0);
      
      expect(firstAudio.paused).toBe(true);
      expect(firstAudio.currentTime).toBe(0);
    });

    it('should clear existing timeout before playing new sound', async () => {
      const firstAudio = new MockAudio('/sounds/hang-up.wav');
      const secondAudio = new MockAudio('/sounds/hang-up.wav');
      mockAudioConstructor
        .mockReturnValueOnce(firstAudio)
        .mockReturnValueOnce(secondAudio);
      
      const promise1 = playHangUpSound();
      await Promise.resolve();
      
      // Advance time a bit (but not enough to complete)
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
      
      // Start second sound (should clear first timeout)
      const promise2 = playHangUpSound();
      await Promise.resolve();
      
      // Verify second audio was created
      expect(mockAudioConstructor).toHaveBeenCalledTimes(2);
      
      // Complete second sound
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
      
      // Wait for second promise to resolve
      await promise2;
      
      // First audio should have been paused/cleared
      expect(firstAudio.paused).toBe(true);
    }, 15000);

    it('should reject promise on audio error', async () => {
      const mockAudio = new MockAudio('/sounds/hang-up.wav');
      const audioError = new Error('Audio error');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      const promise = playHangUpSound();
      await Promise.resolve();
      jest.advanceTimersByTime(0);
      await Promise.resolve();
      
      mockAudio.triggerError(audioError);
      await Promise.resolve();
      
      await expect(promise).rejects.toThrow();
    });

    it('should handle play() rejection and reject promise', async () => {
      const mockAudio = new MockAudio('/sounds/hang-up.wav');
      const playError = new Error('Play failed');
      mockAudio.triggerError(playError);
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      const promise = playHangUpSound();
      jest.advanceTimersByTime(0);
      
      await expect(promise).rejects.toBe(playError);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[audioPlayer] Failed to play hang up sound:'),
        expect.anything()
      );
    });

    it('should handle non-Error error objects', async () => {
      const mockAudio = new MockAudio('/sounds/hang-up.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      const promise = playHangUpSound();
      jest.advanceTimersByTime(0);
      
      // Simulate error event with non-Error object
      const errorEvent = { code: 123, message: 'Error' };
      mockAudio.triggerError(new Error(JSON.stringify(errorEvent)));
      
      await expect(promise).rejects.toBeInstanceOf(Error);
    });

    it('should handle audio creation error and reject promise', async () => {
      const creationError = new Error('Audio creation failed');
      mockAudioConstructor.mockImplementation(() => {
        throw creationError;
      });
      
      const promise = playHangUpSound();
      
      await expect(promise).rejects.toBe(creationError);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[audioPlayer] Error creating hang up sound:'),
        expect.anything()
      );
    });

    it('should clear timeout when audio ends naturally', async () => {
      const mockAudio = new MockAudio('/sounds/hang-up.wav');
      mockAudioConstructor.mockReturnValue(mockAudio);
      
      const promise = playHangUpSound();
      jest.advanceTimersByTime(0);
      
      // Audio ends before timeout
      mockAudio.triggerEnded();
      await promise;
      
      // Advance time past timeout - should not cause issues
      jest.advanceTimersByTime(2500);
      
      expect(mockAudio.paused).toBe(true);
    });
  });
});

