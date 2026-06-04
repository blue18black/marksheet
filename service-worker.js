const CACHE_NAME="marksheet-v1";

const urls=[
    "./",
    "./index.html",
    "./style.css",
    "./app.js"
];

self.addEventListener("install",e=>{

    e.waitUntil(

        caches.open(CACHE_NAME)
        .then(cache=>cache.addAll(urls))

    );
});

self.addEventListener("fetch",e=>{

    e.respondWith(

        caches.match(e.request)
        .then(res=>res||fetch(e.request))

    );
});