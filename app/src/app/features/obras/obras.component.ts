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
import { Anio, Competencia, Obra } from '../../core/models';
import { ObraDialogComponent } from './obra-dialog.component';

@Component({
  selector: 'app-obras',
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
            <mat-select [(ngModel)]="anioFilter" (ngModelChange)="onAnioChange()">
              <mat-option value="">Todos</mat-option>
              @for (a of anios(); track a.id_anio) {
                <mat-option [value]="a.id_anio">{{ a.id_anio }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Competencia</mat-label>
            <mat-select [(ngModel)]="compFilter" (ngModelChange)="load()">
              <mat-option value="">Todas</mat-option>
              @for (c of competencias(); track c.id_comp) {
                <mat-option [value]="c.id_comp">{{ c.id_comp }}</mat-option>
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
          <ng-container matColumnDef="nom_obra">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Obra</th>
            <td mat-cell *matCellDef="let o">{{ o.nom_obra }}</td>
          </ng-container>

          <ng-container matColumnDef="participante">
            <th mat-header-cell *matHeaderCellDef>Participante</th>
            <td mat-cell *matCellDef="let o">
              {{ o.mod_particip || (o.apellido ? o.apellido + ', ' + o.nombre : o.nombre) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="competencia">
            <th mat-header-cell *matHeaderCellDef>Competencia</th>
            <td mat-cell *matCellDef="let o"><code>{{ o.competencia }}</code></td>
          </ng-container>

          <ng-container matColumnDef="puesto">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Puesto</th>
            <td mat-cell *matCellDef="let o">
              @if (o.puesto) {
                <mat-chip [color]="puestoColor(o.puesto)" highlighted>{{ puestoLabel(o.puesto) }}</mat-chip>
              } @else { — }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let o">
              <button mat-icon-button color="primary" (click)="openDialog(o)"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button color="warn" (click)="delete(o)"><mat-icon>delete</mat-icon></button>
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
export class ObrasComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  columns = ['nom_obra', 'participante', 'competencia', 'puesto', 'actions'];
  dataSource = new MatTableDataSource<Obra>();
  anios = signal<Anio[]>([]);
  competencias = signal<Competencia[]>([]);
  anioFilter: number | string = '';
  compFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.api.getAnios().subscribe((a) => this.anios.set(a));
    this.load();
  }

  onAnioChange(): void {
    this.compFilter = '';
    if (this.anioFilter) {
      this.api.getCompetencias({ anio: String(this.anioFilter) }).subscribe((c) => this.competencias.set(c));
    } else {
      this.competencias.set([]);
    }
    this.load();
  }

  load(): void {
    const params = this.compFilter ? { comp: this.compFilter } : undefined;
    this.api.getObras(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(obra?: Obra): void {
    const ref = this.dialog.open(ObraDialogComponent, { width: '540px', data: obra });
    ref.afterClosed().subscribe((r) => { if (r) this.load(); });
  }

  delete(obra: Obra): void {
    if (!confirm(`¿Eliminar "${obra.nom_obra}"?`)) return;
    this.api.deleteObra(obra.id_obra!).subscribe({
      next: () => { this.snack.open('Eliminada', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Error', 'OK', { duration: 3000 }),
    });
  }

  puestoLabel(p: string): string {
    return p === 'mencion' ? 'Mención' : `${p}° lugar`;
  }

  puestoColor(p: string): string {
    return p === '1' ? 'warn' : p === '2' ? 'accent' : 'primary';
  }
}
