import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface HealthProgram {
  id: number;
  name: string;
  icon: string;
  description: string;
  eligibility: string;
  mbs: string;
  color: string;
}

interface LocalService {
  id: number;
  name: string;
  area: string;
  phone: string;
  services: string[];
}

@Component({
  selector: 'app-first-nations-health',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ButtonModule, TagModule, DividerModule, ToastModule],
  providers: [MessageService],
  template: `
    <div class="first-nations-page">
      <p-toast></p-toast>

      <!-- Acknowledgment of Country -->
      <div class="acknowledgment-banner">
        <div class="ack-icon">
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="20" cy="20" r="18" fill="#8B4513" stroke="#5D2E0C" stroke-width="2"/>
            <circle cx="20" cy="20" r="10" fill="#D2691E"/>
            <circle cx="20" cy="20" r="4" fill="#8B4513"/>
          </svg>
        </div>
        <div class="ack-text">
          <strong>Acknowledgment of Country</strong>
          <p>
            AuraHealth acknowledges the Traditional Custodians of the land on which we operate and
            provide care. We pay our respects to Aboriginal and Torres Strait Islander Elders past,
            present, and emerging. We acknowledge that sovereignty was never ceded and that these
            lands always were and always will be Aboriginal and Torres Strait Islander land.
          </p>
        </div>
      </div>

      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-heart-fill"></i>
          </div>
          <div>
            <h1>First Nations Health</h1>
            <p>Culturally safe health programs and services for Aboriginal and Torres Strait Islander peoples</p>
          </div>
        </div>
      </header>

      <!-- Welcome Message -->
      <p-card styleClass="welcome-card">
        <div class="welcome-content">
          <p class="welcome-text">
            Welcome to the First Nations Health section of AuraHealth. This space is designed with
            respect for Aboriginal and Torres Strait Islander cultures, knowledge systems, and
            approaches to health and wellbeing. We recognise that health for First Nations peoples
            encompasses physical, social, emotional, spiritual, and cultural wellbeing — for the
            individual, family, and community.
          </p>
          <div class="yarn-action">
            <button
              pButton
              label="Yarn with a Health Worker"
              icon="pi pi-comments"
              class="p-button-primary yarn-btn"
              (click)="yarnWithHealthWorker()"
            ></button>
            <span class="yarn-desc">Book a culturally safe conversation with an Aboriginal Health Worker</span>
          </div>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Health Programs -->
      <h2 class="section-title">First Nations Health Programs</h2>
      <div class="programs-grid">
        @for (program of healthPrograms(); track program.id) {
          <div class="program-card" [style.border-top-color]="program.color">
            <div class="program-icon" [style.background]="program.color + '20'">
              <i [class]="'pi ' + program.icon" [style.color]="program.color"></i>
            </div>
            <h3 class="program-name">{{ program.name }}</h3>
            <p class="program-desc">{{ program.description }}</p>
            <div class="program-eligibility">
              <strong>Eligibility:</strong>
              <span>{{ program.eligibility }}</span>
            </div>
            <div class="program-mbs">
              <strong>MBS Item:</strong>
              <span class="mbs-item">{{ program.mbs }}</span>
            </div>
            <div class="program-actions">
              <button pButton label="Learn More" icon="pi pi-info-circle" class="p-button-outlined p-button-sm" (click)="learnMore(program)"></button>
              <button pButton label="Book Assessment" icon="pi pi-calendar-plus" class="p-button-text p-button-sm" (click)="bookAssessment(program)"></button>
            </div>
          </div>
        }
      </div>

      <p-divider></p-divider>

      <!-- Local Health Services -->
      <p-card header="Aboriginal Community Controlled Health Services" styleClass="services-card">
        <p class="services-intro">
          Aboriginal Community Controlled Health Services (ACCHS) are primary health care services
          initiated and operated by Aboriginal communities to deliver holistic and culturally
          appropriate health care.
        </p>
        <div class="services-list">
          @for (service of localServices(); track service.id) {
            <div class="service-item">
              <div class="service-icon">
                <i class="pi pi-building"></i>
              </div>
              <div class="service-info">
                <span class="service-name">{{ service.name }}</span>
                <div class="service-area">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ service.area }}</span>
                </div>
                <div class="service-tags">
                  @for (svc of service.services; track svc) {
                    <span class="service-tag">{{ svc }}</span>
                  }
                </div>
              </div>
              <div class="service-contact">
                <span class="service-phone">{{ service.phone }}</span>
                <button pButton label="Contact" icon="pi pi-phone" class="p-button-outlined p-button-sm"></button>
              </div>
            </div>
          }
        </div>
        <div class="services-note">
          <i class="pi pi-info-circle"></i>
          <span>Find more ACCHS services via the <strong>National Aboriginal Community Controlled Health Organisation (NACCHO)</strong> directory.</span>
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Social and Emotional Wellbeing Note -->
      <div class="sewb-banner">
        <div class="sewb-icon">
          <i class="pi pi-heart"></i>
        </div>
        <div class="sewb-content">
          <strong>Social and Emotional Wellbeing Support</strong>
          <p>
            If you are experiencing emotional distress and need to talk to someone, please reach out
            to the <strong>13YARN crisis support line (13 92 76)</strong> — a national crisis line
            staffed by Aboriginal and Torres Strait Islander people 24 hours a day, 7 days a week.
          </p>
          <button pButton label="Call 13YARN" icon="pi pi-phone" class="p-button-outlined p-button-sm sewb-btn"></button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .first-nations-page { max-width: 1000px; margin: 0 auto; }
    .acknowledgment-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: linear-gradient(135deg, #4a2c0a 0%, #6b3a1f 100%); color: #f5e6d3; border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .ack-icon { flex-shrink: 0; margin-top: 0.25rem; }
    .ack-text strong { display: block; margin-bottom: 0.4rem; font-size: 1rem; }
    .ack-text p { margin: 0; font-size: 0.875rem; line-height: 1.65; opacity: 0.9; }
    .page-header { margin-bottom: 1.5rem; }
    .header-content { display: flex; align-items: center; gap: 1rem; }
    .header-icon { width: 52px; height: 52px; background: #fff3e0; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .header-icon i { font-size: 1.5rem; color: #e65100; }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.2rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; }
    .welcome-card { margin-bottom: 0; }
    .welcome-content { display: flex; flex-direction: column; gap: 1rem; }
    .welcome-text { margin: 0; font-size: 0.9rem; line-height: 1.65; color: var(--text-color); }
    .yarn-action { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .yarn-btn { background: #8B4513 !important; border-color: #8B4513 !important; }
    .yarn-btn:hover { background: #5D2E0C !important; border-color: #5D2E0C !important; }
    .yarn-desc { font-size: 0.85rem; color: var(--text-color-secondary); }
    .section-title { margin: 0 0 1rem; font-size: 1.15rem; font-weight: 600; }
    .programs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .program-card { padding: 1.25rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-top: 4px solid; border-radius: var(--border-radius); display: flex; flex-direction: column; gap: 0.6rem; }
    .program-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .program-icon i { font-size: 1.3rem; }
    .program-name { margin: 0; font-size: 0.95rem; font-weight: 600; }
    .program-desc { margin: 0; font-size: 0.85rem; line-height: 1.55; color: var(--text-color-secondary); flex: 1; }
    .program-eligibility, .program-mbs { font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.1rem; }
    .program-eligibility strong, .program-mbs strong { color: var(--text-color); }
    .program-eligibility span, .program-mbs span { color: var(--text-color-secondary); }
    .mbs-item { font-family: monospace; font-weight: 600; }
    .program-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .services-intro { margin: 0 0 1rem; font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.55; }
    .services-list { display: flex; flex-direction: column; gap: 0.875rem; }
    .service-item { display: flex; align-items: flex-start; gap: 1rem; padding: 0.875rem 1rem; background: var(--surface-ground); border: 1px solid var(--surface-border); border-radius: var(--border-radius); }
    .service-icon { width: 42px; height: 42px; background: #fff3e0; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .service-icon i { color: #e65100; font-size: 1.1rem; }
    .service-info { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
    .service-name { font-weight: 600; font-size: 0.9rem; }
    .service-area { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: var(--text-color-secondary); }
    .service-area i { font-size: 0.72rem; }
    .service-tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .service-tag { font-size: 0.72rem; background: #fff3e0; color: #bf360c; border: 1px solid #ffccbc; padding: 0.1rem 0.45rem; border-radius: 12px; }
    .service-contact { display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; flex-shrink: 0; }
    .service-phone { font-size: 0.8rem; color: var(--text-color-secondary); }
    .services-note { display: flex; align-items: center; gap: 0.5rem; margin-top: 1rem; font-size: 0.82rem; color: var(--text-color-secondary); }
    .services-note i { color: var(--primary-400); }
    .sewb-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: linear-gradient(135deg, #1a237e 0%, #283593 100%); color: white; border-radius: var(--border-radius); }
    .sewb-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .sewb-icon i { font-size: 1.4rem; }
    .sewb-content { flex: 1; }
    .sewb-content strong { display: block; margin-bottom: 0.5rem; font-size: 1rem; }
    .sewb-content p { margin: 0 0 0.875rem; font-size: 0.875rem; line-height: 1.6; opacity: 0.9; }
    .sewb-btn { border-color: rgba(255,255,255,0.5) !important; color: white !important; }
    @media (max-width: 640px) {
      .programs-grid { grid-template-columns: 1fr; }
      .service-item { flex-direction: column; }
      .service-contact { align-items: flex-start; }
      .acknowledgment-banner { flex-direction: column; }
      .yarn-action { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class FirstNationsHealthComponent {
  private readonly messageService: MessageService;

  constructor(messageService: MessageService) {
    this.messageService = messageService;
  }

  readonly healthPrograms = signal<HealthProgram[]>([
    {
      id: 1,
      name: 'Closing the Gap — Health Checks',
      icon: 'pi-heart-fill',
      description: 'Comprehensive annual health checks for Aboriginal and Torres Strait Islander people to address health inequity and prevent chronic disease.',
      eligibility: 'All Aboriginal and Torres Strait Islander people (any age)',
      mbs: '715 — Annual Health Assessment',
      color: '#e65100'
    },
    {
      id: 2,
      name: 'Social and Emotional Wellbeing',
      icon: 'pi-comments',
      description: 'Culturally safe mental health, trauma, and social and emotional wellbeing support integrating Indigenous healing practices.',
      eligibility: 'All Aboriginal and Torres Strait Islander people',
      mbs: '92004 / 92005 — SEWB Assessment',
      color: '#1565c0'
    },
    {
      id: 3,
      name: 'Indigenous Health Assessments',
      icon: 'pi-clipboard',
      description: 'Free comprehensive health assessments including chronic disease management, preventive health checks, and follow-up care plans.',
      eligibility: 'Aboriginal and Torres Strait Islander people aged 55+',
      mbs: '228 — Indigenous Health Assessment',
      color: '#2e7d32'
    }
  ]);

  readonly localServices = signal<LocalService[]>([
    {
      id: 1,
      name: 'Aboriginal Medical Service Redfern',
      area: 'Redfern, Sydney NSW',
      phone: '(02) 9319 5823',
      services: ['GP', 'Dental', 'Mental Health', 'Drug & Alcohol']
    },
    {
      id: 2,
      name: 'Awabakal Aboriginal Medical Service',
      area: 'Hamilton, Newcastle NSW',
      phone: '(02) 4961 5566',
      services: ['GP', 'Maternal Health', 'SEWB', 'Chronic Disease']
    },
    {
      id: 3,
      name: 'Murri Watch Health Clinic',
      area: 'Fortitude Valley, Brisbane QLD',
      phone: '(07) 3252 9095',
      services: ['GP', 'Allied Health', 'Children\'s Health', 'Eye Care']
    }
  ]);

  yarnWithHealthWorker(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Booking Request',
      detail: 'We are connecting you with an Aboriginal Health Worker for a culturally safe consultation.'
    });
  }

  learnMore(program: HealthProgram): void {
    this.messageService.add({
      severity: 'info',
      summary: program.name,
      detail: `MBS Item ${program.mbs}. Speak to your GP or an Aboriginal Health Worker to access this program.`
    });
  }

  bookAssessment(program: HealthProgram): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Assessment Booking',
      detail: `Booking initiated for ${program.name}. Your care team will confirm your appointment.`
    });
  }
}
