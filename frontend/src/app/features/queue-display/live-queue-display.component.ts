import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject, interval, takeUntil, startWith } from 'rxjs';
import { WebSocketService } from '../../core/services/websocket.service';
import { QueueService } from '../../core/services/queue.service';
import { TrialRoomResponse } from '../../core/models';

interface DisplayData {
  currentlyServing: string[];
  waiting: string[];
  availableRooms: number;
  waitingCount: number;
  estimatedWait: number;
}

@Component({
  selector: 'app-live-queue-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="display-page">
      <!-- Header -->
      <div class="display-header">
        <div class="brand">
          <span class="brand-icon">🚪</span>
          <div>
            <h1>Smart Trial Room</h1>
            <p>Queue Management System</p>
          </div>
        </div>
        <div class="clock">{{ currentTime() }}</div>
      </div>

      <!-- Main Content -->
      <div class="display-body">

        <!-- Now Serving -->
        <div class="now-serving-section">
          <div class="section-title">🎯 NOW SERVING</div>
          <div class="serving-tokens">
            @if (data().currentlyServing.length > 0) {
              @for (token of data().currentlyServing; track token) {
                <div class="serving-token">{{ token }}</div>
              }
            } @else {
              <div class="empty-serving">No one being served yet</div>
            }
          </div>
        </div>

        <!-- Queue Info Row -->
        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-number">{{ data().waitingCount }}</div>
            <div class="stat-label">Waiting</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">{{ data().estimatedWait }} min</div>
            <div class="stat-label">Est. Wait</div>
          </div>
          <div class="stat-box">
            <div class="stat-number">{{ data().availableRooms }}</div>
            <div class="stat-label">Rooms Free</div>
          </div>
        </div>

        <!-- Next in Queue -->
        @if (data().waiting.length > 0) {
          <div class="next-section">
            <div class="section-title">⏳ NEXT IN QUEUE</div>
            <div class="next-tokens">
              @for (token of data().waiting.slice(0, 5); track token) {
                <div class="next-token">{{ token }}</div>
              }
              @if (data().waiting.length > 5) {
                <div class="more-count">+{{ data().waiting.length - 5 }} more</div>
              }
            </div>
          </div>
        }

        <!-- Room Grid -->
        @if (rooms().length > 0) {
          <div class="rooms-section">
            <div class="section-title">🚪 TRIAL ROOMS</div>
            <div class="rooms-grid">
              @for (room of rooms(); track room.id) {
                <div class="room-tile" [class]="'room-' + room.status.toLowerCase()">
                  <div class="room-name">{{ room.displayName }}</div>
                  <div class="room-status">
                    @if (room.status === 'AVAILABLE') { ✅ Free }
                    @else if (room.status === 'OCCUPIED') { 👤 Occupied }
                    @else if (room.status === 'CLEANING') { 🧹 Cleaning }
                    @else { 🔧 Service }
                  </div>
                  @if (room.status === 'OCCUPIED' && room.currentToken) {
                    <div class="room-token">{{ room.currentToken }}</div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Footer -->
      <div class="display-footer">
        <span>📱 Scan QR to join queue | 🔔 You'll be notified when it's your turn</span>
        <span class="ws-status">{{ wsConnected() ? '🟢 Live' : '🔴 Reconnecting...' }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .display-page {
      min-height: 100vh; background: #0a0a2e;
      color: #fff; font-family: 'Segoe UI', system-ui, sans-serif;
      display: flex; flex-direction: column;
    }
    .display-header {
      background: #1a1a4e; padding: 16px 32px;
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 2px solid #3f51b5;
    }
    .brand { display: flex; align-items: center; gap: 16px; }
    .brand-icon { font-size: 2.5rem; }
    .brand h1 { margin: 0; font-size: 1.8rem; font-weight: 800; color: #90caf9; }
    .brand p { margin: 0; color: #9fa8da; font-size: 0.9rem; }
    .clock { font-size: 2rem; font-weight: 300; color: #90caf9; font-variant-numeric: tabular-nums; }

    .display-body { flex: 1; padding: 24px 32px; display: flex; flex-direction: column; gap: 24px; }
    .section-title { font-size: 1rem; letter-spacing: 3px; color: #9fa8da; margin-bottom: 12px; font-weight: 600; }

    .now-serving-section {}
    .serving-tokens { display: flex; gap: 16px; flex-wrap: wrap; }
    .serving-token {
      background: linear-gradient(135deg, #00c853, #1b5e20);
      border-radius: 16px; padding: 20px 40px;
      font-size: 3rem; font-weight: 900; letter-spacing: 6px;
      box-shadow: 0 0 30px rgba(0, 200, 83, 0.4);
      animation: glow 2s infinite;
    }
    .empty-serving { color: #555; font-style: italic; font-size: 1.2rem; }
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 30px rgba(0,200,83,0.4); }
      50% { box-shadow: 0 0 60px rgba(0,200,83,0.7); }
    }

    .stats-row { display: flex; gap: 16px; }
    .stat-box {
      flex: 1; background: #1a1a4e; border-radius: 12px;
      padding: 20px; text-align: center;
      border: 1px solid #3f51b5;
    }
    .stat-number { font-size: 3rem; font-weight: 800; color: #90caf9; }
    .stat-label { font-size: 0.85rem; color: #9fa8da; letter-spacing: 1px; text-transform: uppercase; }

    .next-section {}
    .next-tokens { display: flex; gap: 12px; flex-wrap: wrap; }
    .next-token {
      background: #1a1a4e; border: 2px solid #3f51b5;
      border-radius: 10px; padding: 12px 24px;
      font-size: 1.6rem; font-weight: 700; letter-spacing: 3px;
      color: #e8eaf6;
    }
    .more-count { color: #9fa8da; font-size: 1.2rem; display: flex; align-items: center; }

    .rooms-section {}
    .rooms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .room-tile {
      border-radius: 10px; padding: 16px; text-align: center;
      border: 2px solid transparent;
    }
    .room-available { background: #1b3a1b; border-color: #4caf50; }
    .room-occupied { background: #3a2a0a; border-color: #ff9800; }
    .room-cleaning { background: #0a1a3a; border-color: #2196f3; }
    .room-out_of_service { background: #3a0a0a; border-color: #f44336; }
    .room-name { font-weight: 700; font-size: 0.95rem; }
    .room-status { font-size: 1rem; margin-top: 4px; }
    .room-token { font-size: 1.1rem; font-weight: 700; color: #ffcc02; margin-top: 4px; }

    .display-footer {
      background: #1a1a4e; padding: 12px 32px;
      display: flex; justify-content: space-between; align-items: center;
      border-top: 1px solid #3f51b5;
      font-size: 0.9rem; color: #9fa8da;
    }
    .ws-status { font-size: 0.8rem; }
  `],
})
export class LiveQueueDisplayComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private wsService = inject(WebSocketService);
  private queueService = inject(QueueService);
  private destroy$ = new Subject<void>();

  currentTime = signal(this.formatTime());
  wsConnected = signal(false);
  data = signal<DisplayData>({
    currentlyServing: [],
    waiting: [],
    availableRooms: 0,
    waitingCount: 0,
    estimatedWait: 0,
  });
  rooms = signal<TrialRoomResponse[]>([]);

  storeId = '';

  ngOnInit(): void {
    this.storeId = this.route.snapshot.paramMap.get('storeId') ?? '';

    // Clock tick
    interval(1000).pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.currentTime.set(this.formatTime());
    });

    // Poll live status every 15s
    interval(15000).pipe(startWith(0), takeUntil(this.destroy$)).subscribe(() => {
      this.refreshData();
    });

    // WebSocket real-time
    this.wsService.connect();
    this.wsConnected.set(true);
    this.wsService.subscribeQueue(this.storeId);
    this.wsService.subscribeRooms(this.storeId);

    this.wsService.queueUpdate$.pipe(takeUntil(this.destroy$)).subscribe(payload => {
      this.data.update(d => ({
        ...d,
        currentlyServing: payload.currentlyServingToken ? [payload.currentlyServingToken] : [],
        waiting: payload.queue?.filter(e => e.status === 'WAITING').map(e => e.token) ?? [],
        waitingCount: payload.waitingCount,
        availableRooms: payload.availableRooms,
      }));
    });

    this.wsService.roomUpdate$.pipe(takeUntil(this.destroy$)).subscribe(payload => {
      this.rooms.set(payload.rooms);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private refreshData(): void {
    if (!this.storeId) return;
    this.queueService.getLiveStatus(this.storeId).subscribe({
      next: s => {
        this.data.update(d => ({
          ...d,
          currentlyServing: s.currentlyServingToken ? [s.currentlyServingToken] : [],
          waitingCount: s.waitingCount,
          availableRooms: s.availableRooms,
        }));
      },
      error: () => {},
    });
    this.queueService.getRoomsStatus(this.storeId).subscribe({
      next: r => this.rooms.set(r),
      error: () => {},
    });
  }

  private formatTime(): string {
    return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
}
