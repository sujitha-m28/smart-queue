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
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatChipsModule, MatSlideToggleModule, MatSnackBarModule,
  ],
  template: `
    <mat-toolbar color="warn">
      <button mat-icon-button routerLink="/admin"><mat-icon>arrow_back</mat-icon></button>
      <mat-icon>manage_accounts</mat-icon>
      <span style="margin-left:8px">User Management</span>
      <span class="spacer"></span>
      <button mat-raised-button (click)="showCreate = !showCreate">
        <mat-icon>person_add</mat-icon> Add User
      </button>
    </mat-toolbar>

    <div class="page-content">
      @if (showCreate) {
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Create New User</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="createForm" (ngSubmit)="createUser()" class="user-form">
              <mat-form-field appearance="outline">
                <mat-label>Username</mat-label>
                <input matInput formControlName="username">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="fullName">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Mobile</mat-label>
                <input matInput formControlName="mobileNumber">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="STAFF">Staff</mat-option>
                  <mat-option value="MANAGER">Manager</mat-option>
                  <mat-option value="ADMIN">Admin</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="createForm.invalid">
                  Create User
                </button>
                <button mat-button type="button" (click)="showCreate = false">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-header><mat-card-title>System Users ({{ users().length }})</mat-card-title></mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="users()" class="full-table">
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>Username</th>
              <td mat-cell *matCellDef="let u">
                <strong>{{ u.username }}</strong><br>
                <small>{{ u.fullName }}</small>
              </td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let u">
                <mat-chip [class]="'role-chip role-' + (u.role || '').toLowerCase()">
                  {{ u.role }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="active">
              <th mat-header-cell *matHeaderCellDef>Active</th>
              <td mat-cell *matCellDef="let u">
                <mat-slide-toggle [checked]="u.active" (change)="toggleActive(u)"></mat-slide-toggle>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .spacer { flex: 1; }
    .page-content { padding: 16px; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .form-card { border-radius: 12px !important; }
    .user-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .user-form mat-form-field { width: 100%; }
    .form-actions { grid-column: span 2; display: flex; gap: 8px; }
    .full-table { width: 100%; }
    .role-chip { font-weight: 700; }
    .role-admin { background: #fce4ec !important; color: #880e4f !important; }
    .role-manager { background: #e8eaf6 !important; color: #283593 !important; }
    .role-staff { background: #e8f5e9 !important; color: #1b5e20 !important; }
  `],
})
export class UserManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  users = signal<User[]>([]);
  showCreate = false;
  cols = ['username', 'email', 'role', 'active'];

  createForm = this.fb.group({
    username: ['', Validators.required],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['STAFF', Validators.required],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({ next: u => this.users.set(u) });
  }

  createUser(): void {
    if (this.createForm.invalid) return;
    this.adminService.createUser(this.createForm.value as any).subscribe({
      next: () => {
        this.snackBar.open('User created!', 'OK', { duration: 3000 });
        this.showCreate = false;
        this.loadUsers();
        this.createForm.reset({ role: 'STAFF' });
      },
      error: err => this.snackBar.open(err?.error?.message ?? 'Error creating user', 'Close', { duration: 4000 }),
    });
  }

  toggleActive(user: User): void {
    this.adminService.toggleUserActive(user.id).subscribe({
      next: () => this.loadUsers(),
      error: () => this.snackBar.open('Failed to update user', 'Close', { duration: 3000 }),
    });
  }
}
