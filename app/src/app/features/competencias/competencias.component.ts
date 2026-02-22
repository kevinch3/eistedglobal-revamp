import { Component, inject, OnInit, ViewChild, signal } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Anio, Competencia } from '../../core/models';
import { CompetenciaDialogComponent } from './competencia-dialog.component';

@Component({
  selector: 'app-competencias',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCardModule, MatSnackBarModule, MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Competencias</h1>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>add</mat-icon> Nueva competencia
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Edición (año)</mat-label>
            <mat-select [(ngModel)]="anioFilter" (ngModelChange)="load()">
              <mat-option value="">Todas</mat-option>
              @for (a of anios(); track a.id_anio) {
                <mat-option [value]="a.id_anio">{{ a.id_anio }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [(ngModel)]="grupindFilter" (ngModelChange)="load()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="IND">Individual</mat-option>
              <mat-option value="GRU">Grupal</mat-option>
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
          <ng-container matColumnDef="id_comp">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
            <td mat-cell *matCellDef="let c"><code>{{ c.id_comp }}</code></td>
          </ng-container>

          <ng-container matColumnDef="descripcion">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Descripción</th>
            <td mat-cell *matCellDef="let c">{{ c.descripcion }}</td>
          </ng-container>

          <ng-container matColumnDef="cat_nombre">
            <th mat-header-cell *matHeaderCellDef>Categoría</th>
            <td mat-cell *matCellDef="let c">{{ c.cat_nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="grupind">
            <th mat-header-cell *matHeaderCellDef>Tipo</th>
            <td mat-cell *matCellDef="let c">
              <mat-chip [color]="c.grupind === 'IND' ? 'primary' : 'accent'" highlighted>
                {{ c.grupind === 'IND' ? 'Individual' : 'Grupal' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="idioma">
            <th mat-header-cell *matHeaderCellDef>Idioma</th>
            <td mat-cell *matCellDef="let c">{{ c.idioma || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="fk_anio">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Año</th>
            <td mat-cell *matCellDef="let c">{{ c.fk_anio }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let c">
              <button mat-icon-button color="primary" (click)="openDialog(c)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(c)"><mat-icon>delete</mat-icon></button>
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
    .filters mat-form-field { min-width: 180px; }
    .full-width { width: 100%; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .no-data { padding: 24px; text-align: center; color: #999; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
  `],
})
export class CompetenciasComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  columns = ['id_comp', 'descripcion', 'cat_nombre', 'grupind', 'idioma', 'fk_anio', 'actions'];
  dataSource = new MatTableDataSource<Competencia>();
  anios = signal<Anio[]>([]);
  anioFilter = '';
  grupindFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.api.getAnios().subscribe((a) => this.anios.set(a));
    this.load();
  }

  load(): void {
    const params: Record<string, string> = {};
    if (this.anioFilter) params['anio'] = this.anioFilter;
    if (this.grupindFilter) params['grupind'] = this.grupindFilter;
    this.api.getCompetencias(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(comp?: Competencia): void {
    const ref = this.dialog.open(CompetenciaDialogComponent, { width: '560px', data: comp });
    ref.afterClosed().subscribe((r) => { if (r) this.load(); });
  }

  delete(comp: Competencia): void {
    if (!confirm(`¿Eliminar competencia ${comp.id_comp}?`)) return;
    this.api.deleteCompetencia(comp.id_comp).subscribe({
      next: () => { this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Error al eliminar', 'OK', { duration: 3000 }),
    });
  }
}
