import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatProgressSpinnerModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <div class="login-page">
      <mat-card class="login-card">
        <mat-card-header>
          <div class="brand">
            <mat-icon class="brand-icon">door_sliding</mat-icon>
            <div>
              <h1>Smart Trial Room</h1>
              <p>Queue Management System</p>
            </div>
          </div>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="Enter username" autocomplete="username">
              <mat-icon matSuffix>person</mat-icon>
              @if (form.get('username')?.hasError('required') && form.get('username')?.touched) {
                <mat-error>Username is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword ? 'password' : 'text'"
                     formControlName="password" autocomplete="current-password">
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width login-btn" [disabled]="loading || form.invalid">
              @if (loading) {
                <mat-spinner diameter="20" />
              } @else {
                Login
              }
            </button>
          </form>
        </mat-card-content>

        <mat-card-footer class="login-footer">
          <p>Customer? <a routerLink="/customer/join">Scan QR or Join Queue</a></p>
        </mat-card-footer>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #1565c0 100%);
      padding: 16px;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      border-radius: 16px !important;
      box-shadow: 0 24px 48px rgba(0,0,0,0.3) !important;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 0 8px;
      width: 100%;
    }
    .brand-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1565c0;
    }
    .brand h1 {
      margin: 0;
      font-size: 1.4rem;
      font-weight: 700;
      color: #1a237e;
    }
    .brand p {
      margin: 2px 0 0;
      font-size: 0.8rem;
      color: #666;
    }
    .full-width { width: 100%; }
    .login-btn {
      margin-top: 8px;
      height: 44px;
      font-size: 1rem;
      font-weight: 600;
    }
    .login-footer {
      text-align: center;
      padding: 12px 16px;
      color: #666;
      font-size: 0.85rem;
    }
    .login-footer a { color: #1565c0; }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  loading = false;
  hidePassword = true;

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;

    const { username, password } = this.form.value;
    this.auth.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.loading = false;
        this.auth.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? 'Invalid username or password';
        this.snackBar.open(msg, 'Close', { duration: 3000 });
      },
    });
  }
}
