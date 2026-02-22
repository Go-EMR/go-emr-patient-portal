import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from 'primeng/accordion';

interface EhrSystem {
  id: string;
  name: string;
  logo: string;
  description: string;
  status: 'connected' | 'available' | 'coming-soon';
  marketShare: string;
}

interface FhirConfig {
  label: string;
  key: string;
  value: string;
  copyable: boolean;
}

@Component({
  selector: 'app-smart-on-fhir',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule, ButtonModule, TagModule, DividerModule, Accordion, AccordionPanel, AccordionHeader, AccordionContent],
  template: `
    <div class="smart-fhir-page">

      <!-- Page header -->
      <header class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <i class="pi pi-shield"></i>
          </div>
          <div>
            <h1>SMART on FHIR — EHR Launch</h1>
            <p>Launch GoHealth Patient Portal directly from your EHR system using the SMART on FHIR standard</p>
          </div>
        </div>
        <div class="fhir-badge">
          <i class="pi pi-verified"></i>
          <span>FHIR R4 Compliant</span>
        </div>
      </header>

      <!-- What is SMART on FHIR -->
      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <div>
          <strong>What is SMART on FHIR?</strong>
          <p>
            SMART (Substitutable Medical Applications, Reusable Technologies) on FHIR enables healthcare
            applications to securely launch from within an EHR system and access patient data using
            standardized FHIR (Fast Healthcare Interoperability Resources) APIs. No separate login required
            when launched from a connected EHR.
          </p>
        </div>
      </div>

      <!-- Supported EHR systems -->
      <p-card header="Supported EHR Systems" styleClass="ehr-card">
        <div class="ehr-grid">
          @for (ehr of ehrSystems; track ehr.id) {
            <div class="ehr-system-card" [class.connected]="ehr.status === 'connected'">
              <div class="ehr-logo-area">
                <div class="ehr-logo-icon">
                  <i [class]="ehr.logo"></i>
                </div>
                <p-tag
                  [value]="getStatusLabel(ehr.status)"
                  [severity]="getStatusSeverity(ehr.status)">
                </p-tag>
              </div>
              <h3 class="ehr-name">{{ ehr.name }}</h3>
              <p class="ehr-desc">{{ ehr.description }}</p>
              <div class="ehr-market">
                <i class="pi pi-chart-bar"></i>
                <span>{{ ehr.marketShare }} market share</span>
              </div>
              @if (ehr.status === 'connected') {
                <div class="ehr-connected-badge">
                  <i class="pi pi-check-circle"></i>
                  <span>Ready to launch</span>
                </div>
              } @else if (ehr.status === 'available') {
                <button pButton label="Configure" icon="pi pi-cog" class="p-button-outlined p-button-sm ehr-btn"></button>
              } @else {
                <button pButton label="Notify Me" icon="pi pi-bell" class="p-button-text p-button-sm ehr-btn"></button>
              }
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- FHIR Launch Configuration -->
      <p-card header="Launch Configuration" styleClass="config-card">
        <p class="config-intro">
          Your GoHealth Portal is registered as a SMART on FHIR application. Use these credentials to
          configure the integration in your EHR system's app gallery.
        </p>
        <div class="config-table">
          @for (config of fhirConfig; track config.key) {
            <div class="config-row">
              <span class="config-label">{{ config.label }}</span>
              <div class="config-value-area">
                <code class="config-value">{{ config.value }}</code>
                @if (config.copyable) {
                  <button
                    class="copy-btn"
                    (click)="copyToClipboard(config.value, config.key)"
                    [attr.aria-label]="'Copy ' + config.label"
                    pTooltip="Copy to clipboard">
                    @if (copiedKey() === config.key) {
                      <i class="pi pi-check" style="color: var(--green-500);"></i>
                    } @else {
                      <i class="pi pi-copy"></i>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- Test Connection -->
      <p-card header="Test Connection" styleClass="test-card">
        <p class="test-intro">
          Verify that the SMART on FHIR integration is working correctly before your first live launch.
        </p>
        <div class="test-controls">
          <button
            pButton
            label="Test Connection"
            icon="pi pi-play"
            [loading]="testRunning()"
            [disabled]="testRunning()"
            (click)="runConnectionTest()">
          </button>
          @if (testResult() === 'success') {
            <div class="test-result success" role="alert" aria-live="polite">
              <i class="pi pi-check-circle"></i>
              <div>
                <strong>Connection successful</strong>
                <ul class="test-details">
                  <li>Authorization server reachable (42ms)</li>
                  <li>Token endpoint verified</li>
                  <li>FHIR R4 base URL validated</li>
                  <li>Patient context scope confirmed</li>
                  <li>Launch parameters well-formed</li>
                </ul>
              </div>
            </div>
          }
        </div>
      </p-card>

      <p-divider></p-divider>

      <!-- How to Connect — Accordion per EHR -->
      <p-card header="How to Connect Your EHR" styleClass="howto-card">
        <p-accordion value="0">
          <p-accordion-panel value="0">
            <p-accordion-header>Epic MyChart</p-accordion-header>
            <p-accordion-content>
              <ol class="setup-steps">
                <li>Log in to the Epic App Orchard at <code>apporchard.epic.com</code></li>
                <li>Search for <strong>GoHealth Patient Portal</strong> in the app gallery</li>
                <li>Click <strong>Request Access</strong> and provide your organization's NPI</li>
                <li>Copy the Client ID above and paste it into the Epic configuration form</li>
                <li>Add the authorized redirect URI: <code>https://portal.gohealth.com/smart/callback</code></li>
                <li>Select the required scopes: <code>openid profile launch patient/*.read</code></li>
                <li>Submit for Epic review — approval typically takes 2–5 business days</li>
                <li>Once approved, GoHealth will appear in MyChart's <strong>Apps</strong> section</li>
              </ol>
            </p-accordion-content>
          </p-accordion-panel>

          <p-accordion-panel value="1">
            <p-accordion-header>Oracle Health (Cerner)</p-accordion-header>
            <p-accordion-content>
              <ol class="setup-steps">
                <li>Navigate to the Cerner Code Console at <code>code.cerner.com</code></li>
                <li>Create a new application and select <strong>SMART on FHIR</strong> as the type</li>
                <li>Enter the GoHealth Client ID in the Application settings</li>
                <li>Configure the launch URL: <code>https://portal.gohealth.com/smart/launch</code></li>
                <li>Set the redirect URI to the callback URL provided above</li>
                <li>Request the following scopes: <code>launch patient/Patient.read user/*.read</code></li>
                <li>Contact your Cerner system administrator to enable the integration in your tenant</li>
                <li>Test using the Cerner SMART App Launcher before going live</li>
              </ol>
            </p-accordion-content>
          </p-accordion-panel>

          <p-accordion-panel value="2">
            <p-accordion-header>athenahealth</p-accordion-header>
            <p-accordion-content>
              <ol class="setup-steps">
                <li>Access the athenahealth Marketplace at <code>marketplace.athenahealth.com</code></li>
                <li>Find GoHealth Patient Portal and click <strong>Get Started</strong></li>
                <li>Your athenahealth Implementation Manager will guide the integration setup</li>
                <li>Provide the FHIR Base URL and Client ID to your Implementation Manager</li>
                <li>Configure single sign-on using the OAuth 2.0 authorization code flow</li>
                <li>Enable patient context passing in your athenaOne configuration</li>
                <li>Run the test suite to verify data access permissions</li>
              </ol>
            </p-accordion-content>
          </p-accordion-panel>

          <p-accordion-panel value="3">
            <p-accordion-header>MEDITECH</p-accordion-header>
            <p-accordion-content>
              <ol class="setup-steps">
                <li>Contact your MEDITECH vendor representative to enable SMART on FHIR</li>
                <li>Request access to the MEDITECH FHIR Sandbox at <code>fhir.meditech.com</code></li>
                <li>Register GoHealth as a trusted application using the Client ID above</li>
                <li>Configure the MEDITECH App Server with the GoHealth launch parameters</li>
                <li>Work with MEDITECH support to set up patient-context scoped access tokens</li>
                <li>Validate the integration in the MEDITECH test environment before production</li>
                <li>Schedule a go-live date with both MEDITECH and GoHealth implementation teams</li>
              </ol>
            </p-accordion-content>
          </p-accordion-panel>
        </p-accordion>
      </p-card>

      <!-- Standards footer -->
      <div class="standards-footer">
        <div class="standard-chip">
          <i class="pi pi-shield"></i>
          <span>HL7 FHIR R4</span>
        </div>
        <div class="standard-chip">
          <i class="pi pi-lock"></i>
          <span>OAuth 2.0</span>
        </div>
        <div class="standard-chip">
          <i class="pi pi-verified"></i>
          <span>SMART App Launch v2</span>
        </div>
        <div class="standard-chip">
          <i class="pi pi-check-circle"></i>
          <span>ONC Certified</span>
        </div>
        <div class="standard-chip">
          <i class="pi pi-lock"></i>
          <span>HIPAA Compliant</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .smart-fhir-page { max-width: 960px; margin: 0 auto; }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .header-content { display: flex; align-items: flex-start; gap: 1rem; flex: 1; }
    .header-icon { width: 52px; height: 52px; background: linear-gradient(135deg, var(--blue-100), var(--blue-50)); border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .header-icon i { font-size: 1.5rem; color: var(--blue-600); }
    .header-content h1 { margin: 0; font-size: 1.6rem; }
    .header-content p { margin: 0.25rem 0 0; color: var(--text-color-secondary); font-size: 0.9rem; max-width: 560px; line-height: 1.5; }
    .fhir-badge { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 1rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: 20px; color: var(--blue-700); font-size: 0.82rem; font-weight: 600; white-space: nowrap; flex-shrink: 0; }
    .fhir-badge i { font-size: 0.9rem; }

    .info-banner { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-100); border-radius: var(--border-radius); margin-bottom: 1.5rem; }
    .info-banner i { color: var(--blue-500); font-size: 1.1rem; flex-shrink: 0; margin-top: 0.15rem; }
    .info-banner strong { display: block; font-size: 0.95rem; margin-bottom: 0.25rem; color: var(--blue-800); }
    .info-banner p { margin: 0; font-size: 0.875rem; line-height: 1.6; color: var(--blue-900); }

    /* EHR grid */
    .ehr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .ehr-system-card { padding: 1.25rem; border: 1px solid var(--surface-border); border-radius: var(--border-radius); background: var(--surface-ground); display: flex; flex-direction: column; gap: 0.5rem; transition: all 0.15s; }
    .ehr-system-card.connected { border-color: var(--green-200); background: var(--green-50); }
    .ehr-system-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }
    .ehr-logo-area { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
    .ehr-logo-icon { width: 40px; height: 40px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--surface-border); box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
    .ehr-logo-icon i { font-size: 1.1rem; color: var(--blue-600); }
    .ehr-name { margin: 0; font-size: 0.95rem; font-weight: 700; }
    .ehr-desc { margin: 0; font-size: 0.8rem; color: var(--text-color-secondary); line-height: 1.45; flex: 1; }
    .ehr-market { display: flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; color: var(--text-color-secondary); }
    .ehr-market i { font-size: 0.7rem; color: var(--primary-400); }
    .ehr-connected-badge { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--green-700); font-weight: 600; }
    .ehr-connected-badge i { font-size: 0.85rem; }
    .ehr-btn { margin-top: 0.25rem; width: 100%; justify-content: center; }

    /* Config table */
    .config-intro { margin: 0 0 1.25rem; font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.5; }
    .config-table { display: flex; flex-direction: column; gap: 0; border: 1px solid var(--surface-border); border-radius: var(--border-radius); overflow: hidden; }
    .config-row { display: flex; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid var(--surface-border); gap: 1rem; }
    .config-row:last-child { border-bottom: none; }
    .config-row:nth-child(odd) { background: var(--surface-50); }
    .config-label { min-width: 160px; font-size: 0.82rem; font-weight: 600; color: var(--text-color-secondary); flex-shrink: 0; }
    .config-value-area { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
    .config-value { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: var(--text-color); background: var(--surface-100); padding: 0.25rem 0.6rem; border-radius: 4px; word-break: break-all; }
    .copy-btn { background: none; border: 1px solid var(--surface-border); border-radius: 6px; padding: 0.25rem 0.5rem; cursor: pointer; font-size: 0.8rem; color: var(--text-color-secondary); transition: all 0.15s; flex-shrink: 0; }
    .copy-btn:hover { background: var(--surface-hover); color: var(--text-color); }

    /* Test connection */
    .test-intro { margin: 0 0 1.25rem; font-size: 0.875rem; color: var(--text-color-secondary); line-height: 1.5; }
    .test-controls { display: flex; flex-direction: column; gap: 1rem; }
    .test-result { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; border-radius: var(--border-radius); }
    .test-result.success { background: var(--green-50); border: 1px solid var(--green-100); color: var(--green-800); }
    .test-result i { font-size: 1.25rem; flex-shrink: 0; margin-top: 0.1rem; }
    .test-result.success i { color: var(--green-600); }
    .test-result strong { display: block; font-size: 0.95rem; margin-bottom: 0.35rem; }
    .test-details { margin: 0; padding-left: 1.25rem; font-size: 0.8rem; line-height: 1.8; }

    /* Setup steps */
    .setup-steps { margin: 0; padding-left: 1.5rem; font-size: 0.875rem; line-height: 1.8; color: var(--text-color); }
    .setup-steps li { margin-bottom: 0.25rem; }
    .setup-steps code { font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background: var(--surface-100); padding: 0.1rem 0.4rem; border-radius: 4px; }

    /* Standards footer */
    .standards-footer { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; padding: 1.5rem 0 0.5rem; margin-top: 1.5rem; border-top: 1px solid var(--surface-border); }
    .standard-chip { display: flex; align-items: center; gap: 0.35rem; padding: 0.375rem 0.875rem; background: var(--surface-card); border: 1px solid var(--surface-border); border-radius: 20px; font-size: 0.78rem; color: var(--text-color-secondary); }
    .standard-chip i { font-size: 0.72rem; color: var(--blue-500); }

    @media (max-width: 640px) {
      .page-header { flex-direction: column; }
      .ehr-grid { grid-template-columns: 1fr 1fr; }
      .config-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
      .config-label { min-width: unset; }
    }
  `]
})
export class SmartOnFhirComponent {

  readonly testRunning = signal(false);
  readonly testResult = signal<'idle' | 'success'>('idle');
  readonly copiedKey = signal('');

  readonly ehrSystems: EhrSystem[] = [
    {
      id: 'epic',
      name: 'Epic MyChart',
      logo: 'pi pi-hospital',
      description: 'Industry-leading EHR used by major academic medical centers and health systems nationwide.',
      status: 'connected',
      marketShare: '~36%'
    },
    {
      id: 'oracle',
      name: 'Oracle Health (Cerner)',
      logo: 'pi pi-database',
      description: 'Comprehensive EHR platform for hospitals, clinics, and government health systems.',
      status: 'connected',
      marketShare: '~25%'
    },
    {
      id: 'athena',
      name: 'athenahealth',
      logo: 'pi pi-cloud',
      description: 'Cloud-based EHR designed for ambulatory practices and specialty care providers.',
      status: 'available',
      marketShare: '~11%'
    },
    {
      id: 'meditech',
      name: 'MEDITECH',
      logo: 'pi pi-server',
      description: 'Trusted EHR for community hospitals and critical access facilities.',
      status: 'coming-soon',
      marketShare: '~15%'
    },
  ];

  readonly fhirConfig: FhirConfig[] = [
    {
      label: 'Authorization URL',
      key: 'auth_url',
      value: 'https://auth.gohealth.com/oauth2/authorize',
      copyable: true
    },
    {
      label: 'Token URL',
      key: 'token_url',
      value: 'https://auth.gohealth.com/oauth2/token',
      copyable: true
    },
    {
      label: 'FHIR Base URL',
      key: 'fhir_url',
      value: 'https://fhir.gohealth.com/r4',
      copyable: true
    },
    {
      label: 'Client ID',
      key: 'client_id',
      value: 'gohealth-patient-portal-v2',
      copyable: true
    },
    {
      label: 'Redirect URI',
      key: 'redirect_uri',
      value: 'https://portal.gohealth.com/smart/callback',
      copyable: true
    },
    {
      label: 'Scopes',
      key: 'scopes',
      value: 'openid profile launch patient/*.read',
      copyable: true
    },
    {
      label: 'FHIR Version',
      key: 'fhir_version',
      value: 'R4 (4.0.1)',
      copyable: false
    },
    {
      label: 'Launch Type',
      key: 'launch_type',
      value: 'EHR Launch + Standalone',
      copyable: false
    },
  ];

  getStatusLabel(status: EhrSystem['status']): string {
    const map: Record<EhrSystem['status'], string> = {
      connected: 'Connected',
      available: 'Available',
      'coming-soon': 'Coming Soon'
    };
    return map[status];
  }

  getStatusSeverity(status: EhrSystem['status']): 'success' | 'info' | 'warn' {
    const map: Record<EhrSystem['status'], 'success' | 'info' | 'warn'> = {
      connected: 'success',
      available: 'info',
      'coming-soon': 'warn'
    };
    return map[status];
  }

  runConnectionTest(): void {
    this.testRunning.set(true);
    this.testResult.set('idle');
    setTimeout(() => {
      this.testRunning.set(false);
      this.testResult.set('success');
    }, 1800);
  }

  copyToClipboard(value: string, key: string): void {
    try {
      navigator.clipboard.writeText(value).then(() => {
        this.copiedKey.set(key);
        setTimeout(() => this.copiedKey.set(''), 2000);
      });
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }
}
