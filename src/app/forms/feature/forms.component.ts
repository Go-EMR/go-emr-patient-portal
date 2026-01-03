import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { PatientForm } from '../../shared/data-access';

@Component({
  selector: 'app-forms',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TabViewModule, TagModule, ProgressBarModule],
  template: `
    <div class="forms-page">
      <header class="page-header"><h1>Forms & Documents</h1><p>Complete required forms and manage your documents</p></header>
      <p-tabView>
        <p-tabPanel header="Pending Forms">
          <div class="forms-list">
            @for (form of pendingForms(); track form.id) {
              <div class="form-card">
                <div class="form-icon"><i class="pi pi-file-edit"></i></div>
                <div class="form-content">
                  <h3>{{ form.title }}</h3>
                  <p>{{ form.description }}</p>
                  @if (form.dueDate) { <span class="due-date"><i class="pi pi-calendar"></i> Due: {{ form.dueDate | date:'MMM d, y' }}</span> }
                  @if (form.progress > 0) { <p-progressBar [value]="form.progress" [showValue]="true" styleClass="mt-2"></p-progressBar> }
                </div>
                <div class="form-actions">
                  <p-tag [value]="form.status" [severity]="form.status === 'pending' ? 'warn' : 'info'"></p-tag>
                  <button pButton [label]="form.progress > 0 ? 'Continue' : 'Start'" [icon]="form.progress > 0 ? 'pi pi-arrow-right' : 'pi pi-play'"></button>
                </div>
              </div>
            } @empty {
              <div class="empty"><i class="pi pi-check-circle"></i><h3>All caught up!</h3><p>No pending forms at this time</p></div>
            }
          </div>
        </p-tabPanel>
        <p-tabPanel header="Completed">
          <div class="forms-list">
            @for (form of completedForms(); track form.id) {
              <div class="form-card completed">
                <div class="form-icon"><i class="pi pi-check-circle"></i></div>
                <div class="form-content"><h3>{{ form.title }}</h3><p>Completed on {{ form.completedAt | date:'MMM d, y' }}</p></div>
                <div class="form-actions"><button pButton icon="pi pi-eye" class="p-button-text" label="View"></button><button pButton icon="pi pi-download" class="p-button-text" label="Download"></button></div>
              </div>
            } @empty {
              <div class="empty"><p>No completed forms</p></div>
            }
          </div>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  styles: [`.forms-page{max-width:1000px;margin:0 auto}.page-header{margin-bottom:2rem}.page-header h1{margin:0}.page-header p{color:var(--text-color-secondary);margin:0.5rem 0 0}.forms-list{display:flex;flex-direction:column;gap:1rem}.form-card{display:flex;gap:1.5rem;padding:1.5rem;background:var(--surface-card);border-radius:var(--border-radius);box-shadow:var(--card-shadow);align-items:flex-start}.form-card.completed{opacity:0.8}.form-icon{width:48px;height:48px;border-radius:12px;background:var(--primary-50);color:var(--primary-500);display:flex;align-items:center;justify-content:center;font-size:1.5rem}.form-card.completed .form-icon{background:var(--green-50);color:var(--green-500)}.form-content{flex:1}.form-content h3{margin:0 0 0.5rem}.form-content p{margin:0;color:var(--text-color-secondary)}.due-date{display:flex;align-items:center;gap:0.5rem;font-size:0.875rem;color:var(--orange-600);margin-top:0.5rem}.form-actions{display:flex;flex-direction:column;gap:0.5rem;align-items:flex-end}.empty{text-align:center;padding:4rem 2rem}.empty i{font-size:4rem;color:var(--green-300)}.empty h3{margin:1rem 0 0.5rem}.empty p{color:var(--text-color-secondary)}.mt-2{margin-top:0.5rem}`]
})
export class FormsComponent {
  pendingForms = signal<PatientForm[]>([
    { id: 'F1', title: 'Pre-Visit Health Questionnaire', description: 'Complete before your upcoming visit on Jan 16', type: 'intake', status: 'pending', dueDate: new Date(Date.now() + 10 * 86400000), appointmentId: 'APT-001', progress: 0 },
    { id: 'F2', title: 'Annual HIPAA Acknowledgment', description: 'Required annually to access portal features', type: 'hipaa', status: 'in_progress', dueDate: new Date(Date.now() + 30 * 86400000), progress: 60 }
  ]);
  completedForms = signal<PatientForm[]>([
    { id: 'F3', title: 'New Patient Registration', description: '', type: 'intake', status: 'completed', completedAt: new Date(Date.now() - 365 * 86400000), progress: 100 }
  ]);
}
