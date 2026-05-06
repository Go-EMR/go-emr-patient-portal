import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';

import { PasskeyService, PasskeyCredentialView } from '../../auth/data-access/passkey.service';

/**
 * PasskeysComponent — list, enrol, rename, revoke a user's passkeys.
 *
 * Mounted at /settings/passkeys. The shell's Settings → Security card
 * links here. Hides itself entirely if the browser doesn't support
 * WebAuthn — no point asking a user to enrol a credential their
 * browser can't store.
 */
@Component({
  selector: 'app-passkeys',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    CardModule, ButtonModule, InputTextModule, TableModule, TagModule,
    TooltipModule, DialogModule, ConfirmDialogModule, ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <p-toast position="top-right" />
    <p-confirmDialog />

    <div class="page">
      <header class="page-header">
        <p-button icon="pi pi-arrow-left" [text]="true" [rounded]="true"
                  ariaLabel="Back to settings" (onClick)="back()" />
        <div>
          <h1>Passkeys</h1>
          <p class="muted">
            Phishing-resistant sign-in. One passkey works across every
            product in the Aura suite — GoEMR, the patient portal,
            GoVet, AuraFleet, AuraSports, inventory.
          </p>
        </div>
      </header>

      @if (!supported) {
        <p-card styleClass="warn-card">
          <div class="warn-block">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <strong>This browser doesn't support passkeys.</strong>
              <p class="muted">
                Use a modern browser (Chrome 116+, Safari 17+, Firefox 122+,
                Edge 116+) on a device with a fingerprint reader, FaceID,
                or a hardware security key.
              </p>
            </div>
          </div>
        </p-card>
      } @else {
        <p-card styleClass="enrol-card">
          <div class="enrol-row">
            <div>
              <h2>Add a passkey</h2>
              <p class="muted">
                You'll be prompted by your operating system to use TouchID,
                FaceID, Windows Hello, or a hardware key. Give it a name
                so you can recognise it later.
              </p>
            </div>
            <div class="enrol-form">
              <input pInputText [(ngModel)]="newDeviceName"
                     placeholder="MacBook TouchID"
                     [disabled]="busy()"
                     style="min-width: 220px;" />
              <p-button label="Add passkey" icon="pi pi-plus"
                        [loading]="busy()"
                        [disabled]="busy()"
                        (onClick)="addPasskey()" />
            </div>
          </div>
        </p-card>

        <p-card styleClass="list-card">
          <h2>Your enrolled passkeys</h2>
          @if (loading()) {
            <p class="muted">Loading…</p>
          } @else if (credentials().length === 0) {
            <p class="muted empty">
              No passkeys yet. Add one above and you'll be able to sign
              in without a password next time.
            </p>
          } @else {
            <p-table [value]="credentials()" dataKey="id" styleClass="passkey-table">
              <ng-template #header>
                <tr>
                  <th>Device</th>
                  <th>Added</th>
                  <th>Last used</th>
                  <th style="width: 200px;"></th>
                </tr>
              </ng-template>
              <ng-template #body let-row>
                <tr>
                  <td>
                    @if (renamingId() === row.id) {
                      <div class="rename-row">
                        <input pInputText [(ngModel)]="renameValue" autofocus
                               (keyup.enter)="saveRename(row)"
                               (keyup.escape)="cancelRename()" />
                      </div>
                    } @else {
                      <div class="device-cell">
                        <i class="pi pi-key"></i>
                        <span>{{ row.deviceName || '(unnamed passkey)' }}</span>
                      </div>
                    }
                  </td>
                  <td>{{ row.createdAt | date: 'mediumDate' }}</td>
                  <td>
                    @if (row.lastUsedAt) {
                      {{ row.lastUsedAt | date: 'medium' }}
                    } @else {
                      <p-tag value="Never used" severity="secondary" [rounded]="true" />
                    }
                  </td>
                  <td class="actions">
                    @if (renamingId() === row.id) {
                      <p-button icon="pi pi-check" size="small" [rounded]="true" [text]="true"
                                pTooltip="Save" (onClick)="saveRename(row)" />
                      <p-button icon="pi pi-times" size="small" [rounded]="true" [text]="true"
                                severity="secondary" pTooltip="Cancel" (onClick)="cancelRename()" />
                    } @else {
                      <p-button icon="pi pi-pencil" size="small" [rounded]="true" [text]="true"
                                pTooltip="Rename" (onClick)="startRename(row)" />
                      <p-button icon="pi pi-trash" size="small" [rounded]="true" [text]="true"
                                severity="danger" pTooltip="Remove"
                                (onClick)="confirmRevoke(row)" />
                    }
                  </td>
                </tr>
              </ng-template>
            </p-table>
          }
        </p-card>
      }
    </div>
  `,
  styles: [`
    :host { display: block; padding: 1.5rem; max-width: 880px; margin: 0 auto; }
    .page-header { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1.25rem; }
    .page-header h1 { margin: 0; font-size: 1.5rem; }
    .muted { color: #64748b; font-size: 0.9rem; margin: .25rem 0 0; }
    .warn-card :host ::ng-deep .p-card { border-color: #f59e0b !important; }
    .warn-block { display: flex; gap: .75rem; align-items: flex-start; }
    .warn-block i { color: #b45309; font-size: 1.25rem; margin-top: .15rem; }
    .enrol-card { margin-bottom: 1rem; }
    .enrol-row { display: flex; gap: 1.5rem; align-items: flex-start; flex-wrap: wrap;
                 justify-content: space-between; }
    .enrol-row h2 { margin: 0 0 .25rem; font-size: 1.05rem; }
    .enrol-form { display: flex; gap: .5rem; align-items: center; flex-shrink: 0; }
    .list-card h2 { margin: 0 0 .75rem; font-size: 1.05rem; }
    .empty { padding: 1rem; background: #f8fafc; border-radius: 6px; }
    .device-cell { display: flex; gap: .5rem; align-items: center; }
    .device-cell i { color: #4338ca; }
    .actions { display: flex; gap: .25rem; justify-content: flex-end; }
    .rename-row input { width: 100%; }
  `],
})
export class PasskeysComponent implements OnInit {
  private readonly passkeyService = inject(PasskeyService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  protected readonly supported = this.passkeyService.isSupported();
  protected readonly credentials = signal<PasskeyCredentialView[]>([]);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly renamingId = signal<string | null>(null);

  protected newDeviceName = this.suggestedDeviceName();
  protected renameValue = '';

  ngOnInit(): void {
    if (this.supported) this.refresh();
  }

  back() { this.router.navigate(['/dashboard']); }

  addPasskey(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.passkeyService.registerPasskey(this.newDeviceName.trim()).subscribe({
      next: () => {
        this.busy.set(false);
        this.messages.add({ severity: 'success', summary: 'Passkey added',
          detail: 'Sign in faster next time using your new passkey.' });
        this.newDeviceName = this.suggestedDeviceName();
        this.refresh();
      },
      error: (err: any) => {
        this.busy.set(false);
        if (err?.cancelled) return;
        this.messages.add({ severity: 'error', summary: 'Could not add passkey',
          detail: err?.message ?? err?.error?.error?.message ?? 'Try again.' });
      },
    });
  }

  startRename(row: PasskeyCredentialView): void {
    this.renamingId.set(row.id);
    this.renameValue = row.deviceName ?? '';
  }
  cancelRename(): void {
    this.renamingId.set(null);
    this.renameValue = '';
  }
  saveRename(row: PasskeyCredentialView): void {
    const name = this.renameValue.trim();
    if (!name) return;
    this.passkeyService.renamePasskey(row.id, name).subscribe({
      next: () => {
        this.cancelRename();
        this.refresh();
      },
      error: () => {
        this.messages.add({ severity: 'error', summary: 'Rename failed' });
      },
    });
  }

  confirmRevoke(row: PasskeyCredentialView): void {
    this.confirm.confirm({
      header: 'Remove passkey?',
      message: `Remove "${row.deviceName || 'this passkey'}"? You will no longer be able to sign in with it on any Aura product.`,
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.revoke(row),
    });
  }

  private revoke(row: PasskeyCredentialView): void {
    this.passkeyService.revokePasskey(row.id).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Passkey removed' });
        this.refresh();
      },
      error: () => {
        this.messages.add({ severity: 'error', summary: 'Remove failed' });
      },
    });
  }

  private refresh(): void {
    this.loading.set(true);
    this.passkeyService.listMyPasskeys().subscribe({
      next: (rows) => { this.credentials.set(rows); this.loading.set(false); },
      error: () => { this.credentials.set([]); this.loading.set(false); },
    });
  }

  /** A best-guess label so the user doesn't stare at an empty input.
   *  Picks up the platform from the user-agent — purely cosmetic. */
  private suggestedDeviceName(): string {
    const ua = navigator.userAgent;
    if (/iPhone|iPad/.test(ua)) return 'iPhone / iPad';
    if (/Macintosh/.test(ua))   return 'Mac TouchID';
    if (/Windows/.test(ua))     return 'Windows Hello';
    if (/Android/.test(ua))     return 'Android device';
    if (/Linux/.test(ua))       return 'Linux device';
    return '';
  }
}
