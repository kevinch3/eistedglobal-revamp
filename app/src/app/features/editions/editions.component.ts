import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Edition } from '../../core/models';

@Component({
  selector: 'app-editions',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatListModule, MatSnackBarModule, MatExpansionModule,
    TranslatePipe,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ 'editions.title' | translate }}</h1>
      <button mat-raised-button color="primary" (click)="showAdd = !showAdd">
        <mat-icon>add</mat-icon> {{ 'editions.new' | translate }}
      </button>
    </div>

    @if (showAdd) {
      <mat-card class="add-card">
        <mat-card-content>
          <form [formGroup]="addForm" (ngSubmit)="createEdition()" class="add-row">
            <mat-form-field appearance="outline">
              <mat-label>{{ 'editions.form.year' | translate }}</mat-label>
              <input matInput type="number" formControlName="year" [placeholder]="'editions.form.yearPlaceholder' | translate" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="addForm.invalid">
              {{ 'common.create' | translate }}
            </button>
            <button mat-button type="button" (click)="showAdd = false">{{ 'common.cancel' | translate }}</button>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <mat-accordion>
      @for (e of editions(); track e.year) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>{{ 'editions.panel' | translate: { year: e.year } }}</mat-panel-title>
          </mat-expansion-panel-header>

          <form class="edition-form" (ngSubmit)="saveEdition(e)">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'editions.form.committee' | translate }}</mat-label>
              <textarea matInput [(ngModel)]="e.committee" [name]="'committee-'+e.year" rows="4"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'editions.form.committeeImg' | translate }}</mat-label>
              <input matInput [(ngModel)]="e.committee_img" [name]="'committee_img-'+e.year" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'editions.form.presenters' | translate }}</mat-label>
              <textarea matInput [(ngModel)]="e.presenters" [name]="'presenters-'+e.year" rows="3"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'editions.form.presentersImg' | translate }}</mat-label>
              <input matInput [(ngModel)]="e.presenters_img" [name]="'presenters_img-'+e.year" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit">{{ 'common.save' | translate }}</button>
          </form>
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
    .page-title { font-size: 1.8rem; font-weight: 600; color: #1a237e; margin: 0; }
    .add-card { margin-bottom: 20px; }
    .add-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .add-row mat-form-field { width: 180px; }
    .edition-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
  `],
})
export class EditionsComponent implements OnInit {
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  editions = signal<Edition[]>([]);
  showAdd = false;

  addForm = this.fb.nonNullable.group({
    year: [new Date().getFullYear() + 1, [Validators.required, Validators.min(1900)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.getEditions().subscribe((e) => this.editions.set(e));
  }

  createEdition(): void {
    if (this.addForm.invalid) return;
    this.api.createEdition(this.addForm.value.year!).subscribe({
      next: () => { this.snack.open(this.translate.instant('editions.messages.created'), this.translate.instant('common.ok'), { duration: 2000 }); this.load(); this.showAdd = false; },
      error: (err) => this.snack.open(err.error?.error || this.translate.instant('editions.messages.error'), this.translate.instant('common.ok'), { duration: 3000 }),
    });
  }

  saveEdition(e: Edition): void {
    this.api.updateEdition(e.year, {
      committee: e.committee,
      committee_img: e.committee_img,
      presenters: e.presenters,
      presenters_img: e.presenters_img,
    }).subscribe({
      next: () => this.snack.open(this.translate.instant('editions.messages.saved'), this.translate.instant('common.ok'), { duration: 2000 }),
      error: () => this.snack.open(this.translate.instant('editions.messages.saveError'), this.translate.instant('common.ok'), { duration: 3000 }),
    });
  }
}
