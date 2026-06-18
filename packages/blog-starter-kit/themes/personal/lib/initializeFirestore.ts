/**
 * Firestore Collection Initialization
 * 
 * This module provides utilities to initialize Firestore collections
 * with proper structure and security rules.
 * 
 * Collections are auto-created by Firebase when data is written to them,
 * but this provides helper functions to ensure proper initialization.
 */

import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Initialize user profile document
 * Called after user signup to create initial profile
 */
export async function initializeUserProfile(
  userId: string,
  email: string,
  displayName?: string
) {
  try {
    const userRef = doc(db, 'users', userId, 'profile', 'metadata');
    
    await setDoc(userRef, {
      email,
      displayName: displayName || email.split('@')[0] || 'Learner',
      avatar: null,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    }, { merge: true });

    console.log(`✓ Initialized profile for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
}

/**
 * Initialize all collections for a new user
 * Call this during signup flow
 */
export async function initializeUserCollections(
  userId: string,
  email: string,
  displayName?: string
) {
  try {
    // Initialize profile
    await initializeUserProfile(userId, email, displayName);

    // Firestore collections are created automatically on first document write.
    // Avoid probing empty collections here because restrictive security rules can
    // block collection reads even when later document-level writes are allowed.
    console.log(`✓ All collections initialized for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error initializing user collections:', error);
    throw error;
  }
}

/**
 * Expected Firestore Structure:
 * 
 * users/
 * ├── {userId}/
 * │   ├── profile/
 * │   │   └── metadata
 * │   │       ├── email: string
 * │   │       ├── displayName: string
 * │   │       ├── avatar: string | null
 * │   │       ├── createdAt: number (timestamp in ms)
 * │   │       └── updatedAt: number (timestamp in ms)
 * │   ├── progressedPosts/
 * │   │   └── {postId}
 * │   │       ├── postId: string
 * │   │       ├── postTitle: string
 * │   │       ├── completedAt: number (timestamp in ms)
 * │   │       ├── timeSpent: number (milliseconds)
 * │   │       └── status: 'completed' | 'in-progress'
 * │   └── seriesProgress/
 * │       └── {seriesId}
 * │           ├── seriesId: string
 * │           ├── seriesName: string
 * │           ├── totalPosts: number
 * │           ├── completedPosts: number
 * │           ├── percentage: number
 * │           └── lastUpdated: number (timestamp in ms)
 */
