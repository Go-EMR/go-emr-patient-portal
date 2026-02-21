import { Injectable, signal, computed } from '@angular/core';

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

const MOCK_CARDS: InsuranceCard[] = [
  {
    id: 'medical-001',
    type: 'medical',
    carrier: 'Blue Cross Blue Shield',
    planName: 'BlueCare PPO Select',
    memberId: 'XBC123456789',
    groupNumber: 'GRP-88412',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    copay: {
      primaryCare: 20,
      specialist: 45,
      urgentCare: 75,
      emergency: 250
    },
    deductible: {
      individual: 1500,
      family: 3000,
      met: 620
    },
    outOfPocketMax: {
      individual: 5000,
      family: 10000,
      met: 1240
    },
    subscriberName: 'Alex Johnson',
    dependents: ['Morgan Johnson', 'Riley Johnson'],
    rxBin: '610014',
    rxPcn: 'BCBSMA',
    rxGroup: 'RX7841',
    isFlipped: false,
    phone: '1-800-262-2583',
    providerPhone: '1-800-810-2583'
  },
  {
    id: 'dental-001',
    type: 'dental',
    carrier: 'Delta Dental',
    planName: 'DeltaCare Premier',
    memberId: 'DD987654321',
    groupNumber: 'GRP-22190',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    copay: {
      primaryCare: 0,
      specialist: 20,
      urgentCare: 20,
      emergency: 50
    },
    deductible: {
      individual: 50,
      family: 150,
      met: 50
    },
    outOfPocketMax: {
      individual: 1500,
      family: 4500,
      met: 380
    },
    subscriberName: 'Alex Johnson',
    dependents: ['Morgan Johnson', 'Riley Johnson'],
    rxBin: '',
    rxPcn: '',
    rxGroup: '',
    isFlipped: false,
    phone: '1-800-932-0783',
    providerPhone: '1-888-335-8227'
  },
  {
    id: 'vision-001',
    type: 'vision',
    carrier: 'VSP Vision Care',
    planName: 'VSP Choice Plan',
    memberId: 'VSP456789012',
    groupNumber: 'GRP-55034',
    effectiveDate: '2026-01-01',
    expirationDate: '2026-12-31',
    copay: {
      primaryCare: 10,
      specialist: 10,
      urgentCare: 10,
      emergency: 10
    },
    deductible: {
      individual: 0,
      family: 0,
      met: 0
    },
    outOfPocketMax: {
      individual: 500,
      family: 1000,
      met: 130
    },
    subscriberName: 'Alex Johnson',
    dependents: ['Morgan Johnson', 'Riley Johnson'],
    rxBin: '',
    rxPcn: '',
    rxGroup: '',
    isFlipped: false,
    phone: '1-800-877-7195',
    providerPhone: '1-800-877-7195'
  }
];

const MOCK_BENEFIT_USAGE: BenefitUsage[] = [
  { category: 'Office Visits', used: 4, total: 20, unit: 'visits' },
  { category: 'Lab Work', used: 2, total: 10, unit: 'claims' },
  { category: 'Prescriptions', used: 18, total: 60, unit: 'fills' },
  { category: 'Physical Therapy', used: 6, total: 30, unit: 'sessions' },
  { category: 'Mental Health', used: 3, total: 26, unit: 'sessions' }
];

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private readonly _cards = signal<InsuranceCard[]>(MOCK_CARDS);
  private readonly _selectedCardId = signal<string>(MOCK_CARDS[0].id);
  private readonly _benefitUsage = signal<BenefitUsage[]>(MOCK_BENEFIT_USAGE);

  readonly cards = this._cards.asReadonly();
  readonly selectedCardId = this._selectedCardId.asReadonly();
  readonly benefitUsage = this._benefitUsage.asReadonly();

  readonly selectedCard = computed(() =>
    this._cards().find(c => c.id === this._selectedCardId()) ?? this._cards()[0]
  );

  readonly activeCards = computed(() =>
    this._cards().filter(c => {
      const exp = new Date(c.expirationDate);
      return exp >= new Date();
    })
  );

  flipCard(id: string): void {
    this._cards.update(cards =>
      cards.map(c => c.id === id ? { ...c, isFlipped: !c.isFlipped } : c)
    );
  }

  selectCard(id: string): void {
    this._selectedCardId.set(id);
  }
}
