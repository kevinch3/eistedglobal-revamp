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
import { Participant } from '../../core/models';

const NATIONALITIES = [
  'Argentina', 'Gales', 'Uruguay', 'Chile', 'Brasil', 'España',
  'Reino Unido', 'Italia', 'Alemania', 'Polonia', 'Francia', 'Portugal', 'Otro',
];

@Component({
  selector: 'app-participant-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nuevo' }} participante</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Tipo</mat-label>
          <mat-select formControlName="type">
            <mat-option value="IND">Individual</mat-option>
            <mat-option value="GRU">Grupo</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>

        <mat-slide-toggle formControlName="active" class="full-width status-toggle">
          Participante activo
        </mat-slide-toggle>

        @if (form.value.type === 'IND') {
          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="surname" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Documento</mat-label>
            <input matInput formControlName="document_id" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha de nacimiento</mat-label>
            <input matInput type="date" formControlName="birth_date" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Teléfono</mat-label>
            <input matInput formControlName="phone" />
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Nacionalidad</mat-label>
          <mat-select formControlName="nationality">
            @for (n of nationalities; track n) {
              <mat-option [value]="n">{{ n }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Residencia</mat-label>
          <input matInput formControlName="residence" />
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
export class ParticipantDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<ParticipantDialogComponent>);

  saving = signal(false);
  data = inject<Participant | undefined>(MAT_DIALOG_DATA);
  nationalities = NATIONALITIES;

  form = this.fb.nonNullable.group({
    type: [this.data?.type ?? 'IND', Validators.required],
    name: [this.data?.name ?? '', Validators.required],
    surname: [this.data?.surname ?? ''],
    document_id: [this.data?.document_id ?? ''],
    birth_date: [this.data?.birth_date ?? ''],
    phone: [this.data?.phone ?? ''],
    nationality: [this.data?.nationality ?? ''],
    residence: [this.data?.residence ?? ''],
    email: [this.data?.email ?? '', Validators.email],
    active: [this.data?.active !== 0],
  });

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload: Participant = {
      ...raw,
      active: raw.active ? 1 : 0,
    };
    const op = this.data?.id
      ? this.api.updateParticipant(this.data.id, payload)
      : this.api.createParticipant(payload);

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
