'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

let cachedApp: FirebaseApp | undefined;
let cachedAuth: Auth | undefined;
let cachedDb: Firestore | undefined;

export function initializeFirebase() {
  if (!cachedApp) {
    if (getApps().length > 0) {
      cachedApp = getApp();
    } else {
      cachedApp = initializeApp(firebaseConfig);
    }
  }

  if (!cachedAuth) {
    cachedAuth = getAuth(cachedApp);
  }

  if (!cachedDb) {
    cachedDb = getFirestore(cachedApp);
  }

  return { app: cachedApp, auth: cachedAuth, db: cachedDb };
}

export { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';
export { useUser } from './auth/use-user';
