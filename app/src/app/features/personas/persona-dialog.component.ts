import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { Persona } from '../../core/models';

@Component({
  selector: 'app-persona-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nueva' }} persona</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="tipo">
            <mat-option value="IND">Individual</mat-option>
            <mat-option value="GRU">Grupo</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>

        <mat-slide-toggle formControlName="activo" class="full-width status-toggle">
          Participante activo
        </mat-slide-toggle>

        @if (form.value.tipo === 'IND') {
          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="apellido" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>DNI</mat-label>
            <input matInput formControlName="dni" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha de nacimiento</mat-label>
            <input matInput type="date" formControlName="fecha_nac" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="telefono" />
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Nacionalidad</mat-label>
          <input matInput formControlName="nacionalidad" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Residencia</mat-label>
          <input matInput formControlName="residencia" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
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
    .status-toggle { margin: 8px 0 16px; }
    mat-form-field { width: 100%; }
    @media (max-width: 599px) {
      .form-grid { grid-template-columns: 1fr; }
      .full-width { grid-column: auto; }
    }
  `],
})
export class PersonaDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<PersonaDialogComponent>);

  saving = signal(false);
  data = inject<Persona | undefined>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    tipo: [this.data?.tipo ?? 'IND', Validators.required],
    nombre: [this.data?.nombre ?? '', Validators.required],
    apellido: [this.data?.apellido ?? ''],
    dni: [this.data?.dni ?? ''],
    fecha_nac: [this.data?.fecha_nac ?? ''],
    telefono: [this.data?.telefono ?? ''],
    nacionalidad: [this.data?.nacionalidad ?? ''],
    residencia: [this.data?.residencia ?? ''],
    email: [this.data?.email ?? '', Validators.email],
    activo: [this.data?.activo !== 0],
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload: Persona = {
      ...raw,
      activo: raw.activo ? 1 : 0,
    };
    const op = this.data?.id_persona
      ? this.api.updatePersona(this.data.id_persona, payload)
      : this.api.createPersona(payload);

    op.subscribe({
      next: () => {
        this.snack.open('Guardado correctamente', 'OK', { duration: 2000 });
        this.ref.close(true);
      },
      error: (err) => {
        this.snack.open(err.error?.error || 'Error al guardar', 'OK', { duration: 3000 });
        this.saving.set(false);
      },
    });
  }
}
