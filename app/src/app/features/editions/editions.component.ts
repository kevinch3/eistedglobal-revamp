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
import { ApiService } from '../../core/services/api.service';
import { Edition } from '../../core/models';

@Component({
  selector: 'app-editions',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatListModule, MatSnackBarModule, MatExpansionModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Ediciones</h1>
      <button mat-raised-button color="primary" (click)="showAdd = !showAdd">
        <mat-icon>add</mat-icon> Nueva edición
      </button>
    </div>

    @if (showAdd) {
      <mat-card class="add-card">
        <mat-card-content>
          <form [formGroup]="addForm" (ngSubmit)="createEdition()" class="add-row">
            <mat-form-field appearance="outline">
              <mat-label>Año</mat-label>
              <input matInput type="number" formControlName="year" placeholder="2027" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit" [disabled]="addForm.invalid">
              Crear
            </button>
            <button mat-button type="button" (click)="showAdd = false">Cancelar</button>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <mat-accordion>
      @for (e of editions(); track e.year) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>Edición {{ e.year }}</mat-panel-title>
          </mat-expansion-panel-header>

          <form class="edition-form" (ngSubmit)="saveEdition(e)">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Comisión</mat-label>
              <textarea matInput [(ngModel)]="e.committee" [name]="'committee-'+e.year" rows="4"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>URL imagen comisión</mat-label>
              <input matInput [(ngModel)]="e.committee_img" [name]="'committee_img-'+e.year" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Presentadores</mat-label>
              <textarea matInput [(ngModel)]="e.presenters" [name]="'presenters-'+e.year" rows="3"></textarea>
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>URL imagen presentadores</mat-label>
              <input matInput [(ngModel)]="e.presenters_img" [name]="'presenters_img-'+e.year" />
            </mat-form-field>
            <button mat-raised-button color="primary" type="submit">Guardar</button>
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
      next: () => { this.snack.open('Edición creada', 'OK', { duration: 2000 }); this.load(); this.showAdd = false; },
      error: (err) => this.snack.open(err.error?.error || 'Error', 'OK', { duration: 3000 }),
    });
  }

  saveEdition(e: Edition): void {
    this.api.updateEdition(e.year, {
      committee: e.committee,
      committee_img: e.committee_img,
      presenters: e.presenters,
      presenters_img: e.presenters_img,
    }).subscribe({
      next: () => this.snack.open('Guardado', 'OK', { duration: 2000 }),
      error: () => this.snack.open('Error al guardar', 'OK', { duration: 3000 }),
    });
  }
}
