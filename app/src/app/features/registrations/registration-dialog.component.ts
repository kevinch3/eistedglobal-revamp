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
import { Edition, Competition, Participant } from '../../core/models';

@Component({
  selector: 'app-registration-dialog',
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
          <input matInput [formControl]="participantCtrl"
                 [matAutocomplete]="participantAuto"
                 placeholder="Buscar por nombre..." />
          <mat-autocomplete #participantAuto="matAutocomplete"
                            [displayWith]="displayParticipant"
                            (optionSelected)="onParticipantSelected($event)">
            @for (p of filteredParticipants; track p.id) {
              <mat-option [value]="p">
                {{ p.surname ? p.surname + ', ' + p.name : p.name }}
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
            <mat-select formControlName="year" (selectionChange)="onYearChange()">
              @for (e of editions(); track e.year) {
                <mat-option [value]="e.year">{{ e.year }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>Competencia</mat-label>
          <mat-select formControlName="competition_id">
            @for (c of competitions(); track c.id) {
              <mat-option [value]="c.id">{{ c.id }} – {{ c.description }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Seudónimo (opcional)</mat-label>
          <input matInput formControlName="pseudonym" />
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
export class RegistrationDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<RegistrationDialogComponent>);

  saving = signal(false);
  participants = signal<Participant[]>([]);
  editions = signal<Edition[]>([]);
  competitions = signal<Competition[]>([]);

  readonly currentYear = new Date().getFullYear();
  showYearSelect = false;

  participantCtrl = new FormControl<Participant | string>('');

  get filteredParticipants(): Participant[] {
    const val = this.participantCtrl.value;
    const search = typeof val === 'string' ? val.toLowerCase() : '';
    if (!search) return this.participants();
    return this.participants().filter((p) =>
      `${p.name} ${p.surname ?? ''}`.toLowerCase().includes(search) ||
      `${p.surname ?? ''} ${p.name}`.toLowerCase().includes(search)
    );
  }

  displayParticipant = (p: Participant | string | null): string => {
    if (!p || typeof p === 'string') return '';
    return p.surname ? `${p.surname}, ${p.name}` : p.name;
  };

  form = this.fb.nonNullable.group({
    participant_id: [0, [Validators.required, Validators.min(1)]],
    competition_id: ['', Validators.required],
    pseudonym: [''],
    year: [this.currentYear, Validators.required],
  });

  ngOnInit(): void {
    this.api.getParticipants().subscribe((p) => this.participants.set(p));
    this.api.getEditions().subscribe((e) => this.editions.set(e));
    this.loadCompetitions();
  }

  onParticipantSelected(event: MatAutocompleteSelectedEvent): void {
    const p = event.option.value as Participant;
    this.form.patchValue({ participant_id: p.id });
  }

  toggleYearSelect(checked: boolean): void {
    this.showYearSelect = checked;
    if (!checked) {
      this.form.patchValue({ year: this.currentYear, competition_id: '' });
      this.loadCompetitions();
    }
  }

  onYearChange(): void {
    this.form.patchValue({ competition_id: '' });
    this.loadCompetitions();
  }

  loadCompetitions(): void {
    const year = String(this.form.value.year ?? this.currentYear);
    this.api.getCompetitions({ year }).subscribe((c) => this.competitions.set(c));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.api.createRegistration(this.form.getRawValue() as any).subscribe({
      next: () => { this.snack.open('Inscripto', 'OK', { duration: 2000 }); this.ref.close(true); },
      error: (err) => { this.snack.open(err.error?.error || 'Error', 'OK', { duration: 3000 }); this.saving.set(false); },
    });
  }
}
