import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Participant } from '../../core/models';
import { ParticipantDialogComponent } from './participant-dialog.component';

@Component({
  selector: 'app-participants',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatCardModule, MatSnackBarModule, MatChipsModule,
    TranslatePipe,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ 'participants.title' | translate }}</h1>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>person_add</mat-icon> {{ 'participants.new' | translate }}
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.search' | translate }}</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (input)="applyFilter($event)" [placeholder]="'participants.searchPlaceholder' | translate" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.type' | translate }}</mat-label>
            <mat-select [(value)]="typeFilter" (selectionChange)="loadParticipants()">
              <mat-option value="">{{ 'common.all' | translate }}</mat-option>
              <mat-option value="IND">{{ 'common.individual' | translate }}</mat-option>
              <mat-option value="GRU">{{ 'common.group' | translate }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="table-scroll">
        <table mat-table [dataSource]="dataSource" matSort class="full-width">
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'participants.table.type' | translate }}</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [color]="p.type === 'IND' ? 'primary' : 'accent'" highlighted>
                {{ (p.type === 'IND' ? 'common.individual' : 'common.group') | translate }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'participants.table.name' | translate }}</th>
            <td mat-cell *matCellDef="let p">{{ p.surname ? p.surname + ', ' + p.name : p.name }}</td>
          </ng-container>

          <ng-container matColumnDef="document_id">
            <th mat-header-cell *matHeaderCellDef>{{ 'participants.table.document' | translate }}</th>
            <td mat-cell *matCellDef="let p">{{ p.document_id || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="residence">
            <th mat-header-cell *matHeaderCellDef>{{ 'participants.table.residence' | translate }}</th>
            <td mat-cell *matCellDef="let p">{{ p.residence || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>{{ 'participants.table.email' | translate }}</th>
            <td mat-cell *matCellDef="let p">{{ p.email || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>{{ 'participants.table.status' | translate }}</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [color]="p.active === 0 ? 'warn' : 'primary'" highlighted>
                {{ (p.active === 0 ? 'common.inactive' : 'common.active') | translate }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>{{ 'participants.table.actions' | translate }}</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary" (click)="openDialog(p)" [title]="'common.edit' | translate">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="delete(p)" [title]="'common.delete' | translate">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data" [attr.colspan]="columns.length">{{ 'common.noResults' | translate }}</td>
          </tr>
        </table>
        </div>

        <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons />
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 8px; }
    .page-title { font-size: 1.8rem; font-weight: 600; color: #1a237e; margin: 0; }
    .filters { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filters mat-form-field { min-width: 200px; }
    .full-width { width: 100%; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .no-data { padding: 24px; text-align: center; color: #999; }
  `],
})
export class ParticipantsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private translate = inject(TranslateService);

  columns = ['type', 'name', 'document_id', 'residence', 'email', 'active', 'actions'];
  dataSource = new MatTableDataSource<Participant>();
  typeFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadParticipants();
  }

  loadParticipants(): void {
    const params = this.typeFilter ? { type: this.typeFilter } : undefined;
    this.api.getParticipants(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();
  }

  openDialog(participant?: Participant): void {
    const ref = this.dialog.open(ParticipantDialogComponent, {
      width: '500px',
      data: participant,
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadParticipants();
    });
  }

  delete(participant: Participant): void {
    const msg = this.translate.instant('participants.messages.confirmDelete', { name: participant.name });
    if (!confirm(msg)) return;
    this.api.deleteParticipant(participant.id!).subscribe({
      next: () => {
        this.snack.open(this.translate.instant('participants.messages.deleted'), this.translate.instant('common.ok'), { duration: 3000 });
        this.loadParticipants();
      },
      error: () => this.snack.open(this.translate.instant('participants.messages.deleteError'), this.translate.instant('common.ok'), { duration: 3000 }),
    });
  }
}
