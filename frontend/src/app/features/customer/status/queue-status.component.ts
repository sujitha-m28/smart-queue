import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, interval, takeUntil, switchMap, startWith } from 'rxjs';
import { QueueService } from '../../../core/services/queue.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { AiService } from '../../../core/services/ai.service';
import { QueueStatusResponse, ChatMessage, TokenUpdatePayload } from '../../../core/models';

@Component({
  selector: 'app-queue-status',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule,
    MatChipsModule, MatDividerModule, MatFormFieldModule, MatInputModule, MatSnackBarModule,
  ],
  template: `
    <div class="status-page">
      <div class="status-container">

        <!-- Header -->
        <div class="page-header">
          <mat-icon>door_sliding</mat-icon>
          <h2>Queue Status</h2>
        </div>

        @if (status) {
          <!-- Status Badge -->
          <div class="status-badge" [class]="'status-' + status.status.toLowerCase()">
            <mat-icon>{{ statusIcon }}</mat-icon>
            <span>{{ statusLabel }}</span>
          </div>

          <!-- Token Card -->
          <mat-card class="token-card">
            <mat-card-content>
              <div class="token-header">
                <div>
                  <div class="token-label">Your Token</div>
                  <div class="token-number">{{ status.token }}</div>
                </div>
                <div class="customer-name">{{ status.customerName }}</div>
              </div>

              @if (status.status === 'CALLED') {
                <div class="alert-called">
                  <mat-icon>notifications_active</mat-icon>
                  Please proceed to {{ status.trialRoomNumber || 'the counter' }}!
                </div>
              }

              @if (status.status === 'SERVING') {
                <div class="alert-serving">
                  <mat-icon>check_circle</mat-icon>
                  You are currently being served in {{ status.trialRoomNumber }}
                </div>
              }

              <!-- Queue Metrics -->
              @if (['WAITING', 'CALLED'].includes(status.status)) {
                <div class="metrics-grid">
                  <div class="metric">
                    <mat-icon>format_list_numbered</mat-icon>
                    <span class="metric-value">{{ status.queuePosition }}</span>
                    <span class="metric-label">Position</span>
                  </div>
                  <div class="metric">
                    <mat-icon>people</mat-icon>
                    <span class="metric-value">{{ status.peopleAhead }}</span>
                    <span class="metric-label">Ahead of you</span>
                  </div>
                  <div class="metric">
                    <mat-icon>schedule</mat-icon>
                    <span class="metric-value">{{ status.estimatedWaitMinutes }}</span>
                    <span class="metric-label">Min wait</span>
                  </div>
                  <div class="metric">
                    <mat-icon>meeting_room</mat-icon>
                    <span class="metric-value">{{ status.availableRooms }}</span>
                    <span class="metric-label">Rooms free</span>
                  </div>
                </div>

                @if (status.status === 'WAITING') {
                  <mat-progress-bar mode="determinate"
                    [value]="progressValue"
                    color="primary">
                  </mat-progress-bar>
                  <p class="progress-label">{{ progressLabel }}</p>
                }
              }

              @if (status.status === 'COMPLETED') {
                <div class="feedback-section">
                  <h3>How was your experience?</h3>
                  <div class="stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <mat-icon
                        [class.filled]="(feedbackRating || 0) >= star"
                        (click)="feedbackRating = star" class="star">
                        {{ (feedbackRating || 0) >= star ? 'star' : 'star_border' }}
                      </mat-icon>
                    }
                  </div>
                  @if (feedbackRating) {
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Comments (optional)</mat-label>
                      <textarea matInput [formControl]="commentControl" rows="2"></textarea>
                    </mat-form-field>
                    <button mat-raised-button color="primary" (click)="submitFeedback()">
                      Submit Feedback
                    </button>
                  }
                </div>
              }

              <!-- Action Buttons -->
              <div class="actions">
                @if (status.status === 'WAITING') {
                  <button mat-stroked-button color="warn" (click)="confirmCancel()">
                    <mat-icon>cancel</mat-icon> Cancel Queue
                  </button>
                }
                <button mat-stroked-button (click)="refresh()">
                  <mat-icon>refresh</mat-icon> Refresh
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- AI Chatbot -->
          <mat-card class="chat-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>smart_toy</mat-icon>
                AI Assistant
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="chat-messages">
                @for (msg of chatMessages; track $index) {
                  <div class="chat-msg" [class.user-msg]="msg.role === 'user'">
                    <mat-icon>{{ msg.role === 'user' ? 'person' : 'smart_toy' }}</mat-icon>
                    <div class="msg-content">
                      {{ msg.loading ? '...' : msg.content }}
                    </div>
                  </div>
                }
              </div>
              <div class="chat-input">
                <mat-form-field appearance="outline" class="chat-field">
                  <input matInput [formControl]="chatControl"
                         placeholder="Ask about your queue status..."
                         (keyup.enter)="sendChat()">
                </mat-form-field>
                <button mat-icon-button color="primary" (click)="sendChat()" [disabled]="chatLoading">
                  <mat-icon>send</mat-icon>
                </button>
              </div>
            </mat-card-content>
          </mat-card>

        } @else {
          <mat-card>
            <mat-card-content class="loading">
              <mat-icon class="loading-icon">hourglass_empty</mat-icon>
              <p>Loading queue status...</p>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </div>
  `,
  styles: [`
    .status-page {
      min-height: 100vh;
      background: #f5f5f5;
      padding: 16px;
    }
    .status-container { max-width: 480px; margin: 0 auto; }
    .page-header {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 16px;
    }
    .page-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; }
    .status-badge {
      display: flex; align-items: center; gap: 8px;
      padding: 12px 20px; border-radius: 24px;
      font-weight: 700; font-size: 1rem;
      margin-bottom: 16px; justify-content: center;
    }
    .status-waiting { background: #fff3e0; color: #e65100; }
    .status-called { background: #e8f5e9; color: #1b5e20; animation: pulse 1.5s infinite; }
    .status-serving { background: #e3f2fd; color: #0d47a1; }
    .status-completed { background: #e8f5e9; color: #2e7d32; }
    .status-cancelled, .status-skipped, .status-no_show { background: #ffebee; color: #b71c1c; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }

    .token-card, .chat-card { border-radius: 12px !important; margin-bottom: 16px; }
    .token-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .token-label { font-size: 0.75rem; color: #666; text-transform: uppercase; }
    .token-number { font-size: 2.2rem; font-weight: 900; color: #1565c0; letter-spacing: 3px; }
    .customer-name { font-weight: 600; color: #333; }

    .alert-called {
      background: #e8f5e9; border: 2px solid #4caf50;
      border-radius: 8px; padding: 12px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
      color: #1b5e20; font-weight: 600; animation: pulse 1.5s infinite;
    }
    .alert-serving {
      background: #e3f2fd; border: 2px solid #1976d2;
      border-radius: 8px; padding: 12px; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px;
      color: #0d47a1; font-weight: 600;
    }

    .metrics-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 8px; margin-bottom: 12px;
    }
    .metric {
      background: #f5f5f5; border-radius: 8px;
      padding: 10px 8px; text-align: center;
    }
    .metric mat-icon { font-size: 20px; color: #1565c0; display: block; }
    .metric-value { display: block; font-size: 1.3rem; font-weight: 700; color: #1a237e; }
    .metric-label { display: block; font-size: 0.65rem; color: #777; }
    .progress-label { text-align: center; font-size: 0.8rem; color: #666; margin: 4px 0 0; }

    .feedback-section { padding: 8px 0; }
    .feedback-section h3 { margin: 0 0 12px; }
    .stars { display: flex; gap: 4px; margin-bottom: 12px; }
    .star { cursor: pointer; font-size: 32px; color: #bbb; transition: color 0.2s; }
    .star.filled { color: #f9a825; }

    .actions { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .full-width { width: 100%; }

    .chat-messages {
      max-height: 200px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 8px;
      padding: 8px 0; margin-bottom: 12px;
    }
    .chat-msg {
      display: flex; gap: 8px; align-items: flex-start;
      background: #f5f5f5; border-radius: 8px; padding: 8px;
    }
    .user-msg { background: #e3f2fd; flex-direction: row-reverse; }
    .msg-content { font-size: 0.9rem; }
    .chat-input { display: flex; align-items: center; gap: 4px; }
    .chat-field { flex: 1; }

    .loading { text-align: center; padding: 40px; }
    .loading-icon { font-size: 48px; color: #bbb; }
  `],
})
export class QueueStatusComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private queueService = inject(QueueService);
  private wsService = inject(WebSocketService);
  private aiService = inject(AiService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  private destroy$ = new Subject<void>();

  status: QueueStatusResponse | null = null;
  token = '';
  feedbackRating = 0;
  chatMessages: ChatMessage[] = [];
  chatLoading = false;
  conversationId = '';

  chatControl = this.fb.control('');
  commentControl = this.fb.control('');

  get statusIcon(): string {
    const icons: Record<string, string> = {
      WAITING: 'hourglass_empty', CALLED: 'notifications_active',
      SERVING: 'meeting_room', COMPLETED: 'check_circle',
      CANCELLED: 'cancel', SKIPPED: 'skip_next', NO_SHOW: 'person_off',
    };
    return icons[this.status?.status ?? ''] ?? 'info';
  }

  get statusLabel(): string {
    const labels: Record<string, string> = {
      WAITING: 'Waiting in Queue', CALLED: '🔔 Your Turn — Please Proceed!',
      SERVING: 'Currently Being Served', COMPLETED: 'Session Complete',
      CANCELLED: 'Cancelled', SKIPPED: 'Skipped', NO_SHOW: 'No Show',
    };
    return labels[this.status?.status ?? ''] ?? '';
  }

  get progressValue(): number {
    if (!this.status?.queuePosition) return 0;
    const max = this.status.queuePosition + this.status.peopleAhead;
    return Math.round(((max - this.status.peopleAhead) / max) * 100);
  }

  get progressLabel(): string {
    return this.status?.explanation ?? `Estimated wait: ${this.status?.estimatedWaitMinutes} min`;
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    // Initial load + poll every 30s
    interval(30000).pipe(startWith(0), takeUntil(this.destroy$)).subscribe(() => this.refresh());

    // WebSocket real-time
    this.wsService.connect();
    this.wsService.subscribeToken(this.token);
    this.wsService.tokenUpdate$.pipe(takeUntil(this.destroy$)).subscribe(payload => {
      this.applyTokenUpdate(payload);
    });

    // Initial AI greeting
    this.chatMessages.push({
      role: 'ai',
      content: 'Hi! I\'m your queue assistant. Ask me about your wait time, position, or anything else!',
      timestamp: new Date(),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh(): void {
    if (!this.token) return;
    this.queueService.getQueueStatus(this.token).subscribe({
      next: res => this.status = res,
      error: () => {},
    });
  }

  private applyTokenUpdate(payload: TokenUpdatePayload): void {
    if (!this.status) return;
    this.status = {
      ...this.status,
      status: payload.status,
      queuePosition: payload.queuePosition,
      peopleAhead: payload.peopleAhead,
      estimatedWaitMinutes: payload.estimatedWaitMinutes,
      trialRoomNumber: payload.trialRoomNumber,
    };
    if (payload.status === 'CALLED') {
      this.snackBar.open(`🔔 Your turn! Proceed to ${payload.trialRoomNumber || 'the counter'}`, 'OK', { duration: 10000 });
    }
  }

  confirmCancel(): void {
    if (confirm('Are you sure you want to cancel your queue entry?')) {
      this.queueService.cancelQueue(this.token).subscribe({
        next: () => this.refresh(),
        error: () => this.snackBar.open('Could not cancel. Try again.', 'Close', { duration: 3000 }),
      });
    }
  }

  sendChat(): void {
    const msg = this.chatControl.value?.trim();
    if (!msg || this.chatLoading) return;

    this.chatMessages.push({ role: 'user', content: msg, timestamp: new Date() });
    this.chatControl.setValue('');
    this.chatLoading = true;
    const loadingMsg: ChatMessage = { role: 'ai', content: '...', timestamp: new Date(), loading: true };
    this.chatMessages.push(loadingMsg);

    this.aiService.customerChat({
      token: this.token,
      storeId: this.status?.storeId ?? '',
      conversationId: this.conversationId,
      message: msg,
    }).subscribe({
      next: res => {
        const idx = this.chatMessages.lastIndexOf(loadingMsg);
        this.chatMessages[idx] = { role: 'ai', content: res.message, timestamp: new Date() };
        this.conversationId = res.conversationId;
        this.chatLoading = false;
      },
      error: () => {
        const idx = this.chatMessages.lastIndexOf(loadingMsg);
        this.chatMessages[idx] = { role: 'ai', content: 'Sorry, I\'m unavailable right now.', timestamp: new Date() };
        this.chatLoading = false;
      },
    });
  }

  submitFeedback(): void {
    if (!this.feedbackRating || !this.status?.entryId) return;
    this.queueService.submitFeedback({
      queueEntryId: this.status.entryId,
      rating: this.feedbackRating,
      comments: this.commentControl.value || undefined,
    }).subscribe({
      next: () => this.snackBar.open('Thank you for your feedback!', 'Close', { duration: 3000 }),
      error: () => this.snackBar.open('Feedback already submitted.', 'Close', { duration: 3000 }),
    });
  }
}
