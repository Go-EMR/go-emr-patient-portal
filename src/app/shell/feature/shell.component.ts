import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';

import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/data-access';
import { ThemeService } from '../../shared/data-access';
import { IdleTimeoutService } from '../../shared/utils';
import { SkipLinkComponent } from '../../shared/ui';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

interface NavGroup {
  label: string;
  collapsed: boolean;
  items: NavItem[];
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, ButtonModule, AvatarModule, RippleModule, TooltipModule, SkipLinkComponent],
  template: `
    <app-skip-link></app-skip-link>
    <div class="portal-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar" role="navigation" aria-label="Main navigation">
        <div class="sidebar-header">
          <div class="logo" [class.collapsed]="sidebarCollapsed()" aria-label="GoHealth Patient Portal">
            <i class="pi pi-heart-fill" aria-hidden="true"></i>
            @if (!sidebarCollapsed()) {
              <span>GoHealth</span>
            }
          </div>
          <button pButton [icon]="sidebarCollapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'"
                  class="p-button-text p-button-rounded collapse-btn"
                  [attr.aria-label]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
                  (click)="toggleSidebar()"></button>
        </div>

        <nav class="sidebar-nav">
          @for (group of navGroups; track group.label) {
            @if (!sidebarCollapsed()) {
              <div class="nav-group-header"
                   (click)="group.collapsed = !group.collapsed"
                   [attr.aria-expanded]="!group.collapsed"
                   role="button"
                   tabindex="0"
                   (keydown.enter)="group.collapsed = !group.collapsed"
                   (keydown.space)="group.collapsed = !group.collapsed">
                <span class="nav-group-label">{{ group.label }}</span>
                <i [class]="group.collapsed ? 'pi pi-plus' : 'pi pi-minus'" class="nav-group-toggle" aria-hidden="true"></i>
              </div>
            }
            @if (!group.collapsed || sidebarCollapsed()) {
              @for (item of group.items; track item.route) {
                <a [routerLink]="item.route" routerLinkActive="active" class="nav-item" pRipple
                   [pTooltip]="sidebarCollapsed() ? item.label : ''" tooltipPosition="right"
                   [attr.aria-label]="item.label + (item.badge ? ', ' + item.badge + ' unread' : '')">
                  <i [class]="item.icon" aria-hidden="true"></i>
                  @if (!sidebarCollapsed()) {
                    <span>{{ item.label }}</span>
                  }
                  @if (item.badge && item.badge > 0) {
                    <span class="nav-badge" [attr.aria-label]="item.badge + ' unread'">{{ item.badge }}</span>
                  }
                </a>
              }
            }
          }
        </nav>

        <!-- Sidebar footer: user info + role badge (Feature 6.3) -->
        <div class="sidebar-footer">
          <div class="user-info" [class.collapsed]="sidebarCollapsed()">
            <p-avatar [label]="userInitials()" shape="circle"
                      [style]="{ 'background-color': 'var(--teal-100)', color: 'var(--teal-700)' }"
                      aria-hidden="true"></p-avatar>
            @if (!sidebarCollapsed()) {
              <div class="user-details">
                <span class="user-name">{{ userName() }}</span>
                <span class="user-mrn">MRN: {{ userMrn() }}</span>
                <!-- Feature 6.3: Role badge with dropdown -->
                <div class="role-badge-wrapper">
                  <button
                    class="role-badge"
                    [class]="'role-badge role-' + currentRole()"
                    (click)="toggleRoleDropdown()"
                    [attr.aria-expanded]="roleDropdownOpen()"
                    aria-haspopup="listbox"
                    [attr.aria-label]="'Current role: ' + roleLabel(currentRole()) + '. Click to change role.'">
                    <i class="pi pi-user" aria-hidden="true"></i>
                    {{ roleLabel(currentRole()) }}
                    <i class="pi pi-angle-down role-arrow" aria-hidden="true"></i>
                  </button>

                  @if (roleDropdownOpen()) {
                    <div class="role-dropdown" role="listbox" aria-label="Select session role">
                      @for (opt of roleOptions; track opt.value) {
                        <button
                          class="role-option"
                          [class.selected]="currentRole() === opt.value"
                          role="option"
                          [attr.aria-selected]="currentRole() === opt.value"
                          (click)="selectRole(opt.value)">
                          <span class="role-dot" [class]="'role-dot-' + opt.value" aria-hidden="true"></span>
                          {{ opt.label }}
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <button pButton icon="pi pi-sign-out" [label]="sidebarCollapsed() ? '' : 'Sign Out'"
                  class="p-button-text logout-btn" (click)="logout()"
                  [pTooltip]="sidebarCollapsed() ? 'Sign Out' : ''" tooltipPosition="right"
                  aria-label="Sign out of your account"></button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content" id="main-content">
        <!-- Top Bar -->
        <div class="theme-toggle-bar">
          <div class="topbar-spacer"></div>
          <span class="theme-label"><i class="pi pi-palette" aria-hidden="true"></i> Theme</span>
          <div class="theme-buttons" role="group" aria-label="Select color theme">
            <button class="theme-btn" [class.active]="themeService.activeTheme() === 'classic'" (click)="themeService.setTheme('classic')"
                    pTooltip="Classic" tooltipPosition="bottom" aria-label="Classic theme" [attr.aria-pressed]="themeService.activeTheme() === 'classic'">
              <i class="pi pi-desktop" aria-hidden="true"></i>
              <span class="theme-btn-label">Classic</span>
            </button>
            <button class="theme-btn" [class.active]="themeService.activeTheme() === 'beach'" (click)="themeService.setTheme('beach')"
                    pTooltip="Beach" tooltipPosition="bottom" aria-label="Beach theme" [attr.aria-pressed]="themeService.activeTheme() === 'beach'">
              <i class="pi pi-sun" aria-hidden="true"></i>
              <span class="theme-btn-label">Beach</span>
            </button>
            <button class="theme-btn" [class.active]="themeService.activeTheme() === 'dark'" (click)="themeService.setTheme('dark')"
                    pTooltip="Dark" tooltipPosition="bottom" aria-label="Dark theme" [attr.aria-pressed]="themeService.activeTheme() === 'dark'">
              <i class="pi pi-moon" aria-hidden="true"></i>
              <span class="theme-btn-label">Dark</span>
            </button>
          </div>
          <a routerLink="/notifications" class="notification-bell" pTooltip="Notifications" tooltipPosition="bottom"
             aria-label="Notifications, 4 unread">
            <i class="pi pi-bell" aria-hidden="true"></i>
            <span class="bell-badge" aria-hidden="true">4</span>
          </a>
        </div>
        <router-outlet></router-outlet>
      </main>
    </div>

    <!-- Feature 6.4: Idle Session Timeout Warning Dialog -->
    @if (idleService.showWarning()) {
      <div class="idle-overlay" role="dialog" aria-modal="true" aria-labelledby="idle-dialog-title" aria-describedby="idle-dialog-desc">
        <div class="idle-dialog">
          <div class="idle-icon" aria-hidden="true">
            <i class="pi pi-clock"></i>
          </div>
          <h2 id="idle-dialog-title">Session Expiring Soon</h2>
          <p id="idle-dialog-desc" aria-live="polite">
            Your session will expire in
            <strong>{{ idleService.remainingSeconds() }} second{{ idleService.remainingSeconds() === 1 ? '' : 's' }}</strong>.
            Would you like to stay logged in?
          </p>
          <div class="idle-actions">
            <button
              pButton
              label="Stay Logged In"
              icon="pi pi-check"
              class="p-button-success"
              (click)="extendSession()"
              aria-label="Extend session and stay logged in"
              #stayBtn></button>
            <button
              pButton
              label="Log Out"
              icon="pi pi-sign-out"
              class="p-button-text p-button-danger"
              (click)="idleLogout()"
              aria-label="Log out now"></button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .portal-layout {
      display: flex;
      min-height: 100vh;
      background: var(--surface-ground);
    }

    .sidebar {
      width: 260px;
      background: var(--surface-card);
      border-right: 1px solid var(--surface-border);
      display: flex;
      flex-direction: column;
      transition: width 0.2s ease;
    }

    .portal-layout.sidebar-collapsed .sidebar {
      width: 72px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--teal-600);
    }

    .logo.collapsed {
      justify-content: center;
    }

    .logo i {
      font-size: 1.5rem;
    }

    .collapse-btn {
      flex-shrink: 0;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0.5rem;
      overflow-y: auto;
    }

    .nav-group-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      margin-top: 0.5rem;
      cursor: pointer;
      user-select: none;
    }

    .nav-group-header:first-child {
      margin-top: 0;
    }

    .nav-group-label {
      font-size: 0.675rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-color-secondary);
    }

    .nav-group-toggle {
      font-size: 0.65rem;
      color: var(--text-color-secondary);
      transition: color 0.15s;
    }

    .nav-group-header:hover .nav-group-label,
    .nav-group-header:hover .nav-group-toggle {
      color: var(--text-color);
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin-bottom: 0.125rem;
      border-radius: var(--border-radius);
      color: var(--text-color);
      text-decoration: none;
      transition: all 0.15s ease;
      position: relative;
    }

    .portal-layout.sidebar-collapsed .nav-item {
      justify-content: center;
      padding: 0.875rem;
    }

    .nav-item:hover {
      background: var(--surface-hover);
    }

    .nav-item.active {
      background: var(--primary-50);
      color: var(--primary-700);
      font-weight: 500;
    }

    .nav-item i {
      font-size: 1.125rem;
      width: 24px;
      text-align: center;
    }

    .nav-badge {
      margin-left: auto;
      background: var(--primary-color);
      color: white;
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
    }

    .portal-layout.sidebar-collapsed .nav-badge {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      margin: 0;
      width: 18px;
      height: 18px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid var(--surface-border);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .user-info.collapsed {
      justify-content: center;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
    }

    .user-name {
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-mrn {
      font-size: 0.75rem;
      color: var(--text-color-secondary);
    }

    .logout-btn {
      width: 100%;
      justify-content: center;
    }

    .main-content {
      flex: 1;
      padding: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .theme-toggle-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 0.5rem 1.5rem;
      background: var(--surface-card);
      border-bottom: 1px solid var(--surface-border);
    }

    .theme-label {
      font-size: 0.8rem;
      color: var(--text-color-secondary);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .theme-buttons {
      display: flex;
      gap: 0.25rem;
      background: var(--surface-100);
      border-radius: 20px;
      padding: 2px;
    }

    .theme-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: 18px;
      background: transparent;
      color: var(--text-color-secondary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: inherit;
      white-space: nowrap;
    }

    .theme-btn.active {
      background: var(--surface-card);
      color: var(--primary-color);
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      font-weight: 600;
    }

    .theme-btn:hover:not(.active) {
      color: var(--text-color);
    }

    .theme-btn-label {
      display: inline;
    }

    @media (max-width: 640px) {
      .theme-btn-label {
        display: none;
      }

      .theme-btn {
        padding: 0.375rem 0.625rem;
      }
    }

    .topbar-spacer {
      flex: 1;
    }

    .notification-bell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      color: var(--text-color-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .notification-bell:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .notification-bell i {
      font-size: 1.15rem;
    }

    .bell-badge {
      position: absolute;
      top: 2px;
      right: 0;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: #22c55e;
      color: white;
      font-size: 0.625rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .main-content > :last-child {
      flex: 1;
      padding: 1.5rem;
    }

    /* Make router-outlet sibling get padding */
    .main-content ::ng-deep > *:not(.theme-toggle-bar):not(router-outlet) {
      padding: 1.5rem;
    }

    @media (max-width: 1024px) {
      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        z-index: 1000;
        transform: translateX(-100%);
      }

      .portal-layout.sidebar-collapsed .sidebar {
        transform: translateX(0);
        width: 260px;
      }

      .main-content {
        width: 100%;
      }
    }

    /* =====================================================
       Feature 6.3: Role Badge Styles
       ===================================================== */
    .role-badge-wrapper {
      position: relative;
      margin-top: 0.375rem;
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.2rem 0.5rem;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      font-family: inherit;
      border: none;
      cursor: pointer;
      letter-spacing: 0.02em;
      text-transform: capitalize;
      transition: opacity 0.15s ease;
    }

    .role-badge:hover {
      opacity: 0.85;
    }

    .role-badge:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    /* patient = teal */
    .role-patient {
      background: var(--teal-50);
      color: var(--teal-700);
      border: 1px solid var(--teal-200);
    }

    /* caregiver = purple */
    .role-caregiver {
      background: #f3e8ff;
      color: #7e22ce;
      border: 1px solid #d8b4fe;
    }

    /* proxy = orange */
    .role-proxy {
      background: var(--orange-50);
      color: var(--orange-700);
      border: 1px solid var(--orange-200);
    }

    .role-arrow {
      font-size: 0.6rem;
      margin-left: 0.1rem;
    }

    .role-dropdown {
      position: absolute;
      bottom: calc(100% + 6px);
      left: 0;
      min-width: 140px;
      background: var(--surface-card);
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      overflow: hidden;
      z-index: 200;
    }

    .role-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: transparent;
      border: none;
      font-family: inherit;
      font-size: 0.8rem;
      color: var(--text-color);
      cursor: pointer;
      text-align: left;
      transition: background 0.1s ease;
    }

    .role-option:hover {
      background: var(--surface-hover);
    }

    .role-option.selected {
      font-weight: 600;
      color: var(--primary-color);
    }

    .role-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .role-dot-patient  { background: #0d9488; }  /* teal-600 */
    .role-dot-caregiver { background: #9333ea; }  /* purple-600 */
    .role-dot-proxy    { background: #ea580c; }  /* orange-600 */

    /* =====================================================
       Feature 6.4: Idle Timeout Warning Dialog Styles
       ===================================================== */
    .idle-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
      backdrop-filter: blur(2px);
    }

    .idle-dialog {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .idle-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--orange-50);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .idle-icon i {
      font-size: 1.75rem;
      color: var(--orange-600);
    }

    .idle-dialog h2 {
      margin: 0 0 0.75rem;
      font-size: 1.25rem;
      color: var(--text-color);
    }

    .idle-dialog p {
      margin: 0 0 1.5rem;
      color: var(--text-color-secondary);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    .idle-actions {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .idle-actions .p-button-success {
      width: 100%;
      justify-content: center;
    }

    .idle-actions .p-button-text {
      width: 100%;
      justify-content: center;
    }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  readonly themeService = inject(ThemeService);
  readonly idleService = inject(IdleTimeoutService);

  sidebarCollapsed = signal(false);

  // Feature 6.3: role management
  currentRole = this.authService.role;
  roleDropdownOpen = signal(false);

  readonly roleOptions: { value: 'patient' | 'caregiver' | 'proxy'; label: string }[] = [
    { value: 'patient', label: 'Patient' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'proxy', label: 'Proxy' },
  ];

  navGroups: NavGroup[] = [
    {
      label: 'Overview',
      collapsed: false,
      items: [
        { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
        { label: 'Quick Help', icon: 'pi pi-question-circle', route: '/triage' },
      ]
    },
    {
      label: 'Care & Appointments',
      collapsed: false,
      items: [
        { label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments' },
        { label: 'Telehealth', icon: 'pi pi-video', route: '/telehealth' },
        { label: 'Symptom Checker', icon: 'pi pi-heart', route: '/symptom-checker' },
        { label: 'Referrals', icon: 'pi pi-directions', route: '/referrals' },
        { label: 'Providers', icon: 'pi pi-users', route: '/providers' },
        { label: 'Care Team', icon: 'pi pi-users', route: '/care-team' },
        { label: 'Queue Status', icon: 'pi pi-clock', route: '/queue-status' },
        { label: 'Check-In', icon: 'pi pi-check-circle', route: '/check-in/APT-001' },
        { label: 'Waitlist', icon: 'pi pi-hourglass', route: '/waitlist' },
      ]
    },
    {
      label: 'Health Records',
      collapsed: false,
      items: [
        { label: 'Health Records', icon: 'pi pi-folder', route: '/records' },
        { label: 'Visit Summaries', icon: 'pi pi-file-check', route: '/visit-summaries' },
        { label: 'Care Plans', icon: 'pi pi-clipboard', route: '/care-plans' },
        { label: 'Health Analytics', icon: 'pi pi-chart-bar', route: '/health-analytics' },
        { label: 'Timeline', icon: 'pi pi-history', route: '/health-timeline' },
        { label: 'Lab Trends', icon: 'pi pi-chart-line', route: '/lab-trends' },
        { label: 'Questionnaires', icon: 'pi pi-list-check', route: '/questionnaires' },
        { label: 'Prescriptions', icon: 'pi pi-box', route: '/prescriptions' },
        { label: 'Devices', icon: 'pi pi-mobile', route: '/devices' },
      ]
    },
    {
      label: 'Billing & Insurance',
      collapsed: false,
      items: [
        { label: 'Billing', icon: 'pi pi-credit-card', route: '/billing' },
        { label: 'Insurance', icon: 'pi pi-id-card', route: '/insurance' },
        { label: 'Pre-Auth', icon: 'pi pi-verified', route: '/preauth-request' },
        { label: 'Forms', icon: 'pi pi-file-edit', route: '/forms' },
      ]
    },
    {
      label: 'Communication',
      collapsed: false,
      items: [
        { label: 'Messages', icon: 'pi pi-envelope', route: '/messages', badge: 3 },
        { label: 'Feedback', icon: 'pi pi-comment', route: '/feedback' },
        { label: 'Audit Log', icon: 'pi pi-shield', route: '/audit-log' },
        { label: 'Settings', icon: 'pi pi-cog', route: '/settings' },
      ]
    },
    {
      label: 'Family',
      collapsed: false,
      items: [
        { label: 'Family Dashboard', icon: 'pi pi-users', route: '/family' },
        { label: 'Family Chart', icon: 'pi pi-sitemap', route: '/family/chart' },
        { label: 'Permissions', icon: 'pi pi-lock', route: '/family/permissions' },
        { label: 'Family History', icon: 'pi pi-history', route: '/health/family-history' },
        { label: 'Genetic Tests', icon: 'pi pi-sliders-h', route: '/health/genetic-tests' },
        { label: 'Genetic Risk', icon: 'pi pi-exclamation-triangle', route: '/health/genetic-risk' },
        { label: 'Jurisdiction', icon: 'pi pi-globe', route: '/settings/jurisdiction' },
        { label: 'Drug Schedules', icon: 'pi pi-list', route: '/medications/schedule-reference' },
        { label: 'Telehealth Check', icon: 'pi pi-video', route: '/telehealth/jurisdiction-check' },
        { label: 'Consent Rules', icon: 'pi pi-shield', route: '/admin/consent-rules' },
        { label: 'Proxy Accounts', icon: 'pi pi-user-edit', route: '/admin/proxy-accounts' },
      ]
    },
    {
      label: 'Tools',
      collapsed: true,
      items: [
        { label: 'Sick Note', icon: 'pi pi-file', route: '/sick-note' },
        { label: 'Record Sharing', icon: 'pi pi-share-alt', route: '/record-sharing' },
        { label: 'Survey', icon: 'pi pi-star', route: '/survey' },
      ]
    },
    {
      label: 'India Services',
      collapsed: true,
      items: [
        { label: 'ABHA Health ID', icon: 'pi pi-id-card', route: '/abha' },
        { label: 'ABDM Health Locker', icon: 'pi pi-database', route: '/abdm-locker' },
        { label: 'eSanjeevani', icon: 'pi pi-video', route: '/esanjeevani' },
        { label: 'CoWIN Certificate', icon: 'pi pi-verified', route: '/cowin' },
        { label: 'Jan Aushadhi', icon: 'pi pi-map-marker', route: '/jan-aushadhi' },
        { label: 'Digital Queue', icon: 'pi pi-clock', route: '/digital-queue' },
      ]
    },
    {
      label: 'Romania / EU Services',
      collapsed: true,
      items: [
        { label: 'DES Viewer', icon: 'pi pi-file-pdf', route: '/des' },
        { label: 'CNAS E-Prescriptions', icon: 'pi pi-file-edit', route: '/cnas' },
        { label: 'EHDS Roadmap', icon: 'pi pi-globe', route: '/ehds' },
      ]
    },
    {
      label: 'Australia Services',
      collapsed: true,
      items: [
        { label: 'My Health Record', icon: 'pi pi-shield', route: '/my-health-record' },
        { label: 'Bulk Billing', icon: 'pi pi-search', route: '/bulk-billing' },
        { label: 'Medicare Benefits', icon: 'pi pi-shield', route: '/medicare-benefits' },
        { label: 'PBS Prescriptions', icon: 'pi pi-box', route: '/pbs' },
        { label: 'First Nations Health', icon: 'pi pi-heart-fill', route: '/first-nations' },
        { label: 'TIS Interpreter', icon: 'pi pi-language', route: '/tis' },
      ]
    },
    {
      label: 'USA Services',
      collapsed: true,
      items: [
        { label: 'OpenNotes', icon: 'pi pi-book', route: '/open-notes' },
        { label: 'Blue Button 2.0', icon: 'pi pi-cloud-download', route: '/blue-button' },
        { label: 'Cures Act Rights', icon: 'pi pi-verified', route: '/cures-act' },
        { label: 'SMART on FHIR', icon: 'pi pi-shield', route: '/smart-fhir' },
        { label: 'CommonWell / Carequality', icon: 'pi pi-share-alt', route: '/commonwell' },
      ]
    },
  ];

  userName = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName} ${user.lastName}` : 'Patient';
  });

  userInitials = computed(() => {
    const user = this.authService.user();
    return user ? `${user.firstName[0]}${user.lastName[0]}` : 'P';
  });

  userMrn = computed(() => {
    const user = this.authService.user();
    return user?.mrn || '';
  });

  ngOnInit(): void {
    // Feature 6.4: Start idle tracking; pass logout callback
    this.idleService.startTracking(() => this.authService.logout());
  }

  ngOnDestroy(): void {
    // Feature 6.4: Clean up on shell destruction
    this.idleService.stopTracking();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.idleService.stopTracking();
    this.authService.logout();
  }

  // Feature 6.3: Role selector methods

  roleLabel(role: 'patient' | 'caregiver' | 'proxy'): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  toggleRoleDropdown(): void {
    this.roleDropdownOpen.update(v => !v);
  }

  selectRole(role: 'patient' | 'caregiver' | 'proxy'): void {
    this.authService.setRole(role);
    this.roleDropdownOpen.set(false);
  }

  // Feature 6.4: Idle timeout dialog actions

  extendSession(): void {
    this.idleService.extendSession();
  }

  idleLogout(): void {
    this.idleService.triggerLogout();
  }
}
