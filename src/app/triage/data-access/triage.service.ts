import { Injectable, signal } from '@angular/core';

export interface TriageCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  route: string;
  color: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

const TRIAGE_CATEGORIES: TriageCategory[] = [
  {
    id: 'appointments',
    label: 'Book an Appointment',
    icon: 'pi-calendar',
    description: 'Schedule a new visit',
    route: '/appointments',
    color: 'teal',
    urgency: 'low'
  },
  {
    id: 'prescriptions',
    label: 'Medication Refill',
    icon: 'pi-box',
    description: 'Request a prescription refill',
    route: '/prescriptions',
    color: 'blue',
    urgency: 'low'
  },
  {
    id: 'lab-trends',
    label: 'View Lab Results',
    icon: 'pi-chart-line',
    description: 'Check your recent lab work',
    route: '/lab-trends',
    color: 'green',
    urgency: 'low'
  },
  {
    id: 'messages',
    label: 'Message Your Doctor',
    icon: 'pi-envelope',
    description: 'Send a secure message',
    route: '/messages',
    color: 'indigo',
    urgency: 'medium'
  },
  {
    id: 'symptom-checker',
    label: 'Urgent Care Advice',
    icon: 'pi-exclamation-circle',
    description: 'Get guidance for non-emergency symptoms',
    route: '/symptom-checker',
    color: 'orange',
    urgency: 'medium'
  },
  {
    id: 'billing',
    label: 'Billing Question',
    icon: 'pi-credit-card',
    description: 'Payment or insurance inquiry',
    route: '/billing',
    color: 'purple',
    urgency: 'low'
  },
  {
    id: 'telehealth',
    label: 'Telehealth Visit',
    icon: 'pi-video',
    description: 'Start or join a video visit',
    route: '/telehealth',
    color: 'cyan',
    urgency: 'medium'
  },
  {
    id: 'emergency',
    label: 'EMERGENCY',
    icon: 'pi-exclamation-triangle',
    description: 'Chest pain, stroke, severe injury',
    route: 'emergency',
    color: 'red',
    urgency: 'emergency'
  }
];

@Injectable({ providedIn: 'root' })
export class TriageService {
  readonly categories: TriageCategory[] = TRIAGE_CATEGORIES;

  private _selectedCategory = signal<TriageCategory | null>(null);
  readonly selectedCategory = this._selectedCategory.asReadonly();

  selectCategory(cat: TriageCategory): void {
    this._selectedCategory.set(cat);
  }

  resetTriage(): void {
    this._selectedCategory.set(null);
  }
}
