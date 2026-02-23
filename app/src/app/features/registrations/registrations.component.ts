import { Component, inject, OnInit, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { Edition, Registration } from '../../core/models';
import { RegistrationDialogComponent } from './registration-dialog.component';

@Component({
  selector: 'app-registrations',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCardModule, MatSnackBarModule, MatChipsModule,
    TranslatePipe,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">{{ 'registrations.title' | translate }}</h1>
      <button mat-raised-button color="primary" (click)="openDialog()">
        <mat-icon>how_to_reg</mat-icon> {{ 'registrations.new' | translate }}
      </button>
    </div>

    <mat-card>
      <mat-card-content>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.year' | translate }}</mat-label>
            <mat-select [(ngModel)]="yearFilter" (ngModelChange)="load()">
              <mat-option value="">{{ 'common.all' | translate }}</mat-option>
              @for (e of editions(); track e.year) {
                <mat-option [value]="e.year">{{ e.year }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>{{ 'common.search' | translate }}</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput (input)="applyFilter($event)" />
          </mat-form-field>
        </div>

        <div class="table-scroll">
        <table mat-table [dataSource]="dataSource" matSort class="full-width">
          <ng-container matColumnDef="participant">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'registrations.table.participant' | translate }}</th>
            <td mat-cell *matCellDef="let r">
              {{ r.surname ? r.surname + ', ' + r.name : r.name }}
            </td>
          </ng-container>

          <ng-container matColumnDef="competition_id">
            <th mat-header-cell *matHeaderCellDef>{{ 'registrations.table.competition' | translate }}</th>
            <td mat-cell *matCellDef="let r"><code>{{ r.competition_id }}</code></td>
          </ng-container>

          <ng-container matColumnDef="comp_description">
            <th mat-header-cell *matHeaderCellDef>{{ 'registrations.table.description' | translate }}</th>
            <td mat-cell *matCellDef="let r">{{ r.comp_description || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="pseudonym">
            <th mat-header-cell *matHeaderCellDef>{{ 'registrations.table.pseudonym' | translate }}</th>
            <td mat-cell *matCellDef="let r">{{ r.pseudonym || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="year">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>{{ 'registrations.table.year' | translate }}</th>
            <td mat-cell *matCellDef="let r">{{ r.year }}</td>
          </ng-container>

          <ng-container matColumnDef="registered_at">
            <th mat-header-cell *matHeaderCellDef>{{ 'registrations.table.registeredAt' | translate }}</th>
            <td mat-cell *matCellDef="let r">{{ r.registered_at || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>{{ 'registrations.table.actions' | translate }}</th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button color="warn" (click)="drop(r)" [title]="'registrations.actions.drop' | translate">
                <mat-icon>person_remove</mat-icon>
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
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .full-width { width: 100%; }
    .table-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .no-data { padding: 24px; text-align: center; color: #999; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
  `],
})
export class RegistrationsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private translate = inject(TranslateService);

  columns = ['participant', 'competition_id', 'comp_description', 'pseudonym', 'year', 'registered_at', 'actions'];
  dataSource = new MatTableDataSource<Registration>();
  editions = signal<Edition[]>([]);
  yearFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.api.getEditions().subscribe((e) => this.editions.set(e));
    this.load();
  }

  load(): void {
    const params = this.yearFilter ? { year: String(this.yearFilter) } : undefined;
    this.api.getRegistrations(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(): void {
    const ref = this.dialog.open(RegistrationDialogComponent, { width: '520px' });
    ref.afterClosed().subscribe((r) => { if (r) this.load(); });
  }

  drop(reg: Registration): void {
    if (!confirm(this.translate.instant('registrations.messages.confirmDrop'))) return;
    this.api.dropRegistration(reg.id!).subscribe({
      next: () => { this.snack.open(this.translate.instant('registrations.messages.dropped'), this.translate.instant('common.ok'), { duration: 2000 }); this.load(); },
      error: () => this.snack.open(this.translate.instant('registrations.messages.error'), this.translate.instant('common.ok'), { duration: 3000 }),
    });
  }
}
