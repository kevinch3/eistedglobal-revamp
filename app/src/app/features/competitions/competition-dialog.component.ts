import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Edition, Category, Competition } from '../../core/models';

const LANGUAGES: { value: string; key: string }[] = [
  { value: 'Cymraeg',   key: 'competitions.languages.cymraeg' },
  { value: 'Castellano', key: 'competitions.languages.castellano' },
  { value: 'English',   key: 'competitions.languages.english' },
  { value: 'Aleman',    key: 'competitions.languages.german' },
  { value: 'Polaco',    key: 'competitions.languages.polish' },
  { value: 'Frances',   key: 'competitions.languages.french' },
  { value: 'Portugues', key: 'competitions.languages.portuguese' },
  { value: 'Italiano',  key: 'competitions.languages.italian' },
  { value: 'Otro',      key: 'competitions.languages.other' },
];

@Component({
  selector: 'app-competition-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSnackBarModule,
    TranslatePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ (data ? 'competitions.dialog.titleEdit' : 'competitions.dialog.titleNew') | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'competitions.dialog.id' | translate }}</mat-label>
          <input matInput formControlName="id" [readonly]="!!data" />
          @if (!data) { <mat-hint>{{ 'competitions.dialog.idHint' | translate }}</mat-hint> }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'competitions.dialog.description' | translate }}</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'competitions.dialog.category' | translate }}</mat-label>
          <mat-select formControlName="category_id">
            @for (c of categories(); track c.id) {
              <mat-option [value]="c.id">{{ c.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'competitions.dialog.type' | translate }}</mat-label>
          <mat-select formControlName="type">
            <mat-option value="IND">{{ 'competitions.dialog.individual' | translate }}</mat-option>
            <mat-option value="GRU">{{ 'competitions.dialog.group' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'competitions.dialog.language' | translate }}</mat-label>
          <mat-select formControlName="language">
            @for (l of languages; track l.value) {
              <mat-option [value]="l.value">{{ l.key | translate }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'competitions.dialog.year' | translate }}</mat-label>
          <mat-select formControlName="year">
            @for (e of editions(); track e.year) {
              <mat-option [value]="e.year">{{ e.year }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'competitions.dialog.rank' | translate }}</mat-label>
          <input matInput type="number" formControlName="rank" />
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ 'common.cancel' | translate }}</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
        {{ (saving() ? 'common.saving' : 'common.save') | translate }}
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
export class CompetitionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<CompetitionDialogComponent>);
  private translate = inject(TranslateService);

  saving = signal(false);
  categories = signal<Category[]>([]);
  editions = signal<Edition[]>([]);
  languages = LANGUAGES;

  data = inject<Competition | undefined>(MAT_DIALOG_DATA);

  form = this.fb.nonNullable.group({
    id: [this.data?.id ?? '', Validators.required],
    description: [this.data?.description ?? ''],
    category_id: [this.data?.category_id ?? 0, Validators.required],
    type: [this.data?.type ?? 'IND', Validators.required],
    language: [this.data?.language ?? 'Castellano'],
    year: [this.data?.year ?? new Date().getFullYear(), Validators.required],
    rank: [this.data?.rank ?? 0],
  });

  ngOnInit(): void {
    this.api.getCategories().subscribe((c) => this.categories.set(c));
    this.api.getEditions().subscribe((e) => this.editions.set(e));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const payload = this.form.getRawValue() as Competition;
    const op = this.data
      ? this.api.updateCompetition(this.data.id, payload)
      : this.api.createCompetition(payload);

    op.subscribe({
      next: () => { this.snack.open(this.translate.instant('competitions.messages.saved'), this.translate.instant('common.ok'), { duration: 2000 }); this.ref.close(true); },
      error: (err) => { this.snack.open(err.error?.error || this.translate.instant('competitions.messages.saveError'), this.translate.instant('common.ok'), { duration: 3000 }); this.saving.set(false); },
    });
  }
}
