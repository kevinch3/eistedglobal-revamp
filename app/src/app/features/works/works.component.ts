import { Component, inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Edition, Competition, Work } from '../../core/models';
import { WorkDialogComponent } from './work-dialog.component';

@Component({
  selector: 'app-works',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCardModule, MatSnackBarModule, MatChipsModule,
    TranslatePipe,
  ],
  templateUrl: './works.component.html',
  styleUrl: './works.component.css',
})
export class WorksComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private translate = inject(TranslateService);

  columns = ['title', 'participant', 'competition_id', 'placement', 'actions'];
  dataSource = new MatTableDataSource<Work>();
  editions = signal<Edition[]>([]);
  competitions = signal<Competition[]>([]);
  yearFilter: number | string = '';
  compFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.api.getEditions().subscribe((e) => this.editions.set(e));
    this.load();
  }

  onYearChange(): void {
    this.compFilter = '';
    if (this.yearFilter) {
      this.api.getCompetitions({ year: String(this.yearFilter) }).subscribe((c) => this.competitions.set(c));
    } else {
      this.competitions.set([]);
    }
    this.load();
  }

  load(): void {
    const params = this.compFilter ? { comp: this.compFilter } : undefined;
    this.api.getWorks(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(work?: Work): void {
    const ref = this.dialog.open(WorkDialogComponent, { width: '540px', data: work });
    ref.afterClosed().subscribe((r) => { if (r) this.load(); });
  }

  delete(work: Work): void {
    if (!confirm(this.translate.instant('works.messages.confirmDelete', { title: work.title }))) return;
    this.api.deleteWork(work.id!).subscribe({
      next: () => { this.snack.open(this.translate.instant('works.messages.deleted'), this.translate.instant('common.ok'), { duration: 2000 }); this.load(); },
      error: () => this.snack.open(this.translate.instant('works.messages.deleteError'), this.translate.instant('common.ok'), { duration: 3000 }),
    });
  }

  placementLabel(p: string): string {
    return p === 'mencion'
      ? this.translate.instant('works.placements.mencion')
      : this.translate.instant('works.placements.place', { n: p });
  }

  placementColor(p: string): string {
    return p === '1' ? 'warn' : p === '2' ? 'accent' : 'primary';
  }
}
