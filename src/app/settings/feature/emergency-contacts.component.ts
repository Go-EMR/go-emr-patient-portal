import { Component, signal, computed, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { EmergencyContact } from '../../shared/data-access';
import { EmergencyContactsService } from '../data-access/emergency-contacts.service';

@Component({
  selector: 'app-emergency-contacts',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    DialogModule,
    DividerModule,
    InputTextModule,
    TooltipModule,
    ProgressSpinnerModule,
    MessageModule,
  ],
  template: `
    <div class="emergency-contacts-page">
      <header class="page-header">
        <div class="header-text">
          <h1>Emergency Contacts</h1>
          <p>People to contact in case of a medical emergency</p>
        </div>
        <p-button
          label="Add Contact"
          icon="pi pi-plus"
          (onClick)="openAddDialog()"
          [disabled]="svc.isSaving()"
        ></p-button>
      </header>

      <div class="info-banner">
        <i class="pi pi-info-circle"></i>
        <span>Keeping your emergency contacts up to date ensures your care team can reach the right people quickly in urgent situations. Review your contacts at least once a year.</span>
      </div>

      @if (svc.error()) {
        <p-message severity="error" [text]="svc.error()!" styleClass="mb-4 w-full"></p-message>
      }

      @if (svc.isLoading()) {
        <div class="loading-state">
          <p-progressSpinner [style]="{'width': '40px', 'height': '40px'}"></p-progressSpinner>
          <span>Loading contacts...</span>
        </div>
      } @else {
        <div class="contacts-list">
          @for (contact of svc.contacts(); track contact.id) {
            <p-card styleClass="contact-card">
              <div class="contact-layout">
                <div class="contact-avatar">
                  <i class="pi pi-user"></i>
                </div>
                <div class="contact-info">
                  <div class="contact-name-row">
                    <h3>{{ contact.name }}</h3>
                    <p-tag [value]="contact.relationship" severity="info"></p-tag>
                    @if (contact.isPrimary) {
                      <p-tag value="Primary" severity="success" icon="pi pi-star-fill"></p-tag>
                    }
                  </div>
                  <div class="contact-details">
                    <span><i class="pi pi-phone"></i> {{ contact.phone }}</span>
                    @if (contact.email) {
                      <span><i class="pi pi-envelope"></i> {{ contact.email }}</span>
                    }
                  </div>
                </div>
                <div class="contact-actions">
                  @if (!contact.isPrimary) {
                    <p-button
                      icon="pi pi-star"
                      label="Set Primary"
                      severity="secondary"
                      [outlined]="true"
                      size="small"
                      pTooltip="This contact will be shown to your care team in GoEMR"
                      [loading]="svc.isSaving()"
                      (onClick)="setPrimary(contact.id)"
                    ></p-button>
                  }
                  <p-button
                    icon="pi pi-pencil"
                    severity="secondary"
                    [text]="true"
                    pTooltip="Edit contact"
                    (onClick)="openEditDialog(contact)"
                  ></p-button>
                  <p-button
                    icon="pi pi-trash"
                    severity="danger"
                    [text]="true"
                    pTooltip="Remove contact"
                    [loading]="svc.isSaving()"
                    (onClick)="removeContact(contact.id)"
                  ></p-button>
                </div>
              </div>
            </p-card>
          } @empty {
            <div class="empty-state">
              <i class="pi pi-users"></i>
              <h3>No emergency contacts added</h3>
              <p>Add at least one emergency contact so your care team knows who to reach.</p>
              <p-button label="Add Your First Contact" icon="pi pi-plus" (onClick)="openAddDialog()"></p-button>
            </div>
          }
        </div>
      }

      <p-dialog
        [header]="isEditing() ? 'Edit Emergency Contact' : 'Add Emergency Contact'"
        [(visible)]="showDialog"
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
              [(ngModel)]="draft.name"
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
              [(ngModel)]="draft.relationship"
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
              [(ngModel)]="draft.phone"
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
              [(ngModel)]="draft.email"
              placeholder="email@example.com"
              class="w-full"
            />
          </div>
        </div>
        <ng-template #footer>
          <p-button label="Cancel" severity="secondary" [text]="true" (onClick)="closeDialog()"></p-button>
          <p-button
            [label]="isEditing() ? 'Save Changes' : 'Add Contact'"
            icon="pi pi-check"
            [disabled]="!draft.name || !draft.relationship || !draft.phone"
            [loading]="svc.isSaving()"
            (onClick)="saveContact()"
          ></p-button>
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
    .loading-state { display: flex; align-items: center; gap: 1rem; padding: 2rem; justify-content: center; color: var(--text-color-secondary); }
    .contacts-list { display: flex; flex-direction: column; gap: 1rem; }
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
export class EmergencyContactsComponent implements OnInit {
  readonly svc = inject(EmergencyContactsService);

  showDialog = false;
  private _editingId = signal<string | null>(null);
  readonly isEditing = computed(() => this._editingId() !== null);

  draft: Partial<EmergencyContact> = this.emptyDraft();

  ngOnInit(): void {
    this.svc.loadContacts();
  }

  openAddDialog(): void {
    this._editingId.set(null);
    this.draft = this.emptyDraft();
    this.showDialog = true;
  }

  openEditDialog(contact: EmergencyContact): void {
    this._editingId.set(contact.id);
    this.draft = { ...contact };
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this._editingId.set(null);
  }

  async saveContact(): Promise<void> {
    if (!this.draft.name || !this.draft.relationship || !this.draft.phone) {
      return;
    }

    const editingId = this._editingId();

    if (editingId !== null) {
      // Edit — replace the full list with the updated contact swapped in
      const updated = this.svc.contacts().map(c =>
        c.id === editingId
          ? { id: editingId, name: this.draft.name!, relationship: this.draft.relationship!, phone: this.draft.phone!, email: this.draft.email || undefined }
          : c
      );
      await this.svc.replaceAll(updated);
    } else {
      // Add
      await this.svc.addContact({
        name: this.draft.name!,
        relationship: this.draft.relationship!,
        phone: this.draft.phone!,
        email: this.draft.email || undefined,
      });
    }

    this.closeDialog();
  }

  async removeContact(id: string): Promise<void> {
    await this.svc.deleteContact(id);
  }

  async setPrimary(id: string): Promise<void> {
    const updated = this.svc.contacts().map(c => ({
      ...c,
      isPrimary: c.id === id
    }));
    await this.svc.replaceAll(updated);
  }

  private emptyDraft(): Partial<EmergencyContact> {
    return { name: '', relationship: '', phone: '', email: '' };
  }
}
