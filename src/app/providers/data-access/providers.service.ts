import { Injectable, signal, computed, inject } from '@angular/core';
import { AuthService } from '../../auth/data-access/auth.service';

export type Specialty =
  | 'All'
  | 'Internal Medicine'
  | 'Cardiology'
  | 'Dermatology'
  | 'Orthopedics'
  | 'Pediatrics'
  | 'Endocrinology'
  | 'Neurology'
  | 'OB/GYN';

export type SortBy = 'name' | 'distance' | 'rating';

export interface ProviderAvailability {
  date: string;
  slots: string[];
}

export interface Provider {
  id: string;
  firstName: string;
  lastName: string;
  specialty: Specialty;
  title: string;
  avatar: string;
  gender: 'Male' | 'Female' | 'Non-binary';
  languages: string[];
  education: string[];
  certifications: string[];
  bio: string;
  acceptingNewPatients: boolean;
  rating: number;
  reviewCount: number;
  locationName: string;
  locationAddress: string;
  distance: number;
  phone: string;
  availability: ProviderAvailability[];
  insuranceAccepted: string[];
}

export const SPECIALTIES: Specialty[] = [
  'All',
  'Internal Medicine',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Endocrinology',
  'Neurology',
  'OB/GYN'
];

// TODO: Implement backend endpoint for GET /api/v1/portal/providers (or /api/v1/portal/providers/search)

@Injectable({ providedIn: 'root' })
export class ProvidersService {
  private readonly authService = inject(AuthService);

  private readonly _providers = signal<Provider[]>([]);
  private readonly _searchQuery = signal<string>('');
  private readonly _selectedSpecialty = signal<Specialty>('All');
  private readonly _selectedProvider = signal<Provider | null>(null);
  private readonly _sortBy = signal<SortBy>('distance');
  private readonly _isLoading = signal<boolean>(false);

  readonly providers = this._providers.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedSpecialty = this._selectedSpecialty.asReadonly();
  readonly selectedProvider = this._selectedProvider.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  readonly filteredProviders = computed(() => {
    const query = this._searchQuery().toLowerCase().trim();
    const specialty = this._selectedSpecialty();
    const sort = this._sortBy();

    let result = this._providers().filter(p => {
      const matchesSpecialty = specialty === 'All' || p.specialty === specialty;
      if (!matchesSpecialty) return false;

      if (!query) return true;

      const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        p.specialty.toLowerCase().includes(query) ||
        p.locationName.toLowerCase().includes(query) ||
        p.locationAddress.toLowerCase().includes(query) ||
        p.languages.some(l => l.toLowerCase().includes(query))
      );
    });

    result = [...result].sort((a, b) => {
      if (sort === 'name') {
        return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`);
      }
      if (sort === 'distance') {
        return a.distance - b.distance;
      }
      if (sort === 'rating') {
        return b.rating - a.rating;
      }
      return 0;
    });

    return result;
  });

  /**
   * Loads provider profiles from the backend API.
   * TODO: Implement backend endpoint GET /api/v1/portal/providers
   */
  async loadProviders(): Promise<void> {
    const token = localStorage.getItem('portal_token');

    if (!token) {
      return;
    }

    this._isLoading.set(true);
    try {
      const resp = await fetch(
        `/api/v1/portal/providers`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (resp.ok) {
        const data: {
          providers: Array<{
            id: string;
            first_name: string;
            last_name: string;
            specialty: string;
            title: string;
            avatar: string;
            gender: string;
            languages: string[];
            education: string[];
            certifications: string[];
            bio: string;
            accepting_new_patients: boolean;
            rating: number;
            review_count: number;
            location_name: string;
            location_address: string;
            distance: number;
            phone: string;
            availability: Array<{ date: string; slots: string[] }>;
            insurance_accepted: string[];
          }>;
        } = await resp.json();

        const mapped: Provider[] = (data.providers ?? []).map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          specialty: (p.specialty as Specialty) || 'Internal Medicine',
          title: p.title,
          avatar: p.avatar,
          gender: (p.gender as Provider['gender']) || 'Female',
          languages: p.languages ?? [],
          education: p.education ?? [],
          certifications: p.certifications ?? [],
          bio: p.bio,
          acceptingNewPatients: p.accepting_new_patients ?? false,
          rating: p.rating ?? 0,
          reviewCount: p.review_count ?? 0,
          locationName: p.location_name,
          locationAddress: p.location_address,
          distance: p.distance ?? 0,
          phone: p.phone,
          availability: (p.availability ?? []).map(a => ({
            date: a.date,
            slots: a.slots ?? []
          })),
          insuranceAccepted: p.insurance_accepted ?? []
        }));

        this._providers.set(mapped);
      }
      // On non-OK response: leave providers as empty array
    } catch {
      // On network error: leave providers as empty array
    } finally {
      this._isLoading.set(false);
    }
  }

  setSearch(query: string): void {
    this._searchQuery.set(query);
  }

  setSpecialty(specialty: Specialty): void {
    this._selectedSpecialty.set(specialty);
  }

  setSort(sort: SortBy): void {
    this._sortBy.set(sort);
  }

  selectProvider(provider: Provider | null): void {
    this._selectedProvider.set(provider);
  }

  clearFilters(): void {
    this._searchQuery.set('');
    this._selectedSpecialty.set('All');
    this._sortBy.set('distance');
  }
}
