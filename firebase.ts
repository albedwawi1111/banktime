// firebase.ts - Firebase configuration and initialization
declare const firebase: any;

// =========================================================================================
// هام: يرجى لصق كائن إعدادات Firebase الخاص بك هنا.
// يمكنك الحصول عليه من إعدادات مشروعك في Firebase Console.
// انتقل إلى: Project settings > General > Your apps > Web app > SDK setup and configuration
// =========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyA2sVwNZ6Cq6OdHtV6BVYu3pvtvpxHA8nk",
  authDomain: "banktime-53f7d.firebaseapp.com",
  projectId: "banktime-53f7d",
  storageBucket: "banktime-53f7d.firebasestorage.app",
  messagingSenderId: "567879666061",
  appId: "1:567879666061:web:d7fdbc290e954f0fb755c4",
  measurementId: "G-FHRLTGT5YZ"
};

// Gemini API Configuration
export const geminiConfig = {
    // The Gemini API key is provided via environment variables for security.
    apiKey: process.env.API_KEY,
};

let db: any;

// Check for placeholder configuration. The user needs to replace this.
if (firebaseConfig.apiKey.includes("YOUR_API_KEY")) {
    console.error(
      "خطأ فادح: إعدادات Firebase غير مكتملة. يرجى تحديث ملف `firebase.ts` بالإعدادات الصحيحة من مشروع Firebase الخاص بك."
    );
    db = null; // Set db to null to indicate initialization failure
} else {
  try {
    // تجنب إعادة تهيئة التطبيق إذا كان موجودًا بالفعل
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    // Enable offline persistence
    db.enablePersistence().catch((err: any) => {
        if (err.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one.
            console.warn('Firestore persistence failed: multiple tabs open.');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence.
            console.warn('Firestore persistence not available in this browser.');
        }
    });
  } catch (e) {
    console.error(
      "خطأ في تهيئة Firebase. يرجى التأكد من أنك قمت بلصق إعدادات مشروعك (firebaseConfig) في ملف firebase.ts بشكل صحيح.",
      e
    );
    db = null; // Set db to null on any initialization error
  }
}

export { db };