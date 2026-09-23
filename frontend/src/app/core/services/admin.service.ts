import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  StoreResponse, CreateStoreRequest,
  TrialRoomResponse, CreateRoomRequest,
  User, CreateUserRequest,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);

  // Stores
  getStores(): Observable<StoreResponse[]> {
    return this.http.get<StoreResponse[]>('/api/admin/stores');
  }
  createStore(req: CreateStoreRequest): Observable<StoreResponse> {
    return this.http.post<StoreResponse>('/api/admin/stores', req);
  }
  updateStore(id: string, req: Partial<CreateStoreRequest>): Observable<StoreResponse> {
    return this.http.put<StoreResponse>(`/api/admin/stores/${id}`, req);
  }
  getStoreQRUrl(storeId: string): Observable<{ url: string; storeId: string }> {
    return this.http.get<{ url: string; storeId: string }>(`/api/admin/stores/${storeId}/qr-url`);
  }

  // Rooms
  getRooms(storeId?: string): Observable<TrialRoomResponse[]> {
    const url = storeId
      ? `/api/admin/rooms?storeId=${storeId}`
      : '/api/admin/rooms';
    return this.http.get<TrialRoomResponse[]>(url);
  }
  createRoom(req: CreateRoomRequest): Observable<TrialRoomResponse> {
    return this.http.post<TrialRoomResponse>('/api/admin/rooms', req);
  }
  updateRoomStatus(id: string, status: string): Observable<TrialRoomResponse> {
    return this.http.put<TrialRoomResponse>(`/api/admin/rooms/${id}/status`, { status });
  }

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/admin/users');
  }
  createUser(req: CreateUserRequest): Observable<any> {
    return this.http.post('/api/admin/users', req);
  }
  toggleUserActive(id: string): Observable<any> {
    return this.http.put(`/api/admin/users/${id}/toggle-active`, {});
  }
}
