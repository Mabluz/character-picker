/* eslint-disable-next-line no-redeclare */
/* global self */
//https://developers.google.com/web/fundamentals/primers/service-workers
//https://web.dev/customize-install/
//https://web.dev/install-criteria/
//https://web.dev/progressive-web-apps/
//https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#custom_responses_to_requests
/*
self.addEventListener('install', () => self.skipWaiting())
*/

var CACHE_NAME = "my-site-cache-v2";
var urlsToCache = ["/"];

self.addEventListener("activate", event => {
  console.log("activate v1.10");
  self.clients.matchAll({ type: "window" }).then(windowClients => {
    for (const windowClient of windowClients) {
      // Force open pages to refresh, so that they have a chance to load the
      // fresh navigation response from the local dev server.
      windowClient.navigate(windowClient.url);
    }
  });
  var cacheAllowlist = ["pages-cache-v1", "blog-posts-cache-v1"];
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheAllowlist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/*
,
    '/app.css',
    '/app.js',
    'https://character-picker-backend.herokuapp.com/game/',
    'https://fonts.googleapis.com/css?family=Josefin+Sans&display=swap'
 */

self.addEventListener("install", function(event) {
  console.log("INSTALL!");
  // Perform install steps
  //self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log("Opened cache");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

/*
self.addEventListener('activate', function(event) {

});
 */

self.addEventListener("fetch", function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      // Cache hit - return response
      if (response) {
        return response;
      }

      return fetch(event.request).then(function(response) {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        var responseToCache = response.clone();

        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
