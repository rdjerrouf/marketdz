// public/push-sw.js - Push notification service worker
self.addEventListener('push', function(event) {
  const options = {
    body: 'Default notification body',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.title = payload.title || 'MarketDZ';
      options.icon = payload.icon || options.icon;
      options.badge = payload.badge || options.badge;
      options.image = payload.image;
      options.tag = payload.tag;
      options.requireInteraction = payload.requireInteraction || false;
      options.data = { ...options.data, ...payload.data };
      
      if (payload.actions) {
        options.actions = payload.actions;
      }
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(options.title || 'MarketDZ', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Route based on notification type
  if (data.type === 'message') {
    targetUrl = '/chat';
  } else if (data.type === 'listing') {
    targetUrl = data.listing_id ? `/browse/${data.listing_id}` : '/profile';
  } else if (data.type === 'favorite') {
    targetUrl = '/favorites';
  }

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow(targetUrl)
    );
  } else if (event.action === 'close') {
    // Notification is already closed
    return;
  } else {
    // Default click
    event.waitUntil(
      clients.openWindow(targetUrl)
    );
  }
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification.tag);
  
  // Optional: Track notification close events
  // Could send analytics data here
});
