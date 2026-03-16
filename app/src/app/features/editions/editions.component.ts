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
  templateUrl: './editions.component.html',
  styleUrl: './editions.component.css',
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
