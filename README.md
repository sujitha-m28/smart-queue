# 🛍️ Smart Trial Room Queue Management System

A production-ready, full-stack web application for intelligent retail trial room queue management. Built as a B.Sc. IT final-year project with real-world deployment capabilities.

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.x-6DB33F?logo=spring-boot)](https://spring.io/projects/spring-boot)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular)](https://angular.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk)](https://openjdk.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://docs.docker.com/compose)

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Architecture](#-architecture)
4. [Technology Stack](#-technology-stack)
5. [Database Design](#-database-design)
6. [API Documentation](#-api-documentation)
7. [Setup Instructions](#-setup-instructions)
8. [Environment Variables](#-environment-variables)
9. [Docker Instructions](#-docker-instructions)
10. [Running Locally](#-running-locally-without-docker)
11. [Demo Credentials](#-demo-credentials)
12. [AI Configuration](#-ai-configuration)
13. [Testing](#-testing)
14. [WebSocket Topics](#-websocket-topics)
15. [Future Enhancements](#-future-enhancements)

---

## 🎯 Project Overview

The Smart Trial Room Queue Management System is a digital queue management platform for retail stores. Customers scan a QR code near the trial room area, join the digital queue, receive a token, and track their position in real time on their mobile devices. Store staff manage the queue through a professional dashboard. Managers get AI-powered analytics and operational insights. Administrators configure the entire system.

### Key Capabilities

- 📱 **QR Code Based** — Customers scan a QR code to join the queue (no app download required)
- 🎫 **Digital Tokens** — Unique tokens like `TR-042` with live queue tracking
- ⚡ **Real-Time Updates** — WebSocket/STOMP push updates to all screens
- 🤖 **AI Assistant** — Generative AI chatbot for customers and manager insights
- 📊 **Analytics Dashboard** — Historical charts, peak hours, utilization metrics
- 📋 **AI Reports** — Automated daily/weekly operational reports
- 🔔 **Notifications** — Extensible notification system (Mock → SMS/Email/WhatsApp)
- 🔐 **Role-Based Access** — Customer, Staff, Manager, Admin with JWT authentication

---

## ✨ Features

### 👤 Customer
- Scan QR code → open join form on mobile browser
- Enter name, mobile, items count → join queue
- Receive unique digital token (e.g., `TR-042`)
- Live queue position, people ahead, estimated wait time
- AI chatbot for queue-related questions
- Notifications when turn approaches / is called
- Leave queue anytime
- Post-session star rating and feedback

### 👷 Staff
- Login → view real-time queue dashboard
- Call next customer (priority-aware: VIP > Appointment > Senior > Normal)
- Assign trial room → start session timer
- Complete session → room auto-available
- Skip / Recall / No-Show actions with confirmation
- Real-time room status panels

### 📊 Manager
- Analytics dashboard with ApexCharts
- Customers per hour, wait times, peak hours, room utilization
- Date range filters (Today / Last 7 / 30 days / Custom)
- AI assistant: ask natural-language questions about queue performance
- Generate AI-powered daily/weekly PDF-ready reports
- Staffing recommendations

### 🔧 Admin
- Store management with QR code generation/download
- Trial room management (add, status, capacity)
- User management (create staff/manager accounts)
- Queue rule configuration
- System-wide audit logs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Customer (Mobile Browser — QR Scan)                        │
│  Staff / Manager / Admin (Desktop Browser)                   │
│         ↕  HTTP REST + WebSocket STOMP                      │
├─────────────────────────────────────────────────────────────┤
│  Angular 19 Frontend  (port 4200 dev / 80 Docker)          │
│  ┌──────────┬─────────────┬────────────┬──────────────┐   │
│  │ Customer │    Staff    │  Manager   │    Admin     │   │
│  │   Flow   │  Dashboard  │  Dashboard │   Dashboard  │   │
│  └──────────┴─────────────┴────────────┴──────────────┘   │
│  Core: AuthService, JwtInterceptor, RoleGuard, WebSocket    │
├─────────────────────────────────────────────────────────────┤
│  Spring Boot 3.3 Backend  (port 8080)                       │
│  ┌────────────┬───────────────┬──────────────────────┐     │
│  │  REST APIs │  WebSocket    │  Spring AI Service   │     │
│  │  /api/**   │  /ws (STOMP)  │  (OpenAI GPT-4o-mini)│     │
│  └────────────┴───────────────┴──────────────────────┘     │
│  ┌────────────┬───────────────┬──────────────────────┐     │
│  │   Queue    │  Prediction   │   Notification       │     │
│  │  Engine    │  Service      │   Service (Mock)     │     │
│  └────────────┴───────────────┴──────────────────────┘     │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL 16  (port 5432)  —  Flyway migrations          │
└─────────────────────────────────────────────────────────────┘
```

### Queue Priority Order
```
APPOINTMENT > VIP > SENIOR_CITIZEN > NORMAL
Within same priority: FIFO (first-in, first-out)
```

### Queue State Machine
```
WAITING → CALLED → SERVING → COMPLETED
        ↓         ↓
      SKIPPED   NO_SHOW
        ↓
      CALLED (recall)
      
WAITING → CANCELLED (customer self-cancels)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Backend Language | Java | 21 (LTS) |
| Backend Framework | Spring Boot | 3.3.x |
| Security | Spring Security 6 + JJWT | 0.12.x |
| Database | PostgreSQL | 16 |
| ORM | Spring Data JPA / Hibernate | 6.x |
| DB Migrations | Flyway | 10.x |
| AI Integration | Spring AI + OpenAI | 1.0.x |
| Build Tool | Maven | 3.9+ |
| Frontend Framework | Angular | 19 |
| UI Components | Angular Material | 19 |
| Charts | ng-apexcharts | Latest |
| WebSocket | SockJS + STOMP | — |
| QR Code | ZXing | 3.5.3 |
| Containerization | Docker + Docker Compose | — |

---

## 🗄️ Database Design

### Entity Relationship Overview

```
stores (1) ──── (N) trial_rooms
stores (1) ──── (N) queue_entries
stores (1) ──── (N) appointments
stores (1) ──── (N) daily_reports
stores (1) ──── (N) ai_conversations

queue_entries (1) ──── (N) queue_events
queue_entries (1) ──── (1) service_sessions
queue_entries (1) ──── (1) customer_feedback
queue_entries (1) ──── (N) notifications

service_sessions (N) ──── (1) trial_rooms
service_sessions (N) ──── (1) users (staff)

users (N) ──── (N) roles
```

### Tables

| Table | Description | Primary Key |
|-------|-------------|-------------|
| `roles` | CUSTOMER, STAFF, MANAGER, ADMIN | BIGSERIAL |
| `users` | All system users | UUID |
| `user_roles` | User-role join | Composite |
| `stores` | Retail stores | UUID |
| `trial_rooms` | Trial rooms per store | UUID |
| `queue_entries` | Customer queue entries with token | UUID |
| `queue_events` | Immutable event audit trail | BIGSERIAL |
| `service_sessions` | Trial room sessions | UUID |
| `notifications` | Notification records | UUID |
| `customer_feedback` | Post-session ratings | UUID |
| `appointments` | Pre-booked slots | UUID |
| `ai_conversations` | AI chat sessions | UUID |
| `ai_messages` | Individual chat messages | BIGSERIAL |
| `daily_reports` | Generated reports | UUID |
| `audit_logs` | System audit trail | BIGSERIAL |

---

## 📡 API Documentation

### Authentication

```
POST /api/auth/login
Content-Type: application/json
{
  "username": "staff@azorte.com",
  "password": "password"
}

Response 200:
{
  "token": "eyJhbGciOiJIUzI1...",
  "username": "staff@azorte.com",
  "roles": ["STAFF"],
  "fullName": "Demo Staff"
}
```

```
POST /api/auth/register
{
  "username": "newstaff@azorte.com",
  "email": "newstaff@azorte.com",
  "password": "SecurePass@123",
  "fullName": "New Staff Member",
  "mobileNumber": "9876543210",
  "role": "STAFF"
}
```

### Customer APIs (Public — No Auth)

```
POST /api/queue/join
{
  "storeId": "uuid-of-store",
  "customerName": "Rahul Sharma",
  "mobileNumber": "9876543210",
  "email": "rahul@example.com",
  "numberOfItems": 3,
  "priority": "NORMAL"
}

Response 201:
{
  "token": "TR-042",
  "customerName": "Rahul Sharma",
  "queuePosition": 5,
  "peopleAhead": 4,
  "estimatedWaitMinutes": 18,
  "status": "WAITING",
  "currentlyServingToken": "TR-038",
  "availableRooms": 2,
  "trialRoomNumber": null,
  "explanation": "Estimated based on 4 people ahead, 2 active rooms, avg service time 8 min"
}
```

```
GET /api/queue/{token}          # Get queue status by token
DELETE /api/queue/{token}/cancel # Cancel queue entry
GET /api/queue/status/{storeId} # Overall queue status
```

### Staff APIs (Bearer JWT Required — STAFF/MANAGER/ADMIN)

```
POST /api/staff/queue/next
Authorization: Bearer {token}
{ "storeId": "uuid" }

POST /api/staff/queue/{id}/start
{ "trialRoomId": "uuid" }

POST /api/staff/queue/{id}/complete
POST /api/staff/queue/{id}/skip
POST /api/staff/queue/{id}/recall
POST /api/staff/queue/{id}/no-show
GET  /api/staff/queue/{storeId}/live
GET  /api/staff/rooms/{storeId}
```

### Manager APIs (MANAGER/ADMIN)

```
GET /api/manager/analytics/overview?storeId={uuid}&date=2024-01-15
GET /api/manager/analytics/hourly?storeId={uuid}&start=2024-01-01&end=2024-01-31
GET /api/manager/analytics/peak-hours?storeId={uuid}&start=...&end=...
GET /api/manager/analytics/room-utilization?storeId={uuid}&start=...&end=...

POST /api/manager/ai/insight
{
  "storeId": "uuid",
  "question": "What was the busiest hour today?",
  "startDate": "2024-01-15",
  "endDate": "2024-01-15"
}

POST /api/manager/reports/daily
{ "storeId": "uuid", "date": "2024-01-15" }

POST /api/manager/reports/weekly
{ "storeId": "uuid", "weekStart": "2024-01-08" }
```

### Admin APIs (ADMIN Only)

```
GET  /api/admin/stores
POST /api/admin/stores
GET  /api/admin/stores/{storeId}/qr       # Returns PNG image
GET  /api/admin/rooms?storeId={uuid}
POST /api/admin/rooms
PUT  /api/admin/rooms/{id}/status
GET  /api/admin/users
POST /api/admin/users
GET  /api/admin/audit-logs
```

### AI Chatbot (Public with valid queue token)

```
POST /api/ai/chat
{
  "token": "TR-042",
  "storeId": "uuid",
  "conversationId": null,
  "message": "How long will I have to wait?"
}

Response:
{
  "conversationId": "uuid",
  "message": "You have 4 people ahead of you. Estimated waiting time is 18 minutes.",
  "timestamp": "2024-01-15T14:30:00"
}
```

---

## 🚀 Setup Instructions

### Prerequisites

- **Java 21+** — [Download](https://adoptium.net/)
- **Maven 3.9+** — [Download](https://maven.apache.org/download.cgi)
- **Node.js 22+** — [Download](https://nodejs.org/)
- **PostgreSQL 16** — [Download](https://www.postgresql.org/download/) (or use Docker)
- **Docker & Docker Compose** — [Download](https://docs.docker.com/get-docker/) (optional)
- **Angular CLI 19** — `npm install -g @angular/cli@19`

### 1. Clone / Navigate to Project

```bash
cd smart-trial-room
```

### 2. Create Environment File

```bash
cp .env.example .env
# Edit .env with your values (especially AI_API_KEY)
```

### 3. Create PostgreSQL Database

```sql
CREATE DATABASE trialroom_db;
CREATE USER trialroom WITH PASSWORD 'trialroom_secure_pass_2024';
GRANT ALL PRIVILEGES ON DATABASE trialroom_db TO trialroom;
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `trialroom_db` |
| `POSTGRES_USER` | DB username | `trialroom` |
| `POSTGRES_PASSWORD` | DB password | *(required)* |
| `DB_URL` | JDBC URL | `jdbc:postgresql://localhost:5432/trialroom_db` |
| `JWT_SECRET` | JWT signing secret (Base64, ≥256 bits) | *(required)* |
| `JWT_EXPIRATION_MS` | Token validity in ms | `86400000` (24h) |
| `AI_API_KEY` | OpenAI or Gemini API key | *(required for AI)* |
| `AI_MODEL` | AI model name | `gpt-4o-mini` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | `http://localhost:4200` |
| `NOTIFICATION_PROVIDER` | `mock`, `email`, or `sms` | `mock` |
| `FRONTEND_BASE_URL` | Base URL for QR code generation | `http://localhost:4200` |

---

## 🐳 Docker Instructions

### Quick Start (Recommended)

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env and set AI_API_KEY and strong passwords

# 2. Start all services
docker-compose up --build

# 3. Access the application
open http://localhost          # Angular frontend
open http://localhost:8080     # Spring Boot backend (API)
```

### Docker Commands

```bash
# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v

# Rebuild specific service
docker-compose up --build backend
```

### Docker Startup Order
1. PostgreSQL starts and becomes healthy
2. Spring Boot starts, Flyway runs migrations, seeds demo data
3. Angular frontend starts

---

## 💻 Running Locally (Without Docker)

### Backend

```bash
cd backend

# Configure database (set environment variables or edit application.yml)
export DB_URL=jdbc:postgresql://localhost:5432/trialroom_db
export DB_USERNAME=trialroom
export DB_PASSWORD=trialroom_secure_pass_2024
export JWT_SECRET=VGhpcyBpcyBhIHZlcnkgbG9uZyBzZWNyZXQga2V5IGZvciBKV1QgdGhhdCBpcyBhdCBsZWFzdCAyNTYgYml0cyBsb25n
export AI_API_KEY=your-openai-api-key

# Run
./mvnw spring-boot:run

# Or build JAR and run
./mvnw package -DskipTests
java -jar target/*.jar
```

Backend will start at: `http://localhost:8080`
Flyway will automatically run all migrations and seed demo data.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server with proxy to backend
npm start

# Or
ng serve --proxy-config proxy.conf.json
```

Frontend will start at: `http://localhost:4200`

---

## 🔑 Demo Credentials

> ⚠️ These are demo accounts seeded by Flyway migration V14. **Change all passwords before production deployment.**

| Role | Username | Password | Access |
|------|----------|----------|--------|
| **Admin** | `admin@azorte.com` | `password` | Full system access |
| **Manager** | `manager@azorte.com` | `password` | Analytics, AI, Reports |
| **Staff** | `staff@azorte.com` | `password` | Queue management |
| **Staff 2** | `staff2@azorte.com` | `password` | Queue management |

### Demo Store
- **Store:** Azorte Fashion — Demo Store (Bengaluru)
- **Trial Rooms:** 6 rooms (Room 1 through Room 6)
- **Historical Data:** 30 days of synthetic queue data (200+ entries) for analytics

### Customer Demo Flow
1. Get the store QR URL from Admin → Stores → QR Code
2. Open the QR URL in browser: `http://localhost:4200/customer/join?storeId={uuid}`
3. Fill in customer details → JOIN QUEUE
4. Receive token → track queue position

---

## 🤖 AI Configuration

### Setting Up OpenAI (Default)

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add to `.env`: `AI_API_KEY=sk-...`
3. Set model: `AI_MODEL=gpt-4o-mini` (recommended for cost efficiency)

### Setting Up Google Gemini

1. Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Change Spring AI dependency in `pom.xml`:
   ```xml
   <!-- Replace openai starter with gemini starter -->
   <dependency>
     <groupId>org.springframework.ai</groupId>
     <artifactId>spring-ai-vertex-ai-gemini-spring-boot-starter</artifactId>
   </dependency>
   ```
3. Update `application.yml` with Gemini configuration

### AI Without API Key
If no API key is configured:
- Customer chatbot returns: *"AI assistant is currently unavailable. Please ask staff for assistance."*
- Manager insights return: *"AI insights unavailable. Please configure AI_API_KEY."*
- Reports can still be generated with statistical data only (no AI narrative)
- All other features work normally

### AI Features
| Feature | Endpoint | Description |
|---------|----------|-------------|
| Customer Chatbot | `POST /api/ai/chat` | Answers queue questions with real data |
| Manager Insights | `POST /api/manager/ai/insight` | Evidence-based operational insights |
| Daily Report | `POST /api/manager/reports/daily` | AI-generated daily summary |
| Weekly Report | `POST /api/manager/reports/weekly` | AI-generated weekly analysis |

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
./mvnw test

# Run specific test class
./mvnw test -Dtest=QueueServiceTest

# Run with coverage report
./mvnw test jacoco:report
# Report: target/site/jacoco/index.html
```

#### Test Coverage
| Test Class | Coverage |
|------------|----------|
| `QueueServiceTest` | Queue join, call next, complete, priority ordering |
| `PredictionServiceTest` | Wait time calculation, edge cases |
| `JwtTokenProviderTest` | Token generation, validation, expiry |
| `AuthControllerIntegrationTest` | Login, register, protected endpoints |

### Frontend Tests

```bash
cd frontend

# Run unit tests
npm test

# Run with coverage
npm test -- --code-coverage
```

### Testing Edge Cases Covered
- Two customers joining simultaneously (concurrent token generation)
- No available trial rooms
- Customer cancellation mid-queue
- Customer no-show handling
- Staff skipping customer (moves to recalled state)
- Queue becoming empty
- Invalid/expired token access
- Unauthorized API access
- Wrong role access

---

## 📡 WebSocket Topics

Connect to: `ws://localhost:8080/ws` (with SockJS fallback)

| Topic | Payload | Subscribers |
|-------|---------|-------------|
| `/topic/queue/{storeId}` | Queue update (waiting count, current token) | Staff, Customer screens |
| `/topic/rooms/{storeId}` | Room status changes | Staff, Customer screens |
| `/topic/token/{token}` | Individual customer update | Specific customer |
| `/topic/display/{storeId}` | TV/kiosk display data | Live display screen |

---

## 🔮 Future Enhancements

### Machine Learning Integration
The `PredictionService` is designed as an abstraction. The current rule-based algorithm can be replaced with an ML model:

```java
// Current (rule-based)
@Service
@Primary
public class RuleBasedPredictionService implements PredictionService { ... }

// Future (ML model)
@Service
@ConditionalOnProperty(name = "app.prediction.provider", havingValue = "ml")
public class XGBoostPredictionService implements PredictionService { ... }
```

Switch by setting: `APP_PREDICTION_PROVIDER=ml`

### Planned Features
1. **SMS/WhatsApp Notifications** — Twilio integration (configuration ready)
2. **Appointment Booking** — Online pre-booking system
3. **Mobile App** — React Native or Flutter customer app
4. **Multi-Store Analytics** — Chain-wide dashboard for area managers
5. **ML Wait Time Prediction** — XGBoost model trained on historical data
6. **Customer Profile** — Frequent customer recognition
7. **Staff Performance Analytics** — Individual staff metrics
8. **Digital Signage Integration** — Direct TV display integration
9. **Voice Announcements** — Text-to-speech for token calling
10. **Integration APIs** — Connect with POS and CRM systems

---

## 📁 Project Structure

```
smart-trial-room/
├── backend/                          # Spring Boot 3.3 Maven project
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/trialroom/
│       │   ├── SmartTrialRoomApplication.java
│       │   ├── config/               # CORS, Web, App config
│       │   ├── controller/           # REST controllers
│       │   ├── dto/                  # Request/Response DTOs
│       │   │   ├── request/
│       │   │   └── response/
│       │   ├── entity/               # JPA entities
│       │   ├── exception/            # Custom exceptions + handler
│       │   ├── mapper/               # Entity ↔ DTO mappers
│       │   ├── ai/                   # AI service + prompts
│       │   ├── notification/         # Notification service
│       │   ├── prediction/           # PredictionService
│       │   ├── repository/           # Spring Data repos
│       │   ├── security/             # JWT + Security config
│       │   ├── service/              # Business logic
│       │   └── websocket/            # STOMP config + broadcast
│       ├── main/resources/
│       │   ├── application.yml
│       │   └── db/migration/         # Flyway SQL (V1–V14)
│       └── test/
│           └── java/com/trialroom/  # Unit + Integration tests
│
├── frontend/                         # Angular 19 project
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   ├── angular.json
│   ├── proxy.conf.json
│   └── src/app/
│       ├── core/                     # Services, guards, interceptors
│       │   ├── models/
│       │   ├── services/
│       │   ├── interceptors/
│       │   └── guards/
│       ├── shared/                   # Reusable components + pipes
│       │   ├── components/
│       │   └── pipes/
│       ├── auth/                     # Login page
│       ├── customer/                 # Join form + queue status
│       ├── staff/                    # Staff dashboard
│       ├── manager/                  # Manager dashboard + analytics + AI
│       ├── admin/                    # Admin management pages
│       └── queue/                    # Live TV display
│
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🤝 Contributing

This project is primarily a final-year academic project. For improvements:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/ml-prediction`
3. Commit changes: `git commit -m 'Add XGBoost prediction model'`
4. Push: `git push origin feature/ml-prediction`
5. Open a Pull Request

---

## 📜 License

MIT License — Free for educational and commercial use.

---

## 👨‍💻 Built With

- [Spring Boot](https://spring.io/projects/spring-boot) — Backend framework
- [Angular](https://angular.dev) — Frontend framework
- [Angular Material](https://material.angular.io) — UI component library
- [Spring AI](https://spring.io/projects/spring-ai) — AI integration
- [PostgreSQL](https://www.postgresql.org) — Database
- [Flyway](https://flywaydb.org) — Database migrations
- [ApexCharts](https://apexcharts.com) — Charts
- [ZXing](https://github.com/zxing/zxing) — QR Code generation
- [JJWT](https://github.com/jwtk/jjwt) — JWT library
- [Docker](https://www.docker.com) — Containerization

---

*Smart Trial Room Queue Management System — Making retail trial rooms smarter, one token at a time.* 🛍️
