import { Injectable, signal, computed } from '@angular/core';

export type CountryCode = 'US' | 'IN' | 'RO' | 'AU';

export interface CountryFeatureFlags {
  abhaHealthId: boolean;
  janAushadhiLocator: boolean;
  desIntegration: boolean;
  digitalQueue: boolean;
  trilingualInterface: boolean;
  myHealthRecord: boolean;
  bulkBillingLocator: boolean;
  openNotes: boolean;
  fhirExport: boolean;
}

@Injectable({ providedIn: 'root' })
export class CountryFeaturesService {
  private _country = signal<CountryCode>('US');
  readonly country = this._country.asReadonly();

  readonly features = computed<CountryFeatureFlags>(() => {
    const c = this._country();
    return {
      abhaHealthId: c === 'IN',
      janAushadhiLocator: c === 'IN',
      desIntegration: c === 'RO',
      digitalQueue: c === 'RO',
      trilingualInterface: c === 'RO',
      myHealthRecord: c === 'AU',
      bulkBillingLocator: c === 'AU',
      openNotes: c === 'US',
      fhirExport: true,
    };
  });

  setCountry(code: CountryCode): void {
    this._country.set(code);
  }
}
