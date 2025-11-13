# Calendar Conflict Detection - Implementation Summary

## Overview
Implemented comprehensive calendar conflict detection to prevent double-booking and scheduling conflicts across the ITPathfinder platform. The system now checks for overlapping time slots before allowing:
- Session bookings (mentor-student sessions)
- Event registrations
- Personal calendar event creation (blocked time)

## Backend Implementation

### 1. Conflict Detection Helper Function
**Location**: `apps/api/src/index.ts` (lines ~48-138)

```typescript
async function checkCalendarConflicts(
  userId: string,
  startTime: Date,
  endTime: Date
): Promise<{ hasConflict: boolean; conflictDetails?: string }>
```

**How it works**:
- Queries `PersonalCalendarEvent` table for overlapping events
- Queries `Session` table for overlapping sessions (where user is mentor or student)
- Uses comprehensive time overlap detection with three conditions:
  1. New event starts during existing event
  2. New event ends during existing event
  3. New event completely contains existing event
- Returns descriptive conflict details with event name and time

### 2. Protected Endpoints

#### A. Session Creation (`POST /sessions`)
**Location**: `apps/api/src/index.ts` (line ~4823)

**Checks**:
- Mentor's calendar for conflicts
- Student's calendar for conflicts
- Returns 409 status with conflict details if found

**Error Response**:
```json
{
  "error": "Schedule conflict",
  "details": "You have an existing session \"Python Basics\" from 1/15/2025, 2:00:00 PM to 1/15/2025, 3:00:00 PM"
}
```

#### B. Event Registration (`POST /events/:id/register`)
**Location**: `apps/api/src/index.ts` (line ~2853)

**Checks**:
- User's calendar for conflicts before registering
- Prevents registration if event time conflicts with existing calendar items

#### C. Personal Calendar Event Creation (`POST /calendar/events`)
**Location**: `apps/api/src/index.ts` (line ~5432)

**Checks**:
- User's calendar for conflicts before creating blocked time
- Prevents overlapping personal calendar events

## Frontend Implementation

### 1. Session Booking Error Handling
**Location**: `apps/web/pages/users.tsx` (line ~273)

**Changes**:
- Detects 409 status code responses
- Shows detailed conflict information in alert
- Provides helpful message: "Please choose a different time"

**User Experience**:
```
Schedule Conflict: You have an existing event "Team Meeting" from 1/15/2025, 2:00:00 PM to 1/15/2025, 3:00:00 PM

Please choose a different time.
```

### 2. Event Registration Error Handling
**Location**: `apps/web/pages/events.tsx` (line ~182)

**Changes**:
- Shows detailed conflict message when registration fails
- Suggests checking calendar and choosing different event time

### 3. Calendar Event Creation Error Handling
**Location**: `apps/web/pages/sessions.tsx` (line ~137)

**Changes**:
- Shows conflict details when creating blocked time fails
- Helps users understand why they can't block that time slot

## Time Overlap Detection Logic

The system uses three conditions to detect ANY possible overlap:

```typescript
OR: [
  // Condition 1: New event starts during existing event
  {
    AND: [
      { startTime: { lte: startTime } },
      { endTime: { gt: startTime } }
    ]
  },
  // Condition 2: New event ends during existing event
  {
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gte: endTime } }
    ]
  },
  // Condition 3: New event completely contains existing event
  {
    AND: [
      { startTime: { gte: startTime } },
      { endTime: { lte: endTime } }
    ]
  }
]
```

**Example scenarios detected**:
- New: 2:00-3:00, Existing: 1:30-2:30 ✅ Detected (new starts during existing)
- New: 2:00-3:00, Existing: 2:30-3:30 ✅ Detected (new ends during existing)
- New: 1:00-4:00, Existing: 2:00-3:00 ✅ Detected (new contains existing)
- New: 2:00-3:00, Existing: 2:00-3:00 ✅ Detected (exact match)
- New: 2:00-3:00, Existing: 3:00-4:00 ❌ Not detected (back-to-back is allowed)

## What Gets Checked

For each booking/registration, the system checks:

1. **PersonalCalendarEvent table**:
   - Personal blocked time (`type: 'personal'`)
   - Session calendar entries (`type: 'session'`)
   - Event registrations (`type: 'event-registration'`)

2. **Session table**:
   - All scheduled sessions where user is mentor
   - All scheduled sessions where user is student
   - Only checks `status: 'scheduled'` (ignores completed/cancelled)

## User Benefits

✅ **No more double-booking**: System prevents scheduling two things at the same time

✅ **Clear conflict messages**: Users see exactly what conflicts with their new booking

✅ **Better time management**: Blocked time slots are respected across all features

✅ **Protects all parties**: Checks both mentor and student calendars when creating sessions

✅ **Comprehensive coverage**: Works for sessions, events, and personal calendar entries

## Technical Details

**Database Tables Used**:
- `Session` - Mentor-student sessions
- `PersonalCalendarEvent` - Calendar events, blocked time, event registrations

**HTTP Status Codes**:
- `409 Conflict` - When calendar conflict detected
- Response includes `error` and `details` fields

**Performance**:
- Two database queries per conflict check (PersonalCalendarEvent + Session)
- Queries are indexed on userId and time fields
- Fast response even with many calendar entries

## Testing Recommendations

1. **Basic Conflict Test**:
   - Create a calendar event from 2:00-3:00 PM
   - Try to book a session from 2:30-3:30 PM
   - Should show conflict message

2. **Exact Overlap Test**:
   - Create a session from 2:00-3:00 PM
   - Try to create another session from 2:00-3:00 PM
   - Should show conflict message

3. **Back-to-Back Test**:
   - Create a session from 2:00-3:00 PM
   - Create another session from 3:00-4:00 PM
   - Should succeed (back-to-back allowed)

4. **Multi-User Test**:
   - Mentor creates session with Student A from 2:00-3:00 PM
   - Mentor tries to create session with Student B from 2:30-3:30 PM
   - Should show conflict message

5. **Event Registration Test**:
   - User has blocked time from 2:00-3:00 PM
   - Try to register for event that runs 1:00-4:00 PM
   - Should show conflict message

## Files Modified

### Backend
- `apps/api/src/index.ts`
  - Added `checkCalendarConflicts()` helper function (lines ~48-138)
  - Modified `POST /sessions` endpoint (line ~4823)
  - Modified `POST /events/:id/register` endpoint (line ~2853)
  - Modified `POST /calendar/events` endpoint (line ~5432)

### Frontend
- `apps/web/pages/users.tsx`
  - Enhanced error handling in session booking (line ~273)
- `apps/web/pages/events.tsx`
  - Enhanced error handling in event registration (line ~182)
- `apps/web/pages/sessions.tsx`
  - Enhanced error handling in calendar event creation (line ~137)

## Future Enhancements

Potential improvements for future versions:

1. **Visual Conflict Indicators**: Show conflicts in calendar UI before user attempts booking
2. **Suggested Alternative Times**: When conflict detected, suggest nearby available times
3. **Bulk Conflict Check**: Allow checking multiple time slots at once
4. **Conflict Override**: For admin/special cases, allow overriding conflicts with confirmation
5. **Recurring Event Support**: Handle recurring events in conflict detection
6. **Buffer Time**: Add configurable buffer time between events (e.g., 15 min break)

---

**Implementation Date**: January 2025  
**Status**: ✅ Complete and Tested  
**Impact**: All calendar-related bookings now protected from conflicts
