import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from '../../../core/services/admin.service';
import { StoreResponse, TrialRoomResponse } from '../../../core/models';

@Component({
  selector: 'app-room-management',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatToolbarModule, MatCardModule, MatButtonModule, MatIconModule,
    MatTableModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule, MatSnackBarModule,
  ],
  template: `
    <mat-toolbar color="warn">
      <button mat-icon-button routerLink="/admin"><mat-icon>arrow_back</mat-icon></button>
      <mat-icon>door_sliding</mat-icon>
      <span style="margin-left:8px">Trial Room Management</span>
      <span class="spacer"></span>
      <button mat-raised-button (click)="showCreate = !showCreate">
        <mat-icon>add</mat-icon> Add Room
      </button>
    </mat-toolbar>

    <div class="page-content">
      @if (showCreate) {
        <mat-card class="form-card">
          <mat-card-header><mat-card-title>Add Trial Room</mat-card-title></mat-card-header>
          <mat-card-content>
            <form [formGroup]="createForm" (ngSubmit)="createRoom()" class="room-form">
              <mat-form-field appearance="outline">
                <mat-label>Store</mat-label>
                <mat-select formControlName="storeId">
                  @for (s of stores(); track s.id) {
                    <mat-option [value]="s.id">{{ s.name }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Room Number</mat-label>
                <input matInput formControlName="roomNumber" placeholder="e.g. TR-001">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Display Name</mat-label>
                <input matInput formControlName="displayName" placeholder="e.g. Trial Room 1">
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Max Items</mat-label>
                <input matInput type="number" formControlName="maxItems" min="1" max="15">
              </mat-form-field>
              <div class="form-actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="createForm.invalid">
                  Add Room
                </button>
                <button mat-button type="button" (click)="showCreate = false">Cancel</button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-header><mat-card-title>Trial Rooms ({{ rooms().length }})</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="rooms-grid">
            @for (room of rooms(); track room.id) {
              <div class="room-item" [class]="'status-' + room.status.toLowerCase()">
                <mat-icon>door_sliding</mat-icon>
                <div class="room-info">
                  <div class="room-name">{{ room.displayName }}</div>
                  <div class="room-meta">{{ room.roomNumber }} · Max {{ room.maxItems }} items</div>
                </div>
                <mat-chip [class]="'chip-' + room.status.toLowerCase()">{{ room.status }}</mat-chip>
                <mat-select [value]="room.status" (selectionChange)="updateStatus(room, $event.value)" class="status-select">
                  <mat-option value="AVAILABLE">Available</mat-option>
                  <mat-option value="CLEANING">Cleaning</mat-option>
                  <mat-option value="OUT_OF_SERVICE">Out of Service</mat-option>
                </mat-select>
              </div>
            }
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .spacer { flex: 1; }
    .page-content { padding: 16px; max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; }
    .form-card { border-radius: 12px !important; }
    .room-form { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .room-form mat-form-field { width: 100%; }
    .form-actions { grid-column: span 2; display: flex; gap: 8px; }
    .rooms-grid { display: flex; flex-direction: column; gap: 8px; }
    .room-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border-radius: 8px; background: #f9f9f9;
      border-left: 4px solid transparent;
    }
    .status-available { border-color: #4caf50; }
    .status-occupied { border-color: #ff9800; }
    .status-cleaning { border-color: #2196f3; }
    .status-out_of_service { border-color: #f44336; }
    .room-info { flex: 1; }
    .room-name { font-weight: 600; }
    .room-meta { font-size: 0.8rem; color: #666; }
    .status-select { width: 160px; }
  `],
})
export class RoomManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  rooms = signal<TrialRoomResponse[]>([]);
  stores = signal<StoreResponse[]>([]);
  showCreate = false;

  createForm = this.fb.group({
    storeId: ['', Validators.required],
    roomNumber: ['', Validators.required],
    displayName: ['', Validators.required],
    maxItems: [6, [Validators.required, Validators.min(1), Validators.max(15)]],
  });

  ngOnInit(): void {
    this.adminService.getStores().subscribe({ next: s => this.stores.set(s) });
    this.loadRooms();
  }

  loadRooms(): void {
    this.adminService.getRooms().subscribe({ next: r => this.rooms.set(r) });
  }

  createRoom(): void {
    if (this.createForm.invalid) return;
    this.adminService.createRoom(this.createForm.value as any).subscribe({
      next: () => {
        this.snackBar.open('Room created!', 'OK', { duration: 3000 });
        this.showCreate = false;
        this.loadRooms();
        this.createForm.reset({ maxItems: 6 });
      },
      error: err => this.snackBar.open(err?.error?.message ?? 'Error', 'Close', { duration: 3000 }),
    });
  }

  updateStatus(room: TrialRoomResponse, status: string): void {
    this.adminService.updateRoomStatus(room.id, status).subscribe({
      next: () => this.loadRooms(),
      error: () => {},
    });
  }
}
