const CACHE_NAME = 'CACHE-01';
const toCache = [
    '/',
];

self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(function(cache) {
            return cache.addAll(toCache)
        })
        .then(self.skipWaiting())
    )
})

self.addEventListener('fetch', function(event) {
    event.respondWith(
        fetch(event.request)
        .catch(() => {
            return caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.match(event.request)
            })
        })
    )
})

self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys()
        .then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('Hapus cache lama', key)
                    return caches.delete(key)
                }
            }))
        })
        .then(() => self.clients.claim())
    )
})
const iklan = {
    banner:'',
    ad:'',
    set(){
        if(!sessionStorage.getItem('iklan')){
            sessionStorage.setItem('iklan',1)
            this.open()
        }
    },
    open(){
        admob.start()
        this.banner = new admob.BannerAd({
            adUnitId: 'ca-app-pub-5890023057020023/1167660754',
            //adUnitId: 'ca-app-pub-3940256099942544/6300978111',
        })
        this.showBanner()
    },
    showBanner(){
        this.banner.show()
    },
    hideBanner(){
        this.banner.hide()
    },
    video : async () =>{
        interstitial = new admob.InterstitialAd({
            adUnitId: 'ca-app-pub-5890023057020023/5006176878',
            //adUnitId: 'ca-app-pub-3940256099942544/1033173712',
        })
        await interstitial.load()
        await interstitial.show()
        document.addEventListener('admob.ad.dismiss', async () => {
            imageEditor.sharee()
            await interstitial.load()
        })
    },
    app : async () => {
        ad = new admob.AppOpenAd({
            adUnitId: 'ca-app-pub-5890023057020023/1725153821',
            //adUnitId: 'ca-app-pub-3940256099942544/3419835294',
        })
        await ad.load()
        await ad.show()
    },
}