import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  JoinQueueRequest,
  QueueStatusResponse,
  LiveQueueStatusResponse,
  FeedbackRequest,
  FeedbackResponse,
  TrialRoomResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class QueueService {
  private readonly http = inject(HttpClient);

  joinQueue(request: JoinQueueRequest): Observable<QueueStatusResponse> {
    return this.http.post<QueueStatusResponse>('/api/queue/join', request);
  }

  getQueueStatus(token: string): Observable<QueueStatusResponse> {
    return this.http.get<QueueStatusResponse>(`/api/queue/${token}`);
  }

  cancelQueue(token: string): Observable<void> {
    return this.http.delete<void>(`/api/queue/${token}/cancel`);
  }

  getLiveStatus(storeId: string): Observable<LiveQueueStatusResponse> {
    return this.http.get<LiveQueueStatusResponse>(`/api/queue/status/${storeId}`);
  }

  getRoomsStatus(storeId: string): Observable<TrialRoomResponse[]> {
    return this.http.get<TrialRoomResponse[]>(`/api/rooms/status/${storeId}`);
  }

  submitFeedback(feedback: FeedbackRequest): Observable<FeedbackResponse> {
    return this.http.post<FeedbackResponse>('/api/feedback', feedback);
  }
}
