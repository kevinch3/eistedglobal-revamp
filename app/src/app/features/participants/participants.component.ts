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
  templateUrl: './participants.component.html',
  styleUrl: './participants.component.css',
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
