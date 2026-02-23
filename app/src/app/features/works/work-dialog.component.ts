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
  template: `
    <h2 mat-dialog-title>{{ (data ? 'works.dialog.titleEdit' : 'works.dialog.titleNew') | translate }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'works.dialog.title' | translate }}</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'works.dialog.participant' | translate }}</mat-label>
          <input matInput [formControl]="participantCtrl"
                 [matAutocomplete]="participantAuto"
                 [placeholder]="'works.dialog.searchPlaceholder' | translate" />
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

        <mat-form-field appearance="outline">
          <mat-label>{{ 'works.dialog.competition' | translate }}</mat-label>
          <mat-select formControlName="competition_id">
            @for (c of competitions(); track c.id) {
              <mat-option [value]="c.id">{{ c.id }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'works.dialog.displayName' | translate }}</mat-label>
          <input matInput formControlName="display_name" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ 'works.dialog.placement' | translate }}</mat-label>
          <mat-select formControlName="placement">
            <mat-option value="">{{ 'works.dialog.noPlacement' | translate }}</mat-option>
            <mat-option value="1">{{ 'works.dialog.place1' | translate }}</mat-option>
            <mat-option value="2">{{ 'works.dialog.place2' | translate }}</mat-option>
            <mat-option value="3">{{ 'works.dialog.place3' | translate }}</mat-option>
            <mat-option value="mencion">{{ 'works.dialog.mention' | translate }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ 'works.dialog.youtube' | translate }}</mat-label>
          <input matInput formControlName="video_url"
                 [placeholder]="'works.dialog.youtubePlaceholder' | translate"
                 (input)="normalizeVideoUrl($event)" />
          @if (form.get('video_url')?.value) {
            <mat-hint>
              https://youtube.com/watch?v={{ form.get('video_url')?.value }}
            </mat-hint>
          }
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
