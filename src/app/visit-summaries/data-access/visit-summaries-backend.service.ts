import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../auth/data-access/auth.service';

export interface VisitSummary {
  id: string;
  date: string;
  providerName: string;
  specialty: string;
  facilityName: string;
  status: string;
  chiefComplaint?: string;
  diagnoses: { code: string; description: string }[];
  treatmentPlan?: string;
  followUp?: { timing: string; reason?: string };
  signedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class VisitSummariesBackendService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly backendUrl = '/api/v1';

  private readonly _summaries = signal<VisitSummary[]>([]);
  private readonly _isLoading = signal(false);

  readonly summaries = this._summaries.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  loadSummaries(): void {
    const patientId = this.authService.user()?.patientId;
    if (!patientId) return;

    const emrPatientId = this.mapPatientId(patientId);

    this._isLoading.set(true);
    this.http.get<VisitSummary[]>(`${this.backendUrl}/patients/${emrPatientId}/visit-summaries`)
      .pipe(catchError(err => {
        console.warn('Failed to fetch visit summaries:', err.message);
        return of([]);
      }))
      .subscribe(summaries => {
        this._summaries.set(summaries);
        this._isLoading.set(false);
      });
  }

  private mapPatientId(portalId: string): string {
    const map: Record<string, string> = {
      'PAT-010': 'pat-010',
      'PAT-011': 'pat-011',
      'PAT-001': 'pat-001',
    };
    return map[portalId] || portalId;
  }
}
