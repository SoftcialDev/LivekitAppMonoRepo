# API Functions - Azure Serverless Backend

Azure Functions backend implementing a LiveKit-based monitoring system with real-time video streaming, command processing, presence tracking, and role-based access control.

## Architecture Overview

This API follows **Domain-Driven Design (DDD)** principles with clear separation of concerns across three main layers:

### Domain Layer
Contains pure business logic with no infrastructure dependencies:
- **Entities**: Core business objects (User, Snapshot, RecordingSession, etc.)
- **Value Objects**: Immutable objects representing domain concepts (GetCurrentUserRequest, etc.)
- **Domain Services**: Business logic that doesn't belong to entities
- **Interfaces**: Contracts for repositories and services (ports)
- **Errors**: Domain-specific error classes extending DomainError
- **Enums**: Domain enumerations (UserRole, CommandType, etc.)
- **Schemas**: Zod validation schemas
- **Constants**: Domain constants and magic strings

### Application Layer
Orchestrates use cases and coordinates domain services:
- **Application Services**: Coordinate domain services and repositories
- Thin layer that delegates to domain services
- Handles cross-cutting concerns and transactions

### Infrastructure Layer
Implements technical concerns and external integrations:
- **Repositories**: Data access implementations using Prisma
- **Services**: External service integrations (GraphService, BlobStorageService, etc.)
- **Container**: Dependency injection container (ServiceContainer)
- **Database**: Prisma client configuration
- **Validation**: Zod validator implementation

### Handler Layer
Azure Functions entry points:
- Thin handlers that coordinate middleware, application services, and responses
- Use middleware for authentication, authorization, validation, and error handling
- Resolve services from dependency injection container

## Folder Structure

```
api-functions/
├── src/
│   ├── handlers/              # Azure Function handlers
│   │   └── [FunctionName]/
│   │       ├── index.ts       # Handler implementation
│   │       └── function.json  # Azure binding configuration
│   ├── domain/                # Domain layer (business logic)
│   │   ├── entities/          # Domain entities
│   │   ├── value-objects/     # Immutable value objects
│   │   ├── services/          # Domain services
│   │   ├── interfaces/        # Domain contracts (ports)
│   │   ├── errors/            # Domain error classes
│   │   ├── enums/             # Domain enumerations
│   │   ├── schemas/           # Zod validation schemas
│   │   ├── constants/         # Domain constants
│   │   └── types/             # Domain type definitions
│   ├── application/           # Application layer
│   │   └── services/          # Application services
│   ├── infrastructure/        # Infrastructure layer
│   │   ├── repositories/      # Data access implementations
│   │   ├── services/          # External service integrations
│   │   ├── container/         # Dependency injection
│   │   ├── database/          # Database configuration
│   │   └── validation/        # Validation implementations
│   ├── middleware/            # HTTP middleware
│   │   ├── auth.ts            # Authentication
│   │   ├── authorization.ts   # Authorization
│   │   ├── permissions.ts     # Permission checking
│   │   ├── validation.ts      # Request validation
│   │   └── errorHandler.ts    # Error handling
│   ├── utils/                 # Utility functions
│   │   ├── logger.ts          # Structured logging
│   │   ├── response.ts        # Response builders
│   │   └── error/             # Error utilities
│   └── config/                # Configuration management
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
└── __tests__/                 # Test files and mocks
```

## Core Principles

### Dependency Rule
Dependencies point inward: Infrastructure → Application → Domain

- Domain layer has no dependencies on infrastructure or application
- Application layer depends only on domain
- Infrastructure layer depends on domain and application
- Handlers depend on all layers through dependency injection

### Single Responsibility Principle
Each class has one reason to change:
- Domain services handle business logic only
- Application services orchestrate use cases only
- Repositories handle data access only
- Handlers coordinate HTTP concerns only

### Error Handling
All errors extend `DomainError` base class:
- Domain-specific error classes in `domain/errors/`
- Each error has HTTP status code via `ErrorCodes` enum
- Errors are automatically logged and formatted by middleware
- Never throw generic `Error` - always use domain-specific errors

### Configuration Management
All configuration accessed through `config` module:
- Environment variables validated with Zod
- Never access `process.env` directly
- Configuration validation at application startup

### Logging
Use structured logging functions:
- Import from `shared/utils/logger.ts`
- Never use `console.log`, `console.error`, etc.
- Include context in all log messages

## Error Handling

### Error Hierarchy

All domain errors extend `DomainError`:

```typescript
DomainError (base class)
├── AuthError
├── ValidationError
├── MessagingError
├── ApplicationError
├── SupervisorError
├── UserRoleChangeError
└── UserDeletionError
```

### Error Codes

Errors use HTTP status codes defined in `ErrorCodes.ts`:

- **AuthErrorCode**: 403, 404 (authentication/authorization)
- **ValidationErrorCode**: 400, 404, 409 (validation errors)
- **MessagingErrorCode**: 400, 503 (messaging failures)
- **ApplicationErrorCode**: 400, 500, 504 (business logic errors)
- **SupervisorErrorCode**: 400, 404, 500 (supervisor management)
- **UserRoleChangeErrorCode**: 403, 404, 500 (role changes)
- **UserDeletionErrorCode**: 400, 404, 500 (user deletion)

### Error Handling Middleware

All handlers are wrapped with `withErrorHandler` middleware:

```typescript
const handler: AzureFunction = withErrorHandler(
  async (ctx: Context) => {
    // Handler logic
  },
  { genericMessage: "Failed to process request" }
);
```

The middleware:
- Catches all errors
- Classifies errors (expected 4xx vs unexpected 5xx)
- Logs errors with context
- Formats HTTP responses
- Records errors in database (if configured)

### Throwing Errors

Always use domain-specific error classes:

```typescript
// Correct
throw new UserNotFoundError('User not found');
throw new ValidationError('Invalid email format', ValidationErrorCode.INVALID_EMAIL_FORMAT);

// Incorrect
throw new Error('User not found');
```

## Repository Pattern

Repositories implement domain interfaces and provide data access:

### Interface (Domain Layer)

```typescript
// domain/interfaces/IUserRepository.ts
export interface IUserRepository {
  findByAzureAdObjectId(azureAdObjectId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}
```

### Implementation (Infrastructure Layer)

```typescript
// infrastructure/repositories/UserRepository.ts
export class UserRepository implements IUserRepository {
  async findByAzureAdObjectId(azureAdObjectId: string): Promise<User | null> {
    const prismaUser = await prisma.user.findUnique({
      where: { azureAdObjectId }
    });
    return prismaUser ? User.fromPrisma(prismaUser) : null;
  }
  // ... other methods
}
```

### Usage

Repositories are resolved from the dependency injection container:

```typescript
const userRepository = serviceContainer.resolve<IUserRepository>('UserRepository');
const user = await userRepository.findByAzureAdObjectId(callerId);
```

## Service Pattern

### Domain Services

Domain services contain business logic that doesn't belong to entities:

```typescript
// domain/services/GetCurrentUserDomainService.ts
export class GetCurrentUserDomainService {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async getCurrentUser(
    request: GetCurrentUserRequest,
    jwtPayload: JwtPayload
  ): Promise<GetCurrentUserResponse> {
    // Business logic here
    let user = await this.userRepository.findByAzureAdObjectId(request.callerId);
    if (!user) {
      user = await this.provisionNewUser(request.callerId, jwtPayload);
    }
    return GetCurrentUserResponse.fromUser(user);
  }
}
```

### Application Services

Application services orchestrate use cases:

```typescript
// application/services/GetCurrentUserApplicationService.ts
export class GetCurrentUserApplicationService {
  constructor(
    private readonly getCurrentUserDomainService: GetCurrentUserDomainService
  ) {}

  async getCurrentUser(
    request: GetCurrentUserRequest,
    jwtPayload: JwtPayload
  ): Promise<GetCurrentUserResponse> {
    // Delegate to domain service
    return await this.getCurrentUserDomainService.getCurrentUser(request, jwtPayload);
  }
}
```

## Dependency Injection

Services are registered and resolved through `ServiceContainer`:

### Service Registration

Services are registered in `ServiceContainer.initialize()`:

```typescript
// infrastructure/container/ServiceContainer.ts
register('UserRepository', () => new UserRepository());
register('GetCurrentUserDomainService', () => 
  new GetCurrentUserDomainService(
    resolve<IUserRepository>('UserRepository')
  )
);
register('GetCurrentUserApplicationService', () =>
  new GetCurrentUserApplicationService(
    resolve<GetCurrentUserDomainService>('GetCurrentUserDomainService')
  )
);
```

### Service Resolution

Resolve services in handlers:

```typescript
serviceContainer.initialize();
const applicationService = serviceContainer.resolve<GetCurrentUserApplicationService>(
  'GetCurrentUserApplicationService'
);
```

## Adding a New Endpoint

Follow these steps to add a new endpoint:

### 1. Create Domain Value Objects

Create request and response value objects:

```typescript
// domain/value-objects/CreateUserRequest.ts
export class CreateUserRequest {
  readonly email: string;
  readonly role: UserRole;

  constructor(email: string, role: UserRole) {
    if (!email) {
      throw new ValidationError('Email is required', ValidationErrorCode.INVALID_FORMAT);
    }
    this.email = email;
    this.role = role;
  }
}
```

### 2. Create Domain Service

Implement business logic:

```typescript
// domain/services/CreateUserDomainService.ts
export class CreateUserDomainService {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async createUser(request: CreateUserRequest): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(request.email);
    if (existingUser) {
      throw new UserAlreadyExistsError('User already exists');
    }
    const user = User.create(request.email, request.role);
    return await this.userRepository.create(user);
  }
}
```

### 3. Create Application Service

Orchestrate the use case:

```typescript
// application/services/CreateUserApplicationService.ts
export class CreateUserApplicationService {
  constructor(
    private readonly createUserDomainService: CreateUserDomainService
  ) {}

  async createUser(request: CreateUserRequest): Promise<User> {
    return await this.createUserDomainService.createUser(request);
  }
}
```

### 4. Register Services in Container

Add service registration in `ServiceContainer.initialize()`:

```typescript
register('CreateUserDomainService', () =>
  new CreateUserDomainService(
    resolve<IUserRepository>('UserRepository')
  )
);
register('CreateUserApplicationService', () =>
  new CreateUserApplicationService(
    resolve<CreateUserDomainService>('CreateUserDomainService')
  )
);
```

### 5. Create Handler

Create the Azure Function handler:

```typescript
// handlers/CreateUser/index.ts
const createUser: AzureFunction = withErrorHandler(
  async (ctx: Context, req: HttpRequest) => {
    await withAuth(ctx, async () => {
      await withCallerId(ctx, async () => {
        await requirePermission(Permission.UsersCreate)(ctx);
        
        serviceContainer.initialize();
        const applicationService = serviceContainer.resolve<CreateUserApplicationService>(
          'CreateUserApplicationService'
        );

        const body = req.body;
        const request = new CreateUserRequest(body.email, body.role);
        const user = await applicationService.createUser(request);

        ok(ctx, user.toPayload());
      });
    });
  }
);

export default createUser;
```

### 6. Create Function Configuration

Create the `function.json` binding:

```json
{
  "bindings": [
    {
      "authLevel": "function",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["post"]
    },
    {
      "type": "http",
      "direction": "out",
      "name": "res"
    }
  ]
}
```

### 7. Add Domain Errors (if needed)

Create domain-specific errors:

```typescript
// domain/errors/UserErrors.ts
export class UserAlreadyExistsError extends ValidationError {
  constructor(message: string) {
    super(message, ValidationErrorCode.INVALID_FORMAT);
  }
}
```

## Middleware

### Authentication

`withAuth` middleware validates Azure AD JWT tokens:

```typescript
await withAuth(ctx, async () => {
  // Handler logic - user is authenticated
});
```

### Authorization

`withCallerId` extracts caller ID from token:

```typescript
await withCallerId(ctx, async () => {
  const callerId = ctx.bindings.callerId as string;
  // Use callerId
});
```

### Permissions

`requirePermission` checks user permissions:

```typescript
await requirePermission(Permission.UsersCreate)(ctx);
// Handler logic - user has required permission
```

### Validation

Use validation middleware with Zod schemas:

```typescript
await withBodyValidation(createUserSchema)(ctx, async () => {
  const validatedBody = ctx.bindings.validatedBody;
  // Use validated data
});
```

### Error Handling

Wrap handlers with `withErrorHandler`:

```typescript
const handler = withErrorHandler(
  async (ctx: Context) => {
    // Handler logic
  },
  { genericMessage: "Failed to process request" }
);
```

## Prerequisites

Before running this project, ensure the following are installed:

- **Node.js 20.x**
- **Azure Functions Core Tools v4**
  ```bash
  npm install -g azure-functions-core-tools@4 --unsafe-perm true
  ```
- **PostgreSQL** (local or remote)
- **AWPS CLI (Azure Web PubSub Tunnel CLI)**
  [Install Guide](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/howto-troubleshoot-localhost-websocket#use-awps-tunnel-cli)
- **Azure Services**: Azure Web PubSub, Azure Service Bus, Azure AD App Registration

## Installation

```bash
cd apps/api-functions
npm ci
npm run build
npm run prisma:generate
npm run migrate:deploy
```

## Configuration

1. Copy the configuration template:
   ```bash
   cp local.settings.example.json local.settings.json
   ```

2. Fill out environment variables in `local.settings.json`:
   - Azure AD configuration (client ID, secret, tenant ID)
   - Database connection string
   - LiveKit configuration
   - Azure Service Bus connection
   - Azure Web PubSub configuration
   - CORS settings

## Running Locally

```bash
npm run build
npm start
```

This launches the API locally on `http://localhost:7071`.

## Testing WebPubSub Event Handlers Locally

Azure Web PubSub triggers require Azure to push events to your local function app. Use AWPS Tunnel:

```bash
export WebPubSubConnectionString="Endpoint=https://your-webpubsub-instance.webpubsub.azure.com;AccessKey=your-access-key;Version=1.0;"

awps-tunnel run \
  --hub your-hub-name \
  --upstream http://localhost:7071/runtime/webhooks/webpubsub
```

## Key Scripts

| Script                    | Description                                |
| ------------------------- | ------------------------------------------ |
| `npm run build`           | Compiles TypeScript                        |
| `npm run prisma:generate` | Generates Prisma client                    |
| `npm run migrate:deploy`  | Deploys latest DB schema                   |
| `npm start`               | Starts the Azure Functions runtime locally |

## Dependencies

| Package                    | Purpose                         |
| -------------------------- | ------------------------------- |
| `@azure/functions`         | Azure Functions SDK             |
| `@prisma/client`           | PostgreSQL ORM                  |
| `@azure/web-pubsub`        | Real-time messaging integration |
| `livekit-server-sdk`       | Video token management          |
| `jwks-rsa`, `jsonwebtoken` | JWT-based Azure AD auth         |
| `zod`                      | Schema validation               |

## Notes

- Each Azure Function uses an `index.ts` file and `function.json` for bindings
- Common logic is centralized in domain, application, and infrastructure layers
- The system supports hybrid messaging: WebPubSub (real-time) and Service Bus (fallback)
- Presence and streaming updates are handled by WebSocket triggers
- All errors extend `DomainError` and are automatically handled by middleware
- Services are resolved through dependency injection container
- Never access `process.env` directly - use `config` module
- Never use `console.*` - use structured logging functions
