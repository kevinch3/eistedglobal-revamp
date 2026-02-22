import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { Persona } from '../../core/models';
import { PersonaDialogComponent } from './persona-dialog.component';

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCardModule, MatSnackBarModule, MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Personas</h1>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>person_add</mat-icon> Nueva persona
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Buscar</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (input)="applyFilter($event)" placeholder="Nombre, apellido, DNI..." />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [(value)]="tipoFilter" (selectionChange)="loadPersonas()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="IND">Individual</mat-option>
              <mat-option value="GRU">Grupo</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="table-scroll">
        <table mat-table [dataSource]="dataSource" matSort class="full-width">
          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Tipo</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [color]="p.tipo === 'IND' ? 'primary' : 'accent'" highlighted>
                {{ p.tipo === 'IND' ? 'Individual' : 'Grupo' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nombre</th>
            <td mat-cell *matCellDef="let p">{{ p.apellido ? p.apellido + ', ' + p.nombre : p.nombre }}</td>
          </ng-container>

          <ng-container matColumnDef="dni">
            <th mat-header-cell *matHeaderCellDef>DNI</th>
            <td mat-cell *matCellDef="let p">{{ p.dni || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="residencia">
            <th mat-header-cell *matHeaderCellDef>Residencia</th>
            <td mat-cell *matCellDef="let p">{{ p.residencia || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let p">{{ p.email || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [color]="p.activo === 0 ? 'warn' : 'primary'" highlighted>
                {{ p.activo === 0 ? 'Inactivo' : 'Activo' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary" (click)="openDialog(p)" title="Editar">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="delete(p)" title="Eliminar">
                <mat-icon>delete</mat-icon>
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
    .filters { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filters mat-form-field { min-width: 200px; }
    .full-width { width: 100%; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .no-data { padding: 24px; text-align: center; color: #999; }
  `],
})
export class PersonasComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  columns = ['tipo', 'nombre', 'dni', 'residencia', 'email', 'estado', 'actions'];
  dataSource = new MatTableDataSource<Persona>();
  tipoFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadPersonas();
  }

  loadPersonas(): void {
    const params = this.tipoFilter ? { tipo: this.tipoFilter } : undefined;
    this.api.getPersonas(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  openDialog(persona?: Persona): void {
    const ref = this.dialog.open(PersonaDialogComponent, {
      width: '500px',
      data: persona,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadPersonas();
    });
  }

  delete(persona: Persona): void {
    if (!confirm(`¿Eliminar a ${persona.nombre}?`)) return;
    this.api.deletePersona(persona.id_persona!).subscribe({
      next: () => {
        this.snack.open('Persona eliminada', 'OK', { duration: 3000 });
        this.loadPersonas();
      },
      error: () => this.snack.open('Error al eliminar', 'OK', { duration: 3000 }),
    });
  }
}
