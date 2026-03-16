import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Competition, Work, Participant } from '../../core/models';

@Component({
  selector: 'app-work-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatAutocompleteModule, MatSnackBarModule,
    TranslatePipe,
  ],
  templateUrl: './work-dialog.component.html',
  styleUrl: './work-dialog.component.css',
})
export class WorkDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<WorkDialogComponent>);
  private translate = inject(TranslateService);

  saving = signal(false);
  participants = signal<Participant[]>([]);
  competitions = signal<Competition[]>([]);

  data = inject<Work | undefined>(MAT_DIALOG_DATA);

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

  onParticipantSelected(event: MatAutocompleteSelectedEvent): void {
    const p = event.option.value as Participant;
    this.form.patchValue({ participant_id: p.id });
  }

  parseYoutubeId(input: string): string {
    if (!input) return '';
    const m = input.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return m ? m[1] : input;
  }

  normalizeVideoUrl(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const id = this.parseYoutubeId(raw);
    if (id !== raw) this.form.patchValue({ video_url: id });
  }

  form = this.fb.nonNullable.group({
    title: [this.data?.title ?? '', Validators.required],
    participant_id: [this.data?.participant_id ?? 0, [Validators.required, Validators.min(1)]],
    competition_id: [this.data?.competition_id ?? '', Validators.required],
    display_name: [this.data?.display_name ?? ''],
    placement: [this.data?.placement ?? ''],
    video_url: [this.data?.video_url ?? ''],
  });

  ngOnInit(): void {
    this.api.getParticipants().subscribe((p) => {
      this.participants.set(p);
      if (this.data?.participant_id) {
        const selected = p.find((x) => x.id === this.data!.participant_id);
        if (selected) this.participantCtrl.setValue(selected);
      }
    });
    this.api.getCompetitions().subscribe((c) => this.competitions.set(c));
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);

    const raw = this.form.getRawValue();
    const payload = { ...raw, placement: raw.placement || undefined } as any;
    const op = this.data?.id
      ? this.api.updateWork(this.data.id, payload)
      : this.api.createWork(payload);

    op.subscribe({
      next: () => { this.snack.open(this.translate.instant('works.messages.saved'), this.translate.instant('common.ok'), { duration: 2000 }); this.ref.close(true); },
      error: (err) => { this.snack.open(err.error?.error || this.translate.instant('works.messages.saveError'), this.translate.instant('common.ok'), { duration: 3000 }); this.saving.set(false); },
    });
  }
}
