import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { HourlyDataPoint } from '../../../core/models';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule,
    NgApexchartsModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/manager"><mat-icon>arrow_back</mat-icon></button>
      <mat-icon>insert_chart</mat-icon>
      <span style="margin-left:8px">Analytics</span>
      <span class="spacer"></span>
      <mat-form-field appearance="outline" class="range-select">
        <mat-select [(value)]="selectedRange" (selectionChange)="loadData()">
          <mat-option value="7">Last 7 days</mat-option>
          <mat-option value="30">Last 30 days</mat-option>
          <mat-option value="1">Today</mat-option>
        </mat-select>
      </mat-form-field>
    </mat-toolbar>

    <div class="analytics-content">
      @if (loading()) {
        <div class="loading-center">
          <mat-spinner />
          <p>Loading analytics...</p>
        </div>
      } @else {
        <!-- Hourly Volume Chart -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Hourly Customer Volume</mat-card-title>
            <mat-card-subtitle>Customers per hour</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (hourlyData().length > 0) {
              <apx-chart
                [series]="hourlyChartOptions.series"
                [chart]="hourlyChartOptions.chart"
                [xaxis]="hourlyChartOptions.xaxis"
                [colors]="hourlyChartOptions.colors"
                [title]="hourlyChartOptions.title"
                [dataLabels]="{ enabled: false }"
                [plotOptions]="hourlyChartOptions.plotOptions">
              </apx-chart>
            } @else {
              <div class="no-data">No hourly data available</div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Peak Hours Chart -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Peak Hours</mat-card-title>
            <mat-card-subtitle>Busiest times ranked</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (peakData().length > 0) {
              <apx-chart
                [series]="peakChartOptions.series"
                [chart]="peakChartOptions.chart"
                [xaxis]="peakChartOptions.xaxis"
                [colors]="peakChartOptions.colors"
                [dataLabels]="{ enabled: true }"
                [plotOptions]="peakChartOptions.plotOptions">
              </apx-chart>
            } @else {
              <div class="no-data">No peak hour data</div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Room Utilization -->
        @if (roomUtil() && Object.keys(roomUtil()!).length > 0) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>Room Utilization</mat-card-title>
              <mat-card-subtitle>Total minutes per room</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="room-util-list">
                @for (entry of roomUtilEntries(); track $index) {
                  <div class="room-util-item">
                    <span class="room-name">{{ entry[0] }}</span>
                    <div class="util-bar-container">
                      <div class="util-bar" [style.width.%]="getUtilPercent(entry[1])"></div>
                    </div>
                    <span class="util-value">{{ entry[1] }} min</span>
                  </div>
                }
              </div>
            </mat-card-content>
          </mat-card>
        }
      }
    </div>
  `,
  styles: [`
    .spacer { flex: 1; }
    .range-select { margin-top: 16px; margin-left: 8px; }
    .analytics-content { padding: 16px; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .loading-center { text-align: center; padding: 60px; }
    .no-data { text-align: center; padding: 32px; color: #999; }
    .room-util-list { display: flex; flex-direction: column; gap: 12px; }
    .room-util-item { display: flex; align-items: center; gap: 12px; }
    .room-name { min-width: 100px; font-weight: 600; font-size: 0.9rem; }
    .util-bar-container { flex: 1; height: 20px; background: #e0e0e0; border-radius: 10px; overflow: hidden; }
    .util-bar { height: 100%; background: linear-gradient(90deg, #1565c0, #42a5f5); border-radius: 10px; transition: width 0.5s; }
    .util-value { min-width: 60px; text-align: right; font-size: 0.85rem; color: #555; }
  `],
})
export class AnalyticsDashboardComponent implements OnInit {
  auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);

  loading = signal(true);
  hourlyData = signal<HourlyDataPoint[]>([]);
  peakData = signal<HourlyDataPoint[]>([]);
  roomUtil = signal<Record<string, number> | null>(null);
  selectedRange = '7';
  storeId = '';

  get Object() { return Object; }

  get hourlyChartOptions() {
    return {
      series: [{ name: 'Customers', data: this.hourlyData().map(d => d.count) }],
      chart: { type: 'bar' as const, height: 280, toolbar: { show: false } },
      xaxis: { categories: this.hourlyData().map(d => String(d.hour)) },
      colors: ['#1565c0'],
      title: { text: '' },
      plotOptions: { bar: { borderRadius: 4 } },
    };
  }

  get peakChartOptions() {
    const top8 = [...this.peakData()].slice(0, 8);
    return {
      series: [{ name: 'Customers', data: top8.map(d => d.count) }],
      chart: { type: 'bar' as const, height: 280, toolbar: { show: false } },
      xaxis: { categories: top8.map(d => String(d.hour)) },
      colors: ['#e65100'],
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
    };
  }

  roomUtilEntries(): [string, number][] {
    const data = this.roomUtil();
    if (!data) return [];
    return Object.entries(data).sort((a, b) => b[1] - a[1]);
  }

  getUtilPercent(val: number): number {
    const entries = this.roomUtilEntries();
    if (entries.length === 0) return 0;
    const max = Math.max(...entries.map(e => e[1]));
    return max > 0 ? (val / max) * 100 : 0;
  }

  ngOnInit(): void {
    this.loadStoreId().then(() => this.loadData());
  }

  private async loadStoreId(): Promise<void> {
    const r = await fetch('/api/admin/stores', {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    });
    const data = await r.json();
    const stores = data.data ?? data;
    if (Array.isArray(stores) && stores.length > 0) {
      this.storeId = stores[0].id;
    }
  }

  loadData(): void {
    if (!this.storeId) return;
    this.loading.set(true);
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - parseInt(this.selectedRange) * 86400000).toISOString().split('T')[0];

    let loaded = 0;
    const done = () => { if (++loaded === 3) this.loading.set(false); };

    this.analyticsService.getHourlyData(this.storeId, start, end).subscribe({
      next: d => { this.hourlyData.set(d); done(); },
      error: () => done(),
    });
    this.analyticsService.getPeakHours(this.storeId, start, end).subscribe({
      next: d => { this.peakData.set(d); done(); },
      error: () => done(),
    });
    this.analyticsService.getRoomUtilization(this.storeId, start, end).subscribe({
      next: d => { this.roomUtil.set(d); done(); },
      error: () => done(),
    });
  }
}
