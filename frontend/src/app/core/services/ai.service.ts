import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AiChatRequest, AiChatResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly http = inject(HttpClient);

  customerChat(request: AiChatRequest): Observable<AiChatResponse> {
    return this.http.post<AiChatResponse>('/api/ai/chat', request);
  }
}
