import { Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, RouterLink],
  template: `
    <h1 class="page-title">Panel Principal</h1>

    <div class="stats-grid">
      @for (stat of stats(); track stat.label) {
        <mat-card class="stat-card" [routerLink]="stat.route">
          <mat-card-content>
            <mat-icon class="stat-icon" [style.color]="stat.color">{{ stat.icon }}</mat-icon>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </mat-card-content>
        </mat-card>
      }
    </div>

    <div class="quick-links">
      <h2>Accesos rápidos</h2>
      <div class="links-grid">
        @for (item of quickLinks; track item.label) {
          <mat-card class="link-card" [routerLink]="item.route">
            <mat-card-content>
              <mat-icon>{{ item.icon }}</mat-icon>
              <span>{{ item.label }}</span>
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
  stats = signal<{ label: string; value: number; icon: string; color: string; route: string }[]>([]);

  quickLinks = [
    { icon: 'person_add', label: 'Nueva persona', route: '/personas' },
    { icon: 'how_to_reg', label: 'Nueva inscripción', route: '/inscripciones' },
    { icon: 'library_add', label: 'Nueva obra', route: '/obras' },
    { icon: 'add_circle', label: 'Nueva competencia', route: '/competencias' },
  ];

  ngOnInit(): void {
    this.api.getPersonas().subscribe((p) => this.updateStat('Personas', p.length, 'people', '#1565c0', '/personas'));
    this.api.getCompetencias().subscribe((c) =>
      this.updateStat('Competencias', c.length, 'emoji_events', '#6a1b9a', '/competencias')
    );
    this.api.getInscriptos().subscribe((i) =>
      this.updateStat('Inscripciones', i.length, 'how_to_reg', '#2e7d32', '/inscripciones')
    );
    this.api.getObras().subscribe((o) =>
      this.updateStat('Obras', o.length, 'library_music', '#e65100', '/obras')
    );
  }

  private updateStat(label: string, value: number, icon: string, color: string, route: string): void {
    this.stats.update((prev) => {
      const idx = prev.findIndex((s) => s.label === label);
      const entry = { label, value, icon, color, route };
      return idx >= 0 ? prev.map((s, i) => (i === idx ? entry : s)) : [...prev, entry];
    });
  }
}
