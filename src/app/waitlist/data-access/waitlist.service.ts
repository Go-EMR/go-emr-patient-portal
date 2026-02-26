import { Injectable, signal, computed } from '@angular/core';
import { WaitlistEntry } from '../../shared/data-access/models';

@Injectable({ providedIn: 'root' })
export class WaitlistService {
  private _entries = signal<WaitlistEntry[]>([]);
  private _loading = signal(false);

  readonly entries = this._entries.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly activeEntries = computed(() =>
    this._entries().filter(e => e.status === 'waiting' || e.status === 'slot-available')
  );

  readonly slotsAvailable = computed(() =>
    this._entries().filter(e => e.status === 'slot-available')
  );

  readonly historyEntries = computed(() =>
    this._entries().filter(e => e.status === 'completed' || e.status === 'cancelled' || e.status === 'expired')
  );

  constructor() {
    this.loadMockData();
  }

  acceptSlot(entryId: string): void {
    this._entries.update(entries =>
      entries.map(e =>
        e.id === entryId
          ? { ...e, status: 'completed' as const, completedDate: new Date() }
          : e
      )
    );
  }

  declineSlot(entryId: string): void {
    this._entries.update(entries =>
      entries.map(e =>
        e.id === entryId ? { ...e, status: 'cancelled' as const } : e
      )
    );
  }

  cancelEntry(entryId: string): void {
    this._entries.update(entries =>
      entries.map(e =>
        e.id === entryId ? { ...e, status: 'cancelled' as const } : e
      )
    );
  }

  updateNotificationPreferences(entryId: string, prefs: { email: boolean; sms: boolean; push: boolean }): void {
    this._entries.update(entries =>
      entries.map(e =>
        e.id === entryId ? { ...e, notificationPreferences: prefs } : e
      )
    );
  }

  private loadMockData(): void {
    this._loading.set(true);
    setTimeout(() => {
      const now = new Date();
      const daysAgo = (n: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n);
        return d;
      };
      const hoursFromNow = (h: number) => {
        const d = new Date(now);
        d.setHours(d.getHours() + h);
        return d;
      };
      const daysFromNow = (n: number) => {
        const d = new Date(now);
        d.setDate(d.getDate() + n);
        return d;
      };
      const monthsAgo = (n: number) => {
        const d = new Date(now);
        d.setMonth(d.getMonth() - n);
        return d;
      };

      const entries: WaitlistEntry[] = [
        {
          id: 'wl-001',
          providerName: 'Dr. James Rivera',
          providerSpecialty: 'Dermatology',
          appointmentType: 'Follow-Up: Skin Biopsy Results',
          dateAdded: daysAgo(18),
          position: 3,
          totalInQueue: 12,
          estimatedWaitWeeks: 2,
          status: 'waiting',
          priority: 'routine',
          notificationPreferences: { email: true, sms: true, push: false },
          notes: 'Patient prefers morning appointments, Monday through Wednesday'
        },
        {
          id: 'wl-002',
          providerName: 'Dr. Lisa Wong',
          providerSpecialty: 'Orthopedics',
          appointmentType: 'New Patient Consultation: Right Knee Pain',
          dateAdded: daysAgo(35),
          status: 'slot-available',
          priority: 'routine',
          slotOfferedDate: daysFromNow(4),
          slotOfferedTime: 'Thursday, ' + daysFromNow(4).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' at 2:30 PM',
          slotOfferExpiresAt: hoursFromNow(22),
          notificationPreferences: { email: true, sms: true, push: true },
          notes: 'Patient was seen in urgent care for this issue — referral attached'
        },
        {
          id: 'wl-003',
          providerName: 'Dr. Emily Brooks',
          providerSpecialty: 'Allergy & Immunology',
          appointmentType: 'New Patient: Seasonal Allergy Evaluation',
          dateAdded: daysAgo(7),
          position: 7,
          totalInQueue: 15,
          estimatedWaitWeeks: 4,
          status: 'waiting',
          priority: 'routine',
          notificationPreferences: { email: true, sms: false, push: true }
        },
        {
          id: 'wl-004',
          providerName: 'Dr. Michael Park',
          providerSpecialty: 'Cardiology',
          appointmentType: 'Cardiology Follow-Up: Aortic Stenosis Monitoring',
          dateAdded: monthsAgo(2),
          status: 'completed',
          priority: 'urgent',
          completedDate: new Date(2026, 0, 15),
          notificationPreferences: { email: true, sms: true, push: false },
          notes: 'Appointment completed — annual echocardiogram performed'
        }
      ];

      this._entries.set(entries);
      this._loading.set(false);
    }, 500);
  }
}
