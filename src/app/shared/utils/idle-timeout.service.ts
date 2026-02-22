import { Injectable, signal, OnDestroy } from '@angular/core';

/**
 * Feature 6.4: Idle Session Timeout Service
 *
 * Tracks user activity (mouse, keyboard, touch) and automatically logs the
 * user out after 15 minutes of inactivity. Shows a warning dialog 2 minutes
 * before the timeout so the user can extend their session.
 */
@Injectable({ providedIn: 'root' })
export class IdleTimeoutService implements OnDestroy {
  private readonly IDLE_TIMEOUT = 15 * 60 * 1000;    // 15 minutes in ms
  private readonly WARNING_BEFORE = 2 * 60 * 1000;   // 2 minutes warning in ms

  readonly showWarning = signal(false);
  readonly remainingSeconds = signal(0);

  private lastActivityAt = Date.now();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private logoutCallback: (() => void) | null = null;
  private tracking = false;

  // Bound event handlers so we can remove them later
  private readonly boundReset = () => this.resetTimer();

  /** Begin activity tracking. Call from ShellComponent.ngOnInit(). */
  startTracking(onLogout: () => void): void {
    if (this.tracking) return;
    this.tracking = true;
    this.logoutCallback = onLogout;
    this.lastActivityAt = Date.now();

    // Listen for any user interaction
    window.addEventListener('mousemove', this.boundReset, { passive: true });
    window.addEventListener('mousedown', this.boundReset, { passive: true });
    window.addEventListener('keydown', this.boundReset, { passive: true });
    window.addEventListener('touchstart', this.boundReset, { passive: true });
    window.addEventListener('scroll', this.boundReset, { passive: true });

    // Check idle state every 10 seconds
    this.checkInterval = setInterval(() => this.checkIdle(), 10_000);
  }

  /** Stop activity tracking. Call from ShellComponent.ngOnDestroy(). */
  stopTracking(): void {
    if (!this.tracking) return;
    this.tracking = false;

    window.removeEventListener('mousemove', this.boundReset);
    window.removeEventListener('mousedown', this.boundReset);
    window.removeEventListener('keydown', this.boundReset);
    window.removeEventListener('touchstart', this.boundReset);
    window.removeEventListener('scroll', this.boundReset);

    this.clearIntervals();
    this.showWarning.set(false);
    this.remainingSeconds.set(0);
  }

  /** Reset the idle timer when the user interacts with the page. */
  resetTimer(): void {
    this.lastActivityAt = Date.now();

    // If the warning is already shown, dismiss it
    if (this.showWarning()) {
      this.showWarning.set(false);
      this.stopCountdown();
    }
  }

  /** Extend the session by resetting the timer (mapped to "Stay Logged In" button). */
  extendSession(): void {
    this.resetTimer();
  }

  // Called from ShellComponent when the user clicks "Log Out" in the warning dialog
  triggerLogout(): void {
    this.stopTracking();
    if (this.logoutCallback) {
      this.logoutCallback();
    }
  }

  private checkIdle(): void {
    const idleMs = Date.now() - this.lastActivityAt;
    const timeUntilTimeout = this.IDLE_TIMEOUT - idleMs;

    if (timeUntilTimeout <= 0) {
      // Session has expired
      this.triggerLogout();
    } else if (timeUntilTimeout <= this.WARNING_BEFORE && !this.showWarning()) {
      // Entered the warning window
      this.showWarning.set(true);
      this.startCountdown(Math.floor(timeUntilTimeout / 1000));
    } else if (this.showWarning()) {
      // Update the countdown while the warning is displayed
      const secs = Math.max(0, Math.floor(timeUntilTimeout / 1000));
      this.remainingSeconds.set(secs);
    }
  }

  private startCountdown(initialSeconds: number): void {
    this.remainingSeconds.set(initialSeconds);
    this.stopCountdown();

    this.countdownInterval = setInterval(() => {
      const current = this.remainingSeconds();
      if (current <= 1) {
        this.remainingSeconds.set(0);
        this.stopCountdown();
        this.triggerLogout();
      } else {
        this.remainingSeconds.set(current - 1);
      }
    }, 1_000);
  }

  private stopCountdown(): void {
    if (this.countdownInterval !== null) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  private clearIntervals(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.stopCountdown();
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }
}
