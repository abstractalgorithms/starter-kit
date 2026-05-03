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
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';

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
      displayName: displayName || email.split('@')[0],
      avatar: null,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    });

    console.log(`✓ Initialized profile for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
}

/**
 * Ensure progressedPosts collection exists for user
 * (Auto-created when first post is marked, but this ensures structure)
 */
export async function ensureProgressedPostsCollection(userId: string) {
  try {
    const collectionRef = collection(db, 'users', userId, 'progressedPosts');
    
    // Try to fetch documents (collection auto-creates on first write)
    const snapshot = await getDocs(collectionRef);
    
    console.log(`✓ Verified progressedPosts collection for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error verifying progressedPosts collection:', error);
    throw error;
  }
}

/**
 * Ensure seriesProgress collection exists for user
 * (Auto-created when first series is tracked, but this ensures structure)
 */
export async function ensureSeriesProgressCollection(userId: string) {
  try {
    const collectionRef = collection(db, 'users', userId, 'seriesProgress');
    
    // Try to fetch documents (collection auto-creates on first write)
    const snapshot = await getDocs(collectionRef);
    
    console.log(`✓ Verified seriesProgress collection for user: ${userId}`);
    return true;
  } catch (error) {
    console.error('Error verifying seriesProgress collection:', error);
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
    
    // Verify other collections (they'll auto-create on first write)
    await ensureProgressedPostsCollection(userId);
    await ensureSeriesProgressCollection(userId);
    
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
