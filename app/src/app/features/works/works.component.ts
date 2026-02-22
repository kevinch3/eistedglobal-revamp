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
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Obras</h1>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>library_add</mat-icon> Nueva obra
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Año</mat-label>
            <mat-select [(ngModel)]="yearFilter" (ngModelChange)="onYearChange()">
              <mat-option value="">Todos</mat-option>
              @for (e of editions(); track e.year) {
                <mat-option [value]="e.year">{{ e.year }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Competencia</mat-label>
            <mat-select [(ngModel)]="compFilter" (ngModelChange)="load()">
              <mat-option value="">Todas</mat-option>
              @for (c of competitions(); track c.id) {
                <mat-option [value]="c.id">{{ c.id }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Buscar</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (input)="applyFilter($event)" />
          </mat-form-field>
        </div>

        <div class="table-scroll">
        <table mat-table [dataSource]="dataSource" matSort class="full-width">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Obra</th>
            <td mat-cell *matCellDef="let w">{{ w.title }}</td>
          </ng-container>

          <ng-container matColumnDef="participant">
            <th mat-header-cell *matHeaderCellDef>Participante</th>
            <td mat-cell *matCellDef="let w">
              {{ w.display_name || (w.surname ? w.surname + ', ' + w.name : w.name) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="competition_id">
            <th mat-header-cell *matHeaderCellDef>Competencia</th>
            <td mat-cell *matCellDef="let w"><code>{{ w.competition_id }}</code></td>
          </ng-container>

          <ng-container matColumnDef="placement">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Puesto</th>
            <td mat-cell *matCellDef="let w">
              @if (w.placement) {
                <mat-chip [color]="placementColor(w.placement)" highlighted>{{ placementLabel(w.placement) }}</mat-chip>
              } @else { — }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let w">
              <button mat-icon-button color="primary" (click)="openDialog(w)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(w)"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data" [attr.colspan]="columns.length">Sin resultados</td>
          </tr>
        </table>
        </div>
        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
    .page-title { font-size: 1.8rem; font-weight: 600; color: #1a237e; margin: 0; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .no-data { padding: 24px; text-align: center; color: #999; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
  `],
})
export class WorksComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

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
    if (!confirm(`¿Eliminar "${work.title}"?`)) return;
    this.api.deleteWork(work.id!).subscribe({
      next: () => { this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Error', 'OK', { duration: 3000 }),
    });
  }

  placementLabel(p: string): string {
    return p === 'mencion' ? 'Mención' : `${p}° lugar`;
  }

  placementColor(p: string): string {
    return p === '1' ? 'warn' : p === '2' ? 'accent' : 'primary';
  }
}
