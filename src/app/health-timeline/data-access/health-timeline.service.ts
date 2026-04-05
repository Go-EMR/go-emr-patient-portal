import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

export type HealthEventType = 'appointment' | 'encounter' | 'lab' | 'medication' | 'immunization' | 'vital' | 'procedure';

export interface HealthEvent {
  id: string;
  date: Date;
  type: HealthEventType;
  title: string;
  description: string;
  provider: string;
  isMilestone?: boolean;
}

export interface EventTypeFilter {
  type: HealthEventType | 'all';
  label: string;
  icon: string;
}

export const EVENT_TYPE_META: Record<HealthEventType, { color: string; bgColor: string; icon: string; label: string }> = {
  appointment: { color: 'var(--blue-700)',   bgColor: 'var(--blue-100)',   icon: 'pi pi-calendar',       label: 'Appointment'   },
  encounter:   { color: 'var(--cyan-700)',   bgColor: 'var(--cyan-100)',   icon: 'pi pi-file-edit',      label: 'Encounter'     },
  lab:         { color: 'var(--purple-700)', bgColor: 'var(--purple-100)', icon: 'pi pi-chart-bar',      label: 'Lab Result'    },
  medication:  { color: 'var(--teal-700)',   bgColor: 'var(--teal-100)',   icon: 'pi pi-tablet',         label: 'Medication'    },
  immunization:{ color: 'var(--green-700)',  bgColor: 'var(--green-100)',  icon: 'pi pi-shield',         label: 'Immunization'  },
  vital:       { color: 'var(--orange-700)', bgColor: 'var(--orange-100)', icon: 'pi pi-heart',          label: 'Vital Signs'   },
  procedure:   { color: 'var(--red-700)',    bgColor: 'var(--red-100)',    icon: 'pi pi-bolt',           label: 'Procedure'     }
};

export const FILTER_OPTIONS: EventTypeFilter[] = [
  { type: 'all',          label: 'All Events',    icon: 'pi pi-list'      },
  { type: 'appointment',  label: 'Appointments',  icon: 'pi pi-calendar'  },
  { type: 'encounter',    label: 'Encounters',    icon: 'pi pi-file-edit' },
  { type: 'lab',          label: 'Labs',          icon: 'pi pi-chart-bar' },
  { type: 'medication',   label: 'Medications',   icon: 'pi pi-tablet'    },
  { type: 'immunization', label: 'Immunizations', icon: 'pi pi-shield'    },
  { type: 'vital',        label: 'Vitals',        icon: 'pi pi-heart'     },
  { type: 'procedure',    label: 'Procedures',    icon: 'pi pi-bolt'      }
];

// TODO: Implement backend endpoint for GET /api/v1/portal/patients/{id}/timeline

@Injectable({ providedIn: 'root' })
export class HealthTimelineService {
  private readonly authService = inject(AuthService);

  private readonly _events = signal<HealthEvent[]>([]);
  private readonly _activeFilter = signal<HealthEventType | 'all'>('all');
  private readonly _isLoading = signal<boolean>(false);

  readonly activeFilter = this._activeFilter.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly filteredEvents = computed(() => {
    const filter = this._activeFilter();
    const events = this._events();
    return filter === 'all' ? events : events.filter(e => e.type === filter);
  });

  readonly eventCountByType = computed(() => {
    const events = this._events();
    const counts: Partial<Record<HealthEventType | 'all', number>> = { all: events.length };
    for (const type of Object.keys(EVENT_TYPE_META) as HealthEventType[]) {
      counts[type] = events.filter(e => e.type === type).length;
    }
    return counts;
  });

  /**
   * Loads health timeline events from the backend API.
   * TODO: Implement backend endpoint GET /api/v1/portal/patients/{id}/timeline
   */
  async loadTimeline(): Promise<void> {
    const patientId = localStorage.getItem('portal_patient_id') || this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token');

    if (!patientId || !token) {
      return;
    }

    this._isLoading.set(true);
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/timeline`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data: {
          events: Array<{
            id: string;
            date: string;
            type: string;
            title: string;
            description: string;
            provider: string;
            is_milestone?: boolean;
          }>;
        } = await resp.json();

        const mapped: HealthEvent[] = (data.events ?? []).map(e => ({
          id: e.id,
          date: new Date(e.date),
          type: (e.type as HealthEventType) || 'appointment',
          title: e.title,
          description: e.description,
          provider: e.provider,
          isMilestone: e.is_milestone ?? false
        }));

        // Sort descending by date (most recent first)
        mapped.sort((a, b) => b.date.getTime() - a.date.getTime());
        this._events.set(mapped);
      }
      // On non-OK response: leave events as empty array
    } catch {
      // On network error: leave events as empty array
    } finally {
      this._isLoading.set(false);
    }
  }

  setFilter(filter: HealthEventType | 'all'): void {
    this._activeFilter.set(filter);
  }

  getMonthYear(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
