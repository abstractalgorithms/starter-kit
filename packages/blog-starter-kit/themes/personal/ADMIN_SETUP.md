# Firebase admin and feature configuration

The admin dashboard is available at `/admin`. Access is enforced by a Firebase Authentication custom claim named `admin`.

## 1. Assign the admin claim

Run this once from a trusted server environment with the Firebase Admin credentials configured:

```js
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

(async () => {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });

  await getAuth().setCustomUserClaims('FIREBASE_USER_UID', { admin: true });
})();
```

The administrator must sign out and sign back in after the claim is assigned.

## 2. Allow clients to read feature configuration

Add this match block inside your existing Firestore `databases/{database}/documents` rules block:

```text
match /appConfig/{document} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.token.admin == true;
}
```

The application server writes configuration through the Admin SDK, but clients require read access for live menu and route updates.

## 3. Required server environment

```text
FIREBASE_SERVICE_ACCOUNT_KEY=
# Or use the three separate values below:
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

`FIREBASE_PRIVATE_KEY` may contain escaped newlines (`\\n`). Never expose these variables with a `NEXT_PUBLIC_` prefix.
