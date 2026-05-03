# Firestore Collections - Setup & Auto-Creation Guide

## Summary

**Collections are NOT pre-created.** They are automatically created by Firebase when data is first written to them. However, we've implemented automatic initialization during user signup.

## How Collections Are Created

### Automatic Creation (Built-in)
Collections are automatically created when:

1. **User signs up** → `initializeUserCollections()` is called
   - Creates: `users/{userId}/profile/metadata`
   - Verifies: `users/{userId}/progressedPosts/` collection exists
   - Verifies: `users/{userId}/seriesProgress/` collection exists

2. **User marks a post complete** → First document written to `progressedPosts`
   - Collection auto-created if it doesn't exist
   - Document: `users/{userId}/progressedPosts/{postId}`

3. **User tracks series** → First document written to `seriesProgress`
   - Collection auto-created if it doesn't exist
   - Document: `users/{userId}/seriesProgress/{seriesId}`

## Collection Structure

```
users/
├── {userId}/
│   ├── profile/
│   │   └── metadata
│   │       ├── email: string
│   │       ├── displayName: string
│   │       ├── avatar: string | null
│   │       ├── createdAt: number (timestamp in ms)
│   │       └── updatedAt: number (timestamp in ms)
│   ├── progressedPosts/
│   │   └── {postId}
│   │       ├── postId: string
│   │       ├── postTitle: string
│   │       ├── completedAt: number (timestamp in ms)
│   │       ├── timeSpent: number (milliseconds)
│   │       └── status: 'completed' | 'in-progress'
│   └── seriesProgress/
│       └── {seriesId}
│           ├── seriesId: string
│           ├── seriesName: string
│           ├── totalPosts: number
│           ├── completedPosts: number
│           ├── percentage: number
│           └── lastUpdated: number (timestamp in ms)
```

## Manual Creation (Optional)

You can manually create collections in Firebase Console for planning/organization:

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**

### Step 2: Create Collection Structure

**Option A: Automatic (Recommended)**
- Just configure `.env.local` and let collections auto-create on first signup

**Option B: Manual**
1. Click **+ Start collection**
2. Create collection: `users`
3. Add first document with your test user ID
4. Add nested collections:
   - `profile` → document `metadata`
   - `progressedPosts` (empty, will be populated)
   - `seriesProgress` (empty, will be populated)

## When Collections Are Created

### Timeline
```
User Action                          Collection Created?
─────────────────────────────────────────────────────────
1. Firebase project created          (empty)
2. User signs up                     users/{userId}/profile/* ✓
3. User marks post complete          users/{userId}/progressedPosts/* ✓
4. User tracks series                users/{userId}/seriesProgress/* ✓
5. Navigate to /progress dashboard   (reads existing collections)
```

## Firestore Security Rules

These rules are configured to auto-create collections safely:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      
      match /progressedPosts/{postId} {
        allow read, write: if request.auth.uid == userId;
      }
      
      match /seriesProgress/{seriesId} {
        allow read, write: if request.auth.uid == userId;
      }
      
      match /profile/{document=**} {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

## Testing Collection Creation

### Step 1: Configure Firebase
1. Copy `.env.example` to `.env.local`
2. Add Firebase credentials from Firebase Console

### Step 2: Test Signup Flow
```bash
npm run dev
```

1. Click "Login" in header
2. Sign up with test email: `test@example.com`
3. Check Firebase Console → Firestore Database

### Step 3: Verify Collections Created
After signup, you should see in Firestore:
- ✓ `users` collection
  - ✓ Document with your user ID
    - ✓ `profile` subcollection
      - ✓ `metadata` document with email, displayName, etc.
    - ✓ `progressedPosts` subcollection (empty, created on first post)
    - ✓ `seriesProgress` subcollection (empty, created on first series)

### Step 4: Test Data Writing
1. Click checkmark badge on any post
2. Return to Firebase Console
3. Refresh and check `progressedPosts` collection
4. Should see new document with `postId`, `postTitle`, `completedAt`, etc.

## Troubleshooting

### Collections Not Appearing

**Problem**: After signup, collections don't appear in Firestore

**Solutions**:
1. Check `.env.local` has correct Firebase credentials
2. Check Firestore Database is created in your Firebase project
3. Verify Authentication is enabled (Email/Password provider)
4. Check browser console for errors: `F12` → Console tab
5. Check Firebase Console → Cloud Messaging → Service Accounts

### Permission Errors

**Problem**: "Permission denied" when writing to Firestore

**Solutions**:
1. Update Firestore Security Rules (see above)
2. Ensure user is authenticated: Check header shows username
3. Verify user UID matches in rules
4. Try test mode (temporarily): Go to Firestore → Rules → Set `allow read, write: if true;`

## Files Modified/Created

```
✓ lib/initializeFirestore.ts       (NEW) Collection initialization utilities
✓ components/contexts/authContext.tsx    Updated to call initialization on signup
✓ FIREBASE_SETUP.md                Updated with collection details
✓ .env.example                     Already has Firebase config vars
```

## Next Steps

1. **Configure Firebase**
   - Copy `.env.example` to `.env.local`
   - Add Firebase credentials

2. **Set Up Firestore Database**
   - Go to Firebase Console
   - Create Firestore Database (test mode or production with rules)

3. **Update Security Rules**
   - Copy rules from FIREBASE_SETUP.md
   - Paste into Firestore → Rules

4. **Test Signup Flow**
   - Run `npm run dev`
   - Sign up new user
   - Verify collections created in Firestore Console

5. **Test Progress Tracking**
   - Mark posts complete
   - Navigate to `/progress` dashboard
   - Verify data appears correctly

## Reference

- [Firestore Get Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
- [Firebase Auth Setup](https://firebase.google.com/docs/auth/web/start)
