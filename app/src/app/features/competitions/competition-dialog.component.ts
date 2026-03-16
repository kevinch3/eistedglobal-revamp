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
  templateUrl: './competition-dialog.component.html',
  styleUrl: './competition-dialog.component.css',
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
