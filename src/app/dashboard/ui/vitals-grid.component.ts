import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VitalDisplay } from '../../shared/data-access';

@Component({
  selector: 'app-vitals-grid',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="vitals-grid">
      @for (vital of vitals; track vital.id) {
        <div class="vital-item">
          <div class="vital-icon" [ngClass]="getIconClass(vital.type)">
            <i [class]="getIcon(vital.type)"></i>
          </div>
          <div class="vital-info">
            <span class="label">{{ vital.type }}</span>
            <span class="value">{{ vital.value }} <small>{{ vital.unit }}</small></span>
            <span class="date">{{ vital.recordedDate | date:'MMM d' }}</span>
          </div>
          @if (vital.trend) {
            <div class="trend" [ngClass]="vital.trend">
              <i [class]="vital.trend === 'up' ? 'pi pi-arrow-up' : vital.trend === 'down' ? 'pi pi-arrow-down' : 'pi pi-minus'"></i>
            </div>
          }
        </div>
      } @empty {
        <div class="empty"><i class="pi pi-heart"></i><p>No vitals recorded</p></div>
      }
    </div>
  `,
  styles: [`
    .vitals-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .vital-item { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; background: var(--surface-50); border-radius: var(--border-radius); }
    .vital-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; }
    .vital-icon.bp { background: var(--red-50); color: var(--red-500); }
    .vital-icon.hr { background: var(--pink-50); color: var(--pink-500); }
    .vital-icon.weight { background: var(--blue-50); color: var(--blue-500); }
    .vital-icon.o2 { background: var(--cyan-50); color: var(--cyan-500); }
    .vital-info { flex: 1; display: flex; flex-direction: column; gap: 0.125rem; }
    .label { font-size: 0.75rem; text-transform: uppercase; color: var(--text-color-secondary); font-weight: 600; }
    .value { font-size: 1.125rem; font-weight: 600; color: var(--text-color); }
    .value small { font-size: 0.75rem; font-weight: 400; color: var(--text-color-secondary); }
    .date { font-size: 0.75rem; color: var(--text-color-secondary); }
    .trend { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .trend.up { background: var(--red-50); color: var(--red-500); }
    .trend.down { background: var(--green-50); color: var(--green-500); }
    .trend.stable { background: var(--surface-100); color: var(--text-color-secondary); }
    .empty { grid-column: span 2; display: flex; flex-direction: column; align-items: center; padding: 2rem; text-align: center; }
    .empty i { font-size: 2rem; color: var(--surface-300); margin-bottom: 0.5rem; }
    .empty p { color: var(--text-color-secondary); margin: 0; }
    @media (max-width: 768px) { .vitals-grid { grid-template-columns: 1fr; } }
  `]
})
export class VitalsGridComponent {
  @Input() vitals: VitalDisplay[] = [];

  getIcon(type: string): string {
    const icons: Record<string, string> = { 'Blood Pressure': 'pi pi-heart', 'Heart Rate': 'pi pi-heart-fill', 'Weight': 'pi pi-chart-bar', 'O2 Saturation': 'pi pi-circle-fill' };
    return icons[type] || 'pi pi-circle';
  }

  getIconClass(type: string): string {
    const classes: Record<string, string> = { 'Blood Pressure': 'bp', 'Heart Rate': 'hr', 'Weight': 'weight', 'O2 Saturation': 'o2' };
    return classes[type] || '';
  }
}
