import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  HostListener,
  inject,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface CommandItem {
  label: string;
  icon: string;
  route: string;
  group: string;
  keywords: string[];
}

interface ScoredCommand extends CommandItem {
  score: number;
}

interface GroupedCommands {
  group: string;
  items: CommandItem[];
}

const ALL_COMMANDS: CommandItem[] = [
  { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard', group: 'Overview', keywords: ['home', 'summary', 'health'] },
  { label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments', group: 'Care', keywords: ['book', 'schedule', 'visit', 'doctor'] },
  { label: 'Messages', icon: 'pi pi-envelope', route: '/messages', group: 'Communication', keywords: ['inbox', 'send', 'secure', 'provider'] },
  { label: 'Health Records', icon: 'pi pi-folder', route: '/records', group: 'Records', keywords: ['medical', 'charts', 'history'] },
  { label: 'Billing', icon: 'pi pi-credit-card', route: '/billing', group: 'Financial', keywords: ['pay', 'statement', 'balance', 'invoice'] },
  { label: 'Prescriptions', icon: 'pi pi-box', route: '/prescriptions', group: 'Medications', keywords: ['medications', 'refill', 'pharmacy', 'drugs'] },
  { label: 'Lab Results', icon: 'pi pi-chart-line', route: '/lab-trends', group: 'Records', keywords: ['blood', 'test', 'results', 'trends'] },
  { label: 'Settings', icon: 'pi pi-cog', route: '/settings', group: 'Account', keywords: ['preferences', 'profile', 'account'] },
  { label: 'Telehealth', icon: 'pi pi-video', route: '/telehealth', group: 'Care', keywords: ['video', 'virtual', 'call'] },
  { label: 'Insurance', icon: 'pi pi-id-card', route: '/insurance', group: 'Financial', keywords: ['coverage', 'benefits', 'plan'] },
  { label: 'Providers', icon: 'pi pi-users', route: '/providers', group: 'Care', keywords: ['doctor', 'find', 'search', 'specialist'] },
  { label: 'Care Team', icon: 'pi pi-users', route: '/care-team', group: 'Care', keywords: ['team', 'coordinator', 'nurse'] },
  { label: 'Symptom Checker', icon: 'pi pi-heart', route: '/symptom-checker', group: 'Care', keywords: ['symptoms', 'check', 'assess', 'triage'] },
  { label: 'Visit Summaries', icon: 'pi pi-file-check', route: '/visit-summaries', group: 'Records', keywords: ['after visit', 'summary', 'encounter', 'notes'] },
  { label: 'Care Plans', icon: 'pi pi-clipboard', route: '/care-plans', group: 'Records', keywords: ['plan', 'goals', 'treatment'] },
  { label: 'Health Analytics', icon: 'pi pi-chart-bar', route: '/health-analytics', group: 'Records', keywords: ['analytics', 'score', 'trends'] },
  { label: 'Health Timeline', icon: 'pi pi-history', route: '/health-timeline', group: 'Records', keywords: ['timeline', 'history', 'events'] },
  { label: 'Devices', icon: 'pi pi-mobile', route: '/devices', group: 'Records', keywords: ['wearable', 'fitbit', 'apple watch', 'sync'] },
  { label: 'Questionnaires', icon: 'pi pi-list-check', route: '/questionnaires', group: 'Records', keywords: ['phq', 'gad', 'survey', 'assessment'] },
  { label: 'Referrals', icon: 'pi pi-directions', route: '/referrals', group: 'Care', keywords: ['specialist', 'referral', 'transfer'] },
  { label: 'Queue Status', icon: 'pi pi-clock', route: '/queue-status', group: 'Care', keywords: ['wait', 'queue', 'token', 'position'] },
  { label: 'Check-In', icon: 'pi pi-check-circle', route: '/check-in/APT-001', group: 'Care', keywords: ['arrive', 'checkin', 'pre-visit'] },
  { label: 'Waitlist', icon: 'pi pi-hourglass', route: '/waitlist', group: 'Care', keywords: ['wait', 'list', 'opening'] },
  { label: 'Forms', icon: 'pi pi-file-edit', route: '/forms', group: 'Administrative', keywords: ['form', 'consent', 'intake', 'document'] },
  { label: 'Pre-Authorization', icon: 'pi pi-verified', route: '/preauth-request', group: 'Financial', keywords: ['preauth', 'prior auth', 'approval'] },
  { label: 'Feedback', icon: 'pi pi-comment', route: '/feedback', group: 'Communication', keywords: ['feedback', 'review', 'suggestion'] },
  { label: 'Family Dashboard', icon: 'pi pi-users', route: '/family', group: 'Family', keywords: ['family', 'members', 'dependents'] },
  { label: 'Family Chart', icon: 'pi pi-sitemap', route: '/family/chart', group: 'Family', keywords: ['pedigree', 'tree', 'genetic'] },
  { label: 'Sick Note', icon: 'pi pi-file', route: '/sick-note', group: 'Tools', keywords: ['sick', 'note', 'excuse', 'work'] },
  { label: 'Record Sharing', icon: 'pi pi-share-alt', route: '/record-sharing', group: 'Tools', keywords: ['share', 'records', 'provider'] },
];

const MAX_VISIBLE = 10;

function scoreCommand(cmd: CommandItem, query: string): number {
  if (!query) return 1;
  const q = query.toLowerCase().trim();
  const label = cmd.label.toLowerCase();

  if (label === q) return 100;
  if (label.startsWith(q)) return 80;
  if (label.includes(q)) return 60;
  if (cmd.keywords.some(k => k.toLowerCase().includes(q))) return 40;
  return 0;
}

@Component({
  selector: 'app-command-palette',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <div class="cp-backdrop" (click)="close()" role="dialog" aria-modal="true" aria-label="Command palette">
        <div class="cp-modal" (click)="$event.stopPropagation()" role="combobox" [attr.aria-expanded]="isOpen()">

          <!-- Search input -->
          <div class="cp-search-row">
            <i class="pi pi-search cp-search-icon" aria-hidden="true"></i>
            <input
              #searchInput
              class="cp-input"
              type="text"
              placeholder="Search features, actions, pages..."
              autocomplete="off"
              spellcheck="false"
              [value]="query()"
              (input)="onInput($event)"
              aria-label="Search commands"
              aria-autocomplete="list"
              [attr.aria-activedescendant]="selectedIndex() >= 0 ? 'cp-item-' + selectedIndex() : null"
            />
            <span class="cp-esc-hint" aria-hidden="true">Esc</span>
          </div>

          <!-- Results -->
          <div class="cp-results" role="listbox">
            @if (visibleResults().length === 0) {
              <div class="cp-empty">
                <i class="pi pi-search cp-empty-icon" aria-hidden="true"></i>
                <span>No results for "{{ query() }}"</span>
              </div>
            } @else {
              @for (group of groupedResults(); track group.group) {
                <div class="cp-group">
                  <div class="cp-group-label" aria-hidden="true">{{ group.group }}</div>
                  @for (item of group.items; track item.route) {
                    <div
                      class="cp-item"
                      [id]="'cp-item-' + getItemIndex(item)"
                      [class.cp-item--selected]="getItemIndex(item) === selectedIndex()"
                      role="option"
                      [attr.aria-selected]="getItemIndex(item) === selectedIndex()"
                      (click)="selectItem(item)"
                      (mouseenter)="selectedIndex.set(getItemIndex(item))"
                    >
                      <div class="cp-item-left">
                        <div class="cp-item-icon-wrap">
                          <i [class]="item.icon" aria-hidden="true"></i>
                        </div>
                        <span class="cp-item-label">{{ item.label }}</span>
                      </div>
                      <span class="cp-item-group-tag">{{ item.group }}</span>
                    </div>
                  }
                </div>
              }

              @if (totalResults() > MAX_VISIBLE) {
                <div class="cp-overflow-hint">
                  <i class="pi pi-ellipsis-h" aria-hidden="true"></i>
                  {{ totalResults() - MAX_VISIBLE }} more result(s) — refine your search
                </div>
              }
            }
          </div>

          <!-- Footer hint -->
          <div class="cp-footer" aria-hidden="true">
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span class="cp-footer-sep"></span>
            <span><kbd>Enter</kbd> Select</span>
            <span class="cp-footer-sep"></span>
            <span><kbd>Esc</kbd> Close</span>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    /* Backdrop */
    .cp-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      animation: cp-backdrop-in 0.15s ease-out;
    }

    @keyframes cp-backdrop-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Modal */
    .cp-modal {
      width: 100%;
      max-width: 580px;
      margin: 0 1rem;
      background: var(--surface-0, #ffffff);
      border-radius: 12px;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24), 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      animation: cp-modal-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 1px solid var(--surface-border, #e2e8f0);
    }

    @keyframes cp-modal-in {
      from { opacity: 0; transform: scale(0.94) translateY(-8px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }

    /* Search row */
    .cp-search-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid var(--surface-border, #e2e8f0);
    }

    .cp-search-icon {
      font-size: 1.125rem;
      color: var(--text-color-secondary, #64748b);
      flex-shrink: 0;
    }

    .cp-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 1.125rem;
      color: var(--text-color, #1e293b);
      font-family: inherit;
      line-height: 1.5;
    }

    .cp-input::placeholder {
      color: var(--text-color-secondary, #94a3b8);
    }

    .cp-esc-hint {
      font-size: 0.75rem;
      padding: 0.2rem 0.45rem;
      background: var(--surface-100, #f1f5f9);
      color: var(--text-color-secondary, #64748b);
      border: 1px solid var(--surface-border, #e2e8f0);
      border-radius: 4px;
      font-family: monospace;
      flex-shrink: 0;
    }

    /* Results area */
    .cp-results {
      max-height: 380px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }

    .cp-results::-webkit-scrollbar { width: 6px; }
    .cp-results::-webkit-scrollbar-track { background: transparent; }
    .cp-results::-webkit-scrollbar-thumb { background: var(--surface-300, #cbd5e1); border-radius: 3px; }

    /* Group */
    .cp-group { padding: 0.25rem 0; }

    .cp-group-label {
      padding: 0.5rem 1rem 0.25rem;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-color-secondary, #94a3b8);
    }

    /* Item */
    .cp-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 1rem;
      cursor: pointer;
      border-left: 3px solid transparent;
      transition: background 0.1s, border-color 0.1s;
    }

    .cp-item:hover, .cp-item--selected {
      background: rgba(13, 148, 136, 0.07);
      border-left-color: #0d9488;
    }

    .cp-item-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }

    .cp-item-icon-wrap {
      width: 32px;
      height: 32px;
      border-radius: 7px;
      background: var(--surface-100, #f1f5f9);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.1s;
    }

    .cp-item--selected .cp-item-icon-wrap,
    .cp-item:hover .cp-item-icon-wrap {
      background: rgba(13, 148, 136, 0.12);
    }

    .cp-item-icon-wrap i {
      font-size: 0.9375rem;
      color: var(--text-color-secondary, #64748b);
      transition: color 0.1s;
    }

    .cp-item--selected .cp-item-icon-wrap i,
    .cp-item:hover .cp-item-icon-wrap i {
      color: #0d9488;
    }

    .cp-item-label {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--text-color, #1e293b);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cp-item-group-tag {
      font-size: 0.75rem;
      color: var(--text-color-secondary, #94a3b8);
      background: var(--surface-100, #f1f5f9);
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      white-space: nowrap;
      flex-shrink: 0;
      margin-left: 0.5rem;
    }

    /* Empty state */
    .cp-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2.5rem 1rem;
      color: var(--text-color-secondary, #94a3b8);
      font-size: 0.9375rem;
    }

    .cp-empty-icon {
      font-size: 2rem;
      opacity: 0.5;
    }

    /* Overflow hint */
    .cp-overflow-hint {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      font-size: 0.8125rem;
      color: var(--text-color-secondary, #94a3b8);
      border-top: 1px solid var(--surface-border, #e2e8f0);
      font-style: italic;
    }

    /* Footer */
    .cp-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1rem;
      border-top: 1px solid var(--surface-border, #e2e8f0);
      background: var(--surface-50, #f8fafc);
      font-size: 0.8125rem;
      color: var(--text-color-secondary, #94a3b8);
    }

    .cp-footer-sep {
      width: 1px;
      height: 12px;
      background: var(--surface-border, #e2e8f0);
    }

    .cp-footer kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 4px;
      background: var(--surface-0, #ffffff);
      border: 1px solid var(--surface-border, #e2e8f0);
      border-radius: 4px;
      font-size: 0.75rem;
      font-family: inherit;
      color: var(--text-color, #1e293b);
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
      margin-right: 3px;
    }

    @media (max-width: 600px) {
      .cp-footer { display: none; }
      .cp-modal { margin: 0 0.5rem; }
    }
  `]
})
export class CommandPaletteComponent implements AfterViewInit {
  private readonly router = inject(Router);

  @ViewChild('searchInput') private searchInputRef!: ElementRef<HTMLInputElement>;

  readonly MAX_VISIBLE = MAX_VISIBLE;

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly selectedIndex = signal(-1);

  private readonly flatResults = computed<CommandItem[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) {
      return ALL_COMMANDS.slice(0, MAX_VISIBLE);
    }

    const scored: ScoredCommand[] = ALL_COMMANDS
      .map(cmd => ({ ...cmd, score: scoreCommand(cmd, q) }))
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored;
  });

  readonly totalResults = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return ALL_COMMANDS.length;
    return ALL_COMMANDS.filter(cmd => scoreCommand(cmd, q) > 0).length;
  });

  readonly visibleResults = computed<CommandItem[]>(() => {
    return this.flatResults().slice(0, MAX_VISIBLE);
  });

  readonly groupedResults = computed<GroupedCommands[]>(() => {
    const items = this.visibleResults();
    const groupMap = new Map<string, CommandItem[]>();

    for (const item of items) {
      const existing = groupMap.get(item.group) ?? [];
      existing.push(item);
      groupMap.set(item.group, existing);
    }

    return Array.from(groupMap.entries()).map(([group, groupItems]) => ({ group, items: groupItems }));
  });

  ngAfterViewInit(): void {
    // intentionally empty — focus is handled in open()
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    const isCtrlK = (event.ctrlKey || event.metaKey) && event.key === 'k';

    if (isCtrlK) {
      event.preventDefault();
      this.isOpen() ? this.close() : this.open();
      return;
    }

    if (!this.isOpen()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;

      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex.update(i => Math.min(i + 1, this.visibleResults().length - 1));
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex.update(i => Math.max(i - 1, 0));
        break;

      case 'Enter':
        event.preventDefault();
        this.confirmSelection();
        break;
    }
  }

  open(): void {
    this.query.set('');
    this.selectedIndex.set(-1);
    this.isOpen.set(true);
    // Focus after change detection runs
    setTimeout(() => {
      this.searchInputRef?.nativeElement?.focus();
    }, 50);
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
    this.selectedIndex.set(-1);
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.query.set(target.value);
    this.selectedIndex.set(-1);
  }

  selectItem(item: CommandItem): void {
    this.close();
    void this.router.navigate([item.route]);
  }

  getItemIndex(item: CommandItem): number {
    return this.visibleResults().findIndex(r => r.route === item.route && r.label === item.label);
  }

  private confirmSelection(): void {
    const idx = this.selectedIndex();
    const results = this.visibleResults();
    if (idx >= 0 && idx < results.length) {
      this.selectItem(results[idx]);
    } else if (results.length > 0) {
      this.selectItem(results[0]);
    }
  }
}
