// 单词大冒险 · Service Worker
const CACHE = "wordgame-v1";
const PRECACHE = ["./", "./index.html", "./manifest.webmanifest", "./roster.json", "./icons/icon-192.png", "./icons/icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(PRECACHE); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  const req = e.request;
  if(req.method !== "GET"){ return; }
  const url = new URL(req.url);
  if(url.origin !== location.origin){ return; }
  const isData = url.pathname.indexOf("/data/") >= 0;
  const isPage = url.pathname.endsWith("/") || url.pathname.indexOf("index.html") >= 0 || url.pathname.indexOf("manifest") >= 0;
  if(isData || isPage){
    // 网络优先：保证词库/页面改动立刻生效；断网时用缓存兜底
    e.respondWith(
      fetch(req).then(function(res){
        const copy = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copy); });
        return res;
      }).catch(function(){ return caches.match(req); })
    );
    return;
  }
  // 其它静态资源：缓存优先
  e.respondWith(caches.match(req).then(function(hit){ return hit || fetch(req); }));
});
