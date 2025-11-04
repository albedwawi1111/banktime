const CACHE_NAME = 'pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/idb.ts',
  '/firebase.ts',
  '/components/AboutPage.tsx',
  '/components/AIChat.tsx',
  '/components/AttendanceSheet.tsx',
  '/components/AuditLogViewer.tsx',
  '/components/ChangePasswordModal.tsx',
  '/components/CorrespondenceLetter.tsx',
  '/components/CustomsCorrespondenceLetter.tsx',
  '/components/CorrespondenceManager.tsx',
  '/components/Dashboard.tsx',
  '/components/EmployeeCV.tsx',
  '/components/EmployeeExporter.tsx',
  '/components/EmployeeManager.tsx',
  '/components/HelpGuide.tsx',
  '/components/icons.tsx',
  '/components/LeaveManager.tsx',
  '/components/LeaveRequestForm.tsx',
  '/components/Login.tsx',
  '/components/MaktabiSystem.tsx',
  '/components/Modal.tsx',
  '/components/MyProfile.tsx',
  '/components/OvertimeReport.tsx',
  '/components/RejectionNoticePrint.tsx',
  '/components/SchedulerCalendarView.tsx',
  '/components/Settings.tsx',
  '/components/ShiftScheduler.tsx',
  '/components/ShortLeaveRequestForm.tsx',
  '/components/TopBar.tsx',
  '/components/TrainingManager.tsx',
  '/components/UserManagement.tsx',
  '/components/UserRequestManager.tsx',
  '/components/VehiclePermitManager.tsx',
  '/components/VehiclePermitPrint.tsx',
  '/components/SurveyManager.tsx',
  '/components/SurveyTaker.tsx',
  '/components/AdminLoginChoiceModal.tsx',
  '/components/AnnouncementBar.tsx',
  '/components/Toast.tsx',
  '/components/ToastContainer.tsx',
  '/components/ChatBot.tsx',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Bypass non-GET requests and API calls to Firebase
  if (event.request.method !== 'GET' || event.request.url.includes('firestore.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Cache-first strategy
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, fetch from network and then cache it
      return fetch(event.request).then((networkResponse) => {
        // Check if we received a valid response before caching
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
});