import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WakeLockService implements OnDestroy {
  private wakeLock: WakeLockSentinel | null = null;
  private readonly boundVisibilityHandler = () => this.onVisibilityChange();

  readonly ativo = signal(false);
  readonly suportado = signal(typeof navigator !== 'undefined' && 'wakeLock' in navigator);

  constructor() {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    }
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
    }
    void this.liberar();
  }

  async solicitar(): Promise<boolean> {
    if (!this.suportado()) {
      return false;
    }

    try {
      this.wakeLock = await navigator.wakeLock.request('screen');
      this.ativo.set(true);

      this.wakeLock.addEventListener('release', () => {
        this.ativo.set(false);
        this.wakeLock = null;
      });

      return true;
    } catch {
      this.ativo.set(false);
      return false;
    }
  }

  async liberar(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release();
      this.wakeLock = null;
    }
    this.ativo.set(false);
  }

  private async onVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && !this.wakeLock) {
      await this.solicitar();
    }
  }
}
