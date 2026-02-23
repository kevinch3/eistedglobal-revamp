import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterLink, TranslatePipe],
  template: `
    <h1 class="page-title">{{ 'dashboard.title' | translate }}</h1>

    <div class="stats-grid">
      @for (stat of stats(); track stat.key) {
        <mat-card class="stat-card" [routerLink]="stat.route">
          <mat-card-content>
            <mat-icon class="stat-icon" [style.color]="stat.color">{{ stat.icon }}</mat-icon>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.key | translate }}</div>
          </mat-card-content>
        </mat-card>
      }
    </div>

    <div class="quick-links">
      <h2>{{ 'dashboard.quickAccess' | translate }}</h2>
      <div class="links-grid">
        @for (item of quickLinks; track item.labelKey) {
          <mat-card class="link-card" [routerLink]="item.route">
            <mat-card-content>
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.labelKey | translate }}</span>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-title { font-size: 1.8rem; font-weight: 600; margin-bottom: 24px; color: #1a237e; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { cursor: pointer; transition: box-shadow .2s; }
    .stat-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.15); }
    .stat-card mat-card-content { text-align: center; padding: 24px 16px; }
    .stat-icon { font-size: 2.5rem; width: 40px; height: 40px; margin-bottom: 8px; }
    .stat-value { font-size: 2rem; font-weight: 700; }
    .stat-label { color: #666; font-size: .9rem; }
    h2 { margin-bottom: 16px; color: #333; }
    .links-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .link-card { cursor: pointer; }
    .link-card mat-card-content { display: flex; align-items: center; gap: 12px; padding: 16px; }
    .link-card mat-icon { color: #1a237e; }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<{ key: string; value: number; icon: string; color: string; route: string }[]>([]);

  quickLinks = [
    { icon: 'person_add', labelKey: 'dashboard.newParticipant', route: '/participants' },
    { icon: 'how_to_reg', labelKey: 'dashboard.newRegistration', route: '/registrations' },
    { icon: 'library_add', labelKey: 'dashboard.newWork', route: '/works' },
    { icon: 'add_circle', labelKey: 'dashboard.newCompetition', route: '/competitions' },
  ];

  ngOnInit(): void {
    this.api.getParticipants().subscribe((p) => this.updateStat('dashboard.participants', p.length, 'people', '#1565c0', '/participants'));
    this.api.getCompetitions().subscribe((c) =>
      this.updateStat('dashboard.competitions', c.length, 'emoji_events', '#6a1b9a', '/competitions')
    );
    this.api.getRegistrations().subscribe((r) =>
      this.updateStat('dashboard.registrations', r.length, 'how_to_reg', '#2e7d32', '/registrations')
    );
    this.api.getWorks().subscribe((w) =>
      this.updateStat('dashboard.works', w.length, 'library_music', '#e65100', '/works')
    );
  }

  private updateStat(key: string, value: number, icon: string, color: string, route: string): void {
    this.stats.update((prev) => {
      const idx = prev.findIndex((s) => s.key === key);
      const entry = { key, value, icon, color, route };
      return idx >= 0 ? prev.map((s, i) => (i === idx ? entry : s)) : [...prev, entry];
    });
  }
}
