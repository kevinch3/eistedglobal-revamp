import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Participant } from '../../core/models';

const NATIONALITIES: { value: string; key: string }[] = [
  { value: 'Argentina', key: 'participants.nationalities.argentina' },
  { value: 'Gales',     key: 'participants.nationalities.wales' },
  { value: 'Uruguay',   key: 'participants.nationalities.uruguay' },
  { value: 'Chile',     key: 'participants.nationalities.chile' },
  { value: 'Brasil',    key: 'participants.nationalities.brazil' },
  { value: 'España',    key: 'participants.nationalities.spain' },
  { value: 'Reino Unido', key: 'participants.nationalities.uk' },
  { value: 'Italia',    key: 'participants.nationalities.italy' },
  { value: 'Alemania',  key: 'participants.nationalities.germany' },
  { value: 'Polonia',   key: 'participants.nationalities.poland' },
  { value: 'Francia',   key: 'participants.nationalities.france' },
  { value: 'Portugal',  key: 'participants.nationalities.portugal' },
  { value: 'Otro',      key: 'participants.nationalities.other' },
];

@Component({
  selector: 'app-participant-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './participant-dialog.component.html',
  styleUrl: './participant-dialog.component.css',
})
export class ParticipantDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<ParticipantDialogComponent>);
  private translate = inject(TranslateService);

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
        this.snack.open(this.translate.instant('participants.messages.saved'), this.translate.instant('common.ok'), { duration: 2000 });
        this.ref.close(true);
      },
      error: (err) => {
        this.snack.open(err.error?.error || this.translate.instant('participants.messages.saveError'), this.translate.instant('common.ok'), { duration: 3000 });
        this.saving.set(false);
      },
    });
  }
}
