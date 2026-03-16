import { Component, inject, OnInit, ViewChild, signal } from '@angular/core';
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
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Edition, Competition } from '../../core/models';
import { CompetitionDialogComponent } from './competition-dialog.component';

@Component({
  selector: 'app-competitions',
  standalone: true,
  imports: [
    FormsModule, MatTableModule, MatPaginatorModule, MatSortModule,
    MatButtonModule, MatIconModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatCardModule, MatSnackBarModule, MatChipsModule,
    TranslatePipe,
  ],
  templateUrl: './competitions.component.html',
  styleUrl: './competitions.component.css',
})
export class CompetitionsComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private translate = inject(TranslateService);

  columns = ['id', 'description', 'category_name', 'type', 'language', 'year', 'actions'];
  dataSource = new MatTableDataSource<Competition>();
  editions = signal<Edition[]>([]);
  yearFilter = '';
  typeFilter = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.api.getEditions().subscribe((e) => this.editions.set(e));
    this.load();
  }

  load(): void {
    const params: Record<string, string> = {};
    if (this.yearFilter) params['year'] = this.yearFilter;
    if (this.typeFilter) params['type'] = this.typeFilter;
    this.api.getCompetitions(params).subscribe((data) => {
      this.dataSource.data = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event): void {
    this.dataSource.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
  }

  openDialog(comp?: Competition): void {
    const ref = this.dialog.open(CompetitionDialogComponent, { width: '560px', data: comp });
    ref.afterClosed().subscribe((r) => { if (r) this.load(); });
  }

  delete(comp: Competition): void {
    if (!confirm(this.translate.instant('competitions.messages.confirmDelete', { id: comp.id }))) return;
    this.api.deleteCompetition(comp.id).subscribe({
      next: () => { this.snack.open(this.translate.instant('competitions.messages.deleted'), this.translate.instant('common.ok'), { duration: 2000 }); this.load(); },
      error: () => this.snack.open(this.translate.instant('competitions.messages.deleteError'), this.translate.instant('common.ok'), { duration: 3000 }),
    });
  }
}
