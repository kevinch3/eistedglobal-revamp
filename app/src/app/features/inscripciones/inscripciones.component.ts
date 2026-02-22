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
import { Anio, Inscripto } from '../../core/models';
import { InscriptoDialogComponent } from './inscripto-dialog.component';

@Component({
  selector: 'app-inscripciones',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCardModule, MatSnackBarModule, MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Inscripciones</h1>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>how_to_reg</mat-icon> Nueva inscripción
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Año</mat-label>
            <mat-select [(ngModel)]="anioFilter" (ngModelChange)="load()">
              <mat-option value="">Todos</mat-option>
              @for (a of anios(); track a.id_anio) {
                <mat-option [value]="a.id_anio">{{ a.id_anio }}</mat-option>
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
          <ng-container matColumnDef="persona">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Participante</th>
            <td mat-cell *matCellDef="let i">
              {{ i.apellido ? i.apellido + ', ' + i.nombre : i.nombre }}
            </td>
          </ng-container>

          <ng-container matColumnDef="fk_comp">
            <th mat-header-cell *matHeaderCellDef>Competencia</th>
            <td mat-cell *matCellDef="let i"><code>{{ i.fk_comp }}</code></td>
          </ng-container>

          <ng-container matColumnDef="comp_descripcion">
            <th mat-header-cell *matHeaderCellDef>Descripción</th>
            <td mat-cell *matCellDef="let i">{{ i.comp_descripcion || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="seudonimo">
            <th mat-header-cell *matHeaderCellDef>Seudónimo</th>
            <td mat-cell *matCellDef="let i">{{ i.seudonimo || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="anio_insc">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Año</th>
            <td mat-cell *matCellDef="let i">{{ i.anio_insc }}</td>
          </ng-container>

          <ng-container matColumnDef="fecha_inscrip">
            <th mat-header-cell *matHeaderCellDef>Fecha inscripción</th>
            <td mat-cell *matCellDef="let i">{{ i.fecha_inscrip || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let i">
              <button mat-icon-button color="warn" (click)="darBaja(i)" title="Dar de baja">
                <mat-icon>person_remove</mat-icon>
              </button>
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
export class InscripcionesComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  columns = ['persona', 'fk_comp', 'comp_descripcion', 'seudonimo', 'anio_insc', 'fecha_inscrip', 'actions'];
  dataSource = new MatTableDataSource<Inscripto>();
  anios = signal<Anio[]>([]);
  anioFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.api.getAnios().subscribe((a) => this.anios.set(a));
    this.load();
  }

  load(): void {
    const params = this.anioFilter ? { anio: String(this.anioFilter) } : undefined;
    this.api.getInscriptos(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(): void {
    const ref = this.dialog.open(InscriptoDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((r) => { if (r) this.load(); });
  }

  darBaja(insc: Inscripto): void {
    if (!confirm('¿Dar de baja esta inscripción?')) return;
    this.api.darBajaInscripto(insc.id_inscripto!).subscribe({
      next: () => { this.snack.open('Baja registrada', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snack.open('Error', 'OK', { duration: 3000 }),
    });
  }
}
