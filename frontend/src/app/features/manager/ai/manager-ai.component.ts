import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { ChatMessage } from '../../../core/models';

@Component({
  selector: 'app-manager-ai',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatChipsModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/manager"><mat-icon>arrow_back</mat-icon></button>
      <mat-icon>smart_toy</mat-icon>
      <span style="margin-left:8px">AI Manager Insights</span>
    </mat-toolbar>

    <div class="ai-content">
      <mat-card class="chat-card">
        <mat-card-header>
          <mat-card-title>AI Analytics Assistant</mat-card-title>
          <mat-card-subtitle>Powered by GPT-4o-mini · Uses your live analytics data</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>

          <!-- Suggested Questions -->
          <div class="suggestions">
            <p class="suggestions-label">Try asking:</p>
            <div class="chips">
              @for (q of suggestions; track q) {
                <mat-chip (click)="askSuggestion(q)" class="suggestion-chip">{{ q }}</mat-chip>
              }
            </div>
          </div>

          <!-- Chat Window -->
          <div class="chat-window" #chatWindow>
            @for (msg of messages(); track $index) {
              <div class="chat-msg" [class.user-msg]="msg.role === 'user'">
                <mat-icon class="msg-icon">
                  {{ msg.role === 'user' ? 'person' : 'smart_toy' }}
                </mat-icon>
                <div class="msg-bubble" [class.user-bubble]="msg.role === 'user'">
                  @if (msg.loading) {
                    <mat-icon class="spin">autorenew</mat-icon>
                    Thinking...
                  } @else {
                    {{ msg.content }}
                  }
                </div>
              </div>
            }
          </div>

          <!-- Input -->
          <div class="chat-input">
            <mat-form-field appearance="outline" class="chat-field">
              <mat-label>Ask about queue operations, staffing, trends...</mat-label>
              <input matInput [formControl]="inputControl" (keyup.enter)="send()">
            </mat-form-field>
            <button mat-fab color="primary" (click)="send()" [disabled]="loading()">
              <mat-icon>send</mat-icon>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .spacer { flex: 1; }
    .ai-content { padding: 16px; max-width: 800px; margin: 0 auto; }
    .chat-card { border-radius: 12px !important; }
    .suggestions { margin-bottom: 16px; }
    .suggestions-label { margin: 0 0 8px; font-size: 0.85rem; color: #666; }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .suggestion-chip { cursor: pointer; }
    .chat-window {
      min-height: 300px; max-height: 450px; overflow-y: auto;
      display: flex; flex-direction: column; gap: 12px;
      padding: 8px 0; margin-bottom: 16px;
      border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px;
    }
    .chat-msg { display: flex; gap: 8px; align-items: flex-start; }
    .user-msg { flex-direction: row-reverse; }
    .msg-icon { font-size: 20px; color: #666; }
    .msg-bubble {
      background: #f5f5f5; border-radius: 12px;
      padding: 10px 14px; max-width: 75%; font-size: 0.9rem;
      line-height: 1.5; white-space: pre-wrap;
    }
    .user-bubble { background: #e3f2fd; }
    .chat-input { display: flex; align-items: center; gap: 8px; }
    .chat-field { flex: 1; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `],
})
export class ManagerAiComponent implements OnInit {
  auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private fb = inject(FormBuilder);

  messages = signal<ChatMessage[]>([]);
  loading = signal(false);
  inputControl = this.fb.control('');
  conversationId = '';
  storeId = '';

  suggestions = [
    'What are my peak hours?',
    'How can I reduce wait times?',
    'How many staff should I have during peak hours?',
    'Which trial room needs attention?',
    'What is today\'s customer satisfaction trend?',
  ];

  ngOnInit(): void {
    this.loadStoreId().then(() => {
      this.messages.update(msgs => [...msgs, {
        role: 'ai' as const,
        content: 'Hello! I\'m your AI analytics assistant. I have access to your live queue data. Ask me anything about your operations!',
        timestamp: new Date(),
      }]);
    });
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

  askSuggestion(q: string): void {
    this.inputControl.setValue(q);
    this.send();
  }

  send(): void {
    const msg = this.inputControl.value?.trim();
    if (!msg || this.loading()) return;

    this.inputControl.setValue('');
    this.messages.update(msgs => [...msgs, { role: 'user' as const, content: msg, timestamp: new Date() }]);

    const loadingMsg: ChatMessage = { role: 'ai', content: '...', timestamp: new Date(), loading: true };
    this.messages.update(msgs => [...msgs, loadingMsg]);
    this.loading.set(true);

    this.analyticsService.getManagerInsight({
      storeId: this.storeId,
      conversationId: this.conversationId,
      message: msg,
    }).subscribe({
      next: res => {
        this.loading.set(false);
        this.conversationId = res.conversationId;
        this.messages.update(msgs => {
          const updated = [...msgs];
          const idx = updated.lastIndexOf(loadingMsg);
          if (idx >= 0) updated[idx] = { role: 'ai', content: res.message, timestamp: new Date() };
          return updated;
        });
      },
      error: () => {
        this.loading.set(false);
        this.messages.update(msgs => {
          const updated = [...msgs];
          const idx = updated.lastIndexOf(loadingMsg);
          if (idx >= 0) updated[idx] = { role: 'ai', content: 'AI is temporarily unavailable. Please try again later.', timestamp: new Date() };
          return updated;
        });
      },
    });
  }
}
