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
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService, SupportedLang } from '../../../core/services/language.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatDividerModule, MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  auth = inject(AuthService);
  langService = inject(LanguageService);
  themeService = inject(ThemeService);
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
