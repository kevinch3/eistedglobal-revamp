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
  templateUrl: './registrations.component.html',
  styleUrl: './registrations.component.css',
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
