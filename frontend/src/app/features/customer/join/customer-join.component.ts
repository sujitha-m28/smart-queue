import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QueueService } from '../../../core/services/queue.service';
import { QueueStatusResponse } from '../../../core/models';

@Component({
  selector: 'app-customer-join',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatIconModule, MatStepperModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <div class="join-page">
      <div class="join-container">
        <div class="header">
          <mat-icon class="logo-icon">door_sliding</mat-icon>
          <h1>Smart Trial Room</h1>
          <p class="subtitle">Join the queue — no waiting in line!</p>
        </div>

        @if (!joined) {
          <mat-card class="join-card">
            <mat-card-header>
              <mat-card-title>Join Queue</mat-card-title>
              <mat-card-subtitle>Enter your details to get your token</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="form" (ngSubmit)="joinQueue()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Full Name</mat-label>
                  <input matInput formControlName="customerName" placeholder="Your full name">
                  <mat-icon matSuffix>person</mat-icon>
                  @if (form.get('customerName')?.hasError('required') && form.get('customerName')?.touched) {
                    <mat-error>Name is required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Mobile Number</mat-label>
                  <input matInput formControlName="mobileNumber" placeholder="10-digit mobile number" maxlength="10">
                  <mat-icon matSuffix>phone</mat-icon>
                  @if (form.get('mobileNumber')?.invalid && form.get('mobileNumber')?.touched) {
                    <mat-error>Valid 10-digit Indian mobile number required</mat-error>
                  }
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email (optional)</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="your@email.com">
                  <mat-icon matSuffix>email</mat-icon>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Number of Items to Try</mat-label>
                  <mat-select formControlName="numberOfItems">
                    @for (n of [1,2,3,4,5,6,7,8,9,10]; track n) {
                      <mat-option [value]="n">{{ n }} item{{ n > 1 ? 's' : '' }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Priority</mat-label>
                  <mat-select formControlName="priority">
                    <mat-option value="NORMAL">Normal</mat-option>
                    <mat-option value="SENIOR_CITIZEN">Senior Citizen</mat-option>
                    <mat-option value="VIP">VIP</mat-option>
                  </mat-select>
                </mat-form-field>

                <button mat-raised-button color="primary" type="submit"
                        class="full-width join-btn" [disabled]="loading || form.invalid">
                  @if (loading) {
                    <mat-spinner diameter="22" />
                  } @else {
                    <ng-container>
                      <mat-icon>queue</mat-icon>
                      Join Queue
                    </ng-container>
                  }
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        } @else {
          <!-- Token Card -->
          <mat-card class="token-card">
            <mat-card-content>
              <div class="token-display">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <h2>You're in the Queue!</h2>
                <div class="token-number">{{ queueStatus?.token }}</div>
                <div class="queue-info">
                  <div class="info-item">
                    <span class="info-label">Position</span>
                    <span class="info-value">#{{ queueStatus?.queuePosition }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">People Ahead</span>
                    <span class="info-value">{{ queueStatus?.peopleAhead }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Est. Wait</span>
                    <span class="info-value">{{ queueStatus?.estimatedWaitMinutes }} min</span>
                  </div>
                </div>
                <button mat-raised-button color="primary" (click)="viewStatus()">
                  <mat-icon>visibility</mat-icon>
                  Track My Status
                </button>
              </div>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .join-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 24px 16px;
    }
    .join-container { width: 100%; max-width: 480px; }
    .header {
      text-align: center;
      margin-bottom: 24px;
    }
    .logo-icon {
      font-size: 56px; width: 56px; height: 56px;
      color: #1565c0; margin-bottom: 8px;
    }
    .header h1 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #1a237e; }
    .subtitle { color: #555; margin-top: 4px; }
    .join-card, .token-card { border-radius: 16px !important; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .join-btn { height: 48px; font-size: 1rem; font-weight: 600; margin-top: 8px; }
    .token-display { text-align: center; padding: 24px 0; }
    .success-icon { font-size: 56px; width: 56px; height: 56px; color: #2e7d32; }
    .token-number {
      font-size: 3rem; font-weight: 900; color: #1565c0;
      background: #e3f2fd; border-radius: 12px;
      padding: 12px 32px; margin: 16px 0; display: inline-block;
      letter-spacing: 4px;
    }
    .queue-info {
      display: flex; gap: 16px; justify-content: center;
      margin: 20px 0; flex-wrap: wrap;
    }
    .info-item {
      background: #f5f5f5; border-radius: 8px;
      padding: 12px 20px; text-align: center; min-width: 100px;
    }
    .info-label { display: block; font-size: 0.75rem; color: #666; text-transform: uppercase; }
    .info-value { display: block; font-size: 1.4rem; font-weight: 700; color: #1a237e; margin-top: 4px; }
  `],
})
export class CustomerJoinComponent implements OnInit {
  private fb = inject(FormBuilder);
  private queueService = inject(QueueService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(2)]],
    mobileNumber: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    email: ['', Validators.email],
    numberOfItems: [1, [Validators.required, Validators.min(1), Validators.max(15)]],
    priority: ['NORMAL'],
  });

  loading = false;
  joined = false;
  queueStatus: QueueStatusResponse | null = null;
  storeId = '';

  ngOnInit(): void {
    this.storeId = this.route.snapshot.queryParamMap.get('storeId') ?? '';
  }

  joinQueue(): void {
    if (this.form.invalid || !this.storeId) {
      if (!this.storeId) {
        this.snackBar.open('Invalid QR code — no store ID', 'Close', { duration: 4000 });
      }
      return;
    }
    this.loading = true;
    const v = this.form.value;
    this.queueService.joinQueue({
      storeId: this.storeId,
      customerName: v.customerName!,
      mobileNumber: v.mobileNumber!,
      email: v.email || undefined,
      numberOfItems: v.numberOfItems!,
      priority: v.priority as any,
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.queueStatus = res;
        this.joined = true;
        // Save token for later
        localStorage.setItem('queue_token', res.token);
      },
      error: (err) => {
        this.loading = false;
        const msg = err?.error?.message ?? 'Failed to join queue. Please try again.';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
      },
    });
  }

  viewStatus(): void {
    if (this.queueStatus?.token) {
      this.router.navigate(['/customer/status', this.queueStatus.token]);
    }
  }
}
