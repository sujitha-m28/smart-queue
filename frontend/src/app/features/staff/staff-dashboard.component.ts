import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Subject, interval, takeUntil, startWith } from 'rxjs';
import { StaffService } from '../../core/services/staff.service';
import { WebSocketService } from '../../core/services/websocket.service';
import { AuthService } from '../../core/services/auth.service';
import { QueueEntryResponse, TrialRoomResponse } from '../../core/models';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule,
    MatChipsModule, MatSelectModule, MatFormFieldModule,
    MatSnackBarModule, MatToolbarModule,
  ],
  template: `
    <div class="staff-layout">
      <!-- Toolbar -->
      <mat-toolbar color="primary">
        <mat-icon>door_sliding</mat-icon>
        <span style="margin-left:8px">Staff Dashboard</span>
        <span class="spacer"></span>
        <span class="user-chip">{{ auth.getFullName() || auth.getUsername() }}</span>
        <button mat-icon-button (click)="auth.logout()" title="Logout">
          <mat-icon>logout</mat-icon>
        </button>
      </mat-toolbar>

      <div class="staff-content">

        <!-- Stats Row -->
        <div class="stats-row">
          <mat-card class="stat-card waiting">
            <mat-card-content>
              <mat-icon>hourglass_empty</mat-icon>
              <div class="stat-value">{{ waiting.length }}</div>
              <div class="stat-label">Waiting</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card serving">
            <mat-card-content>
              <mat-icon>meeting_room</mat-icon>
              <div class="stat-value">{{ serving.length }}</div>
              <div class="stat-label">Serving</div>
            </mat-card-content>
          </mat-card>
          <mat-card class="stat-card rooms">
            <mat-card-content>
              <mat-icon>door_front</mat-icon>
              <div class="stat-value">{{ availableRooms.length }}</div>
              <div class="stat-label">Rooms Free</div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Next Customer Button -->
        <mat-card class="action-card">
          <mat-card-content>
            <div class="next-action">
              <div>
                <h3>Call Next Customer</h3>
                @if (waiting.length > 0) {
                  <p class="next-preview">
                    Next: <strong>{{ waiting[0].customerName }}</strong>
                    — Token {{ waiting[0].token }}
                    — {{ waiting[0].numberOfItems }} items
                    <mat-chip [class]="'priority-' + waiting[0].priority.toLowerCase()">
                      {{ waiting[0].priority }}
                    </mat-chip>
                  </p>
                } @else {
                  <p class="empty-msg">Queue is empty</p>
                }
              </div>
              <button mat-raised-button color="primary"
                      [disabled]="waiting.length === 0 || calling"
                      (click)="callNext()">
                <mat-icon>arrow_forward</mat-icon>
                Call Next
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Live Queue Table -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Live Queue</mat-card-title>
            <mat-card-subtitle>{{ queue.length }} entries</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (queue.length === 0) {
              <div class="empty-state">
                <mat-icon>queue</mat-icon>
                <p>Queue is empty</p>
              </div>
            } @else {
              <div class="queue-list">
                @for (entry of queue; track entry.id) {
                  <div class="queue-item" [class]="'status-' + entry.status.toLowerCase()">
                    <div class="queue-item-left">
                      <span class="token-badge">{{ entry.token }}</span>
                      <div>
                        <div class="customer-name">{{ entry.customerName }}</div>
                        <div class="customer-meta">
                          {{ entry.numberOfItems }} items ·
                          <span [class]="'priority-text priority-' + entry.priority.toLowerCase()">
                            {{ entry.priority }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div class="queue-item-right">
                      <mat-chip [class]="'status-chip status-' + entry.status.toLowerCase()">
                        {{ entry.status }}
                      </mat-chip>
                      <div class="entry-actions">
                        @if (entry.status === 'CALLED') {
                          <button mat-mini-fab color="accent" title="Start Service"
                                  (click)="startService(entry)">
                            <mat-icon>play_arrow</mat-icon>
                          </button>
                          <button mat-mini-fab color="warn" title="Skip"
                                  (click)="skip(entry)">
                            <mat-icon>skip_next</mat-icon>
                          </button>
                          <button mat-mini-fab title="No Show"
                                  (click)="noShow(entry)">
                            <mat-icon>person_off</mat-icon>
                          </button>
                        }
                        @if (entry.status === 'SERVING') {
                          <button mat-mini-fab color="primary" title="Complete"
                                  (click)="complete(entry)">
                            <mat-icon>done</mat-icon>
                          </button>
                        }
                        @if (entry.status === 'SKIPPED') {
                          <button mat-mini-fab color="primary" title="Recall"
                                  (click)="recall(entry)">
                            <mat-icon>replay</mat-icon>
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Rooms Status -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Trial Rooms</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="rooms-grid">
              @for (room of rooms; track room.id) {
                <div class="room-card" [class]="'room-' + room.status.toLowerCase()">
                  <mat-icon>{{ room.status === 'AVAILABLE' ? 'door_front' : room.status === 'OCCUPIED' ? 'meeting_room' : 'cleaning_services' }}</mat-icon>
                  <div class="room-number">{{ room.displayName }}</div>
                  <div class="room-status">{{ room.status }}</div>
                  @if (room.status !== 'AVAILABLE') {
                    <button mat-button color="primary" (click)="setRoomAvailable(room)">
                      Mark Available
                    </button>
                  }
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

      </div>
    </div>

    <!-- Room Selection Dialog -->
    @if (showRoomSelect) {
      <div class="room-select-overlay" (click)="showRoomSelect = false">
        <mat-card class="room-select-dialog" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>Assign Trial Room</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Select a trial room for <strong>{{ selectedEntry?.customerName }}</strong></p>
            <div class="room-options">
              @for (room of availableRooms; track room.id) {
                <button mat-stroked-button (click)="confirmStartService(room)">
                  {{ room.displayName }}
                </button>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .staff-layout { display: flex; flex-direction: column; min-height: 100vh; background: #f5f5f5; }
    .spacer { flex: 1; }
    .user-chip { font-size: 0.85rem; margin-right: 8px; }
    .staff-content { padding: 16px; display: flex; flex-direction: column; gap: 16px; max-width: 900px; margin: 0 auto; width: 100%; }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .stat-card { border-radius: 12px !important; text-align: center; }
    .stat-card mat-card-content { display: flex; flex-direction: column; align-items: center; padding: 16px; }
    .stat-card mat-icon { font-size: 28px; }
    .stat-value { font-size: 2rem; font-weight: 800; line-height: 1.2; }
    .stat-label { font-size: 0.75rem; color: #666; }
    .stat-card.waiting mat-icon, .stat-card.waiting .stat-value { color: #e65100; }
    .stat-card.serving mat-icon, .stat-card.serving .stat-value { color: #1565c0; }
    .stat-card.rooms mat-icon, .stat-card.rooms .stat-value { color: #2e7d32; }

    .next-action { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
    .next-preview { margin: 4px 0 0; color: #444; }
    .empty-msg { margin: 4px 0 0; color: #999; }

    .queue-list { display: flex; flex-direction: column; gap: 8px; }
    .queue-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px; border-radius: 8px; border-left: 4px solid transparent;
      background: #fff;
    }
    .queue-item.status-waiting { border-color: #ff6f00; }
    .queue-item.status-called { border-color: #2e7d32; background: #f1f8e9; animation: pulse 2s infinite; }
    .queue-item.status-serving { border-color: #1565c0; background: #e3f2fd; }
    .queue-item.status-skipped { border-color: #9e9e9e; opacity: 0.7; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.8} }

    .queue-item-left { display: flex; align-items: center; gap: 12px; }
    .token-badge {
      background: #1565c0; color: #fff; border-radius: 6px;
      padding: 4px 10px; font-weight: 700; font-size: 0.85rem; white-space: nowrap;
    }
    .customer-name { font-weight: 600; font-size: 0.95rem; }
    .customer-meta { font-size: 0.8rem; color: #666; }
    .queue-item-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .entry-actions { display: flex; gap: 4px; }

    .priority-text { font-weight: 600; }
    .priority-vip { color: #7b1fa2; }
    .priority-senior_citizen { color: #1565c0; }

    .empty-state { text-align: center; padding: 32px; color: #999; }
    .empty-state mat-icon { font-size: 48px; display: block; margin-bottom: 8px; }

    .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .room-card {
      border-radius: 8px; padding: 16px; text-align: center;
      border: 2px solid transparent;
    }
    .room-available { background: #e8f5e9; border-color: #4caf50; }
    .room-occupied { background: #fff3e0; border-color: #ff9800; }
    .room-cleaning { background: #e3f2fd; border-color: #2196f3; }
    .room-out_of_service { background: #ffebee; border-color: #f44336; }
    .room-card mat-icon { font-size: 32px; display: block; margin-bottom: 4px; }
    .room-number { font-weight: 700; }
    .room-status { font-size: 0.75rem; color: #666; text-transform: uppercase; }

    .room-select-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .room-select-dialog { min-width: 320px; border-radius: 12px !important; }
    .room-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  `],
})
export class StaffDashboardComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  private staffService = inject(StaffService);
  private wsService = inject(WebSocketService);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();

  queue: QueueEntryResponse[] = [];
  rooms: TrialRoomResponse[] = [];

  calling = false;
  showRoomSelect = false;
  selectedEntry: QueueEntryResponse | null = null;

  // The store ID from user session (hardcoded demo — in real app from user profile)
  storeId = ''; // Will be loaded from API

  get waiting() { return this.queue.filter(e => e.status === 'WAITING'); }
  get serving() { return this.queue.filter(e => e.status === 'SERVING'); }
  get availableRooms() { return this.rooms.filter(r => r.status === 'AVAILABLE'); }

  ngOnInit(): void {
    this.loadData();
    interval(15000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadData());

    this.wsService.connect();
    this.wsService.queueUpdate$.pipe(takeUntil(this.destroy$)).subscribe(payload => {
      this.storeId = payload.storeId;
      this.loadData();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    if (!this.storeId) {
      // Try to get storeId from API (get first store for demo)
      this.getStores();
      return;
    }
    this.staffService.getLiveQueue(this.storeId).subscribe({
      next: q => this.queue = q,
      error: () => {},
    });
    this.staffService.getRooms(this.storeId).subscribe({
      next: r => this.rooms = r,
      error: () => {},
    });
  }

  private getStores(): void {
    // Fallback — get store ID from queue status endpoint
    // For demo, use first available store from admin endpoint
    import('../../core/services/admin.service').then(({ AdminService }) => {
      // Use angular inject if needed - just call through injector
    });
    // In a real app, the storeId would come from user.storeId in JWT
    // For now use a direct API call
    fetch('/api/admin/stores', {
      headers: { Authorization: `Bearer ${this.auth.getToken()}` }
    }).then(r => r.json()).then((data: any) => {
      const stores = data.data ?? data;
      if (Array.isArray(stores) && stores.length > 0) {
        this.storeId = stores[0].id;
        this.wsService.subscribeQueue(this.storeId);
        this.wsService.subscribeRooms(this.storeId);
        this.loadData();
      }
    }).catch(() => {});
  }

  callNext(): void {
    this.calling = true;
    this.staffService.callNext(this.storeId).subscribe({
      next: entry => {
        this.calling = false;
        this.snackBar.open(`Called: ${entry.token} — ${entry.customerName}`, 'OK', { duration: 4000 });
        this.loadData();
      },
      error: err => {
        this.calling = false;
        this.snackBar.open(err?.error?.message ?? 'No customers waiting', 'Close', { duration: 3000 });
      },
    });
  }

  startService(entry: QueueEntryResponse): void {
    this.selectedEntry = entry;
    this.showRoomSelect = true;
  }

  confirmStartService(room: TrialRoomResponse): void {
    if (!this.selectedEntry) return;
    this.showRoomSelect = false;
    this.staffService.startService(this.selectedEntry.id, room.id).subscribe({
      next: () => {
        this.snackBar.open(`Service started in ${room.displayName}`, 'OK', { duration: 3000 });
        this.loadData();
      },
      error: err => this.snackBar.open(err?.error?.message ?? 'Error', 'Close', { duration: 3000 }),
    });
  }

  complete(entry: QueueEntryResponse): void {
    this.staffService.completeService(entry.id).subscribe({
      next: () => {
        this.snackBar.open('Session completed!', 'OK', { duration: 3000 });
        this.loadData();
      },
      error: err => this.snackBar.open(err?.error?.message ?? 'Error', 'Close', { duration: 3000 }),
    });
  }

  skip(entry: QueueEntryResponse): void {
    this.staffService.skipEntry(entry.id).subscribe({
      next: () => { this.snackBar.open('Customer skipped', 'OK', { duration: 3000 }); this.loadData(); },
      error: () => {},
    });
  }

  recall(entry: QueueEntryResponse): void {
    this.staffService.recallEntry(entry.id).subscribe({
      next: () => { this.snackBar.open('Customer recalled', 'OK', { duration: 3000 }); this.loadData(); },
      error: () => {},
    });
  }

  noShow(entry: QueueEntryResponse): void {
    this.staffService.markNoShow(entry.id).subscribe({
      next: () => { this.snackBar.open('Marked as no-show', 'OK', { duration: 3000 }); this.loadData(); },
      error: () => {},
    });
  }

  setRoomAvailable(room: TrialRoomResponse): void {
    import('../../core/services/admin.service').then(({ AdminService }) => {}).catch(() => {});
    fetch(`/api/admin/rooms/${room.id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.getToken()}`,
      },
      body: JSON.stringify({ status: 'AVAILABLE' }),
    }).then(() => this.loadData());
  }
}
