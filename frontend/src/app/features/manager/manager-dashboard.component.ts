import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsOverviewResponse } from '../../core/models';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>bar_chart</mat-icon>
      <span style="margin-left:8px">Manager Dashboard</span>
      <span class="spacer"></span>
      <button mat-icon-button routerLink="/staff" title="Staff View">
        <mat-icon>support_agent</mat-icon>
      </button>
      <button mat-icon-button (click)="auth.logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <div class="manager-content">
      <!-- Overview Cards -->
      @if (overview()) {
        <div class="overview-grid">
          <mat-card class="kpi-card">
            <mat-card-content>
              <mat-icon class="kpi-icon" style="color:#1565c0">people</mat-icon>
              <div class="kpi-value">{{ overview()!.totalToday }}</div>
              <div class="kpi-label">Customers Today</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <mat-icon class="kpi-icon" style="color:#e65100">hourglass_empty</mat-icon>
              <div class="kpi-value">{{ overview()!.waitingNow }}</div>
              <div class="kpi-label">Waiting Now</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <mat-icon class="kpi-icon" style="color:#2e7d32">schedule</mat-icon>
              <div class="kpi-value">{{ overview()!.avgWaitMinutes | number:'1.0-1' }} min</div>
              <div class="kpi-label">Avg Wait</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <mat-icon class="kpi-icon" style="color:#f9a825">star</mat-icon>
              <div class="kpi-value">{{ overview()!.satisfactionRating | number:'1.1-1' }} / 5</div>
              <div class="kpi-label">Satisfaction</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <mat-icon class="kpi-icon" style="color:#7b1fa2">access_time</mat-icon>
              <div class="kpi-value">{{ overview()!.peakHour }}</div>
              <div class="kpi-label">Peak Hour</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="kpi-card">
            <mat-card-content>
              <mat-icon class="kpi-icon" style="color:#0288d1">meeting_room</mat-icon>
              <div class="kpi-value">{{ overview()!.completedToday }}</div>
              <div class="kpi-label">Completed Today</div>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Nav Cards -->
      <div class="nav-grid">
        <mat-card class="nav-card" routerLink="/manager/analytics">
          <mat-card-content>
            <mat-icon>insert_chart</mat-icon>
            <h3>Analytics</h3>
            <p>Hourly trends, peak hours, room utilization</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="nav-card" routerLink="/manager/ai">
          <mat-card-content>
            <mat-icon>smart_toy</mat-icon>
            <h3>AI Insights</h3>
            <p>Ask AI for operational recommendations</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="nav-card" routerLink="/manager/reports">
          <mat-card-content>
            <mat-icon>description</mat-icon>
            <h3>Reports</h3>
            <p>Generate daily and weekly reports</p>
          </mat-card-content>
        </mat-card>
        <mat-card class="nav-card" routerLink="/staff">
          <mat-card-content>
            <mat-icon>support_agent</mat-icon>
            <h3>Staff View</h3>
            <p>Manage live queue operations</p>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .spacer { flex: 1; }
    .manager-content { padding: 16px; max-width: 1000px; margin: 0 auto; }
    .overview-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .kpi-card { border-radius: 12px !important; }
    .kpi-card mat-card-content { text-align: center; padding: 16px; }
    .kpi-icon { font-size: 32px; width: 32px; height: 32px; display: block; margin-bottom: 4px; }
    .kpi-value { font-size: 1.8rem; font-weight: 800; }
    .kpi-label { font-size: 0.75rem; color: #666; }
    .nav-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .nav-card { border-radius: 12px !important; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
    .nav-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; }
    .nav-card mat-card-content { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 24px; }
    .nav-card mat-icon { font-size: 40px; width: 40px; height: 40px; color: #1565c0; margin-bottom: 8px; }
    .nav-card h3 { margin: 0 0 4px; font-size: 1.1rem; }
    .nav-card p { margin: 0; font-size: 0.85rem; color: #666; }
  `],
})
export class ManagerDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);

  overview = signal<AnalyticsOverviewResponse | null>(null);
  storeId = '';

  ngOnInit(): void {
    this.loadStoreAndOverview();
  }

  private loadStoreAndOverview(): void {
    fetch('/api/admin/stores', {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).then(r => r.json()).then((data: any) => {
      const stores = data.data ?? data;
      if (Array.isArray(stores) && stores.length > 0) {
        this.storeId = stores[0].id;
        this.analyticsService.getOverview(this.storeId).subscribe({
          next: res => this.overview.set(res),
          error: () => {},
        });
      }
    }).catch(() => {});
  }
}
