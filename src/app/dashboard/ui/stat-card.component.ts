import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RippleModule } from 'primeng/ripple';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, RippleModule],
  template: `
    <div class="stat-card" [ngClass]="variant" pRipple (click)="clicked.emit()">
      <div class="stat-icon">
        <i [class]="icon"></i>
      </div>
      <div class="stat-content">
        <span class="stat-value">{{ value }}</span>
        <span class="stat-label">{{ label }}</span>
      </div>
      @if (badge) {
        <span class="stat-badge" [ngClass]="badgeVariant">{{ badge }}</span>
      }
    </div>
  `,
  styles: [`
    .stat-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: var(--surface-card); border-radius: var(--border-radius); box-shadow: var(--card-shadow); cursor: pointer; transition: all 0.2s ease; position: relative; }
    .stat-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.appointments .stat-icon { background: var(--blue-50); color: var(--blue-500); }
    .stat-card.messages .stat-icon { background: var(--green-50); color: var(--green-500); }
    .stat-card.labs .stat-icon { background: var(--purple-50); color: var(--purple-500); }
    .stat-card.balance .stat-icon { background: var(--orange-50); color: var(--orange-500); }
    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-color); }
    .stat-label { font-size: 0.875rem; color: var(--text-color-secondary); }
    .stat-badge { position: absolute; top: 0.75rem; right: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 1rem; font-size: 0.75rem; font-weight: 600; background: var(--primary-100); color: var(--primary-700); }
    .stat-badge.alert { background: var(--red-100); color: var(--red-700); }
    .stat-badge.warning { background: var(--orange-100); color: var(--orange-700); }
  `]
})
export class StatCardComponent {
  @Input() value: string | number = 0;
  @Input() label = '';
  @Input() icon = 'pi pi-circle';
  @Input() variant = 'default';
  @Input() badge?: string;
  @Input() badgeVariant?: 'default' | 'alert' | 'warning';
  @Output() clicked = new EventEmitter<void>();
}
