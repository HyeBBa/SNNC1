const CACHE_NAME = 'snnc-pwa-v3';

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* =========================
   PWA 설치
========================= */

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
  );

  self.skipWaiting();
});


/* =========================
   PWA 활성화
========================= */

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});


/* =========================
   일반 파일 요청
========================= */

self.addEventListener('fetch', event => {
  event.respondWith(
    (event.request.mode === 'navigate'
      ? fetch(event.request, { cache: 'no-cache' })
          .then(async response => {
            if (response.ok) {
              try {
                const cache = await caches.open(CACHE_NAME);
                await cache.put(event.request, response.clone());
              } catch (error) {
                console.warn('페이지 캐시 갱신 실패:', error);
              }
            }
            return response;
          })
      : fetch(event.request))
      .catch(() => caches.match(event.request))
  );
});


/* =========================
   🔔 푸시 알림 수신
========================= */

self.addEventListener('push', event => {

  let data = {
    title: '휴무계획표',
    body: '새로운 알림이 있습니다.',
    url: './'
  };

  /*
   * 서버에서 JSON 형태로 보낸 경우
   */
  if (event.data) {
    try {
      const pushData = event.data.json();

      data = {
        ...data,
        ...pushData
      };

    } catch (error) {
      /*
       * JSON이 아닌 일반 문자열로 들어온 경우
       */
      data.body = event.data.text();
    }
  }

  const notificationOptions = {
    body: data.body,

    icon: './icons/icon-192.png',

    badge: './icons/icon-192.png',

    data: {
      url: data.url || './'
    },

    // 공통 tag를 지정하지 않아 새 알림이 이전 알림을 덮어쓰지 않습니다.
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title,
      notificationOptions
    )
  );
});


/* =========================
   🔔 알림 클릭
========================= */

self.addEventListener('notificationclick', event => {

  event.notification.close();

  const urlToOpen =
    event.notification.data?.url || './';

  event.waitUntil(

    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {

      /*
       * 이미 PWA가 열려 있다면
       * 해당 화면을 앞으로 가져옵니다.
       */
      for (const client of clientList) {

        if ('focus' in client) {
          return client.focus();
        }

      }

      /*
       * PWA가 열려 있지 않다면
       * 앱을 새로 엽니다.
       */
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }

    })
  );
});
