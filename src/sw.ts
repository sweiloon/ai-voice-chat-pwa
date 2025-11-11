/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */
import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'document' ||
    request.destination === 'font',
  new StaleWhileRevalidate({ cacheName: 'resonance-static-v1' }),
)
