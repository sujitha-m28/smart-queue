import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AnalyticsOverviewResponse,
  HourlyDataPoint,
  AiChatRequest,
  AiChatResponse,
  ReportRequest,
  ReportResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly http = inject(HttpClient);

  getOverview(storeId: string, date?: string): Observable<AnalyticsOverviewResponse> {
    let params = new HttpParams().set('storeId', storeId);
    if (date) params = params.set('date', date);
    return this.http.get<AnalyticsOverviewResponse>('/api/manager/analytics/overview', { params });
  }

  getHourlyData(storeId: string, start: string, end: string): Observable<HourlyDataPoint[]> {
    const params = new HttpParams()
      .set('storeId', storeId).set('start', start).set('end', end);
    return this.http.get<HourlyDataPoint[]>('/api/manager/analytics/hourly', { params });
  }

  getPeakHours(storeId: string, start: string, end: string): Observable<HourlyDataPoint[]> {
    const params = new HttpParams()
      .set('storeId', storeId).set('start', start).set('end', end);
    return this.http.get<HourlyDataPoint[]>('/api/manager/analytics/peak-hours', { params });
  }

  getRoomUtilization(storeId: string, start: string, end: string): Observable<Record<string, number>> {
    const params = new HttpParams()
      .set('storeId', storeId).set('start', start).set('end', end);
    return this.http.get<Record<string, number>>('/api/manager/analytics/room-utilization', { params });
  }

  getManagerInsight(request: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>('/api/manager/ai/insight', request);
  }

  generateDailyReport(storeId: string, date: string): Observable<ReportResponse> {
    return this.http.post<ReportResponse>('/api/manager/reports/daily', { storeId, date });
  }

  generateWeeklyReport(storeId: string, weekStart: string): Observable<ReportResponse> {
    return this.http.post<ReportResponse>('/api/manager/reports/weekly', { storeId, weekStart });
  }
}
