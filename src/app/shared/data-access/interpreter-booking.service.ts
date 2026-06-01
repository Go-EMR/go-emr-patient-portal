import { Injectable, signal, computed } from '@angular/core';

export interface InterpreterBooking {
  id: string;
  language: string;
  date: string;
  time: string;
  type: 'phone' | 'video' | 'on-site';
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  providerName: string;
  appointmentLabel: string;
  requestedAt: Date;
}

/**
 * InterpreterBookingService
 *
 * Generic interpreter booking service for the AuraHealth Patient Portal.
 * Manages mock interpreter bookings using Angular Signals.  In production
 * this would communicate with a backend interpreter coordination service.
 */
@Injectable({ providedIn: 'root' })
export class InterpreterBookingService {
  private _bookings = signal<InterpreterBooking[]>([
    {
      id: 'INT-001',
      language: 'Spanish',
      date: '28 Feb 2026',
      time: '10:00 AM',
      type: 'phone',
      status: 'confirmed',
      providerName: 'Dr. Michael Chen',
      appointmentLabel: 'Annual Physical — AuraHealth Primary Care',
      requestedAt: new Date('2026-02-20')
    },
    {
      id: 'INT-002',
      language: 'Mandarin',
      date: '05 Mar 2026',
      time: '02:30 PM',
      type: 'video',
      status: 'pending',
      providerName: 'Dr. Sarah Johnson',
      appointmentLabel: 'Cardiology Consultation — Heart Health Center',
      requestedAt: new Date('2026-02-21')
    }
  ]);

  readonly bookings = this._bookings.asReadonly();

  readonly activeBookings = computed(() =>
    this._bookings().filter(b => b.status === 'confirmed' || b.status === 'pending')
  );

  readonly bookingCount = computed(() => this._bookings().length);

  /**
   * Request a new interpreter booking.
   * Returns the created booking so callers can display confirmation details.
   */
  bookInterpreter(params: {
    language: string;
    appointmentId: string;
    appointmentLabel: string;
    providerName: string;
    date: string;
    time: string;
    type: 'phone' | 'video' | 'on-site';
  }): InterpreterBooking {
    const booking: InterpreterBooking = {
      id: `INT-${String(Date.now()).slice(-4)}`,
      language: params.language,
      date: params.date,
      time: params.time,
      type: params.type,
      status: 'pending',
      providerName: params.providerName,
      appointmentLabel: params.appointmentLabel,
      requestedAt: new Date()
    };
    this._bookings.update(list => [booking, ...list]);
    return booking;
  }

  /**
   * Cancel an existing interpreter booking by ID.
   */
  cancelBooking(id: string): void {
    this._bookings.update(list =>
      list.map(b => b.id === id ? { ...b, status: 'cancelled' as const } : b)
    );
  }

  /**
   * Get a booking by ID.
   */
  getBooking(id: string): InterpreterBooking | undefined {
    return this._bookings().find(b => b.id === id);
  }
}
