import { Injectable, signal, inject } from '@angular/core';
import { EmergencyContact } from '../../shared/data-access';
import { AuthService } from '../../auth/data-access/auth.service';

/**
 * EmergencyContactsService manages CRUD operations for emergency contacts stored
 * in patient_master.emergency_contact via the patient-portal-api.
 *
 * All mutations optimistically update local signal state, then persist to the
 * backend.  On failure the prior state is restored and an error signal is set.
 */
@Injectable({ providedIn: 'root' })
export class EmergencyContactsService {
  private readonly authService = inject(AuthService);

  private readonly _contacts = signal<EmergencyContact[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly contacts = this._contacts.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly error = this._error.asReadonly();

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private get token(): string {
    return localStorage.getItem('portal_token') ?? '';
  }

  private get patientId(): string | null {
    return this.authService.user()?.patientId ?? localStorage.getItem('portal_patient_id');
  }

  private baseUrl(patientId: string): string {
    return `/api/v1/portal/patients/${patientId}/emergency-contacts`;
  }

  // -------------------------------------------------------------------------
  // Load
  // -------------------------------------------------------------------------

  async loadContacts(): Promise<void> {
    const patientId = this.patientId;
    if (!patientId) {
      this._contacts.set([]);
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      const resp = await fetch(this.baseUrl(patientId), {
        headers: { 'Authorization': `Bearer ${this.token}` },
      });

      if (resp.ok) {
        const data: EmergencyContact[] = await resp.json();
        this._contacts.set(data ?? []);
      } else {
        this._error.set(`Failed to load contacts (${resp.status})`);
      }
    } catch (err) {
      this._error.set('Network error while loading emergency contacts');
    } finally {
      this._isLoading.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Add
  // -------------------------------------------------------------------------

  async addContact(partial: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact | null> {
    const patientId = this.patientId;
    if (!patientId) return null;

    const newContact: EmergencyContact = {
      ...partial,
      id: `ec-${Date.now()}`,
    };

    this._isSaving.set(true);
    this._error.set(null);

    // Optimistic update
    this._contacts.update(list => [...list, newContact]);

    try {
      const resp = await fetch(this.baseUrl(patientId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      });

      if (resp.ok) {
        // Backend echoes the saved contact (may have server-generated id)
        const saved: EmergencyContact = await resp.json();
        // Replace optimistic entry with server response in case id changed
        this._contacts.update(list =>
          list.map(c => c.id === newContact.id ? saved : c)
        );
        return saved;
      } else {
        // Rollback
        this._contacts.update(list => list.filter(c => c.id !== newContact.id));
        this._error.set(`Failed to add contact (${resp.status})`);
        return null;
      }
    } catch (err) {
      this._contacts.update(list => list.filter(c => c.id !== newContact.id));
      this._error.set('Network error while adding contact');
      return null;
    } finally {
      this._isSaving.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  async deleteContact(contactId: string): Promise<boolean> {
    const patientId = this.patientId;
    if (!patientId) return false;

    // Optimistic update
    const prior = this._contacts();
    this._contacts.update(list => list.filter(c => c.id !== contactId));
    this._isSaving.set(true);
    this._error.set(null);

    try {
      const resp = await fetch(`${this.baseUrl(patientId)}/${contactId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` },
      });

      if (resp.ok || resp.status === 204) {
        return true;
      } else {
        // Rollback
        this._contacts.set(prior);
        this._error.set(`Failed to delete contact (${resp.status})`);
        return false;
      }
    } catch (err) {
      this._contacts.set(prior);
      this._error.set('Network error while deleting contact');
      return false;
    } finally {
      this._isSaving.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Replace all (bulk PUT)
  // -------------------------------------------------------------------------

  async replaceAll(contacts: EmergencyContact[]): Promise<boolean> {
    const patientId = this.patientId;
    if (!patientId) return false;

    const prior = this._contacts();
    this._contacts.set(contacts);
    this._isSaving.set(true);
    this._error.set(null);

    try {
      const resp = await fetch(this.baseUrl(patientId), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contacts),
      });

      if (resp.ok) {
        return true;
      } else {
        this._contacts.set(prior);
        this._error.set(`Failed to save contacts (${resp.status})`);
        return false;
      }
    } catch (err) {
      this._contacts.set(prior);
      this._error.set('Network error while saving contacts');
      return false;
    } finally {
      this._isSaving.set(false);
    }
  }
}
