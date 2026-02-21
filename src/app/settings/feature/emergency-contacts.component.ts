import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { EmergencyContact } from '../../shared/data-access';

@Component({
  selector: 'app-emergency-contacts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CardModule, ButtonModule, TagModule, DialogModule, DividerModule, InputTextModule, TooltipModule],
  template: `
    <div class="emergency-contacts-page">
      <header class="page-header">
        <div class="header-text">
          <h1>Emergency Contacts</h1>
          <p>People to contact in case of a medical emergency</p>
        </div>
        <button pButton label="Add Contact" icon="pi pi-plus" (click)="openAddDialog()"></button>
      </header>

      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <span>Keeping your emergency contacts up to date ensures your care team can reach the right people quickly in urgent situations. Review your contacts at least once a year.</span>
      </div>

      <div class="contacts-list">
        @for (contact of contacts(); track contact.id) {
          <p-card styleClass="contact-card">
            <div class="contact-layout">
              <div class="contact-avatar">
                <i class="pi pi-user"></i>
              </div>
              <div class="contact-info">
                <div class="contact-name-row">
                  <h3>{{ contact.name }}</h3>
                  <p-tag [value]="contact.relationship" severity="info"></p-tag>
                </div>
                <div class="contact-details">
                  <span><i class="pi pi-phone"></i> {{ contact.phone }}</span>
                  @if (contact.email) {
                    <span><i class="pi pi-envelope"></i> {{ contact.email }}</span>
                  }
                </div>
              </div>
              <div class="contact-actions">
                <button
                  pButton
                  icon="pi pi-phone"
                  label="Call"
                  class="p-button-outlined p-button-success"
                  pTooltip="Call {{ contact.name }}"
                ></button>
                <button
                  pButton
                  icon="pi pi-envelope"
                  label="Message"
                  class="p-button-outlined"
                  pTooltip="Message {{ contact.name }}"
                ></button>
                <button
                  pButton
                  icon="pi pi-pencil"
                  class="p-button-text p-button-secondary"
                  pTooltip="Edit contact"
                ></button>
                <button
                  pButton
                  icon="pi pi-trash"
                  class="p-button-text p-button-danger"
                  pTooltip="Remove contact"
                  (click)="removeContact(contact.id)"
                ></button>
              </div>
            </div>
          </p-card>
        } @empty {
          <div class="empty-state">
            <i class="pi pi-users"></i>
            <h3>No emergency contacts added</h3>
            <p>Add at least one emergency contact so your care team knows who to reach.</p>
            <button pButton label="Add Your First Contact" icon="pi pi-plus" (click)="openAddDialog()"></button>
          </div>
        }
      </div>

      <p-dialog
        header="Add Emergency Contact"
        [(visible)]="showAddDialog"
        [modal]="true"
        [style]="{ width: '480px' }"
        [draggable]="false"
        [resizable]="false"
      >
        <div class="dialog-form">
          <div class="field">
            <label for="ec-name">Full Name <span class="required">*</span></label>
            <input
              id="ec-name"
              type="text"
              pInputText
              [(ngModel)]="newContact.name"
              placeholder="e.g. Jane Smith"
              class="w-full"
            />
          </div>
          <div class="field">
            <label for="ec-relationship">Relationship <span class="required">*</span></label>
            <input
              id="ec-relationship"
              type="text"
              pInputText
              [(ngModel)]="newContact.relationship"
              placeholder="e.g. Spouse, Parent, Sibling"
              class="w-full"
            />
          </div>
          <div class="field">
            <label for="ec-phone">Phone Number <span class="required">*</span></label>
            <input
              id="ec-phone"
              type="tel"
              pInputText
              [(ngModel)]="newContact.phone"
              placeholder="(555) 000-0000"
              class="w-full"
            />
          </div>
          <div class="field">
            <label for="ec-email">Email Address <span class="optional">(optional)</span></label>
            <input
              id="ec-email"
              type="email"
              pInputText
              [(ngModel)]="newContact.email"
              placeholder="email@example.com"
              class="w-full"
            />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button pButton label="Cancel" class="p-button-text" (click)="closeAddDialog()"></button>
          <button
            pButton
            label="Add Contact"
            icon="pi pi-check"
            [disabled]="!newContact.name || !newContact.relationship || !newContact.phone"
            (click)="saveContact()"
          ></button>
        </ng-template>
      </p-dialog>
    </div>
  `,
  styles: [`
    .emergency-contacts-page { max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-text h1 { margin: 0; }
    .header-text p { color: var(--text-color-secondary); margin: 0.25rem 0 0; }
    .info-banner { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem 1.25rem; background: var(--blue-50); border: 1px solid var(--blue-200); border-radius: var(--border-radius); margin-bottom: 1.5rem; color: var(--blue-800); font-size: 0.9rem; line-height: 1.5; }
    .info-banner i { color: var(--blue-500); font-size: 1.1rem; flex-shrink: 0; margin-top: 0.1rem; }
    .contacts-list { display: flex; flex-direction: column; gap: 1rem; }
    .contact-card { }
    .contact-layout { display: flex; align-items: center; gap: 1.25rem; }
    .contact-avatar { width: 52px; height: 52px; border-radius: 50%; background: var(--primary-100); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
    .contact-info { flex: 1; min-width: 0; }
    .contact-name-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; flex-wrap: wrap; }
    .contact-name-row h3 { margin: 0; font-size: 1.05rem; }
    .contact-details { display: flex; gap: 1.5rem; flex-wrap: wrap; }
    .contact-details span { display: flex; align-items: center; gap: 0.4rem; font-size: 0.875rem; color: var(--text-color-secondary); }
    .contact-details i { font-size: 0.8rem; }
    .contact-actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-color-secondary); }
    .empty-state i { font-size: 3.5rem; color: var(--surface-400); display: block; margin-bottom: 1rem; }
    .empty-state h3 { margin: 0 0 0.5rem; color: var(--text-color); }
    .empty-state p { margin: 0 0 1.5rem; }
    .dialog-form { display: flex; flex-direction: column; gap: 1.25rem; padding: 0.5rem 0; }
    .field { display: flex; flex-direction: column; gap: 0.5rem; }
    .field label { font-weight: 500; font-size: 0.9rem; }
    .field input { width: 100%; }
    .required { color: var(--red-500); }
    .optional { font-weight: 400; color: var(--text-color-secondary); font-size: 0.8rem; }
    @media (max-width: 640px) {
      .contact-layout { flex-wrap: wrap; }
      .contact-actions { width: 100%; justify-content: flex-start; }
      .page-header { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class EmergencyContactsComponent {
  showAddDialog = signal(false);

  contacts = signal<EmergencyContact[]>([
    {
      id: 'EC-001',
      name: 'Jane Smith',
      relationship: 'Spouse',
      phone: '(555) 234-5678',
      email: 'jane.smith@email.com'
    },
    {
      id: 'EC-002',
      name: 'Robert Smith',
      relationship: 'Parent',
      phone: '(555) 345-6789',
      email: 'robert.smith@email.com'
    },
    {
      id: 'EC-003',
      name: 'Emily Johnson',
      relationship: 'Sibling',
      phone: '(555) 456-7890'
    }
  ]);

  newContact: Partial<EmergencyContact> = {
    name: '',
    relationship: '',
    phone: '',
    email: ''
  };

  openAddDialog(): void {
    this.newContact = { name: '', relationship: '', phone: '', email: '' };
    this.showAddDialog.set(true);
  }

  closeAddDialog(): void {
    this.showAddDialog.set(false);
  }

  saveContact(): void {
    if (!this.newContact.name || !this.newContact.relationship || !this.newContact.phone) {
      return;
    }
    const contact: EmergencyContact = {
      id: `EC-${Date.now()}`,
      name: this.newContact.name,
      relationship: this.newContact.relationship,
      phone: this.newContact.phone,
      email: this.newContact.email || undefined
    };
    this.contacts.update(list => [...list, contact]);
    this.closeAddDialog();
  }

  removeContact(id: string): void {
    this.contacts.update(list => list.filter(c => c.id !== id));
  }
}
