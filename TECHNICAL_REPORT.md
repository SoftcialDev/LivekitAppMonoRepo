# InContact Application - Technical Report

## Executive Summary

The InContact Application is a comprehensive real-time communication and monitoring system designed for Personnel Safety Officer (PSO) monitoring. Built as a monorepo, it consists of three main applications: a serverless Azure Functions backend, a React web application, and an Electron desktop client. The system leverages modern cloud-native architecture patterns, real-time WebSocket communication, and enterprise-grade security.

---

## System Architecture

### Monorepo Structure

The application is organized as a monorepo containing:

1. **API Functions** (`apps/api-functions/`) - Azure Functions backend
2. **In Contact Web** (`apps/in-contact-web/`) - React web application
3. **Electron Desktop App** (`apps/electron/`) - Desktop wrapper
4. **Infrastructure** (`infra/`) - Terraform infrastructure as code

### Backend Architecture: Domain-Driven Design (DDD)

The API follows **Domain-Driven Design** principles with clear separation of concerns:

#### Layer Structure

**Domain Layer** (Pure Business Logic)
- **Entities**: Core business objects (User, Snapshot, RecordingSession, Command, etc.)
- **Value Objects**: Immutable domain concepts (GetCurrentUserRequest, CreateUserRequest, etc.)
- **Domain Services**: Business logic that doesn't belong to entities
- **Interfaces**: Contracts for repositories and services (ports in hexagonal architecture)
- **Errors**: Domain-specific error classes extending `DomainError`
- **Enums**: Domain enumerations (UserRole, CommandType, Permission, etc.)
- **Schemas**: Zod validation schemas for type safety
- **Constants**: Domain constants and configuration

**Application Layer** (Use Case Orchestration)
- **Application Services**: Coordinate domain services and repositories
- Thin orchestration layer that delegates to domain services
- Handles cross-cutting concerns and transaction boundaries

**Infrastructure Layer** (Technical Implementation)
- **Repositories**: Data access implementations using Prisma ORM
- **Services**: External service integrations (GraphService, BlobStorageService, WebPubSubService, etc.)
- **Container**: Dependency injection container (ServiceContainer)
- **Database**: Prisma client configuration and connection management
- **Validation**: Zod validator implementation

**Handler Layer** (Azure Functions Entry Points)
- Thin HTTP handlers that coordinate middleware, application services, and responses
- Uses middleware for authentication, authorization, validation, and error handling
- Resolves services from dependency injection container

#### Dependency Rule

Dependencies flow inward: **Infrastructure → Application → Domain**

- Domain layer has **zero** dependencies on infrastructure or application
- Application layer depends only on domain
- Infrastructure layer depends on domain and application
- Handlers depend on all layers through dependency injection

### Frontend Architecture: Screaming Architecture

The web application follows **Screaming Architecture** principles, organizing code by feature/domain rather than technical layers:

#### Module Structure

Each module is self-contained with:
- `api/` - API clients for module endpoints
- `components/` - React components
- `hooks/` - Custom React hooks
- `pages/` - Page components
- `routes.tsx` - Route definitions
- `stores/` - Zustand state management stores
- `types/` - Type definitions
- `enums/` - Enumerations
- `interfaces/` - Contracts
- `services/` - Module-specific services
- `utils/` - Utility functions

#### State Management

- **Zustand**: Global state that updates frequently (user info, header info, etc.)
- **Context API**: Provider configuration (AuthProvider, ToastProvider, WebSocketProvider)
- **React Router Data API**: Declarative routing with `createBrowserRouter`

---

## Technology Stack

### Backend Technologies

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **Node.js** | 20.x | Runtime | LTS version with excellent Azure Functions support |
| **TypeScript** | 5.1+ | Language | Type safety, better IDE support, maintainability |
| **Azure Functions** | v3/v4 | Serverless runtime | Auto-scaling, pay-per-use, integrated Azure services |
| **Prisma** | 7.2.0 | ORM | Type-safe database access, migrations, excellent DX |
| **PostgreSQL** | 13+ | Database | Relational data, ACID compliance, flexible schema |
| **Zod** | 3.25+ | Validation | Runtime type validation, schema-first approach |
| **jsonwebtoken** | 8.5+ | JWT handling | Azure AD token verification |
| **jwks-rsa** | 3.2+ | Key management | Secure key rotation for Azure AD |
| **LiveKit Server SDK** | 2.13+ | Video streaming | Real-time video/audio streaming infrastructure |
| **@azure/web-pubsub** | 1.2+ | WebSocket | Real-time messaging and presence |
| **@azure/service-bus** | 7.0+ | Messaging | Reliable command queuing and fallback |
| **@azure/storage-blob** | 12.27+ | Storage | Video recordings and snapshots storage |
| **@microsoft/microsoft-graph-client** | 3.0+ | Azure AD | User management and directory queries |

### Frontend Technologies

| Technology | Version | Purpose | Rationale |
|------------|---------|---------|-----------|
| **React** | 19.1+ | UI Framework | Component-based, large ecosystem, performance |
| **TypeScript** | 5.8+ | Language | Type safety across frontend and API contracts |
| **Vite** | 6.3+ | Build tool | Fast HMR, optimized production builds |
| **React Router** | 6.9+ | Routing | Declarative routing, data API support |
| **Zustand** | 5.0+ | State management | Lightweight, performant, simple API |
| **Axios** | 1.10+ | HTTP client | Promise-based, interceptors, error handling |
| **@azure/msal-react** | 3.0+ | Authentication | Azure AD integration, token management |
| **@azure/web-pubsub-client** | 1.0+ | WebSocket client | Real-time messaging client |
| **livekit-client** | 2.14+ | Video client | WebRTC video streaming client |
| **Tailwind CSS** | 4.1+ | Styling | Utility-first CSS, rapid UI development |
| **Lucide React** | 0.540+ | Icons | Modern icon library |

### Infrastructure Technologies

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **Terraform** | Infrastructure as Code | Version-controlled, repeatable infrastructure |
| **Azure Resource Manager** | Cloud provider | Enterprise-grade cloud services |
| **Azure Kubernetes Service (AKS)** | Container orchestration | LiveKit server deployment |
| **Azure Static Web Apps** | Frontend hosting | Integrated CI/CD, global CDN |
| **Azure Key Vault** | Secrets management | Centralized, secure secret storage |
| **Azure Virtual Network** | Network isolation | Private endpoints, VNet integration |
| **Azure Redis Cache** | Caching | Session storage, performance optimization |

---

## Services and Components

### Backend Services

#### Core Infrastructure Services

**1. Authentication & Authorization**
- **JWT Bearer Authentication**: Validates Azure AD tokens using JWKS
- **Role-Based Access Control (RBAC)**: Three-tier system (Admin, Supervisor, Employee)
- **Permission-Based Authorization**: Fine-grained permissions per operation
- **Azure AD Integration**: Single Sign-On (SSO), user provisioning

**2. User Management**
- **UserRepository**: User data access with Prisma
- **GetCurrentUserDomainService**: Auto-provisioning of new users
- **UserRoleAssignmentRepository**: Role and permission management
- **GraphService**: Azure AD directory queries

**3. Command Processing**
- **CommandMessagingService**: Hybrid messaging (WebPubSub + Service Bus)
- **PendingCommandRepository**: Command state tracking
- **CommandAcknowledgmentService**: Command delivery confirmation
- **Command Types**: Camera control, snapshot capture, recording management

**4. Video Streaming**
- **LiveKitService**: Video token generation, room management
- **LiveKitRecordingService**: Recording lifecycle management
- **LiveKitEgressClient**: Server-side recording egress
- **BlobStorageService**: Video storage in Azure Blob Storage
- **BlobUrlService**: Secure, time-limited URL generation

**5. Presence & Real-Time Communication**
- **PresenceService**: User online/offline status tracking
- **WebPubSubService**: WebSocket connection management
- **PresenceRepository**: Presence state persistence

**6. Data Management**
- **SnapshotRepository**: Image snapshot storage and retrieval
- **StreamingSessionRepository**: Session history tracking
- **RecordingSessionRepository**: Recording metadata management
- **AuditService**: Comprehensive audit logging

**7. External Integrations**
- **ChatService**: Messaging functionality
- **GraphService**: Microsoft Graph API integration
- **StorageDetailsService**: Storage account management
- **EncryptionService**: Data encryption utilities
- **RecordingErrorLoggerService**: Error tracking and logging

### Frontend Services

**1. WebSocket Service**
- **Singleton Pattern**: One connection per application instance
- **Auto-Reconnect**: Exponential backoff with jitter
- **Group Management**: Automatic group subscription
- **Message Handlers**: Pluggable handler architecture
- **Connection State Management**: Robust state tracking

**2. API Client**
- **Automatic Token Injection**: Bearer token from MSAL
- **Error Transformation**: Typed error classes
- **Request/Response Interceptors**: Centralized logging and error handling
- **Timeout Management**: Configurable request timeouts

**3. Authentication**
- **MSAL Integration**: Azure AD authentication
- **Token Refresh**: Automatic token renewal
- **Protected Routes**: Route-level authorization
- **Session Management**: Persistent login state

**4. State Management**
- **User Info Store**: Current user information
- **Header Store**: Navigation and header state
- **Module Stores**: Feature-specific state (supervisors, recordings, etc.)

---

## WebSocket Architecture

### Overview

The system uses **Azure Web PubSub** for real-time bidirectional communication between the frontend and backend.

### Connection Flow

1. **Frontend Connection**
   - Client negotiates connection token from backend API
   - Establishes WebSocket connection to Azure Web PubSub
   - Authenticates using user email
   - Subscribes to user-specific and presence groups

2. **Backend Integration**
   - Azure Functions with Web PubSub triggers
   - Event handlers for connection events (connect, disconnect, user events)
   - Message broadcasting to groups or individual users

### Message Types

- **Presence Updates**: User online/offline status
- **Command Delivery**: Real-time command notifications
- **Supervisor Changes**: Assignment updates
- **System Notifications**: General system messages

### Reliability Features

- **Exponential Backoff**: Reconnection attempts with increasing delays
- **Jitter**: Random delay variation to prevent thundering herd
- **Group Memory**: Automatic re-subscription to groups on reconnect
- **Connection Validation**: Pre-connection state validation
- **Handshake Retry**: Retry logic for connection handshake failures

### Fallback Mechanism

- **Primary**: Azure Web PubSub (real-time, low latency)
- **Fallback**: Azure Service Bus (reliable queuing, guaranteed delivery)

Commands are sent via Web PubSub first. If delivery fails, they're queued in Service Bus for later processing.

---

## Security Architecture

### Authentication

**Azure AD Integration**
- **OAuth 2.0 / OpenID Connect**: Industry-standard protocols
- **JWT Tokens**: Stateless authentication tokens
- **Token Validation**: JWKS-based key rotation support
- **Multi-Tenant Support**: Configurable tenant isolation

**Token Verification Process**
1. Extract Bearer token from Authorization header
2. Validate token signature using JWKS from Azure AD
3. Verify issuer, audience, and expiration
4. Extract user claims (email, object ID, roles)
5. Attach user context to request

### Authorization

**Role-Based Access Control (RBAC)**
- **Admin**: Full system access, user management
- **Supervisor**: Manage assigned employees, monitor streams
- **Employee**: Personal dashboard, camera streaming

**Permission-Based Authorization**
- Fine-grained permissions per operation
- Database-backed permission system
- Role-permission mapping
- Dynamic permission checking

**Middleware Chain**
```
Request → Auth Middleware → Authorization Middleware → Permission Check → Handler
```

### Data Security

**Secrets Management**
- **Azure Key Vault**: Centralized secret storage
- **Managed Identities**: No secrets in code
- **Environment Variables**: Secure configuration injection

**Network Security**
- **Virtual Network Integration**: Function apps in VNet
- **Private Endpoints**: Database and storage private access
- **CORS Configuration**: Whitelist-based origin control
- **Firewall Rules**: IP-based access restrictions

**Data Encryption**
- **In Transit**: TLS 1.2+ for all communications
- **At Rest**: Azure Storage encryption
- **Database**: PostgreSQL encryption
- **Application-Level**: EncryptionService for sensitive data

### Audit & Compliance

**Audit Logging**
- **Comprehensive Logging**: All user actions logged
- **Structured Logs**: JSON format for easy parsing
- **User Context**: User ID, timestamp, action type
- **Error Tracking**: RecordingErrorLoggerService for video errors

---

## Infrastructure Architecture

### Azure Services

**Compute**
- **Azure Functions**: Serverless API backend (consumption plan)
- **Azure Kubernetes Service (AKS)**: LiveKit server hosting
- **Azure Static Web Apps**: Frontend hosting with CDN

**Storage**
- **PostgreSQL Flexible Server**: Primary database
- **Azure Blob Storage**: Video recordings and snapshots
- **Azure Redis Cache**: Session storage and caching

**Networking**
- **Azure Virtual Network**: Network isolation
- **Private Endpoints**: Secure service access
- **Application Gateway**: Load balancing (if needed)

**Messaging**
- **Azure Web PubSub**: Real-time WebSocket messaging
- **Azure Service Bus**: Reliable command queuing

**Security**
- **Azure Key Vault**: Secrets management
- **Azure AD**: Identity and access management
- **Managed Identities**: Service-to-service authentication

**Monitoring**
- **Application Insights**: Application performance monitoring
- **Azure Monitor**: Infrastructure monitoring
- **Log Analytics**: Centralized logging

### Infrastructure as Code

**Terraform Modules**
- `network/` - VNet and subnet configuration
- `database/` - PostgreSQL server setup
- `function-app/` - Function app deployment
- `static-web-app/` - Frontend hosting
- `aks/` - Kubernetes cluster
- `keyvault/` - Key Vault configuration
- `pubsub/` - Web PubSub service
- `storage/` - Blob storage accounts
- `redis/` - Redis cache instance

**Deployment Process**
1. Bootstrap remote state backend
2. Configure environment-specific variables
3. Apply Terraform configuration
4. Generate environment variables for applications
5. Deploy applications via CI/CD

---

## Data Flow

### User Authentication Flow

```
User → Frontend (MSAL) → Azure AD → JWT Token → Backend API → Token Validation → User Context
```

### Command Processing Flow

```
Supervisor → Frontend → API → CommandMessagingService → WebPubSub (primary) / Service Bus (fallback) → Employee Client → Acknowledgment → API → Database
```

### Video Streaming Flow

```
Employee Camera → LiveKit Server (AKS) → WebRTC → Supervisor Client
                ↓
         Recording → Blob Storage → Secure URL → API → Frontend
```

### Presence Flow

```
User Login → WebSocket Connect → PresenceService → Database → WebPubSub Broadcast → All Connected Clients
```

---

## Error Handling

### Backend Error Handling

**Domain Error Hierarchy**
```
DomainError (base)
├── AuthError (403, 404)
├── ValidationError (400, 404, 409)
├── MessagingError (400, 503)
├── ApplicationError (400, 500, 504)
├── SupervisorError (400, 404, 500)
├── UserRoleChangeError (403, 404, 500)
└── UserDeletionError (400, 404, 500)
```

**Error Handling Middleware**
- Catches all errors
- Classifies errors (expected 4xx vs unexpected 5xx)
- Logs errors with full context
- Formats HTTP responses
- Records errors in database

**Structured Logging**
- Never uses `console.*`
- All logs include context (user ID, request ID, etc.)
- Log levels: Debug, Info, Warn, Error

### Frontend Error Handling

**Error Classes**
- `UnauthorizedError`: 401 responses
- `ForbiddenError`: 403 responses
- `NotFoundError`: 404 responses
- `ValidationError`: 400 responses
- `ServerError`: 500+ responses

**Error Boundaries**
- React error boundaries for component-level errors
- Global error handler for unhandled errors
- User-friendly error messages

---

## Performance Considerations

### Backend Optimization

- **Connection Pooling**: Prisma connection pool configuration
- **Caching**: Redis for frequently accessed data
- **Lazy Loading**: On-demand service resolution
- **Database Indexing**: Optimized queries with Prisma
- **Async Processing**: Non-blocking operations

### Frontend Optimization

- **Code Splitting**: Route-based code splitting
- **Lazy Loading**: Component lazy loading
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: For large lists
- **Image Optimization**: Lazy loading, responsive images

### Real-Time Optimization

- **Message Batching**: Group multiple updates
- **Selective Subscriptions**: Subscribe only to needed groups
- **Connection Reuse**: Singleton WebSocket connection
- **Exponential Backoff**: Prevent connection storms

---

## Testing Strategy

### Backend Testing

- **Unit Tests**: Jest for service and repository testing
- **Integration Tests**: Database and external service mocking
- **Test Coverage**: Target 80%+ coverage
- **Mock Infrastructure**: Comprehensive mock library

### Frontend Testing

- **Component Tests**: React Testing Library
- **Integration Tests**: User flow testing
- **E2E Tests**: Critical path validation

---

## Deployment & CI/CD

### CI/CD Pipeline

**API Functions**
- GitHub Actions workflow
- Build TypeScript
- Run tests
- Deploy to Azure Functions
- Database migrations via Prisma

**Frontend**
- Build with Vite
- Deploy to Azure Static Web Apps
- Automatic CDN distribution

### Environment Management

- **Development**: Local development with Azure emulators
- **Staging**: Pre-production validation
- **Production**: Full Azure infrastructure

---

## Monitoring & Observability

### Application Monitoring

- **Application Insights**: Performance metrics, dependencies
- **Custom Metrics**: Business-specific metrics
- **Distributed Tracing**: Request correlation across services

### Logging

- **Structured Logging**: JSON format
- **Log Levels**: Debug, Info, Warn, Error
- **Context Enrichment**: User ID, request ID, correlation ID
- **Centralized Logging**: Azure Log Analytics

### Alerting

- **Error Rate Alerts**: High error rates
- **Performance Alerts**: Slow response times
- **Availability Alerts**: Service downtime
- **Custom Alerts**: Business-specific metrics

---

## Scalability

### Horizontal Scaling

- **Azure Functions**: Automatic scaling based on load
- **AKS**: Kubernetes auto-scaling
- **Load Balancing**: Application Gateway or Azure Front Door

### Vertical Scaling

- **Database**: PostgreSQL Flexible Server scaling
- **Redis**: Cache tier scaling
- **Storage**: Blob storage auto-scaling

### Performance Targets

- **API Response Time**: < 200ms (p95)
- **WebSocket Latency**: < 100ms
- **Video Streaming**: < 2s startup time
- **Database Queries**: < 50ms (p95)

---

## Disaster Recovery & Backup

### Backup Strategy

- **Database**: Automated daily backups (7-day retention)
- **Blob Storage**: Geo-redundant storage (GRS)
- **Configuration**: Infrastructure as Code in Git

### Recovery Procedures

- **RTO (Recovery Time Objective)**: < 4 hours
- **RPO (Recovery Point Objective)**: < 24 hours
- **Failover**: Manual failover procedures documented

---

## Future Enhancements

### Planned Improvements

1. **Enhanced Analytics**: User behavior analytics
2. **Mobile Applications**: iOS and Android clients
3. **Advanced Recording**: AI-powered event detection
4. **Multi-Tenant Support**: Enhanced tenant isolation
5. **Performance Optimization**: Further caching and optimization

---

## Conclusion

The InContact Application represents a modern, scalable, and secure solution for real-time monitoring and communication. Built with industry best practices, it leverages Azure's cloud-native services to provide a robust, maintainable, and performant system. The architecture supports future growth and can be extended with additional features as business requirements evolve.

