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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
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
