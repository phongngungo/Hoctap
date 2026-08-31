/* Phong Study - Service Worker
   - Giúp trình duyệt coi web là PWA có thể CÀI ĐẶT thật (không phải chỉ tạo lối tắt)
   - Cache các tài nguyên gốc để mở được cả khi mất mạng
   - Nhận cấu hình "nhắc học hằng ngày" và bắn thông báo qua Periodic Background Sync
     (chỉ hoạt động trên trình duyệt/hệ điều hành hỗ trợ, best-effort) */

const CACHE_VERSION = 'phong-study-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Điều hướng trang: ưu tiên mạng, rơi về cache khi offline.
// Tài nguyên tĩnh khác cùng gốc: trả cache ngay (nhanh) rồi âm thầm cập nhật cache từ mạng.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // để CDN (mammoth, jszip, MathJax...) tự xử lý

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* ===== Nhắc học hằng ngày (đồng bộ từ trang chính qua postMessage) ===== */
const DB_NAME = 'phong-study-sw';
const STORE_NAME = 'kv';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_STUDY_REMINDER') {
    event.waitUntil(idbSet('studyReminderConfig', event.data.config));
  }
});

async function fireDailyStudyReminder() {
  const config = await idbGet('studyReminderConfig');
  if (!config || !config.enabled) return;
  await self.registration.showNotification('🔔 Phong Study', {
    body: 'Đến giờ ôn tập rồi! Mở app để tiếp tục lịch học của bạn.',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: 'phong-study-daily-reminder'
  });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-study-reminder') {
    event.waitUntil(fireDailyStudyReminder());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow('./index.html');
    })
  );
});
