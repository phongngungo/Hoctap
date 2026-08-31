const CACHE_NAME = "phong-study-pwa-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest.json",
  "./offline.html",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("Phong Study SW install warning:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // Không can thiệp CDN/API bên ngoài.
  if (url.origin !== self.location.origin) {
    return;
  }

  // Khi mở app hoặc reload trang:
  // ưu tiên mạng để lấy bản mới,
  // nếu mất mạng thì dùng bản cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }

          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) =>
              cached ||
              caches.match("./index.html") ||
              caches.match("./offline.html")
          )
        )
    );

    return;
  }

  // Với tài nguyên cùng origin:
  // cache trước, nếu chưa có thì lấy mạng rồi cache.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => cache.put(request, copy))
              .catch(() => {});
          }

          return response;
        })
        .catch(() => Response.error());
    })
  );
});

// Giữ tương thích với chức năng nhắc học hiện có trong app.
self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "SET_STUDY_REMINDER") {
    console.log("Phong Study reminder config received.");
  }
});
