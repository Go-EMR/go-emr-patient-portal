import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/data-access/auth.service';
import { AppointmentsDataService } from '../../appointments/data-access/appointments-data.service';

/**
 * PortalEvent is the shape emitted by the Go patient-portal-api SSE endpoint.
 * The NATS -> SSE bridge serialises messages as:
 *   { type: string, subject: string, tenant_id?: string, payload: Record<string, unknown> }
 */
interface PortalEvent {
  type?: string;
  subject?: string;
  tenant_id?: string;
  payload?: Record<string, unknown>;
}

/**
 * RealtimeService opens a long-lived SSE connection to
 * /api/v1/portal/events/stream and routes incoming events to:
 *
 *   - AppointmentsDataService — refreshes the appointment list when a
 *     scheduling event arrives so the UI stays in sync without polling.
 *   - PrimeNG MessageService — surfaces a toast notification for the patient.
 *
 * Authentication: the portal JWT is passed as a query-string token because
 * EventSource does not support custom headers.  The token is read from
 * localStorage under the key `portal_token` — the same key used by all other
 * portal fetch calls.
 *
 * Reconnection: exponential back-off with a 30-second ceiling.  Reconnection
 * stops when the user is no longer authenticated.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly appointmentsService = inject(AppointmentsDataService);

  private eventSource: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_DELAY_MS = 30_000;

  /** True while an SSE connection is open. */
  readonly isConnected = signal(false);

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Open the SSE connection.  Call this once the patient has authenticated
   * (e.g. inside the shell component's ngOnInit).
   */
  connect(): void {
    const token = localStorage.getItem('portal_token');
    if (!token) {
      console.warn('[Portal SSE] No portal_token found — skipping connection');
      return;
    }

    this.closeEventSource();

    const url = `/api/v1/portal/events/stream?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.isConnected.set(true);
      this.reconnectAttempts = 0;
      console.log('[Portal SSE] Connected');
    };

    this.eventSource.onmessage = (event: MessageEvent) => {
      this.handleMessage(event);
    };

    this.eventSource.onerror = () => {
      this.isConnected.set(false);
      this.closeEventSource();
      this.scheduleReconnect();
    };
  }

  /** Close the SSE connection and stop any pending reconnect timer. */
  disconnect(): void {
    this.clearReconnectTimer();
    this.closeEventSource();
    this.reconnectAttempts = 0;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.disconnect();
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private closeEventSource(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnected.set(false);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as PortalEvent;
      this.routeEvent(data);
    } catch (err) {
      console.warn('[Portal SSE] Failed to parse event data:', err);
    }
  }

  /**
   * Routes a parsed SSE event:
   *  1. Refreshes the appointments signal when a scheduling event arrives.
   *  2. Shows a PrimeNG toast notification to the patient.
   */
  private routeEvent(event: PortalEvent): void {
    const subject = event.subject ?? event.type ?? '';
    const payload = event.payload ?? {};

    // ── Appointment events ────────────────────────────────────────────────
    if (
      subject.includes('scheduling.appointment') ||
      subject.startsWith('portal.appointment')
    ) {
      // Refresh the patient's appointment list from the backend.
      this.appointmentsService.loadAppointments().catch(() => {
        // Non-fatal — the UI will still show the last known state.
      });
    }

    // ── Toast notification ────────────────────────────────────────────────
    const toast = this.buildToast(subject, payload);
    if (toast) {
      this.messageService.add(toast);
    }
  }

  /**
   * Maps a subject/payload pair to a PrimeNG MessageService config object.
   * Returns null for subjects that should not surface a notification to the
   * patient.
   */
  private buildToast(
    subject: string,
    payload: Record<string, unknown>
  ): { severity: string; summary: string; detail: string; life: number } | null {
    const providerName = (payload['providerName'] as string | undefined) ?? '';

    if (subject.includes('appointment.booked') || subject.includes('appointment.created')) {
      return {
        severity: 'success',
        summary: 'Appointment Confirmed',
        detail: providerName
          ? `Your appointment with ${providerName} has been booked.`
          : 'Your appointment has been booked.',
        life: 6000,
      };
    }

    if (subject.includes('appointment.cancelled')) {
      return {
        severity: 'warn',
        summary: 'Appointment Cancelled',
        detail: 'One of your appointments has been cancelled. Please rebook if needed.',
        life: 8000,
      };
    }

    if (subject.includes('appointment.rescheduled')) {
      return {
        severity: 'info',
        summary: 'Appointment Rescheduled',
        detail: providerName
          ? `Your appointment with ${providerName} has been rescheduled.`
          : 'Your appointment has been rescheduled.',
        life: 6000,
      };
    }

    if (subject.includes('lab.resulted') || subject.includes('clinical.lab.resulted')) {
      return {
        severity: 'info',
        summary: 'Lab Results Available',
        detail: 'Your lab results are ready to view.',
        life: 8000,
      };
    }

    if (subject.includes('portal.message') || subject.includes('message.sent')) {
      const msgSubject = (payload['subject'] as string | undefined) ?? 'New message';
      return {
        severity: 'info',
        summary: 'New Message',
        detail: msgSubject,
        life: 6000,
      };
    }

    if (subject.includes('portal.notification')) {
      const title = (payload['title'] as string | undefined) ?? 'New Notification';
      const message = (payload['message'] as string | undefined) ?? '';
      return {
        severity: 'info',
        summary: title,
        detail: message,
        life: 6000,
      };
    }

    return null;
  }

  private scheduleReconnect(): void {
    // Stop reconnecting when the patient has signed out.
    if (!this.authService.isAuthenticated()) return;

    // Exponential back-off: 1 s → 2 s → 4 s → … capped at 30 s.
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.MAX_RECONNECT_DELAY_MS
    );
    this.reconnectAttempts++;

    console.log(`[Portal SSE] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }
}
