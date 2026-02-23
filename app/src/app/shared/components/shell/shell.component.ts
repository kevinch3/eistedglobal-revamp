import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, SupportedLang } from '../../../core/services/language.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule,
    TranslatePipe,
  ],
  template: `
    <mat-sidenav-container class="shell-container">
      <mat-sidenav #sidenav [mode]="isHandset() ? 'over' : 'side'"
                   [opened]="!isHandset()" class="sidenav">
        <div class="sidenav-header">
          <span class="logo">Eisteddfod</span>
        </div>
        <mat-nav-list>
          @for (item of navItems; track item.path) {
            <a mat-list-item [routerLink]="item.path"
               routerLinkActive #rla="routerLinkActive"
               [activated]="rla.isActive"
               (click)="isHandset() && sidenav.close()">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.labelKey | translate }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          @if (isHandset()) {
            <button mat-icon-button (click)="sidenav.toggle()" [attr.aria-label]="'common.menu' | translate">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="spacer"></span>

          <!-- User menu button -->
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <mat-icon>account_circle</mat-icon>
            <span class="user-btn-name">{{ auth.currentUser()?.name }}</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>

          <!-- User dropdown menu -->
          <mat-menu #userMenu="matMenu" class="user-menu-panel">
            <!-- Profile header (non-interactive) -->
            <div class="menu-profile" (click)="$event.stopPropagation()">
              <mat-icon class="profile-avatar">account_circle</mat-icon>
              <div class="profile-info">
                <div class="profile-name">{{ auth.currentUser()?.name }}</div>
                <div class="profile-username">{{ auth.currentUser()?.username }}</div>
              </div>
            </div>

            <mat-divider />

            <!-- Language section -->
            <div class="menu-section-label" (click)="$event.stopPropagation()">
              <mat-icon class="section-icon">translate</mat-icon>
              {{ 'user.language' | translate }}
            </div>

            @for (lang of languages; track lang.code) {
              <button mat-menu-item (click)="setLang(lang.code)">
                <mat-icon>{{ langService.currentLang() === lang.code ? 'check' : '' }}</mat-icon>
                {{ lang.label }}
              </button>
            }

            <mat-divider />

            <!-- Logout -->
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              {{ 'user.logout' | translate }}
            </button>
          </mat-menu>
        </mat-toolbar>

        <main class="main-content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .shell-container { height: 100vh; }
    .sidenav { width: 220px; }
    .sidenav-header { padding: 24px 16px 12px; }
    .logo { font-size: 1.4rem; font-weight: 700; letter-spacing: 1px; }
    .spacer { flex: 1; }
    .main-content { padding: 24px; min-height: calc(100vh - 64px); }

    /* User menu button */
    .user-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      color: inherit;
      text-transform: none;
      letter-spacing: normal;
    }
    .user-btn-name {
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 0.9rem;
    }

    /* Profile header inside menu */
    .menu-profile {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: default;
      pointer-events: none;
    }
    .profile-avatar { font-size: 2.5rem; width: 40px; height: 40px; color: #5c6bc0; }
    .profile-info { display: flex; flex-direction: column; }
    .profile-name { font-weight: 600; font-size: 0.95rem; }
    .profile-username { font-size: 0.8rem; color: #888; }

    /* Language section label */
    .menu-section-label {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: default;
    }
    .section-icon { font-size: 1rem; width: 16px; height: 16px; }

    @media (max-width: 599px) {
      .main-content { padding: 12px; }
      .user-btn-name { display: none; }
    }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);
  langService = inject(LanguageService);
  private bp = inject(BreakpointObserver);

  isHandset = toSignal(
    this.bp.observe(Breakpoints.Handset).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  navItems = [
    { path: '/dashboard', icon: 'dashboard', labelKey: 'nav.home' },
    { path: '/participants', icon: 'people', labelKey: 'nav.participants' },
    { path: '/competitions', icon: 'emoji_events', labelKey: 'nav.competitions' },
    { path: '/registrations', icon: 'how_to_reg', labelKey: 'nav.registrations' },
    { path: '/works', icon: 'library_music', labelKey: 'nav.works' },
    { path: '/editions', icon: 'calendar_today', labelKey: 'nav.editions' },
  ];

  /** Language options — labels always shown in their native language */
  languages: { code: SupportedLang; label: string }[] = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'cy', label: 'Cymraeg' },
  ];

  setLang(code: SupportedLang): void {
    this.langService.setLanguage(code);
  }
}
