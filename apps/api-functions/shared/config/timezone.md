# 🕐 Central America Time Configuration

## Overview
This system uses **Central America Time (CST/CDT)** for all date and time operations to ensure consistency across the application.

## Timezone Details
- **Standard Time**: CST (UTC-6) - Central Standard Time
- **Daylight Time**: CDT (UTC-5) - Central Daylight Time  
- **Timezone Identifier**: `America/Guatemala`

## Implementation

### Date Utilities (`shared/utils/dateUtils.ts`)
- `getCentralAmericaTime()` - Get current time in Central America Time
- `formatCentralAmericaTime()` - Format dates in Central America Time
- `toCentralAmericaTime()` - Convert UTC to Central America Time
- `fromCentralAmericaTime()` - Convert Central America Time to UTC

### Entity Methods
All entities now include Central America Time formatting methods:

#### User Entity
- `getCreatedAtFormatted()` - Creation date in Central America Time
- `getUpdatedAtFormatted()` - Last update in Central America Time
- `getDeletedAtFormatted()` - Deletion date in Central America Time
- `getAccountAgeInDays()` - Account age calculation
- `getTimeSinceLastUpdate()` - Time since last update

#### AuditLog Entity
- `getTimestampFormatted()` - Audit timestamp in Central America Time
- `getAgeInHours()` - Age calculation in Central America Time
- `getAgeFormatted()` - Human-readable age string

### Repository Operations
All database operations now use Central America Time:
- User creation and updates
- Audit log entries
- Supervisor assignments
- Role changes

## Usage Examples

```typescript
import { getCentralAmericaTime, formatCentralAmericaTime } from '../utils/dateUtils';

// Get current time
const now = getCentralAmericaTime();

// Format a date
const formatted = formatCentralAmericaTime(new Date());

// In entities
const user = await userRepository.findByEmail('user@example.com');
const createdAt = user.getCreatedAtFormatted(); // "12/25/2023, 14:30:00"
const age = user.getAccountAgeInDays(); // 45
```

## Benefits
- **Consistency**: All timestamps use the same timezone
- **User Experience**: Users see times in their local timezone
- **Audit Trail**: Clear chronological order of events
- **Reporting**: Accurate time-based analytics
- **Compliance**: Proper timestamp handling for legal requirements

## Migration Notes
- All existing timestamps remain in UTC in the database
- Display and calculations use Central America Time
- No data migration required
- Backward compatibility maintained
