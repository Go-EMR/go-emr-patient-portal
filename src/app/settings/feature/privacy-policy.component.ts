import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, CardModule, ButtonModule, DividerModule],
  template: `
    <div class="privacy-page">
      <header class="page-header">
        <div>
          <h1>Privacy Policy</h1>
          <p class="last-updated">Last Updated: January 15, 2026</p>
        </div>
      </header>

      <p-card styleClass="policy-card">
        <div class="policy-intro">
          <p>
            GoHealth Patient Portal ("we," "us," or "our") is committed to protecting the privacy and
            security of your personal health information. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our patient portal. Please read
            this policy carefully. If you do not agree with its terms, please discontinue use of the portal.
          </p>
        </div>

        <p-divider></p-divider>

        <!-- Section 1 -->
        <section class="policy-section">
          <h3>1. Information We Collect</h3>
          <p>
            We collect information that you provide directly to us and information generated as you use
            our portal. The categories of information we collect include:
          </p>
          <ul class="policy-list">
            <li>
              <strong>Personal Information:</strong> Name, date of birth, address, telephone number,
              email address, Social Security number (for insurance purposes), and government-issued
              identification where required.
            </li>
            <li>
              <strong>Health and Medical Data:</strong> Medical history, diagnoses, prescriptions,
              lab results, imaging studies, immunization records, allergy information, visit notes,
              and other clinical documentation constituting protected health information (PHI) under HIPAA.
            </li>
            <li>
              <strong>Usage and Technical Data:</strong> IP address, browser type, operating system,
              pages visited, session duration, features accessed, error logs, and device identifiers
              collected automatically when you interact with the portal.
            </li>
            <li>
              <strong>Payment Information:</strong> Credit or debit card details, bank account numbers,
              and billing addresses processed through our PCI-DSS compliant payment processor.
            </li>
            <li>
              <strong>Communications:</strong> Secure messages sent through the portal, feedback submitted,
              and records of support interactions.
            </li>
          </ul>
        </section>

        <p-divider></p-divider>

        <!-- Section 2 -->
        <section class="policy-section">
          <h3>2. How We Use Your Information</h3>
          <p>
            We use the information we collect for the following purposes:
          </p>
          <ul class="policy-list">
            <li>
              <strong>Treatment and Care Coordination:</strong> To provide, coordinate, and manage
              your healthcare services, including sharing information with your care team, specialists,
              and other providers involved in your treatment.
            </li>
            <li>
              <strong>Healthcare Operations:</strong> For quality assessment, performance improvement,
              staff training, accreditation activities, and business management functions necessary
              to operate as a healthcare provider.
            </li>
            <li>
              <strong>Payment Processing:</strong> To process insurance claims, determine coverage,
              obtain payment for services rendered, and manage billing inquiries.
            </li>
            <li>
              <strong>Communications:</strong> To send appointment reminders, lab result notifications,
              prescription refill alerts, and other health-related communications you have opted to receive.
            </li>
            <li>
              <strong>Legal Compliance:</strong> To comply with applicable federal and state laws,
              including HIPAA, HITECH, and state health information laws, and to respond to lawful
              government requests and legal proceedings.
            </li>
            <li>
              <strong>Portal Improvement:</strong> To analyze usage patterns, diagnose technical
              issues, and enhance the functionality and user experience of the portal.
            </li>
          </ul>
        </section>

        <p-divider></p-divider>

        <!-- Section 3 -->
        <section class="policy-section">
          <h3>3. Information Sharing and Disclosure</h3>
          <p>
            We do not sell your personal information. We may share your information in the following
            limited circumstances:
          </p>
          <ul class="policy-list">
            <li>
              <strong>With Your Healthcare Providers:</strong> Physicians, nurses, specialists,
              ancillary providers, and care team members involved in your treatment have access
              to your health records as necessary to provide care.
            </li>
            <li>
              <strong>With Insurers and Payers:</strong> We share information necessary to process
              insurance claims, obtain pre-authorizations, and coordinate benefits with your
              insurance carrier or other payers.
            </li>
            <li>
              <strong>With Service Providers:</strong> Third-party vendors who perform services
              on our behalf (e.g., cloud hosting, payment processing, analytics) under Business
              Associate Agreements (BAAs) that require them to maintain the confidentiality and
              security of your PHI.
            </li>
            <li>
              <strong>As Required by Law:</strong> When required by court order, subpoena, or
              other legal process; to report communicable diseases to public health authorities;
              or to respond to lawful requests from government agencies.
            </li>
            <li>
              <strong>For Public Health and Safety:</strong> To avert serious threats to your
              health or safety or the health or safety of another person, consistent with HIPAA
              and applicable law.
            </li>
            <li>
              <strong>With Your Authorization:</strong> For any other purpose with your explicit
              written consent, which you may revoke at any time.
            </li>
          </ul>
        </section>

        <p-divider></p-divider>

        <!-- Section 4 -->
        <section class="policy-section">
          <h3>4. Data Security</h3>
          <p>
            We implement industry-leading technical, administrative, and physical safeguards to protect
            your health information from unauthorized access, use, alteration, and disclosure.
          </p>
          <ul class="policy-list">
            <li>
              <strong>Encryption:</strong> All data is encrypted in transit using TLS 1.3 and at
              rest using AES-256 encryption. Health data is never transmitted or stored in plain text.
            </li>
            <li>
              <strong>Access Controls:</strong> Role-based access control (RBAC) ensures that only
              authorized personnel can access your records. All access is authenticated via multi-factor
              authentication and governed by least-privilege principles.
            </li>
            <li>
              <strong>Audit Trails:</strong> Comprehensive, tamper-evident audit logs record every
              access and modification to your health information, retained for a minimum of six years
              in compliance with HIPAA requirements.
            </li>
            <li>
              <strong>Vulnerability Management:</strong> Regular penetration testing, security audits,
              and vulnerability scanning are conducted by independent third parties. Our systems
              are SOC 2 Type II certified.
            </li>
            <li>
              <strong>Breach Response:</strong> In the event of a breach affecting your PHI, we will
              notify you within the timeframes required by HIPAA and applicable state law, along with
              details of the breach and steps taken to mitigate harm.
            </li>
          </ul>
        </section>

        <p-divider></p-divider>

        <!-- Section 5 -->
        <section class="policy-section">
          <h3>5. Your Rights</h3>
          <p>
            You have significant rights with respect to your health information. To exercise any
            of these rights, contact our Privacy Officer at privacy&#64;gohealth.example.com.
          </p>
          <ul class="policy-list">
            <li>
              <strong>Right of Access:</strong> You have the right to inspect and obtain a copy of
              your health records held in our designated record set, typically within 30 days of request.
              Electronic copies are available in machine-readable format at no charge.
            </li>
            <li>
              <strong>Right to Correction:</strong> You may request that we amend inaccurate or
              incomplete health information. If we deny your request, you have the right to submit
              a statement of disagreement that will be included in your record.
            </li>
            <li>
              <strong>Right to Deletion:</strong> Subject to applicable law and our legal obligations
              to retain records, you may request deletion of your portal account and associated
              personal data. Underlying clinical records are subject to separate retention requirements.
            </li>
            <li>
              <strong>Right to Data Portability:</strong> You may request a structured, machine-readable
              export of your health records in FHIR R4 format, enabling you to transmit your data
              to other healthcare providers or applications of your choice.
            </li>
            <li>
              <strong>Right to Restrict Processing:</strong> You may request restrictions on certain
              uses and disclosures of your information, such as restricting disclosure to your insurer
              for services you have paid for out of pocket. We are required to agree to restrictions
              that meet specific criteria under HIPAA.
            </li>
            <li>
              <strong>Right to an Accounting of Disclosures:</strong> You may request a list of
              certain disclosures of your PHI made by us over the past six years, excluding disclosures
              for treatment, payment, and operations.
            </li>
            <li>
              <strong>Right to File a Complaint:</strong> If you believe your privacy rights have been
              violated, you may file a complaint with us or directly with the U.S. Department of Health
              and Human Services Office for Civil Rights at hhs.gov/ocr. We will not retaliate against
              you for filing a complaint.
            </li>
          </ul>
        </section>

        <p-divider></p-divider>

        <div class="policy-footer">
          <p class="footer-note">
            This Privacy Policy may be updated periodically to reflect changes in our practices or
            applicable law. Material changes will be communicated to you through the portal or by
            email. Continued use of the portal after the effective date of any change constitutes
            your acceptance of the updated policy. For questions, contact our Privacy Officer at
            <a href="mailto:privacy@gohealth.example.com">privacy&#64;gohealth.example.com</a>.
          </p>
          <button
            pButton
            label="Back to Settings"
            icon="pi pi-arrow-left"
            class="p-button-outlined"
            routerLink="/settings"
          ></button>
        </div>
      </p-card>
    </div>
  `,
  styles: [`
    .privacy-page { max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0 0 0.25rem; }
    .last-updated { color: var(--text-color-secondary); font-size: 0.875rem; margin: 0; }
    .policy-card { }
    .policy-intro { margin-bottom: 0; }
    .policy-intro p { color: var(--text-color-secondary); line-height: 1.7; margin: 0; font-size: 0.9rem; }
    .policy-section { padding: 0.25rem 0; }
    .policy-section h3 { margin: 0 0 0.75rem; font-size: 1.05rem; color: var(--primary-700); border-bottom: 1px solid var(--surface-border); padding-bottom: 0.5rem; }
    .policy-section p { color: var(--text-color-secondary); line-height: 1.7; margin: 0 0 0.75rem; font-size: 0.9rem; }
    .policy-list { margin: 0; padding-left: 1.5rem; display: flex; flex-direction: column; gap: 0.6rem; }
    .policy-list li { color: var(--text-color-secondary); line-height: 1.65; font-size: 0.875rem; }
    .policy-list li strong { color: var(--text-color); }
    .policy-footer { padding-top: 0.25rem; }
    .footer-note { color: var(--text-color-secondary); font-size: 0.85rem; line-height: 1.65; margin: 0 0 1.5rem; }
    .footer-note a { color: var(--primary-600); text-decoration: none; }
    .footer-note a:hover { text-decoration: underline; }
  `]
})
export class PrivacyPolicyComponent {}
