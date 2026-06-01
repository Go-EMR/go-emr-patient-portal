import { Component, inject, signal, computed, OnInit, OnDestroy, effect } from '@angular/core';

import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../auth/data-access';
import { ThemeService } from '../../shared/data-access';
import { IdleTimeoutService } from '../../shared/utils';
import { SkipLinkComponent } from '../../shared/ui';
import { CountryFeaturesService } from '../../shared/data-access/country-features.service';
import { NotificationsDataService } from '../../notifications/data-access/notifications-data.service';

type NavTier = 'core' | 'extended' | 'specialist';
type CountryCode = 'US' | 'IN' | 'RO' | 'AU';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  tier: NavTier;
  keywords?: string[];
}

interface NavGroup {
  label: string;
  collapsed: boolean;
  items: NavItem[];
  country?: CountryCode;
}

const LS_PINNED_KEY = 'portal_pinned_nav';
const MAX_PINS = 6;

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, ButtonModule, AvatarModule, RippleModule, TooltipModule, ToastModule, SkipLinkComponent],
  template: `
    <p-toast position="top-right" />
    <app-skip-link></app-skip-link>
    <div class="portal-layout" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Sidebar -->
      <aside class="sidebar" role="navigation" aria-label="Main navigation">
        <div class="sidebar-header">
          <div class="logo" [class.collapsed]="sidebarCollapsed()" aria-label="AuraHealth Patient Portal">
            <i class="pi pi-heart-fill" aria-hidden="true"></i>
            @if (!sidebarCollapsed()) {
              <span>AuraHealth</span>
            }
          </div>
          <button pButton [icon]="sidebarCollapsed() ? 'pi pi-angle-right' : 'pi pi-angle-left'"
                  class="p-button-text p-button-rounded collapse-btn"
                  [attr.aria-label]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
                  (click)="toggleSidebar()"></button>
        </div>

        <nav class="sidebar-nav">
          <!-- Feature 3: Pinned Items Section -->
          @if (pinnedNavItems().length > 0 && !sidebarCollapsed()) {
            <div class="pinned-section" role="region" aria-label="Pinned items">
              <div class="pinned-header">
                <i class="pi pi-star-fill" aria-hidden="true"></i>
                <span>Pinned</span>
              </div>
              @for (item of pinnedNavItems(); track item.route) {
                <a [routerLink]="item.route" routerLinkActive="active" class="nav-item pinned-nav-item" pRipple
                   [attr.aria-label]="item.label + (item.badge ? ', ' + item.badge + ' unread' : '')">
                  <i [class]="item.icon" aria-hidden="true"></i>
                  <span>{{ item.label }}</span>
                  @if (item.badge && item.badge > 0) {
                    <span class="nav-badge" [attr.aria-label]="item.badge + ' unread'">{{ item.badge }}</span>
                  }
                  <button class="unpin-btn"
                          (click)="togglePin(item.route); $event.preventDefault(); $event.stopPropagation()"
                          [attr.aria-label]="'Unpin ' + item.label">
                    <i class="pi pi-times" aria-hidden="true"></i>
                  </button>
                </a>
              }
            </div>
          }

          <!-- Feature 1: Core nav groups (always visible) -->
          @for (group of visibleNavGroups(); track group.label) {
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
                  @if (!sidebarCollapsed()) {
                    <button class="pin-btn"
                            [class.pinned]="isPinned(item.route)"
                            (click)="togglePin(item.route); $event.preventDefault(); $event.stopPropagation()"
                            [attr.aria-label]="isPinned(item.route) ? 'Unpin ' + item.label : 'Pin ' + item.label">
                      <i [class]="isPinned(item.route) ? 'pi pi-star-fill' : 'pi pi-star'" aria-hidden="true"></i>
                    </button>
                  }
                </a>
              }
            }
          }

          <!-- Feature 1: More Features toggle -->
          @if (!sidebarCollapsed()) {
            <div class="more-toggle"
                 (click)="toggleExtended()"
                 role="button"
                 tabindex="0"
                 [attr.aria-expanded]="showExtended()"
                 aria-controls="extended-nav-region"
                 (keydown.enter)="toggleExtended()"
                 (keydown.space)="toggleExtended()">
              <span>More Features</span>
              <i [class]="showExtended() ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true"></i>
            </div>
          }

          <!-- Feature 1+2: Extended nav groups (visible when expanded, country-gated) -->
          @if (showExtended() || sidebarCollapsed()) {
            <div id="extended-nav-region">
              @for (group of extendedNavGroups(); track group.label) {
                @if (!sidebarCollapsed()) {
                  <div class="nav-group-header extended-group-header"
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
                      @if (!sidebarCollapsed()) {
                        <button class="pin-btn"
                                [class.pinned]="isPinned(item.route)"
                                (click)="togglePin(item.route); $event.preventDefault(); $event.stopPropagation()"
                                [attr.aria-label]="isPinned(item.route) ? 'Unpin ' + item.label : 'Pin ' + item.label">
                          <i [class]="isPinned(item.route) ? 'pi pi-star-fill' : 'pi pi-star'" aria-hidden="true"></i>
                        </button>
                      }
                    </a>
                  }
                }
              }
            </div>
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
          <button class="topbar-search" (click)="openSearch()" aria-label="Open search (Ctrl+K)">
            <i class="pi pi-search" aria-hidden="true"></i>
            <span class="topbar-search-text">Search...</span>
            <kbd class="topbar-search-kbd" aria-hidden="true">Ctrl K</kbd>
          </button>
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
          <button class="topbar-icon-btn" pTooltip="Take a Tour" tooltipPosition="bottom"
                  (click)="startTour()" aria-label="Start guided tour">
            <i class="pi pi-question-circle" aria-hidden="true"></i>
          </button>
          <a routerLink="/notifications" class="notification-bell" pTooltip="Notifications" tooltipPosition="bottom"
             [attr.aria-label]="unreadNotifications() > 0 ? 'Notifications, ' + unreadNotifications() + ' unread' : 'Notifications'">
            <i class="pi pi-bell" aria-hidden="true"></i>
            @if (unreadNotifications() > 0) {
              <span class="bell-badge" aria-hidden="true">{{ unreadNotifications() }}</span>
            }
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
      position: sticky;
      top: 0;
      height: 100vh;
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
      overflow: visible;
      flex: 1;
      min-width: 0;
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

      .topbar-search {
        min-width: auto;
      }

      .topbar-search-text {
        display: none;
      }
    }

    .topbar-search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: 8px;
      background: var(--surface-ground);
      color: var(--text-color-secondary);
      font-family: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.15s ease;
      min-width: 220px;
    }

    .topbar-search:hover {
      border-color: var(--primary-200);
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .topbar-search:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .topbar-search i {
      font-size: 0.9rem;
      opacity: 0.7;
    }

    .topbar-search-text {
      flex: 1;
      text-align: left;
    }

    .topbar-search-kbd {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      background: var(--surface-200);
      color: var(--text-color-secondary);
      font-size: 0.65rem;
      font-weight: 600;
      font-family: inherit;
      letter-spacing: 0.03em;
      border: 1px solid var(--surface-border);
    }

    .topbar-spacer {
      flex: 1;
    }

    .topbar-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: var(--text-color-secondary);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1.15rem;
    }

    .topbar-icon-btn:hover {
      background: var(--surface-hover);
      color: var(--primary-color);
    }

    .topbar-icon-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
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

    /* =====================================================
       Feature 1: More Features Toggle
       ===================================================== */
    .more-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      margin-top: 0.75rem;
      cursor: pointer;
      user-select: none;
      border-top: 1px solid var(--surface-border);
      border-bottom: 1px solid var(--surface-border);
      color: var(--text-color-secondary);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      transition: color 0.15s ease, background 0.15s ease;
      border-radius: var(--border-radius);
    }

    .more-toggle:hover {
      background: var(--surface-hover);
      color: var(--text-color);
    }

    .more-toggle:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .more-toggle i {
      font-size: 0.65rem;
      transition: transform 0.2s ease;
    }

    .extended-group-header {
      opacity: 0.85;
    }

    /* =====================================================
       Feature 3: Pinned Items
       ===================================================== */
    .pinned-section {
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--surface-border);
    }

    .pinned-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--yellow-600);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.25rem 1rem;
      margin-bottom: 0.25rem;
    }

    .pinned-nav-item {
      padding-right: 2.5rem;
    }

    .unpin-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      font-size: 0.7rem;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.15s ease, color 0.15s ease;
    }

    .pinned-nav-item:hover .unpin-btn {
      opacity: 1;
    }

    .unpin-btn:hover {
      color: var(--red-500);
    }

    .unpin-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      opacity: 1;
    }

    .pin-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0;
      transition: opacity 0.15s ease, color 0.15s ease;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-color-secondary);
      font-size: 0.75rem;
      padding: 0.25rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-item:hover .pin-btn {
      opacity: 1;
    }

    .pin-btn.pinned {
      opacity: 1;
      color: var(--yellow-600);
    }

    .pin-btn:hover {
      color: var(--yellow-500);
    }

    .pin-btn:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
      opacity: 1;
    }

    /* Ensure badge doesn't overlap pin button when both visible */
    .nav-item:has(.pin-btn) .nav-badge {
      margin-right: 1.75rem;
    }
  `]
})
export class ShellComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastService = inject(MessageService);
  readonly themeService = inject(ThemeService);
  readonly idleService = inject(IdleTimeoutService);
  private countryService = inject(CountryFeaturesService);
  private notificationsData = inject(NotificationsDataService);
  private messagePollTimer: ReturnType<typeof setInterval> | null = null;
  private lastThreadSnapshot: { id: string; unreadCount: number }[] = [];

  // Topbar bell — live count of unread notifications for this patient.
  readonly unreadNotifications = this.notificationsData.unreadCount;

  sidebarCollapsed = signal(false);

  // Feature 6.3: role management
  currentRole = this.authService.role;
  roleDropdownOpen = signal(false);

  // Feature 1: Extended nav toggle
  showExtended = signal(false);

  // Feature 3: Pinned routes persisted to localStorage
  pinnedRoutes = signal<string[]>(this.loadPinnedRoutes());

  readonly roleOptions: { value: 'patient' | 'caregiver' | 'proxy'; label: string }[] = [
    { value: 'patient', label: 'Patient' },
    { value: 'caregiver', label: 'Caregiver' },
    { value: 'proxy', label: 'Proxy' },
  ];

  // All nav groups — core groups contain only 'core' tier items shown by default.
  // Extended/specialist groups are shown under "More Features".
  private readonly allCoreGroups: NavGroup[] = [
    {
      label: 'Overview',
      collapsed: false,
      items: [
        { label: 'Dashboard', icon: 'pi pi-home', route: '/dashboard', tier: 'core', keywords: ['home', 'overview', 'summary'] },
        { label: 'Quick Help', icon: 'pi pi-question-circle', route: '/triage', tier: 'core', keywords: ['help', 'triage', 'urgent'] },
      ]
    },
    {
      label: 'Care & Appointments',
      collapsed: false,
      items: [
        { label: 'Appointments', icon: 'pi pi-calendar', route: '/appointments', tier: 'core', keywords: ['schedule', 'visit', 'booking'] },
      ]
    },
    {
      label: 'Health Records',
      collapsed: false,
      items: [
        { label: 'Health Records', icon: 'pi pi-folder', route: '/records', tier: 'core', keywords: ['records', 'history', 'chart'] },
        { label: 'Prescriptions', icon: 'pi pi-box', route: '/prescriptions', tier: 'core', keywords: ['medications', 'drugs', 'rx', 'pharmacy'] },
      ]
    },
    {
      label: 'Family',
      collapsed: false,
      items: [
        { label: 'Family', icon: 'pi pi-heart', route: '/family', tier: 'core', keywords: ['family', 'pets', 'companions', 'dependents'] },
      ]
    },
    {
      label: 'Billing & Insurance',
      collapsed: false,
      items: [
        { label: 'Billing', icon: 'pi pi-credit-card', route: '/billing', tier: 'core', keywords: ['payment', 'invoice', 'statement', 'cost'] },
      ]
    },
    {
      label: 'Communication',
      collapsed: false,
      items: [
        { label: 'Messages', icon: 'pi pi-envelope', route: '/messages', tier: 'core', keywords: ['inbox', 'chat', 'doctor', 'secure'] },
        { label: 'Settings', icon: 'pi pi-cog', route: '/settings', tier: 'core', keywords: ['preferences', 'account', 'profile', 'notifications'] },
      ]
    },
  ];

  // Extended groups — shown when "More Features" is expanded.
  // Specialist items (rarely used) are grouped in collapsed state.
  private readonly allExtendedGroups: NavGroup[] = [
    {
      label: 'Care & Appointments',
      collapsed: false,
      items: [
        { label: 'Telehealth', icon: 'pi pi-video', route: '/telehealth', tier: 'extended', keywords: ['video', 'virtual visit', 'remote'] },
        { label: 'Symptom Checker', icon: 'pi pi-heart', route: '/symptom-checker', tier: 'extended', keywords: ['symptoms', 'ai', 'check'] },
        { label: 'Referrals', icon: 'pi pi-directions', route: '/referrals', tier: 'extended', keywords: ['specialist', 'refer'] },
        { label: 'Providers', icon: 'pi pi-users', route: '/providers', tier: 'extended', keywords: ['doctors', 'physicians', 'find'] },
        { label: 'Care Team', icon: 'pi pi-users', route: '/care-team', tier: 'extended', keywords: ['team', 'nurses', 'coordinators'] },
        { label: 'Queue Status', icon: 'pi pi-clock', route: '/queue-status', tier: 'specialist', keywords: ['wait', 'queue', 'line'] },
        { label: 'Check-In', icon: 'pi pi-check-circle', route: '/check-in/APT-001', tier: 'specialist', keywords: ['arrive', 'check in'] },
        { label: 'Waitlist', icon: 'pi pi-hourglass', route: '/waitlist', tier: 'specialist', keywords: ['waitlist', 'cancellation'] },
      ]
    },
    {
      label: 'Health Records',
      collapsed: false,
      items: [
        { label: 'Visit Summaries', icon: 'pi pi-file-check', route: '/visit-summaries', tier: 'extended', keywords: ['after visit', 'notes', 'summary'] },
        { label: 'Care Plans', icon: 'pi pi-clipboard', route: '/care-plans', tier: 'extended', keywords: ['plan', 'goals', 'treatment'] },
        { label: 'Health Analytics', icon: 'pi pi-chart-bar', route: '/health-analytics', tier: 'extended', keywords: ['trends', 'analytics', 'data'] },
        { label: 'Timeline', icon: 'pi pi-history', route: '/health-timeline', tier: 'extended', keywords: ['history', 'events', 'timeline'] },
        { label: 'Lab Trends', icon: 'pi pi-chart-line', route: '/lab-trends', tier: 'extended', keywords: ['labs', 'results', 'graph'] },
        { label: 'Questionnaires', icon: 'pi pi-list-check', route: '/questionnaires', tier: 'extended', keywords: ['forms', 'survey', 'assessment'] },
        { label: 'Devices', icon: 'pi pi-mobile', route: '/devices', tier: 'extended', keywords: ['wearable', 'monitor', 'connected'] },
      ]
    },
    {
      label: 'Billing & Insurance',
      collapsed: false,
      items: [
        { label: 'Insurance', icon: 'pi pi-id-card', route: '/insurance', tier: 'extended', keywords: ['coverage', 'plan', 'benefits'] },
        { label: 'Pre-Auth', icon: 'pi pi-verified', route: '/preauth-request', tier: 'extended', keywords: ['authorization', 'approval', 'prior auth'] },
        { label: 'Forms', icon: 'pi pi-file-edit', route: '/forms', tier: 'extended', keywords: ['documents', 'paperwork'] },
      ]
    },
    {
      label: 'Communication',
      collapsed: false,
      items: [
        { label: 'Feedback', icon: 'pi pi-comment', route: '/feedback', tier: 'specialist', keywords: ['review', 'rating', 'experience'] },
        { label: 'Audit Log', icon: 'pi pi-shield', route: '/audit-log', tier: 'specialist', keywords: ['access log', 'privacy', 'security'] },
      ]
    },
    {
      label: 'Family',
      collapsed: false,
      items: [
        { label: 'Family Chart', icon: 'pi pi-sitemap', route: '/family/chart', tier: 'specialist', keywords: ['pedigree', 'tree', 'chart'] },
        { label: 'Permissions', icon: 'pi pi-lock', route: '/family/permissions', tier: 'specialist', keywords: ['access', 'sharing', 'delegate'] },
        { label: 'Family History', icon: 'pi pi-history', route: '/health/family-history', tier: 'specialist', keywords: ['hereditary', 'history', 'conditions'] },
        { label: 'Genetic Tests', icon: 'pi pi-sliders-h', route: '/health/genetic-tests', tier: 'specialist', keywords: ['dna', 'genomics', 'testing'] },
        { label: 'Genetic Risk', icon: 'pi pi-exclamation-triangle', route: '/health/genetic-risk', tier: 'specialist', keywords: ['risk', 'hereditary', 'genomics'] },
        // Staff-only features (GoEMR): Jurisdiction, Drug Schedules, Telehealth Check, Consent Rules, Proxy Accounts
      ]
    },
    {
      label: 'Tools',
      collapsed: true,
      items: [
        { label: 'Sick Note', icon: 'pi pi-file', route: '/sick-note', tier: 'specialist', keywords: ['excuse', 'work', 'school'] },
        { label: 'Record Sharing', icon: 'pi pi-share-alt', route: '/record-sharing', tier: 'specialist', keywords: ['share', 'export', 'transfer'] },
        { label: 'Survey', icon: 'pi pi-star', route: '/survey', tier: 'specialist', keywords: ['satisfaction', 'feedback', 'survey'] },
      ]
    },
    {
      label: 'India Services',
      collapsed: true,
      country: 'IN',
      items: [
        { label: 'ABHA Health ID', icon: 'pi pi-id-card', route: '/abha', tier: 'specialist', keywords: ['abha', 'ayushman', 'health id'] },
        { label: 'ABDM Health Locker', icon: 'pi pi-database', route: '/abdm-locker', tier: 'specialist', keywords: ['locker', 'records', 'abdm'] },
        { label: 'eSanjeevani', icon: 'pi pi-video', route: '/esanjeevani', tier: 'specialist', keywords: ['telemedicine', 'government', 'india'] },
        { label: 'CoWIN Certificate', icon: 'pi pi-verified', route: '/cowin', tier: 'specialist', keywords: ['vaccination', 'covid', 'certificate'] },
        { label: 'Jan Aushadhi', icon: 'pi pi-map-marker', route: '/jan-aushadhi', tier: 'specialist', keywords: ['pharmacy', 'generic', 'medicine'] },
        { label: 'Digital Queue', icon: 'pi pi-clock', route: '/digital-queue', tier: 'specialist', keywords: ['queue', 'token', 'opd'] },
      ]
    },
    {
      label: 'Romania / EU Services',
      collapsed: true,
      country: 'RO',
      items: [
        { label: 'DES Viewer', icon: 'pi pi-file-pdf', route: '/des', tier: 'specialist', keywords: ['medical record', 'des', 'romania'] },
        { label: 'CNAS E-Prescriptions', icon: 'pi pi-file-edit', route: '/cnas', tier: 'specialist', keywords: ['prescription', 'cnas', 'reimbursement'] },
        { label: 'EHDS Roadmap', icon: 'pi pi-globe', route: '/ehds', tier: 'specialist', keywords: ['european', 'health data', 'ehds'] },
      ]
    },
    {
      label: 'Australia Services',
      collapsed: true,
      country: 'AU',
      items: [
        { label: 'My Health Record', icon: 'pi pi-shield', route: '/my-health-record', tier: 'specialist', keywords: ['my health record', 'mhr', 'australia'] },
        { label: 'Bulk Billing', icon: 'pi pi-search', route: '/bulk-billing', tier: 'specialist', keywords: ['bulk billing', 'gp', 'medicare'] },
        { label: 'Medicare Benefits', icon: 'pi pi-shield', route: '/medicare-benefits', tier: 'specialist', keywords: ['medicare', 'rebate', 'australia'] },
        { label: 'PBS Prescriptions', icon: 'pi pi-box', route: '/pbs', tier: 'specialist', keywords: ['pbs', 'pharmaceutical', 'subsidy'] },
        { label: 'First Nations Health', icon: 'pi pi-heart-fill', route: '/first-nations', tier: 'specialist', keywords: ['indigenous', 'aboriginal', 'torres strait'] },
        { label: 'TIS Interpreter', icon: 'pi pi-language', route: '/tis', tier: 'specialist', keywords: ['interpreter', 'language', 'translation'] },
      ]
    },
    {
      label: 'USA Services',
      collapsed: true,
      country: 'US',
      items: [
        { label: 'OpenNotes', icon: 'pi pi-book', route: '/open-notes', tier: 'specialist', keywords: ['notes', 'transparency', 'records'] },
        { label: 'Blue Button 2.0', icon: 'pi pi-cloud-download', route: '/blue-button', tier: 'specialist', keywords: ['cms', 'medicare', 'download'] },
        { label: 'Cures Act Rights', icon: 'pi pi-verified', route: '/cures-act', tier: 'specialist', keywords: ['21st century cures', 'information blocking', 'rights'] },
        { label: 'SMART on FHIR', icon: 'pi pi-shield', route: '/smart-fhir', tier: 'specialist', keywords: ['fhir', 'api', 'apps'] },
        { label: 'CommonWell / Carequality', icon: 'pi pi-share-alt', route: '/commonwell', tier: 'specialist', keywords: ['interoperability', 'exchange', 'network'] },
      ]
    },
  ];

  // Feature 1: Computed — only core groups with items (non-empty after tier filter)
  visibleNavGroups = computed<NavGroup[]>(() => {
    return this.allCoreGroups
      .map(g => ({ ...g, items: g.items.filter(i => i.tier === 'core') }))
      .filter(g => g.items.length > 0);
  });

  // Feature 1 + 2: Computed — extended/specialist groups, filtered by country
  extendedNavGroups = computed<NavGroup[]>(() => {
    const userCountry = this.countryService.country();
    return this.allExtendedGroups
      .filter(g => !g.country || g.country === userCountry)
      .map(g => ({ ...g, items: g.items }))
      .filter(g => g.items.length > 0);
  });

  // Feature 3: Flat lookup of all nav items across both core and extended groups
  private get allNavItems(): NavItem[] {
    const coreItems = this.allCoreGroups.flatMap(g => g.items);
    const extendedItems = this.allExtendedGroups.flatMap(g => g.items);
    return [...coreItems, ...extendedItems];
  }

  // Feature 3: Computed — resolve pinned route strings to full NavItem objects
  pinnedNavItems = computed<NavItem[]>(() => {
    const routes = this.pinnedRoutes();
    const itemMap = new Map(this.allNavItems.map(item => [item.route, item]));
    return routes
      .map(r => itemMap.get(r))
      .filter((item): item is NavItem => item !== undefined);
  });

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

  constructor() {
    // Feature 3: Persist pinned routes to localStorage whenever they change
    effect(() => {
      const pins = this.pinnedRoutes();
      try {
        localStorage.setItem(LS_PINNED_KEY, JSON.stringify(pins));
      } catch { /* storage quota or private browsing */ }
    });
  }

  ngOnInit(): void {
    // Feature 6.4: Start idle tracking; pass logout callback
    this.idleService.startTracking(() => this.authService.logout());

    // Load notifications so the bell badge reflects real unread counts
    // (was previously hardcoded to 4).
    this.notificationsData.loadNotifications();

    // Poll for new messages every 30s for toast notifications
    this.messagePollTimer = setInterval(() => this.pollForNewMessages(), 30000);
  }

  ngOnDestroy(): void {
    // Feature 6.4: Clean up on shell destruction
    this.idleService.stopTracking();
    if (this.messagePollTimer) {
      clearInterval(this.messagePollTimer);
    }
  }

  private pollForNewMessages(): void {
    const patientId = this.authService.user()?.patientId;
    const token = localStorage.getItem('portal_token') || '';
    if (!patientId || !token) return;

    fetch(`/api/v1/portal/patients/${patientId}/messages?page=1&page_size=50`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : null).then(data => {
      if (!data?.threads) return;
      const newSnapshot = data.threads.map((t: any) => ({
        id: t.id,
        unreadCount: t.unread_count ?? 0,
        providerName: t.provider_name || 'Care Team',
        subject: t.subject || 'Message',
      }));

      if (this.lastThreadSnapshot.length > 0) {
        for (const thread of newSnapshot) {
          const prev = this.lastThreadSnapshot.find((t: any) => t.id === thread.id);
          if (!prev && thread.unreadCount > 0) {
            this.toastService.add({
              severity: 'info',
              summary: 'New Message',
              detail: `${thread.providerName} sent you a message`,
              life: 5000,
            });
          } else if (prev && thread.unreadCount > (prev as any).unreadCount) {
            this.toastService.add({
              severity: 'info',
              summary: 'New Message',
              detail: `New message from ${thread.providerName}: ${thread.subject}`,
              life: 5000,
            });
          }
        }
      }
      this.lastThreadSnapshot = newSnapshot;
    }).catch(() => {});
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  // Feature 1: Toggle extended nav section
  toggleExtended(): void {
    this.showExtended.update(v => !v);
  }

  // Open the global command palette by dispatching Ctrl+K
  openSearch(): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  }

  // Restart the guided onboarding tour
  startTour(): void {
    localStorage.removeItem('onboarding_completed');
    void this.router.navigate(['/onboarding']);
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

  // Feature 3: Pin/unpin a nav item by route

  togglePin(route: string): void {
    this.pinnedRoutes.update(current => {
      const idx = current.indexOf(route);
      if (idx !== -1) {
        // Already pinned — remove it
        return current.filter(r => r !== route);
      }
      if (current.length >= MAX_PINS) {
        // Silently enforce the 6-pin cap
        return current;
      }
      return [...current, route];
    });
  }

  isPinned(route: string): boolean {
    return this.pinnedRoutes().includes(route);
  }

  // Feature 3: Load pinned routes from localStorage on startup
  private loadPinnedRoutes(): string[] {
    try {
      const stored = localStorage.getItem(LS_PINNED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_PINS);
        }
      }
    } catch { /* ignore parse errors */ }
    return [];
  }
}
