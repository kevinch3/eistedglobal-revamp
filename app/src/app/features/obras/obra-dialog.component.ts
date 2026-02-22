import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { Competencia, Obra, Persona } from '../../core/models';

@Component({
  selector: 'app-obra-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatAutocompleteModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar' : 'Nueva' }} obra</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Título de la obra</mat-label>
          <input matInput formControlName="nom_obra" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Participante</mat-label>
          <input matInput [formControl]="personaCtrl"
                 [matAutocomplete]="personaAuto"
                 placeholder="Buscar por nombre..." />
          <mat-autocomplete #personaAuto="matAutocomplete"
                            [displayWith]="displayPersona"
                            (optionSelected)="onPersonaSelected($event)">
            @for (p of filteredPersonas; track p.id_persona) {
              <mat-option [value]="p">
                {{ p.apellido ? p.apellido + ', ' + p.nombre : p.nombre }}
              </mat-option>
            }
          </mat-autocomplete>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Competencia</mat-label>
          <mat-select formControlName="competencia">
            @for (c of competencias(); track c.id_comp) {
              <mat-option [value]="c.id_comp">{{ c.id_comp }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Seudónimo / Nombre a mostrar</mat-label>
          <input matInput formControlName="mod_particip" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Puesto</mat-label>
          <mat-select formControlName="puesto">
            <mat-option value="">Sin asignar</mat-option>
            <mat-option value="1">1° lugar</mat-option>
            <mat-option value="2">2° lugar</mat-option>
            <mat-option value="3">3° lugar</mat-option>
            <mat-option value="mencion">Mención</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>ID Video YouTube (opcional)</mat-label>
          <input matInput formControlName="video_urls" placeholder="ej. dQw4w9WgXcQ" />
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
export class ObraDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<ObraDialogComponent>);

  saving = signal(false);
  personas = signal<Persona[]>([]);
  competencias = signal<Competencia[]>([]);

  data = inject<Obra | undefined>(MAT_DIALOG_DATA);

  personaCtrl = new FormControl<Persona | string>('');

  get filteredPersonas(): Persona[] {
    const val = this.personaCtrl.value;
    const search = typeof val === 'string' ? val.toLowerCase() : '';
    if (!search) return this.personas();
    return this.personas().filter((p) =>
      `${p.nombre} ${p.apellido ?? ''}`.toLowerCase().includes(search) ||
      `${p.apellido ?? ''} ${p.nombre}`.toLowerCase().includes(search)
    );
  }

  displayPersona = (p: Persona | string | null): string => {
    if (!p || typeof p === 'string') return '';
    return p.apellido ? `${p.apellido}, ${p.nombre}` : p.nombre;
  };

  onPersonaSelected(event: MatAutocompleteSelectedEvent): void {
    const p = event.option.value as Persona;
    this.form.patchValue({ fk_particip: p.id_persona });
  }

  form = this.fb.nonNullable.group({
    nom_obra: [this.data?.nom_obra ?? '', Validators.required],
    fk_particip: [this.data?.fk_particip ?? 0, [Validators.required, Validators.min(1)]],
    competencia: [this.data?.competencia ?? '', Validators.required],
    mod_particip: [this.data?.mod_particip ?? ''],
    puesto: [this.data?.puesto ?? ''],
    video_urls: [this.data?.video_urls ?? ''],
  });

  ngOnInit(): void {
    this.api.getPersonas().subscribe((p) => {
      this.personas.set(p);
      if (this.data?.fk_particip) {
        const selected = p.find((x) => x.id_persona === this.data!.fk_particip);
        if (selected) this.personaCtrl.setValue(selected);
      }
    });
    this.api.getCompetencias().subscribe((c) => this.competencias.set(c));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload = { ...raw, puesto: raw.puesto || undefined } as any;
    const op = this.data?.id_obra
      ? this.api.updateObra(this.data.id_obra, payload)
      : this.api.createObra(payload);

    op.subscribe({
      next: () => { this.snack.open('Guardado', 'OK', { duration: 2000 }); this.ref.close(true); },
      error: (err) => { this.snack.open(err.error?.error || 'Error', 'OK', { duration: 3000 }); this.saving.set(false); },
    });
  }
}
