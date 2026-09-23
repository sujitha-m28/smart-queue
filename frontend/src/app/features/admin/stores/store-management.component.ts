import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { StoreResponse } from '../../../core/models';

@Component({
  selector: 'app-store-management',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <mat-toolbar color="warn">
      <button mat-icon-button routerLink="/admin"><mat-icon>arrow_back</mat-icon></button>
      <mat-icon>store</mat-icon>
      <span style="margin-left:8px">Store Management</span>
      <span class="spacer"></span>
      <button mat-raised-button (click)="showCreate = !showCreate">
        <mat-icon>add</mat-icon> New Store
      </button>
    </mat-toolbar>

    <div class="page-content">

      @if (showCreate) {
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Create New Store</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="createForm" (ngSubmit)="createStore()" class="store-form">
              <mat-form-field appearance="outline">
                <mat-label>Store Name</mat-label>
                <input matInput formControlName="name">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Address</mat-label>
                <input matInput formControlName="address">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>State</mat-label>
                <input matInput formControlName="state">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Pincode</mat-label>
                <input matInput formControlName="pincode">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone">
              </mat-form-field>
              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="createForm.invalid">
                  Create Store
                </button>
                <button mat-button type="button" (click)="showCreate = false">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-header><mat-card-title>Stores ({{ stores().length }})</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="stores()" class="full-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let s">{{ s.name }}</td>
            </ng-container>
            <ng-container matColumnDef="city">
              <th mat-header-cell *matHeaderCellDef>City</th>
              <td mat-cell *matCellDef="let s">{{ s.city }}</td>
            </ng-container>
            <ng-container matColumnDef="phone">
              <th mat-header-cell *matHeaderCellDef>Phone</th>
              <td mat-cell *matCellDef="let s">{{ s.phone }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let s">
                <button mat-icon-button (click)="viewQR(s)" title="View QR Code">
                  <mat-icon>qr_code</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
        </mat-card-content>
      </mat-card>

      @if (qrUrl()) {
        <mat-card class="qr-card">
          <mat-card-header><mat-card-title>QR Code</mat-card-title></mat-card-header>
          <mat-card-content>
            <img [src]="qrUrl()" alt="Store QR Code" class="qr-img">
            <p class="qr-url">Scan to join queue for <strong>{{ selectedStoreName() }}</strong></p>
            <a [href]="qrUrl()" download="store-qr.png">
              <button mat-stroked-button><mat-icon>download</mat-icon> Download QR</button>
            </a>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .spacer { flex: 1; }
    .page-content { padding: 16px; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .form-card { border-radius: 12px !important; }
    .store-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .store-form mat-form-field { width: 100%; }
    .form-actions { grid-column: span 2; display: flex; gap: 8px; }
    .full-table { width: 100%; }
    .qr-card { border-radius: 12px !important; text-align: center; }
    .qr-img { max-width: 250px; border: 2px solid #e0e0e0; border-radius: 8px; }
    .qr-url { color: #666; }
  `],
})
export class StoreManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);
  private fb = inject(FormBuilder);

  stores = signal<StoreResponse[]>([]);
  qrUrl = signal('');
  selectedStoreName = signal('');
  showCreate = false;
  cols = ['name', 'city', 'phone', 'actions'];

  createForm = this.fb.group({
    name: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
    state: ['', Validators.required],
    pincode: ['', Validators.required],
    phone: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadStores();
  }

  loadStores(): void {
    this.adminService.getStores().subscribe({
      next: s => this.stores.set(s),
      error: () => {},
    });
  }

  createStore(): void {
    if (this.createForm.invalid) return;
    this.adminService.createStore(this.createForm.value as any).subscribe({
      next: () => {
        this.snackBar.open('Store created!', 'OK', { duration: 3000 });
        this.showCreate = false;
        this.loadStores();
        this.createForm.reset();
      },
      error: err => this.snackBar.open(err?.error?.message ?? 'Error', 'Close', { duration: 3000 }),
    });
  }

  viewQR(store: StoreResponse): void {
    this.selectedStoreName.set(store.name);
    this.qrUrl.set(`/api/admin/stores/${store.id}/qr`);
  }
}
