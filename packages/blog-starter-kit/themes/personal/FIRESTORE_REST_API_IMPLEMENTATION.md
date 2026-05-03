# Firestore REST API Implementation

## Overview
Refactored progress tracking to use Firestore REST API instead of client SDK in API routes. This ensures proper authentication and security rule enforcement.

## Problem Solved
**Error:** "Missing or insufficient permissions" when calling Firestore from API routes
**Root Cause:** API routes using unauthenticated Firebase client SDK → Firestore security rules rejected requests (no `request.auth.uid`)
**Solution:** Use Firestore REST API with user's ID token for proper authentication

## Architecture

```
Client (React)
  ↓
  └→ 1. Get user ID token: await user.getIdToken()
     2. Pass token to API route

API Route (Node)
  ↓
  └→ 1. Receive token from request
     2. Forward token to Firestore REST API in Authorization header

Firestore
  ↓
  └→ 1. Validate ID token with Firebase Auth
     2. Extract user ID from token
     3. Enforce security rules using request.auth.uid
```

## Files Modified

### hooks/useProgress.ts
Updated all progress functions to obtain and pass user's ID token:
- `useUserProgress()` - Fetches progress with token
- `markPostComplete()` - Marks post complete with token
- `useSeriesProgress()` - Gets/updates series progress with token
- `usePostTimeTracking()` - Tracks time spent with token

**Key change:** All API calls now include `await user.getIdToken()`

### pages/api/progress/
All 5 API routes now use Firestore REST API with Bearer token:

1. **get-progress.ts** - Fetches user's completed posts
   - GET endpoint expecting `userId` and `token` query params
   - Forwards token to Firestore REST API

2. **mark-complete.ts** - Marks a post as completed
   - POST endpoint with token in request body
   - Uses PATCH to update Firestore document

3. **track-time.ts** - Accumulates time spent reading
   - POST endpoint with token
   - Reads current value, adds to it, writes back

4. **update-series.ts** - Updates series progress
   - POST endpoint with token and series data
   - Calculates completion percentage

5. **get-series.ts** - Fetches series-level progress
   - GET endpoint with userId, seriesId, token
   - Returns 404 as success if series not found

## Security
- User's ID token is obtained only on the client (after Firebase Auth verification)
- Token is passed to backend API routes
- Backend forwards token to Firestore REST API in Authorization header
- Firestore validates token and enforces security rules
- No API keys or credentials exposed

## Firestore REST API Details
- **Endpoint:** `https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/...`
- **Authentication:** Bearer token in Authorization header
- **Field Format:** Firestore-specific format (e.g., `{stringValue: "text"}`, `{integerValue: "123"}`)
- **Methods:** GET, PATCH

## Testing Checklist
- [ ] Build completes without errors
- [ ] Dev server starts successfully
- [ ] User can log in
- [ ] Progress page loads without "Missing or insufficient permissions" error
- [ ] Can mark posts as complete
- [ ] Can track time spent
- [ ] Series progress updates correctly

## Environment Variables Required
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID from .env.local

## Notes
- Admin SDK cannot be used in this monorepo due to workspace:* protocol issues
- REST API approach is more secure than exposing client SDK in backend
- ID tokens are short-lived (~1 hour) and auto-refresh if needed
