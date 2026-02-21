import { Injectable, signal, computed } from '@angular/core';

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

const MOCK_PROVIDERS: Provider[] = [
  {
    id: 'prov-001',
    firstName: 'Sarah',
    lastName: 'Chen',
    specialty: 'Internal Medicine',
    title: 'MD, FACP',
    avatar: 'SC',
    gender: 'Female',
    languages: ['English', 'Mandarin'],
    education: [
      'MD – Johns Hopkins University School of Medicine',
      'Residency – Massachusetts General Hospital',
      'Fellowship – Internal Medicine, UCSF'
    ],
    certifications: [
      'American Board of Internal Medicine',
      'Fellow, American College of Physicians'
    ],
    bio: 'Dr. Chen is a board-certified internist with over 14 years of experience in primary and preventive care. She focuses on a holistic, patient-centered approach to chronic disease management including hypertension, diabetes, and thyroid disorders. She is fluent in Mandarin and welcomes patients from diverse backgrounds.',
    acceptingNewPatients: true,
    rating: 4.9,
    reviewCount: 312,
    locationName: 'GoHealth Medical Center – Main Campus',
    locationAddress: '1200 Medical Plaza Dr, Suite 300, Boston, MA 02115',
    distance: 0.8,
    phone: '(617) 555-0101',
    availability: [
      { date: '2026-02-23', slots: ['9:00 AM', '10:30 AM', '2:00 PM'] },
      { date: '2026-02-24', slots: ['8:30 AM', '1:00 PM', '3:30 PM'] },
      { date: '2026-02-26', slots: ['11:00 AM', '4:00 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'United Healthcare', 'Cigna', 'Medicare']
  },
  {
    id: 'prov-002',
    firstName: 'Marcus',
    lastName: 'Williams',
    specialty: 'Cardiology',
    title: 'MD, FACC',
    avatar: 'MW',
    gender: 'Male',
    languages: ['English', 'Spanish'],
    education: [
      'MD – Columbia University College of Physicians and Surgeons',
      'Residency – Cleveland Clinic',
      'Fellowship – Interventional Cardiology, Cleveland Clinic'
    ],
    certifications: [
      'American Board of Internal Medicine – Cardiovascular Disease',
      'Fellow, American College of Cardiology',
      'Certified in Advanced Heart Failure and Transplant Cardiology'
    ],
    bio: 'Dr. Williams specializes in interventional cardiology and advanced heart failure. With 18 years of clinical experience, he has performed over 3,000 cardiac catheterizations. He is passionate about preventive cardiology and works closely with patients to reduce cardiovascular risk through lifestyle modification and evidence-based pharmacotherapy.',
    acceptingNewPatients: true,
    rating: 4.8,
    reviewCount: 241,
    locationName: 'GoHealth Heart & Vascular Institute',
    locationAddress: '880 Cardiovascular Way, Suite 500, Boston, MA 02116',
    distance: 1.4,
    phone: '(617) 555-0202',
    availability: [
      { date: '2026-02-24', slots: ['10:00 AM', '2:30 PM'] },
      { date: '2026-02-25', slots: ['9:30 AM', '11:30 AM', '3:00 PM'] },
      { date: '2026-02-27', slots: ['8:00 AM', '1:30 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'United Healthcare', 'Humana', 'Medicare', 'Medicaid']
  },
  {
    id: 'prov-003',
    firstName: 'Priya',
    lastName: 'Patel',
    specialty: 'Dermatology',
    title: 'MD, FAAD',
    avatar: 'PP',
    gender: 'Female',
    languages: ['English', 'Hindi', 'Gujarati'],
    education: [
      'MD – University of Pennsylvania Perelman School of Medicine',
      'Residency – Dermatology, NYU Langone Health',
      'Mohs Surgery Fellowship – Mayo Clinic'
    ],
    certifications: [
      'American Board of Dermatology',
      'Fellow, American Academy of Dermatology',
      'Certified Mohs Micrographic Surgeon'
    ],
    bio: 'Dr. Patel is a fellowship-trained dermatologist and Mohs surgeon specializing in skin cancer detection and treatment, medical dermatology, and cosmetic procedures. She brings expertise in treating diverse skin types and is particularly experienced in conditions affecting South Asian patients. She is trilingual and committed to culturally sensitive care.',
    acceptingNewPatients: true,
    rating: 4.7,
    reviewCount: 198,
    locationName: 'GoHealth Dermatology & Skin Care',
    locationAddress: '450 Beacon Street, Suite 210, Boston, MA 02115',
    distance: 2.1,
    phone: '(617) 555-0303',
    availability: [
      { date: '2026-02-23', slots: ['1:00 PM', '3:00 PM', '4:30 PM'] },
      { date: '2026-02-25', slots: ['9:00 AM', '10:30 AM'] },
      { date: '2026-02-27', slots: ['2:00 PM', '3:30 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'Tufts Health Plan', 'Medicare']
  },
  {
    id: 'prov-004',
    firstName: 'James',
    lastName: 'O\'Brien',
    specialty: 'Orthopedics',
    title: 'MD, FAAOS',
    avatar: 'JO',
    gender: 'Male',
    languages: ['English'],
    education: [
      'MD – Harvard Medical School',
      'Residency – Orthopedic Surgery, Hospital for Special Surgery',
      'Sports Medicine Fellowship – Andrews Sports Medicine & Orthopaedic Center'
    ],
    certifications: [
      'American Board of Orthopaedic Surgery',
      'Fellow, American Academy of Orthopaedic Surgeons',
      'Certificate of Added Qualification in Sports Medicine'
    ],
    bio: 'Dr. O\'Brien is a Harvard-trained orthopedic surgeon with expertise in sports medicine, minimally invasive joint reconstruction, and arthroscopic surgery. He serves as a team physician for collegiate athletics programs and has a special interest in ACL reconstruction and shoulder instability. He employs the latest biologics and regenerative medicine techniques.',
    acceptingNewPatients: false,
    rating: 4.9,
    reviewCount: 389,
    locationName: 'GoHealth Orthopedics & Sports Medicine',
    locationAddress: '1 Sports Medicine Blvd, Suite 600, Boston, MA 02118',
    distance: 3.2,
    phone: '(617) 555-0404',
    availability: [
      { date: '2026-03-02', slots: ['8:30 AM', '11:00 AM'] },
      { date: '2026-03-03', slots: ['2:00 PM', '4:00 PM'] },
      { date: '2026-03-05', slots: ['9:30 AM', '1:30 PM', '3:00 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'United Healthcare', 'Aetna', 'Workers Comp', 'Medicare']
  },
  {
    id: 'prov-005',
    firstName: 'Aisha',
    lastName: 'Thompson',
    specialty: 'Pediatrics',
    title: 'MD, FAAP',
    avatar: 'AT',
    gender: 'Female',
    languages: ['English', 'French'],
    education: [
      'MD – Howard University College of Medicine',
      'Residency – Pediatrics, Boston Children\'s Hospital',
      'Developmental-Behavioral Pediatrics Fellowship – Boston Children\'s Hospital'
    ],
    certifications: [
      'American Board of Pediatrics',
      'Fellow, American Academy of Pediatrics',
      'Certified in Developmental-Behavioral Pediatrics'
    ],
    bio: 'Dr. Thompson is a board-certified pediatrician and developmental specialist dedicated to the well-being of children from newborns through adolescence. She has a particular focus on developmental delays, ADHD, autism spectrum disorder, and behavioral health. She creates a warm, welcoming environment where children and families feel heard and supported.',
    acceptingNewPatients: true,
    rating: 4.8,
    reviewCount: 427,
    locationName: 'GoHealth Children\'s Clinic',
    locationAddress: '230 Pediatric Lane, Suite 100, Boston, MA 02120',
    distance: 1.9,
    phone: '(617) 555-0505',
    availability: [
      { date: '2026-02-23', slots: ['8:00 AM', '9:30 AM', '11:00 AM', '2:30 PM'] },
      { date: '2026-02-24', slots: ['10:00 AM', '1:00 PM', '4:00 PM'] },
      { date: '2026-02-26', slots: ['9:00 AM', '3:00 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'United Healthcare', 'Medicaid', 'CHIP', 'Tufts Health Plan']
  },
  {
    id: 'prov-006',
    firstName: 'David',
    lastName: 'Kim',
    specialty: 'Endocrinology',
    title: 'MD, PhD, FACE',
    avatar: 'DK',
    gender: 'Male',
    languages: ['English', 'Korean'],
    education: [
      'MD/PhD – Stanford University School of Medicine',
      'Residency – Internal Medicine, UCSF Medical Center',
      'Endocrinology Fellowship – Joslin Diabetes Center, Harvard'
    ],
    certifications: [
      'American Board of Internal Medicine – Endocrinology, Diabetes and Metabolism',
      'Fellow, American College of Endocrinology',
      'Certified Diabetes Care and Education Specialist'
    ],
    bio: 'Dr. Kim is a physician-scientist specializing in complex diabetes management, thyroid disorders, adrenal diseases, and metabolic bone disease. With a PhD in metabolic biochemistry, he bridges cutting-edge research with clinical practice. He is a leading expert in advanced insulin delivery technologies and continuous glucose monitoring systems.',
    acceptingNewPatients: true,
    rating: 4.6,
    reviewCount: 156,
    locationName: 'GoHealth Diabetes & Endocrine Center',
    locationAddress: '755 Endocrine Ave, Suite 400, Boston, MA 02115',
    distance: 2.7,
    phone: '(617) 555-0606',
    availability: [
      { date: '2026-02-25', slots: ['9:00 AM', '11:30 AM', '2:00 PM'] },
      { date: '2026-02-26', slots: ['10:30 AM', '3:30 PM'] },
      { date: '2026-03-02', slots: ['8:30 AM', '1:00 PM', '4:30 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'United Healthcare', 'Medicare', 'Humana']
  },
  {
    id: 'prov-007',
    firstName: 'Elena',
    lastName: 'Vasquez',
    specialty: 'Neurology',
    title: 'MD, FAAN',
    avatar: 'EV',
    gender: 'Female',
    languages: ['English', 'Spanish', 'Portuguese'],
    education: [
      'MD – Universidad de Chile, Faculty of Medicine',
      'Residency – Neurology, Massachusetts General Hospital',
      'Fellowship – Epilepsy and Clinical Neurophysiology, MGH/Harvard'
    ],
    certifications: [
      'American Board of Psychiatry and Neurology',
      'Fellow, American Academy of Neurology',
      'Certified in Epilepsy (NAEC)'
    ],
    bio: 'Dr. Vasquez is a trilingual neurologist with specialized expertise in epilepsy, headache disorders, and neuroinflammatory conditions including multiple sclerosis. She has led clinical trials investigating novel anti-seizure medications and believes strongly in shared decision-making with patients and their families. Her diverse linguistic background enables her to serve the broader Boston community.',
    acceptingNewPatients: true,
    rating: 4.7,
    reviewCount: 203,
    locationName: 'GoHealth Neuroscience Institute',
    locationAddress: '320 Brain Health Blvd, Suite 800, Boston, MA 02114',
    distance: 4.1,
    phone: '(617) 555-0707',
    availability: [
      { date: '2026-02-24', slots: ['1:30 PM', '4:00 PM'] },
      { date: '2026-02-27', slots: ['9:00 AM', '10:30 AM', '2:30 PM'] },
      { date: '2026-03-02', slots: ['11:00 AM', '3:00 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'United Healthcare', 'Tufts Health Plan', 'Medicare', 'Medicaid']
  },
  {
    id: 'prov-008',
    firstName: 'Rachel',
    lastName: 'Goldberg',
    specialty: 'OB/GYN',
    title: 'MD, FACOG',
    avatar: 'RG',
    gender: 'Female',
    languages: ['English', 'Hebrew'],
    education: [
      'MD – Yale School of Medicine',
      'Residency – Obstetrics and Gynecology, Brigham and Women\'s Hospital',
      'Minimally Invasive Gynecologic Surgery Fellowship – Brigham and Women\'s Hospital'
    ],
    certifications: [
      'American Board of Obstetrics and Gynecology',
      'Fellow, American College of Obstetricians and Gynecologists',
      'Da Vinci Robotic Surgery Certified'
    ],
    bio: 'Dr. Goldberg is a Yale-trained OB/GYN with expertise in high-risk obstetrics, minimally invasive gynecologic surgery, and comprehensive women\'s health. She is proficient in robotic-assisted laparoscopic surgery for conditions such as endometriosis, fibroids, and pelvic floor disorders. She is committed to compassionate, evidence-based care throughout all stages of a woman\'s life.',
    acceptingNewPatients: true,
    rating: 4.9,
    reviewCount: 344,
    locationName: 'GoHealth Women\'s Health Center',
    locationAddress: '610 Women\'s Way, Suite 250, Boston, MA 02115',
    distance: 1.2,
    phone: '(617) 555-0808',
    availability: [
      { date: '2026-02-23', slots: ['10:00 AM', '11:30 AM', '3:00 PM'] },
      { date: '2026-02-25', slots: ['8:30 AM', '2:00 PM', '4:30 PM'] },
      { date: '2026-02-26', slots: ['9:30 AM', '1:00 PM'] }
    ],
    insuranceAccepted: ['Blue Cross Blue Shield', 'Aetna', 'Cigna', 'United Healthcare', 'Tufts Health Plan', 'Medicare']
  }
];

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

@Injectable({ providedIn: 'root' })
export class ProvidersService {
  private readonly _providers = signal<Provider[]>(MOCK_PROVIDERS);
  private readonly _searchQuery = signal<string>('');
  private readonly _selectedSpecialty = signal<Specialty>('All');
  private readonly _selectedProvider = signal<Provider | null>(null);
  private readonly _sortBy = signal<SortBy>('distance');

  readonly providers = this._providers.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedSpecialty = this._selectedSpecialty.asReadonly();
  readonly selectedProvider = this._selectedProvider.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();

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
