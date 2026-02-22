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
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule,
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
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          @if (isHandset()) {
            <button mat-icon-button (click)="sidenav.toggle()" aria-label="Menú">
              <mat-icon>menu</mat-icon>
            </button>
          }
          <span class="spacer"></span>
          <span class="user-name">{{ auth.currentUser()?.name }}</span>
          <button mat-icon-button (click)="auth.logout()" title="Cerrar sesión">
            <mat-icon>logout</mat-icon>
          </button>
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
    .user-name { margin-right: 8px; font-size: 0.9rem; }
    .main-content { padding: 24px; min-height: calc(100vh - 64px); }
    @media (max-width: 599px) {
      .main-content { padding: 12px; }
    }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);
  private bp = inject(BreakpointObserver);

  isHandset = toSignal(
    this.bp.observe(Breakpoints.Handset).pipe(map(r => r.matches)),
    { initialValue: false }
  );

  navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Inicio' },
    { path: '/participants', icon: 'people', label: 'Participantes' },
    { path: '/competitions', icon: 'emoji_events', label: 'Competencias' },
    { path: '/registrations', icon: 'how_to_reg', label: 'Inscripciones' },
    { path: '/works', icon: 'library_music', label: 'Obras' },
    { path: '/editions', icon: 'calendar_today', label: 'Ediciones' },
  ];
}
