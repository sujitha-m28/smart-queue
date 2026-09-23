import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { QueueEntryResponse, TrialRoomResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly http = inject(HttpClient);

  callNext(storeId: string): Observable<QueueEntryResponse> {
    return this.http.post<QueueEntryResponse>('/api/staff/queue/next', { storeId });
  }

  startService(id: string, trialRoomId: string): Observable<QueueEntryResponse> {
    return this.http.post<QueueEntryResponse>(`/api/staff/queue/${id}/start`, { trialRoomId });
  }

  completeService(id: string): Observable<QueueEntryResponse> {
    return this.http.post<QueueEntryResponse>(`/api/staff/queue/${id}/complete`, {});
  }

  skipEntry(id: string): Observable<QueueEntryResponse> {
    return this.http.post<QueueEntryResponse>(`/api/staff/queue/${id}/skip`, {});
  }

  recallEntry(id: string): Observable<QueueEntryResponse> {
    return this.http.post<QueueEntryResponse>(`/api/staff/queue/${id}/recall`, {});
  }

  markNoShow(id: string): Observable<QueueEntryResponse> {
    return this.http.post<QueueEntryResponse>(`/api/staff/queue/${id}/no-show`, {});
  }

  getLiveQueue(storeId: string): Observable<QueueEntryResponse[]> {
    return this.http.get<QueueEntryResponse[]>(`/api/staff/queue/${storeId}/live`);
  }

  getRooms(storeId: string): Observable<TrialRoomResponse[]> {
    return this.http.get<TrialRoomResponse[]>(`/api/staff/rooms/${storeId}`);
  }
}
