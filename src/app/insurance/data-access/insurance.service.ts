import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

export type InsuranceType = 'medical' | 'dental' | 'vision';

export interface InsuranceCard {
  id: string;
  type: InsuranceType;
  carrier: string;
  planName: string;
  memberId: string;
  groupNumber: string;
  effectiveDate: string;
  expirationDate: string;
  copay: {
    primaryCare: number;
    specialist: number;
    urgentCare: number;
    emergency: number;
  };
  deductible: {
    individual: number;
    family: number;
    met: number;
  };
  outOfPocketMax: {
    individual: number;
    family: number;
    met: number;
  };
  subscriberName: string;
  dependents: string[];
  rxBin: string;
  rxPcn: string;
  rxGroup: string;
  isFlipped: boolean;
  phone: string;
  providerPhone: string;
}

export interface BenefitUsage {
  category: string;
  used: number;
  total: number;
  unit: string;
}

// TODO: Implement backend endpoint for GET /api/v1/portal/patients/{id}/insurance
// The billing endpoint (GET /api/v1/portal/patients/{id}/billing) may carry
// insurance policy data in future; wire to it when available.

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private readonly authService = inject(AuthService);

  private readonly _cards = signal<InsuranceCard[]>([]);
  private readonly _selectedCardId = signal<string>('');
  private readonly _benefitUsage = signal<BenefitUsage[]>([]);
  private readonly _isLoading = signal<boolean>(false);

  readonly cards = this._cards.asReadonly();
  readonly selectedCardId = this._selectedCardId.asReadonly();
  readonly benefitUsage = this._benefitUsage.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly selectedCard = computed(() =>
    this._cards().find(c => c.id === this._selectedCardId()) ?? this._cards()[0] ?? null
  );

  readonly activeCards = computed(() =>
    this._cards().filter(c => {
      const exp = new Date(c.expirationDate);
      return exp >= new Date();
    })
  );

  /**
   * Loads insurance cards from the backend API.
   * Attempts GET /api/v1/portal/patients/{id}/insurance first.
   * TODO: Implement backend endpoint for /api/v1/portal/patients/{id}/insurance
   */
  async loadInsurance(): Promise<void> {
    const patientId = localStorage.getItem('portal_patient_id') || this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token');

    if (!patientId || !token) {
      return;
    }

    this._isLoading.set(true);
    try {
      const resp = await fetch(
        `/api/v1/portal/patients/${patientId}/insurance`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data: {
          cards: Array<{
            id: string;
            type: string;
            carrier: string;
            plan_name: string;
            member_id: string;
            group_number: string;
            effective_date: string;
            expiration_date: string;
            copay?: {
              primary_care: number;
              specialist: number;
              urgent_care: number;
              emergency: number;
            };
            deductible?: {
              individual: number;
              family: number;
              met: number;
            };
            out_of_pocket_max?: {
              individual: number;
              family: number;
              met: number;
            };
            subscriber_name: string;
            dependents?: string[];
            rx_bin?: string;
            rx_pcn?: string;
            rx_group?: string;
            phone?: string;
            provider_phone?: string;
          }>;
          benefit_usage?: Array<{
            category: string;
            used: number;
            total: number;
            unit: string;
          }>;
        } = await resp.json();

        const mapped: InsuranceCard[] = (data.cards ?? []).map(c => ({
          id: c.id,
          type: (c.type as InsuranceType) || 'medical',
          carrier: c.carrier,
          planName: c.plan_name,
          memberId: c.member_id,
          groupNumber: c.group_number,
          effectiveDate: c.effective_date,
          expirationDate: c.expiration_date,
          copay: {
            primaryCare: c.copay?.primary_care ?? 0,
            specialist: c.copay?.specialist ?? 0,
            urgentCare: c.copay?.urgent_care ?? 0,
            emergency: c.copay?.emergency ?? 0
          },
          deductible: {
            individual: c.deductible?.individual ?? 0,
            family: c.deductible?.family ?? 0,
            met: c.deductible?.met ?? 0
          },
          outOfPocketMax: {
            individual: c.out_of_pocket_max?.individual ?? 0,
            family: c.out_of_pocket_max?.family ?? 0,
            met: c.out_of_pocket_max?.met ?? 0
          },
          subscriberName: c.subscriber_name,
          dependents: c.dependents ?? [],
          rxBin: c.rx_bin ?? '',
          rxPcn: c.rx_pcn ?? '',
          rxGroup: c.rx_group ?? '',
          isFlipped: false,
          phone: c.phone ?? '',
          providerPhone: c.provider_phone ?? ''
        }));

        this._cards.set(mapped);
        if (mapped.length > 0) {
          this._selectedCardId.set(mapped[0].id);
        }

        if (data.benefit_usage) {
          const usageMapped: BenefitUsage[] = data.benefit_usage.map(u => ({
            category: u.category,
            used: u.used,
            total: u.total,
            unit: u.unit
          }));
          this._benefitUsage.set(usageMapped);
        }
      }
      // On non-OK response: leave cards as empty array
    } catch {
      // On network error: leave cards as empty array
    } finally {
      this._isLoading.set(false);
    }
  }

  flipCard(id: string): void {
    this._cards.update(cards =>
      cards.map(c => c.id === id ? { ...c, isFlipped: !c.isFlipped } : c)
    );
  }

  selectCard(id: string): void {
    this._selectedCardId.set(id);
  }
}
