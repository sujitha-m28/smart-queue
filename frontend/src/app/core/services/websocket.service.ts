import { Injectable, inject, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { QueueUpdatePayload, TokenUpdatePayload, RoomUpdatePayload } from '../models';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client | null = null;

  readonly queueUpdate$ = new Subject<QueueUpdatePayload>();
  readonly tokenUpdate$ = new Subject<TokenUpdatePayload>();
  readonly roomUpdate$  = new Subject<RoomUpdatePayload>();

  connect(): void {
    if (this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WS] Connected');
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected');
      },
    });

    this.client.activate();
  }

  subscribeQueue(storeId: string): void {
    this.ensureConnected();
    this.client!.subscribe(`/topic/queue/${storeId}`, (msg: IMessage) => {
      try {
        this.queueUpdate$.next(JSON.parse(msg.body) as QueueUpdatePayload);
      } catch { /* ignore parse errors */ }
    });
  }

  subscribeToken(token: string): void {
    this.ensureConnected();
    this.client!.subscribe(`/topic/token/${token}`, (msg: IMessage) => {
      try {
        this.tokenUpdate$.next(JSON.parse(msg.body) as TokenUpdatePayload);
      } catch { /* ignore parse errors */ }
    });
  }

  subscribeRooms(storeId: string): void {
    this.ensureConnected();
    this.client!.subscribe(`/topic/rooms/${storeId}`, (msg: IMessage) => {
      try {
        this.roomUpdate$.next(JSON.parse(msg.body) as RoomUpdatePayload);
      } catch { /* ignore parse errors */ }
    });
  }

  disconnect(): void {
    this.client?.deactivate();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private ensureConnected(): void {
    if (!this.client?.active) {
      this.connect();
    }
  }
}
