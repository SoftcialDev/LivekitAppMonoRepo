# Technical Document: Architecture and Video Streaming Flow

## Table of Contents

1. [Domain-Driven Design (DDD)](#domain-driven-design-ddd)
2. [Screaming Architecture](#screaming-architecture)
3. [Camera Technical Flow](#camera-technical-flow)
4. [LiveKit: Integration and Usage](#livekit-integration-and-usage)
5. [Flow Diagrams](#flow-diagrams)

---

## Domain-Driven Design (DDD)

### What is Domain-Driven Design?

**Domain-Driven Design (DDD)** is a software design methodology that focuses on modeling software according to the business domain. 
Instead of organizing code by technical layers (presentation, logic, data), DDD organizes code according to business 
concepts.

### Fundamental Principles

#### 1. Layer Separation

The InContact backend is organized into **4 main layers**:

```
┌─────────────────────────────────────┐
│     Handler Layer (Azure Functions)  │  ← HTTP entry point
├─────────────────────────────────────┤
│     Application Layer                │  ← Use case orchestration
├─────────────────────────────────────┤
│     Domain Layer                     │  ← Pure business logic
├─────────────────────────────────────┤
│     Infrastructure Layer             │  ← Technical implementation
└─────────────────────────────────────┘
```

#### 2. Domain Layer

**Purpose:** Contains pure business logic, with no technical dependencies.

**Components:**

- **Entities:** Business objects with unique identity
  ```typescript
  // Example: User entity
  export class User {
    private constructor(
      public readonly id: string,
      public readonly email: string,
      public readonly role: UserRole
    ) {}
    
    // Business methods
    canAccessRoom(roomId: string): boolean {
      // Pure business logic
    }
  }
  ```

- **Value Objects:** Immutable objects representing domain concepts
  ```typescript
  // Example: LiveKitTokenRequest
  export class LiveKitTokenRequest {
    constructor(
      public readonly callerId: string,
      public readonly targetUserId?: string
    ) {
      // Business validations
      if (!callerId) {
        throw new ValidationError('Caller ID is required');
      }
    }
  }
  ```

- **Domain Services:** Business logic that doesn't belong to a specific entity
  ```typescript
  // Example: LiveKitTokenDomainService
  export class LiveKitTokenDomainService {
    async generateTokenForUser(request: LiveKitTokenRequest): Promise<LiveKitTokenResponse> {
      // 1. Validate user
      // 2. Determine permissions based on role
      // 3. Generate tokens for appropriate rooms
      // Pure business logic, no technical dependencies
    }
  }
  ```

- **Interfaces (Ports):** Contracts defining what the domain needs
  ```typescript
  // Domain defines WHAT it needs, not HOW it's implemented
  export interface ILiveKitService {
    ensureRoom(roomName: string): Promise<void>;
    generateToken(identity: string, isAdmin: boolean, room: string): Promise<string>;
  }
  ```

- **Errors:** Domain-specific errors
  ```typescript
  export class UserNotFoundError extends DomainError {
    constructor(message: string) {
      super(message, ErrorCodes.NOT_FOUND);
    }
  }
  ```

**Key Characteristics:**
- ✅ **Zero dependencies** on infrastructure
- ✅ **Pure business logic**
- ✅ **Easy to test** (no complex mocks)
- ✅ **Reusable** in different contexts

#### 3. Application Layer

**Purpose:** Orchestrates use cases, coordinates domain services.

**Example:**

```typescript
export class LiveKitTokenApplicationService {
  constructor(
    private readonly liveKitTokenDomainService: LiveKitTokenDomainService
  ) {}

  async generateToken(callerId: string, request: LiveKitTokenRequest): Promise<LiveKitTokenResponse> {
    // Orchestrates the use case:
    // 1. Authorization validations (if needed)
    // 2. Delegates to domain service
    // 3. Returns response
    return await this.liveKitTokenDomainService.generateTokenForUser(request);
  }
}
```

**Characteristics:**
- Thin layer that delegates to domain
- Handles transactions and coordination
- Can combine multiple domain services

#### 4. Infrastructure Layer

**Purpose:** Implements technical details and external integrations.

**Components:**

- **Repositories:** Data access implementation
  ```typescript
  export class UserRepository implements IUserRepository {
    async findByAzureAdObjectId(id: string): Promise<User | null> {
      // Prisma implementation
      const prismaUser = await prisma.user.findUnique({ where: { azureAdObjectId: id } });
      return prismaUser ? User.fromPrisma(prismaUser) : null;
    }
  }
  ```

- **Services:** External service integrations
  ```typescript
  export class LiveKitService implements ILiveKitService {
    private readonly adminClient: RoomServiceClient;
    
    async generateToken(identity: string, isAdmin: boolean, room: string): Promise<string> {
      // Technical implementation with LiveKit SDK
      const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, { identity });
      // ... token configuration
      return await at.toJwt();
    }
  }
  ```

**Characteristics:**
- Implements interfaces defined in domain
- Handles technical details (SDKs, databases, external APIs)
- Can be changed without affecting domain

#### 5. Handler Layer

**Purpose:** HTTP entry point, coordinates middleware and services.

**Example:**

```typescript
const liveKitTokenHandler = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    // 1. Authentication
    await withAuth(ctx, async () => {
      // 2. Caller ID extraction
      await withCallerId(ctx, async () => {
        // 3. Query params validation
        await withQueryValidation(liveKitTokenSchema)(ctx, async () => {
          // 4. Permission check
          await requirePermission(Permission.StreamingStatusRead)(ctx);
          
          // 5. Service resolution
          const serviceContainer = ServiceContainer.getInstance();
          serviceContainer.initialize();
          const applicationService = serviceContainer.resolve<LiveKitTokenApplicationService>('LiveKitTokenApplicationService');
          
          // 6. Use case execution
          const response = await applicationService.generateToken(callerId, request);
          
          // 7. HTTP response
          return ok(ctx, response.toPayload());
        });
      });
    });
  }
);
```

### Dependency Rule

**Dependencies flow inward:**

```
Infrastructure → Application → Domain
     ↓              ↓            ↓
  (Details)   (Orchestration)  (Business)
```

- **Domain:** Depends on nothing (innermost layer)
- **Application:** Only depends on Domain
- **Infrastructure:** Depends on Domain and Application
- **Handlers:** Depends on all layers

### Benefits of DDD

1. **Maintainability:** Technical changes don't affect business logic
2. **Testability:** Domain can be tested without infrastructure
3. **Clarity:** Code reflects the business
4. **Scalability:** Easy to add new features
5. **Flexibility:** Change technical implementations without affecting business

---

## Screaming Architecture

### What is Screaming Architecture?

**Screaming Architecture** is a code organization principle that prioritizes **domain/feature over technical layers**. The name comes from the idea that the folder structure should "scream" what the application does, not how it's technically implemented.

### Comparison: Traditional Architecture vs Screaming

#### Traditional Architecture (By Technical Layers)

```
src/
├── components/        ← All components together
├── hooks/            ← All hooks together
├── services/         ← All services together
├── utils/            ← All utilities together
└── pages/            ← All pages together
```

**Problem:** To understand a complete feature, you must search across multiple folders.

#### Screaming Architecture (By Feature/Domain)

```
src/
├── modules/
│   ├── auth/                    ← EVERYTHING related to authentication
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── stores/
│   │   ├── types/
│   │   └── routes.tsx
│   │
│   ├── supervisor/              ← EVERYTHING related to supervisors
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── routes.tsx
│   │
│   └── pso-dashboard/           ← EVERYTHING related to PSO dashboard
│       ├── api/
│       ├── components/
│       ├── hooks/
│       │   ├── streaming/
│       │   └── livekit/
│       ├── pages/
│       └── routes.tsx
│
└── shared/                       ← Code shared between modules
    ├── api/
    ├── services/
    └── utils/
```

**Advantage:** Everything related to a feature is in one place.

### Module Structure

Each module in `modules/` follows this structure:

```
modules/{module-name}/
├── api/                    # Module-specific API clients
│   └── {module}Client.ts
│
├── components/             # Module React components
│   ├── types/
│   └── {Component}.tsx
│
├── hooks/                  # Module custom hooks
│   └── use{HookName}.ts
│
├── pages/                  # Module pages
│   ├── constants/
│   └── {PageName}.tsx
│
├── routes.tsx             # Route definitions
│
├── stores/                 # Module Zustand stores
│   └── {store-name}/
│       ├── constants/
│       ├── types/
│       ├── hooks/
│       └── use{Store}Store.ts
│
├── types/                  # Module TypeScript types
│   └── {module}Types.ts
│
├── enums/                  # Module enumerations
│   └── {module}Enums.ts
│
├── interfaces/             # Module interfaces/contracts
│   └── {module}Interfaces.ts
│
├── services/               # Module local services
│   └── {module}Service.ts
│
├── utils/                  # Module utilities
│   └── {module}Utils.ts
│
└── index.ts                # Public exports (barrel export)
```

### Real Example: `pso-dashboard` Module

```
modules/pso-dashboard/
├── api/
│   └── streamingClient.ts          # Client for streaming endpoints
│
├── hooks/
│   ├── streaming/
│   │   └── useStreamingDashboard.ts    # Main streaming hook
│   └── livekit/
│       └── useLiveKitRoomSetup.ts      # LiveKit setup hook
│
├── pages/
│   └── PsoDashboardPage.tsx        # Dashboard page
│
└── routes.tsx                      # Module routes
```

**Advantage:** If you need to understand how PSO streaming works, everything is in `pso-dashboard/`.

### Screaming Architecture Principles

#### 1. Self-Containment

Each module contains everything it needs:
- ✅ Its own components
- ✅ Its own hooks
- ✅ Its own types
- ✅ Its own services
- ✅ Its own routes

#### 2. Separation of Concerns

- **`shared/`:** Code used by multiple modules
- **`ui-kit/`:** Generic reusable components
- **`modules/`:** Specific functionalities

#### 3. Barrel Exports

Each module exposes its public API through `index.ts`:

```typescript
// modules/pso-dashboard/index.ts
export * from './pages';
export * from './hooks';
export * from './components';
export * from './routes';
```

### Benefits of Screaming Architecture

1. **Intuitive Navigation:** Find everything related to a feature in one place
2. **Maintainability:** Changes to a feature are localized
3. **Scalability:** Adding new features is simple (new module)
4. **Onboarding:** New developers understand the structure quickly
5. **Refactoring:** Moving or removing features is safer

---

## Camera Technical Flow

### Overview

The video streaming flow in InContact involves multiple components working together:

```
Employee Camera → Frontend (React) → LiveKit Server → Supervisor Frontend
```

### Complete Step-by-Step Flow

#### Phase 1: Stream Initialization (Employee)

**1.1. User starts stream**

```typescript
// modules/pso-dashboard/hooks/streaming/useStreamingDashboard.ts
const startStream = useCallback(async (): Promise<void> => {
  // 1. Request camera permission
  await mediaDevices.requestCameraPermission();
  
  // 2. Create video track from device
  const track = await mediaDevices.createVideoTrackFromDevices();
  // Configuration: 240p at 15 fps, 150 kbps
```

**1.2. Video Track Configuration**

```typescript
// Video track is created with optimized configuration:
const track = await mediaDevices.createVideoTrackFromDevices();
// Parameters:
// - Resolution: 240p (426x240)
// - Frame rate: 15 fps
// - Bitrate: 150 kbps
// - Codec: VP8/VP9 (WebRTC)
```

**1.3. LiveKit Token Retrieval**

```typescript
// Frontend requests token from backend
const tokenResponse = await getLiveKitToken();
// GET /api/LiveKitToken

// Backend processes request:
// 1. Handler receives request with Azure AD JWT
// 2. Middleware validates authentication and permissions
// 3. Application Service orchestrates use case
// 4. Domain Service determines which rooms user can access
// 5. Infrastructure Service generates LiveKit JWT token
```

**1.4. Token Generation (Backend)**

```typescript
// apps/api-functions/src/infrastructure/services/LiveKitService.ts
async generateToken(identity: string, isAdmin: boolean, room: string): Promise<string> {
  const at = new AccessToken(
    config.livekitApiKey,
    config.livekitApiSecret,
    { identity }
  );

  const grant = {
    roomJoin: true,
    room,
    canSubscribe: true,
    canPublish: true,
    canPublishData: true,
    publishSources: isAdmin
      ? ['microphone']  // Supervisor can only publish audio
      : ['camera', 'microphone', 'screen_share'],  // Employee can publish video
  };

  at.addGrant(grant);
  return await at.toJwt();
}
```

**1.5. LiveKit Room Connection**

```typescript
// Frontend connects to LiveKit
const room = new Room();
await room.connect(livekitUrl, token);

// Connection events:
room.on('connected', () => {
  logDebug('Room connected');
});

room.on('disconnected', (reason) => {
  logDebug('Room disconnected', { reason });
  // Automatic reconnection logic
});
```

**1.6. Video Track Publication**

```typescript
// modules/pso-dashboard/hooks/livekit/useLiveKitRoomSetup.ts
const publishVideoTrack = async (room: Room, videoTrack: LocalVideoTrack): Promise<void> => {
  await room.localParticipant.publishTrack(videoTrack, {
    name: 'camera',
    simulcast: false,
    videoEncoding: {
      maxBitrate: 150000,    // 150 kbps
      maxFramerate: 15,      // 15 fps
    }
  });
};
```

#### Phase 2: Processing in LiveKit Server

**2.1. LiveKit Server Receives Stream**

```
Employee (WebRTC) → LiveKit Server (AKS/Kubernetes)
```

- **Protocol:** WebRTC (UDP)
- **Codec:** VP8/VP9 for video, Opus for audio
- **Adaptation:** LiveKit adjusts quality based on bandwidth

**2.2. Stream Distribution**

LiveKit Server:
- Receives stream from employee
- Distributes to all subscribers (supervisors)
- Handles transcoding if needed
- Manages adaptive quality

#### Phase 3: Supervisor Viewing

**3.1. Supervisor Requests Access**

```typescript
// Supervisor makes GET /api/LiveKitToken?userId={employeeId}
// Backend generates token with read-only permissions (canSubscribe: true, canPublish: false)
```

**3.2. Supervisor Connection**

```typescript
// Supervisor connects to employee's room
const room = new Room();
await room.connect(livekitUrl, supervisorToken);

// Supervisor only subscribes, doesn't publish
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.kind === 'video') {
    // Attach video track to <video> element
    track.attach(videoElement);
  }
});
```

**3.3. Stream Reception**

```typescript
// When employee publishes video, supervisor receives it automatically
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (publication.kind === 'video' && publication.source === 'camera') {
    const videoElement = document.getElementById('supervisor-video');
    track.attach(videoElement);
  }
});
```

### Complete Sequence Diagram

```
Employee                    Backend API              LiveKit Server           Supervisor
   |                            |                         |                      |
   |--1. startStream()--------->|                         |                      |
   |                            |                         |                      |
   |--2. requestCamera()        |                         |                      |
   |<--VideoTrack---------------|                         |                      |
   |                            |                         |                      |
   |--3. getLiveKitToken()----->|                         |                      |
   |                            |--4. validateAuth()      |                      |
   |                            |--5. generateToken()     |                      |
   |<--6. Token-----------------|                         |                      |
   |                            |                         |                      |
   |--7. connect(room, token)--->|                        |                      |
   |                            |                         |--8. authenticate()   |
   |                            |                         |<--9. connected------|
   |                            |                         |                      |
   |--10. publishTrack(video)--->|                        |                      |
   |                            |                         |--11. receiveStream()|
   |                            |                         |                      |
   |                            |                         |--12. distribute()--->|
   |                            |                         |                      |
   |                            |                         |                      |--13. connect()
   |                            |                         |                      |--14. subscribe()
   |                            |                         |                      |<--15. videoTrack
   |                            |                         |                      |
   |                            |                         |                      |--16. display()
```

### Video Configuration

#### Encoding Parameters

```typescript
const VIDEO_ENCODING = {
  maxBitrate: 150000,      // 150 kbps (optimized for mobile/low bandwidth)
  maxFramerate: 15,         // 15 fps (balance between smoothness and bandwidth)
  resolution: {
    width: 426,             // 240p width
    height: 240             // 240p height
  }
};
```

**Reason for these parameters:**
- **240p @ 15fps:** Sufficient for monitoring, low bandwidth consumption
- **150 kbps:** Works well on 3G/4G mobile connections
- **VP8/VP9:** Efficient codecs, supported by WebRTC

### Error Handling and Reconnection

#### Automatic Reconnection

```typescript
room.on('disconnected', (reason) => {
  if (!manualStopRef.current) {
    // Automatic reconnection with exponential backoff
    handleReconnection();
  }
});

const handleReconnection = async (): Promise<void> => {
  // 1. Wait with exponential backoff
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // 2. Retry connection
  await startStream();
};
```

#### Camera Error Handling

```typescript
try {
  const track = await mediaDevices.createVideoTrackFromDevices();
} catch (error) {
  if (error instanceof MediaPermissionError) {
    // Show permissions modal
    setMediaPermissionError(error);
    setMediaPermissionsModalOpen(true);
  } else {
    // Other type of error
    logError('Failed to create video track', { error });
  }
}
```

---

## LiveKit: Integration and Usage

### What is LiveKit?

**LiveKit** is an open-source platform for real-time video/audio built on WebRTC. It provides:

- **SFU Server (Selective Forwarding Unit):** Efficiently distributes streams
- **SDKs:** For multiple languages (JavaScript, Go, Python, etc.)
- **Scalability:** Handles thousands of simultaneous connections
- **Low latency:** < 500ms typical delay

### LiveKit Architecture in InContact

```
┌─────────────────┐
│  Frontend       │
│  (React)        │
│  livekit-client │
└────────┬────────┘
         │ WebRTC
         │ (UDP)
         ↓
┌─────────────────┐
│  LiveKit Server │
│  (AKS Pod)      │
│  SFU            │
└────────┬────────┘
         │
         ├──→ Supervisor 1
         ├──→ Supervisor 2
         └──→ Supervisor N
```

### LiveKit Components

#### 1. Room (Room)

A **Room** is a virtual space where participants connect.

```typescript
// Create a room
const room = new Room({
  adaptiveStream: true,        // Adaptive quality
  dynacast: true,              // Dynamic optimization
});

// Connect to a room
await room.connect(livekitUrl, accessToken);
```

**Characteristics:**
- Each employee has their own room (room ID = user ID)
- Supervisors connect to employee rooms
- Rooms are created automatically when needed

#### 2. Participant (Participant)

A **Participant** represents a user in a room.

```typescript
// Local participant (who publishes)
const localParticipant = room.localParticipant;

// Remote participants (who receive)
room.on(RoomEvent.ParticipantConnected, (participant) => {
  console.log('Participant connected:', participant.identity);
});
```

**Participant types:**
- **Publisher:** Publishes video/audio (employee)
- **Subscriber:** Only receives video/audio (supervisor)

#### 3. Track (Track)

A **Track** is a video or audio stream.

```typescript
// Local Video Track (from employee)
const videoTrack = await createLocalVideoTrack({
  resolution: { width: 426, height: 240 },
  facingMode: 'user',
});

// Publish track
await room.localParticipant.publishTrack(videoTrack, {
  name: 'camera',
  videoEncoding: {
    maxBitrate: 150000,
    maxFramerate: 15,
  }
});

// Subscribe to remote track (supervisor)
room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.kind === 'video') {
    track.attach(videoElement);
  }
});
```

### LiveKit Integration Flow

#### Step 1: Server Configuration

```typescript
// Backend: Create/ensure room exists
await liveKitService.ensureRoom(userId);
// This creates the room in LiveKit if it doesn't exist
```

#### Step 2: Token Generation

```typescript
// Backend: Generate JWT token
const token = await liveKitService.generateToken(
  userId,           // User identity
  isAdmin,          // Is supervisor? (audio only)
  roomName          // Room name
);
```

**Permissions in token:**

```typescript
// For Employee (publisher)
{
  roomJoin: true,
  canSubscribe: true,
  canPublish: true,
  publishSources: ['camera', 'microphone']
}

// For Supervisor (subscriber)
{
  roomJoin: true,
  canSubscribe: true,
  canPublish: false,  // Cannot publish video
  publishSources: ['microphone']  // Only audio if needed
}
```

#### Step 3: Frontend Connection

```typescript
// Employee: Connect and publish
const room = new Room();
await room.connect(livekitUrl, employeeToken);

const videoTrack = await createLocalVideoTrack();
await room.localParticipant.publishTrack(videoTrack, {
  name: 'camera',
  videoEncoding: { maxBitrate: 150000, maxFramerate: 15 }
});

// Supervisor: Connect and subscribe
const supervisorRoom = new Room();
await supervisorRoom.connect(livekitUrl, supervisorToken);

supervisorRoom.on(RoomEvent.TrackSubscribed, (track, publication) => {
  if (publication.kind === 'video' && publication.source === 'camera') {
    track.attach(videoElement);
  }
});
```

### LiveKit Events

#### Connection Events

```typescript
room.on('connected', () => {
  console.log('Connected to room');
});

room.on('disconnected', (reason) => {
  console.log('Disconnected:', reason);
  // Handle reconnection
});

room.on('reconnecting', () => {
  console.log('Reconnecting...');
});
```

#### Participant Events

```typescript
room.on(RoomEvent.ParticipantConnected, (participant) => {
  console.log('Participant connected:', participant.identity);
});

room.on(RoomEvent.ParticipantDisconnected, (participant) => {
  console.log('Participant disconnected:', participant.identity);
});
```

#### Track Events

```typescript
room.on(RoomEvent.TrackPublished, (publication, participant) => {
  console.log('Track published:', publication.kind);
});

room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
  if (track.kind === 'video') {
    track.attach(videoElement);
  }
});

room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
  track.detach();
});
```

### LiveKit Optimizations

#### 1. Adaptive Stream

```typescript
const room = new Room({
  adaptiveStream: true,  // Automatically adjusts quality
});
```

**Benefit:** Reduces bandwidth when connection is slow.

#### 2. Dynacast

```typescript
const room = new Room({
  dynacast: true,  // Only sends visible tracks
});
```

**Benefit:** Saves resources when there are multiple streams but only one is visible.

#### 3. Simulcast

```typescript
await room.localParticipant.publishTrack(videoTrack, {
  simulcast: true,  // Sends multiple qualities simultaneously
});
```

**Benefit:** Allows different subscribers to receive different qualities.

### Recording with LiveKit

#### Start Recording (Backend)

```typescript
// apps/api-functions/src/infrastructure/services/LiveKitRecordingService.ts
async startRecording(roomName: string): Promise<RecordingSession> {
  const egress = new EgressClient(livekitUrl, apiKey, apiSecret);
  
  const request = {
    roomName,
    layout: 'speaker',  // Recording layout
    output: {
      fileType: 'MP4',
      filepath: `recordings/${roomName}/${Date.now()}.mp4`,
    },
  };
  
  const info = await egress.startRoomCompositeEgress(request);
  // Save metadata in database
  return recordingSession;
}
```

#### Stop Recording

```typescript
async stopRecording(egressId: string): Promise<void> => {
  await egress.stopEgress(egressId);
  // Update state in database
}
```

### Security with LiveKit

#### 1. JWT Tokens

- **Signed:** With server secret key
- **Expiration:** Tokens with limited lifetime
- **Permissions:** Granular (can publish, can subscribe, etc.)

#### 2. Identity Validation

```typescript
// Token includes user identity
const token = new AccessToken(apiKey, apiSecret, {
  identity: userId,  // Identity verified by Azure AD
});
```

#### 3. Room Isolation

- Each employee has their own room
- Supervisors can only access authorized rooms
- No cross-room communication

### Monitoring and Debugging

#### LiveKit Logs

```typescript
// Enable detailed logs
setLogLevel('debug');

room.on('localTrackPublished', (publication, participant) => {
  logDebug('Local track published', {
    kind: publication.kind,
    source: publication.source,
  });
});
```

#### Connection Metrics

```typescript
room.on('connectionQualityChanged', (quality, participant) => {
  console.log('Connection quality:', quality);
  // quality: 'excellent' | 'good' | 'poor' | 'unknown'
});
```

---

## Flow Diagrams

### Complete Flow: Employee → Supervisor

```
┌─────────────────────────────────────────────────────────────────┐
│                        EMPLOYEE (PSO)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ 1. startStream()
                              ↓
                    ┌─────────────────────┐
                    │ requestCamera()     │
                    │ createVideoTrack() │
                    └──────────┬──────────┘
                               │
                               │ 2. VideoTrack (240p@15fps)
                               ↓
                    ┌─────────────────────┐
                    │ getLiveKitToken()    │
                    │ GET /api/LiveKitToken│
                    └──────────┬──────────┘
                               │
                               │ 3. HTTP Request
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Handler: LiveKitToken                                    │ │
│  │  ├─ withAuth() → Validates Azure AD JWT                │ │
│  │  ├─ requirePermission() → Verifies permissions           │ │
│  │  └─ LiveKitTokenApplicationService                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ LiveKitTokenDomainService                                │ │
│  │  ├─ Determines accessible rooms                          │ │
│  │  └─ Generates tokens for each room                      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                              │                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ LiveKitService (Infrastructure)                         │ │
│  │  ├─ ensureRoom(userId) → Creates room if doesn't exist │ │
│  │  └─ generateToken() → JWT with permissions              │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               │ 4. JWT Token + Room Name
                               ↓
                    ┌─────────────────────┐
                    │ room.connect()      │
                    │ WebRTC Connection   │
                    └──────────┬──────────┘
                               │
                               │ 5. WebRTC (UDP)
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LIVEKIT SERVER (AKS)                         │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ SFU (Selective Forwarding Unit)                         │ │
│  │  ├─ Receives stream from employee                       │ │
│  │  ├─ Processes and optimizes                             │ │
│  │  └─ Distributes to subscribers                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬─────────────────────────────────┘
                               │
                               │ 6. WebRTC Stream
                               ↓
                    ┌─────────────────────┐
                    │ Supervisor connects │
                    │ room.connect()      │
                    │ TrackSubscribed      │
                    └──────────┬──────────┘
                               │
                               │ 7. Video Track
                               ↓
┌─────────────────────────────────────────────────────────────────┐
│                      SUPERVISOR                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ <video> element                                          │ │
│  │  └─ track.attach(videoElement)                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Layer Architecture (DDD)

```
┌─────────────────────────────────────────────────────────────┐
│                    HANDLER LAYER                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ LiveKitToken Handler                                  │ │
│  │  ├─ withAuth()                                        │ │
│  │  ├─ withCallerId()                                    │ │
│  │  ├─ requirePermission()                              │ │
│  │  └─ Resolves Application Service                       │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION LAYER                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ LiveKitTokenApplicationService                        │ │
│  │  └─ Orchestrates use case                            │ │
│  │  └─ Delegates to Domain Service                       │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ LiveKitTokenDomainService                            │ │
│  │  ├─ Pure business logic                              │ │
│  │  ├─ Determines access based on role                   │ │
│  │  └─ Uses interfaces (not implementations)             │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Interfaces (Ports)                                   │ │
│  │  ├─ ILiveKitService                                  │ │
│  │  ├─ IUserRepository                                  │ │
│  │  └─ Defines WHAT is needed, not HOW                  │ │
│  └───────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────┐
│              INFRASTRUCTURE LAYER                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ LiveKitService (implements ILiveKitService)           │ │
│  │  ├─ Uses LiveKit SDK                                  │ │
│  │  ├─ Generates JWT tokens                              │ │
│  │  └─ Handles technical details                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ UserRepository (implements IUserRepository)           │ │
│  │  ├─ Uses Prisma ORM                                   │ │
│  │  ├─ PostgreSQL access                                 │ │
│  │  └─ Converts data to Entities                         │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Module Flow (Screaming Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    modules/pso-dashboard/                   │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   api/       │  │  hooks/      │  │  pages/       │      │
│  │              │  │              │  │              │     │
│  │ streaming    │  │ streaming/   │  │ PsoDashboard │      │
│  │ Client.ts    │  │ useStreaming │  │ Page.tsx     │      │
│  │              │  │ Dashboard    │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│                  ┌────────▼────────┐                        │
│                  │  routes.tsx     │                        │
│                  │  /pso-dashboard │                        │
│                  └─────────────────┘                        │
│                                                             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ Uses
                             ↓
┌─────────────────────────────────────────────────────────────┐
│                    shared/                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   api/       │  │  services/    │  │   utils/     │      │
│  │              │  │              │  │              │     │
│  │ apiClient.ts │  │ webSocket    │  │ logger.ts    │      │
│  │              │  │ Service.ts    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

### Domain-Driven Design (DDD)

- **Layer organization:** Domain → Application → Infrastructure → Handlers
- **Pure business logic:** In Domain Layer, no technical dependencies
- **Interfaces (Ports):** Domain defines WHAT it needs, infrastructure defines HOW
- **Benefits:** Maintainability, testability, clarity, scalability

### Screaming Architecture

- **Feature-based organization:** Each module contains everything related to a functionality
- **Self-containment:** Each module has its own components, hooks, types, services
- **Intuitive navigation:** Everything for a feature is in one place
- **Benefits:** Easy to understand, maintain, and scale

### Camera Flow

1. **Employee:** Requests camera permission → Creates video track → Gets token → Connects to LiveKit → Publishes video
2. **LiveKit Server:** Receives stream → Processes → Distributes to subscribers
3. **Supervisor:** Gets token → Connects to room → Subscribes to tracks → Views video

### LiveKit

- **WebRTC platform:** Low latency, scalable
- **SFU Architecture:** Efficient stream distribution
- **JWT Tokens:** Security and access control
- **SDKs:** Easy integration in frontend and backend

---

## Technical References

- **LiveKit Documentation:** https://docs.livekit.io/
- **WebRTC Specification:** https://www.w3.org/TR/webrtc/
- **Domain-Driven Design:** Eric Evans (2003)
- **Screaming Architecture:** Robert C. Martin (2011)

