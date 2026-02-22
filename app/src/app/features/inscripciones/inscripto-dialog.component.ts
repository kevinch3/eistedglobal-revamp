import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../core/services/api.service';
import { Anio, Competencia, Persona } from '../../core/models';

@Component({
  selector: 'app-inscripto-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatAutocompleteModule, MatCheckboxModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>Nueva inscripción</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-col">

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

        <mat-checkbox [checked]="showYearSelect" (change)="toggleYearSelect($event.checked)">
          Otra edición (no es {{ currentYear }})
        </mat-checkbox>

        @if (showYearSelect) {
          <mat-form-field appearance="outline">
            <mat-label>Año</mat-label>
            <mat-select formControlName="anio_insc" (selectionChange)="onAnioChange()">
              @for (a of anios(); track a.id_anio) {
                <mat-option [value]="a.id_anio">{{ a.id_anio }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Competencia</mat-label>
          <mat-select formControlName="fk_comp">
            @for (c of competencias(); track c.id_comp) {
              <mat-option [value]="c.id_comp">{{ c.id_comp }} – {{ c.descripcion }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Seudónimo (opcional)</mat-label>
          <input matInput formControlName="seudonimo" />
        </mat-form-field>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ saving() ? 'Guardando...' : 'Inscribir' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-col { display: flex; flex-direction: column; gap: 4px; }
    mat-form-field { width: 100%; }
    mat-checkbox { margin: 4px 0 8px; }
  `],
})
export class InscriptoDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<InscriptoDialogComponent>);

  saving = signal(false);
  personas = signal<Persona[]>([]);
  anios = signal<Anio[]>([]);
  competencias = signal<Competencia[]>([]);

  readonly currentYear = new Date().getFullYear();
  showYearSelect = false;

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

  form = this.fb.nonNullable.group({
    fk_persona: [0, [Validators.required, Validators.min(1)]],
    fk_comp: ['', Validators.required],
    seudonimo: [''],
    anio_insc: [this.currentYear, Validators.required],
  });

  ngOnInit(): void {
    this.api.getPersonas().subscribe((p) => this.personas.set(p));
    this.api.getAnios().subscribe((a) => this.anios.set(a));
    this.loadCompetencias();
  }

  onPersonaSelected(event: MatAutocompleteSelectedEvent): void {
    const p = event.option.value as Persona;
    this.form.patchValue({ fk_persona: p.id_persona });
  }

  toggleYearSelect(checked: boolean): void {
    this.showYearSelect = checked;
    if (!checked) {
      this.form.patchValue({ anio_insc: this.currentYear, fk_comp: '' });
      this.loadCompetencias();
    }
  }

  onAnioChange(): void {
    this.form.patchValue({ fk_comp: '' });
    this.loadCompetencias();
  }

  loadCompetencias(): void {
    const anio = String(this.form.value.anio_insc ?? this.currentYear);
    this.api.getCompetencias({ anio }).subscribe((c) => this.competencias.set(c));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.createInscripto(this.form.getRawValue() as any).subscribe({
      next: () => { this.snack.open('Inscripto', 'OK', { duration: 2000 }); this.ref.close(true); },
      error: (err) => { this.snack.open(err.error?.error || 'Error', 'OK', { duration: 3000 }); this.saving.set(false); },
    });
  }
}
