import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../auth/data-access';
import { ThemeService } from '../../shared/data-access';

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
  imports: [CommonModule, RouterModule, ButtonModule, AvatarModule, RippleModule, TooltipModule],
  template: `
    <div class="portal-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo" [class.collapsed]="sidebarCollapsed()">
            <i class="pi pi-heart-fill"></i>
            @if (!sidebarCollapsed()) {
              <span>GoHealth</span>
            }
          </div>
          <button pButton [icon]="sidebarCollapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'"
                  class="p-button-text p-button-rounded collapse-btn"
                  (click)="toggleSidebar()"></button>
        </div>

        <nav class="sidebar-nav">
          @for (group of navGroups; track group.label) {
            @if (!sidebarCollapsed()) {
              <div class="nav-group-header" (click)="group.collapsed = !group.collapsed">
                <span class="nav-group-label">{{ group.label }}</span>
                <i [class]="group.collapsed ? 'pi pi-plus' : 'pi pi-minus'" class="nav-group-toggle"></i>
              </div>
            }
            @if (!group.collapsed || sidebarCollapsed()) {
              @for (item of group.items; track item.route) {
                <a [routerLink]="item.route" routerLinkActive="active" class="nav-item" pRipple
                   [pTooltip]="sidebarCollapsed() ? item.label : ''" tooltipPosition="right">
                  <i [class]="item.icon"></i>
                  @if (!sidebarCollapsed()) {
                    <span>{{ item.label }}</span>
                  }
                  @if (item.badge && item.badge > 0) {
                    <span class="nav-badge">{{ item.badge }}</span>
                  }
                </a>
              }
            }
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-info" [class.collapsed]="sidebarCollapsed()">
            <p-avatar [label]="userInitials()" shape="circle" [style]="{ 'background-color': 'var(--teal-100)', color: 'var(--teal-700)' }"></p-avatar>
            @if (!sidebarCollapsed()) {
              <div class="user-details">
                <span class="user-name">{{ userName() }}</span>
                <span class="user-mrn">MRN: {{ userMrn() }}</span>
              </div>
            }
          </div>
          <button pButton icon="pi pi-sign-out" [label]="sidebarCollapsed() ? '' : 'Sign Out'"
                  class="p-button-text logout-btn" (click)="logout()"
                  [pTooltip]="sidebarCollapsed() ? 'Sign Out' : ''" tooltipPosition="right"></button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Bar -->
        <div class="theme-toggle-bar">
          <div class="topbar-spacer"></div>
          <span class="theme-label"><i class="pi pi-palette"></i> Theme</span>
          <div class="theme-buttons">
            <button class="theme-btn" [class.active]="themeService.activeTheme() === 'classic'" (click)="themeService.setTheme('classic')"
                    pTooltip="Classic" tooltipPosition="bottom">
              <i class="pi pi-desktop"></i>
              <span class="theme-btn-label">Classic</span>
            </button>
            <button class="theme-btn" [class.active]="themeService.activeTheme() === 'beach'" (click)="themeService.setTheme('beach')"
                    pTooltip="Beach" tooltipPosition="bottom">
              <i class="pi pi-sun"></i>
              <span class="theme-btn-label">Beach</span>
            </button>
            <button class="theme-btn" [class.active]="themeService.activeTheme() === 'dark'" (click)="themeService.setTheme('dark')"
                    pTooltip="Dark" tooltipPosition="bottom">
              <i class="pi pi-moon"></i>
              <span class="theme-btn-label">Dark</span>
            </button>
          </div>
          <a routerLink="/notifications" class="notification-bell" pTooltip="Notifications" tooltipPosition="bottom">
            <i class="pi pi-bell"></i>
            <span class="bell-badge">4</span>
          </a>
        </div>
        <router-outlet></router-outlet>
      </main>
    </div>
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
      background: #ef4444;
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
  `]
})
export class ShellComponent {
  private authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  sidebarCollapsed = signal(false);

  navGroups: NavGroup[] = [
    {
      label: 'Overview',
      collapsed: false,
      items: [
        { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard' },
      ]
    },
    {
      label: 'Care & Appointments',
      collapsed: false,
      items: [
        { label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments' },
        { label: 'Telehealth', icon: 'pi pi-video', route: '/telehealth' },
        { label: 'Symptom Checker', icon: 'pi pi-heart', route: '/symptom-checker' },
        { label: 'Providers', icon: 'pi pi-users', route: '/providers' },
        { label: 'Care Team', icon: 'pi pi-users', route: '/care-team' },
      ]
    },
    {
      label: 'Health Records',
      collapsed: false,
      items: [
        { label: 'Health Records', icon: 'pi pi-folder', route: '/records' },
        { label: 'Timeline', icon: 'pi pi-history', route: '/health-timeline' },
        { label: 'Lab Trends', icon: 'pi pi-chart-line', route: '/lab-trends' },
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
        { label: 'Forms', icon: 'pi pi-file-edit', route: '/forms' },
      ]
    },
    {
      label: 'Communication',
      collapsed: false,
      items: [
        { label: 'Messages', icon: 'pi pi-envelope', route: '/messages', badge: 3 },
        { label: 'Settings', icon: 'pi pi-cog', route: '/settings' },
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

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
  }
}
