import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { Anio, Categoria, Competencia } from '../../core/models';

const IDIOMAS = ['Cymraeg', 'Castellano', 'English', 'Aleman', 'Polaco', 'Frances', 'Portugues', 'Italiano', 'Otro'];

@Component({
  selector: 'app-competencia-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nueva' }} competencia</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>ID competencia (ej. CH202601)</mat-label>
          <input matInput formControlName="id_comp" [readonly]="!!data" />
          @if (!data) { <mat-hint>Formato: CH/JU + Año + Nro (ej. CH202601)</mat-hint> }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="descripcion" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Categoría</mat-label>
          <mat-select formControlName="categoria">
            @for (c of categorias(); track c.id_cat) {
              <mat-option [value]="c.id_cat">{{ c.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="grupind">
            <mat-option value="IND">Individual</mat-option>
            <mat-option value="GRU">Grupal</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Idioma</mat-label>
          <mat-select formControlName="idioma">
            @for (i of idiomas; track i) {
              <mat-option [value]="i">{{ i }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Año</mat-label>
          <mat-select formControlName="fk_anio">
            @for (a of anios(); track a.id_anio) {
              <mat-option [value]="a.id_anio">{{ a.id_anio }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Orden (rank)</mat-label>
          <input matInput type="number" formControlName="rank" />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Guardando...' : 'Guardar' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .full-width { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }
    @media (max-width: 599px) {
      .form-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: auto; }
    }
  `],
})
export class CompetenciaDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<CompetenciaDialogComponent>);

  saving = signal(false);
  categorias = signal<Categoria[]>([]);
  anios = signal<Anio[]>([]);
  idiomas = IDIOMAS;

  data = inject<Competencia | undefined>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    id_comp: [this.data?.id_comp ?? '', Validators.required],
    descripcion: [this.data?.descripcion ?? ''],
    categoria: [this.data?.categoria ?? 0, Validators.required],
    grupind: [this.data?.grupind ?? 'IND', Validators.required],
    idioma: [this.data?.idioma ?? 'Castellano'],
    fk_anio: [this.data?.fk_anio ?? new Date().getFullYear(), Validators.required],
    rank: [this.data?.rank ?? 0],
  });

  ngOnInit(): void {
    this.api.getCategorias().subscribe((c) => this.categorias.set(c));
    this.api.getAnios().subscribe((a) => this.anios.set(a));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const payload = this.form.getRawValue() as Competencia;
    const op = this.data
      ? this.api.updateCompetencia(this.data.id_comp, payload)
      : this.api.createCompetencia(payload);

    op.subscribe({
      next: () => { this.snack.open('Guardado', 'OK', { duration: 2000 }); this.ref.close(true); },
      error: (err) => { this.snack.open(err.error?.error || 'Error', 'OK', { duration: 3000 }); this.saving.set(false); },
    });
  }
}
