// ============================================================
// Auth Models
// ============================================================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  mobileNumber: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  roles: string[];
  fullName: string;
}

export interface JwtPayload {
  sub: string;
  roles: string[];
  fullName: string;
  exp: number;
  iat: number;
}

// ============================================================
// Queue Models
// ============================================================
export type QueueStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SERVING'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type Priority = 'NORMAL' | 'SENIOR' | 'VIP' | 'APPOINTMENT';

export interface JoinQueueRequest {
  storeId: string;
  customerName: string;
  mobileNumber: string;
  email?: string;
  numberOfItems: number;
  priority: Priority;
}

export interface QueueStatusResponse {
  token: string;
  customerName: string;
  queuePosition: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  status: QueueStatus;
  currentlyServingToken: string;
  availableRooms: number;
  trialRoomNumber: string;
  explanation: string;
  storeId: string;
  entryId: string;
}

export interface QueueEntryResponse {
  id: string;
  token: string;
  customerName: string;
  mobileNumber: string;
  numberOfItems: number;
  priority: Priority;
  status: QueueStatus;
  queuePosition: number;
  estimatedWaitMinutes: number;
  joinedAt: string;
  calledAt: string;
  trialRoomId: string;
  trialRoomNumber: string;
}

export interface LiveQueueStatusResponse {
  currentlyServingToken: string;
  waitingCount: number;
  availableRooms: number;
  occupiedRooms: number;
}

// ============================================================
// Trial Room Models
// ============================================================
export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'OUT_OF_SERVICE';

export interface TrialRoomResponse {
  id: string;
  roomNumber: string;
  displayName: string;
  maxItems: number;
  status: RoomStatus;
  storeId: string;
  currentToken?: string;
  currentCustomerName?: string;
  occupiedSince?: string;
}

// ============================================================
// Store Models
// ============================================================
export interface StoreResponse {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export interface CreateStoreRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface CreateRoomRequest {
  storeId: string;
  roomNumber: string;
  displayName: string;
  maxItems: number;
}

// ============================================================
// Analytics Models
// ============================================================
export interface AnalyticsOverviewResponse {
  totalToday: number;
  avgWaitMinutes: number;
  avgServiceMinutes: number;
  peakHour: string;
  completedToday: number;
  cancelledToday: number;
  satisfactionRating: number;
  waitingNow: number;
  servedToday: number;
}

export interface HourlyDataPoint {
  hour: string;
  count: number;
  avgWait: number;
}

export interface PeakHourData {
  hour: number;
  dayOfWeek: string;
  count: number;
}

export interface RoomUtilizationData {
  roomNumber: string;
  utilizationPercent: number;
  totalServed: number;
  avgServiceMinutes: number;
}

export interface WaitTimeData {
  date: string;
  avgWait: number;
  maxWait: number;
  minWait: number;
}

// ============================================================
// AI Models
// ============================================================
export interface AiChatRequest {
  token?: string;
  storeId: string;
  conversationId?: string;
  message: string;
}

export interface AiChatResponse {
  conversationId: string;
  message: string;
  timestamp: string;
}

export interface AiInsightRequest {
  storeId: string;
  question: string;
  startDate: string;
  endDate: string;
}

export interface AiInsightResponse {
  insight: string;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  loading?: boolean;
}

// ============================================================
// Report Models
// ============================================================
export interface ReportRequest {
  storeId: string;
  date?: string;
  weekStart?: string;
}

export interface ReportResponse {
  reportId: string;
  title: string;
  content: string;
  generatedAt: string;
  type: 'DAILY' | 'WEEKLY';
}

// ============================================================
// Feedback Models
// ============================================================
export interface FeedbackRequest {
  queueEntryId: string;
  rating: number;
  comments?: string;
}

export interface FeedbackResponse {
  id: string;
  rating: number;
  comments: string;
  submittedAt: string;
}

// ============================================================
// User Models
// ============================================================
export type Role = 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  mobileNumber: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName: string;
  mobileNumber: string;
  role: Role;
}

// ============================================================
// Audit Models
// ============================================================
export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
}

// ============================================================
// WebSocket Payloads
// ============================================================
export interface QueueUpdatePayload {
  type: 'QUEUE_UPDATE' | 'TOKEN_CALLED' | 'TOKEN_UPDATE' | 'ROOM_UPDATE';
  storeId: string;
  waitingCount: number;
  currentlyServingToken: string;
  availableRooms: number;
  queue?: QueueEntryResponse[];
}

export interface RoomUpdatePayload {
  type: string;
  storeId: string;
  rooms: TrialRoomResponse[];
}

export interface TokenUpdatePayload {
  token: string;
  status: QueueStatus;
  queuePosition: number;
  peopleAhead: number;
  estimatedWaitMinutes: number;
  trialRoomNumber: string;
  message?: string;
}

export interface DisplayUpdatePayload {
  storeId: string;
  currentlyServing: string[];
  nextInQueue: string[];
  waitingCount: number;
  estimatedWaitMinutes: number;
  rooms: TrialRoomResponse[];
}

// ============================================================
// Generic API Wrappers
// ============================================================
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
