# Firebase Integration Documentation

## Overview

This blog starter kit now includes Firebase integration for user authentication and progress tracking. Users can sign up, log in, and track their learning progress across posts and series.

## Features Implemented

### 1. **User Authentication**
- Email/password signup and login
- Session persistence across browser refreshes
- Automatic user state management
- Logout functionality

### 2. **Progress Tracking**
- Mark individual posts as completed
- Track completion status per user
- Automatic progress persistence to Firestore
- Progress dashboard showing:
  - Total posts tracked
  - Completed posts count
  - Overall completion percentage
  - List of completed posts with timestamps

### 3. **UI Components**
- **UserProfile**: Header button showing user status (login/logout)
- **AuthModal**: Beautiful modal for sign-up and login
- **ProgressBadge**: Badge to mark posts as completed
- **Progress Page**: Dedicated page at `/progress` showing user progress

## Setup Instructions

### Step 1: Set Up Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
4. Create a Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (or production with proper rules)
   - Set location (recommended: us-central1)

### Step 2: Get Firebase Configuration

1. In Firebase Console, go to Project Settings
2. Under "Your apps", click on the web app icon or create a new web app
3. Copy your Firebase config object
4. You'll need these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local` (if not already done)
2. Add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 4: Update Firestore Security Rules

Replace your Firestore security rules with:

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
      
      match /profile {
        allow read, write: if request.auth.uid == userId;
      }
    }
  }
}
```

## Usage

### For Users

1. **Sign Up**: Click the "Login" button in the header
2. **Create Account**: Switch to sign-up mode and fill in email/password
3. **Track Progress**: After logging in, click "Mark Complete" on any post
4. **View Progress**: Click your profile icon (top-right) → "Progress Tracker"

### For Developers

#### Using Authentication

```typescript
import { useAuth } from '@/components/contexts/authContext';

export function MyComponent() {
  const { user, logout, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (user) {
    return (
      <div>
        Welcome, {user.email}!
        <button onClick={logout}>Logout</button>
      </div>
    );
  }
  
  return <div>Please log in</div>;
}
```

#### Tracking Post Completion

```typescript
import { useUserProgress } from '@/hooks/useProgress';

export function PostComponent({ postId, postTitle }) {
  const { isPostCompleted, markPostComplete } = useUserProgress();
  const completed = isPostCompleted(postId);
  
  return (
    <button onClick={() => markPostComplete(postId, postTitle)}>
      {completed ? '✓ Completed' : 'Mark as Complete'}
    </button>
  );
}
```

#### Tracking Series Progress

```typescript
import { useSeriesProgress } from '@/hooks/useProgress';

export function SeriesComponent() {
  const { updateSeriesProgress } = useSeriesProgress();
  
  const handleSeriesCompletion = async (seriesId, seriesName, total, completed) => {
    await updateSeriesProgress(seriesId, seriesName, total, completed);
  };
  
  return (/* JSX */);
}
```

## File Structure

```
lib/
├── firebase.ts                    # Firebase initialization

components/
├── contexts/
│   └── authContext.tsx           # Auth context and provider
├── auth-modal.tsx                # Login/signup modal
├── user-profile.tsx              # User profile menu
└── progress-badge.tsx            # Mark complete badge

hooks/
└── useProgress.ts                # Progress tracking hooks

pages/
├── _app.tsx                      # Updated with AuthProvider
├── progress.tsx                  # Progress dashboard page
└── [other pages]

.env.example                       # Updated with Firebase config
```

## Firestore Database Structure

```
users/
├── {userId}/
│   ├── profile
│   │   ├── displayName: string
│   │   ├── email: string
│   │   ├── avatar: string
│   │   └── createdAt: timestamp
│   ├── progressedPosts/
│   │   └── {postId}
│   │       ├── postId: string
│   │       ├── postTitle: string
│   │       ├── completedAt: number (timestamp)
│   │       ├── timeSpent: number (milliseconds)
│   │       └── status: 'completed' | 'in-progress'
│   └── seriesProgress/
│       └── {seriesId}
│           ├── seriesId: string
│           ├── seriesName: string
│           ├── totalPosts: number
│           ├── completedPosts: number
│           ├── percentage: number
│           └── lastUpdated: number (timestamp)
```

## API Reference

### useAuth Hook

```typescript
const { user, loading, signUp, login, logout } = useAuth();

// user: User | null - Firebase user object
// loading: boolean - Auth state loading
// signUp(email: string, password: string): Promise<void>
// login(email: string, password: string): Promise<void>
// logout(): Promise<void>
```

### useUserProgress Hook

```typescript
const {
  posts,
  loading,
  markPostComplete,
  getPostStatus,
  isPostCompleted,
} = useUserProgress();

// posts: PostProgress[] - All tracked posts
// loading: boolean - Progress data loading
// markPostComplete(postId: string, postTitle?: string): Promise<void>
// getPostStatus(postId: string): 'completed' | 'in-progress' | null
// isPostCompleted(postId: string): boolean
```

### useSeriesProgress Hook

```typescript
const {
  seriesData,
  loading,
  getSeriesProgress,
  updateSeriesProgress,
} = useSeriesProgress();

// seriesData: SeriesProgress | null
// loading: boolean
// getSeriesProgress(seriesId: string, seriesName: string): Promise<SeriesProgress | null>
// updateSeriesProgress(seriesId, seriesName, totalPosts, completedPosts): Promise<void>
```

### usePostTimeTracking Hook

```typescript
const { startTracking, endTracking } = usePostTimeTracking();

// startTracking(): void - Start timing a post
// endTracking(postId: string): Promise<void> - Save time spent
```

## Troubleshooting

### "Cannot find module '@firebase/auth'"
- Run `pnpm add firebase` or `npm install firebase`
- Make sure you're in the personal theme directory

### Auth modal not appearing
- Check that AuthProvider is wrapped in _app.tsx
- Verify Firebase config variables in .env.local
- Check browser console for errors

### Progress not saving
- Verify Firestore database is created and enabled
- Check Firebase security rules
- Ensure user is authenticated (check useAuth hook)
- Check browser console for Firestore errors

### User stays logged in after page reload
- This is expected! Firebase persists auth state
- To force logout: Call logout() function

## Future Enhancements

- [ ] Time tracking per post
- [ ] Export progress as PDF
- [ ] Achievements and badges
- [ ] Leaderboard
- [ ] Social sharing of progress
- [ ] Google/GitHub sign-in
- [ ] Email notifications for series completion
- [ ] Progress reminders
- [ ] Mobile app support
- [ ] Dark mode optimization for auth components

## Security Notes

- All user data is private (Firestore rules enforce this)
- Passwords are handled by Firebase (encrypted)
- API keys are public (that's normal for web apps)
- Never expose your project ID in git
- Use environment variables for all sensitive data

## Support

For issues related to:
- Firebase: See [Firebase Documentation](https://firebase.google.com/docs)
- Next.js: See [Next.js Documentation](https://nextjs.org/docs)
- Authentication: See [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- Firestore: See [Firestore Docs](https://firebase.google.com/docs/firestore)
