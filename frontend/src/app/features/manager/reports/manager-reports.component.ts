import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ReportResponse } from '../../../core/models';

@Component({
  selector: 'app-manager-reports',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatRadioModule, MatDividerModule, MatSnackBarModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/manager"><mat-icon>arrow_back</mat-icon></button>
      <mat-icon>description</mat-icon>
      <span style="margin-left:8px">Reports</span>
    </mat-toolbar>

    <div class="reports-content">
      <div class="report-actions">
        <mat-card class="report-action-card" (click)="generateDaily()">
          <mat-card-content>
            <mat-icon class="report-icon">today</mat-icon>
            <h3>Daily Report</h3>
            <p>AI-powered summary of today's queue performance</p>
            <button mat-raised-button color="primary" [disabled]="generating()">
              @if (generating()) { <mat-spinner diameter="20" /> }
              @else { Generate Daily Report }
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="report-action-card" (click)="generateWeekly()">
          <mat-card-content>
            <mat-icon class="report-icon">date_range</mat-icon>
            <h3>Weekly Report</h3>
            <p>Comprehensive week-over-week analysis and trends</p>
            <button mat-raised-button color="accent" [disabled]="generating()">
              @if (generating()) { <mat-spinner diameter="20" /> }
              @else { Generate Weekly Report }
            </button>
          </mat-card-content>
        </mat-card>
      </div>

      @if (report()) {
        <mat-card class="report-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>article</mat-icon>
              {{ report()!.reportType }} Report — {{ report()!.reportDate }}
            </mat-card-title>
            <mat-card-subtitle>Generated at {{ report()!.generatedAt | date:'medium' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <!-- Stats Summary -->
            <div class="report-stats">
              <div class="rs">
                <span class="rs-value">{{ report()!.totalCustomers }}</span>
                <span class="rs-label">Total Customers</span>
              </div>
              <div class="rs">
                <span class="rs-value">{{ report()!.completedSessions }}</span>
                <span class="rs-label">Completed</span>
              </div>
              <div class="rs">
                <span class="rs-value">{{ report()!.avgWaitMinutes | number:'1.1-1' }} min</span>
                <span class="rs-label">Avg Wait</span>
              </div>
              <div class="rs">
                <span class="rs-value">{{ report()!.peakHour }}</span>
                <span class="rs-label">Peak Hour</span>
              </div>
            </div>

            <mat-divider style="margin: 16px 0"></mat-divider>

            <div class="report-content">
              <pre>{{ report()!.content }}</pre>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .reports-content { padding: 16px; max-width: 900px; margin: 0 auto; }
    .report-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .report-action-card { border-radius: 12px !important; cursor: pointer; }
    .report-action-card mat-card-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px; gap: 8px; }
    .report-icon { font-size: 48px; width: 48px; height: 48px; color: #1565c0; }
    .report-action-card h3 { margin: 0; font-size: 1.1rem; }
    .report-action-card p { margin: 0; color: #666; font-size: 0.85rem; }
    .report-card { border-radius: 12px !important; }
    .report-stats { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 8px; }
    .rs { text-align: center; flex: 1; min-width: 80px; }
    .rs-value { display: block; font-size: 1.5rem; font-weight: 700; color: #1565c0; }
    .rs-label { font-size: 0.75rem; color: #666; }
    .report-content {
      background: #f9f9f9; border-radius: 8px; padding: 16px;
      max-height: 400px; overflow-y: auto;
    }
    .report-content pre { white-space: pre-wrap; font-family: inherit; font-size: 0.9rem; line-height: 1.6; margin: 0; }
  `],
})
export class ManagerReportsComponent implements OnInit {
  auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private snackBar = inject(MatSnackBar);

  generating = signal(false);
  report = signal<any | null>(null);
  storeId = '';

  ngOnInit(): void {
    this.loadStoreId();
  }

  private async loadStoreId(): Promise<void> {
    const r = await fetch('/api/admin/stores', { headers: { Authorization: `Bearer ${this.auth.getToken()}` } });
    const data = await r.json();
    const stores = data.data ?? data;
    if (Array.isArray(stores) && stores.length > 0) this.storeId = stores[0].id;
  }

  generateDaily(): void {
    if (!this.storeId) return;
    this.generating.set(true);
    const today = new Date().toISOString().split('T')[0];
    this.analyticsService.generateDailyReport(this.storeId, today).subscribe({
      next: res => {
        this.generating.set(false);
        this.report.set(res);
      },
      error: () => {
        this.generating.set(false);
        this.snackBar.open('Failed to generate report', 'Close', { duration: 3000 });
      },
    });
  }

  generateWeekly(): void {
    if (!this.storeId) return;
    this.generating.set(true);
    const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    this.analyticsService.generateWeeklyReport(this.storeId, weekStart).subscribe({
      next: res => {
        this.generating.set(false);
        this.report.set(res);
      },
      error: () => {
        this.generating.set(false);
        this.snackBar.open('Failed to generate report', 'Close', { duration: 3000 });
      },
    });
  }
}
