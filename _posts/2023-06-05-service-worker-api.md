---
title: "Service Worker"
search: false
category:
  - information
last_modified_at: 2023-06-05T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [Make Simple Web Server by live-server][live-server-link]

## 0. 들어가면서

프론트엔드 테스트에 대해 공부하다 알게된 MSW(Mock Service Worker)를 조사하면서 처음 서비스 워커(service worker)를 접했습니다. 
최근 진행했던 프로젝트에선 PWA(Progressive Web Application)을 고려하면서 한번 더 마주쳤습니다. 
서비스 워커는 어떤 역할을 수행하는지 이번 포스트에서 개념과 사용 방법에 대해 정리해보겠습니다. 

## 1. Service Worker

서비스 워커는 웹 브라우저에서 실행되는 백그라운드 스크립트입니다. 
웹 어플리케이션의 성능을 향상시키고, 기능 구현에 도움을 주는 기술입니다. 
웹 페이지와 별개로 동작하며 일종의 네트워크 프록시(proxy)로서 브라우저와 서버 사이에서 요청과 응답을 처리할 수 있습니다. 
네트워크 연결이 불안정한 경우에도 사용자 경험을 향상시킬 수 있습니다. 
로컬호스트(localhost)를 제외하면 HTTPS 통신이 가능한 서버에서만 동작합니다. 

대표적으로 다음과 같은 기능을 수행합니다.

* 오프라인 브라우징(offline browsing)
    * 서비스 워커를 통해 웹 어플리케이션의 캐시(cache)를 관리할 수 있습니다.
    * 네트워크 연결이 없는 상황에서도 캐시된 리소스를 사용하여 어플리케이션을 실행할 수 있습니다.
* 백그라운드 동기화
    * 사용자가 오프라인 상태에서 수행한 작업을 추적합니다.
    * 네트워크 연결이 다시 활성화 될 때 작업을 동기화합니다.
    * 오프라인 상태에서 작업하거나 변경한 내용을 온라인 상태가 되면 서버로 전송하여 동기화합니다.
* 푸시 알림
    * 푸시 알림을 받아 사용자에게 표시할 수 있습니다.
    * 웹 어플리케이션이 백그라운드에서도 중요한 정보를 사용자에게 전달할 수 있습니다.

##### Where is the Service Worker?

* 웹 어플리케이션과 웹 서버 사이의 새로운 계층에서 동작합니다.
    * 웹 어플리케이션 입장에선 네트워크 프록시 역할을 수행합니다.
* 브라우저의 캐시 저장소를 사용해 필요한 리소스들을 저장합니다.
    * 오프라인 상태에서도 캐시에 저장된 리소스를 사용하므로 일부 기능이 제한되지만 정상적인 동작이 가능합니다.
    * 캐시 저장소는 브라우저 캐시와 독립적으로 동작하며 영구적으로 보관됩니다
* 서비스 워커는 웹 어플리케이션과 독립적으로 동작하기 위해 설치를 통해 사용합니다.
    * 웹 페이지와 독립적으로 동작하기 때문에 DOM 엘리먼트나 window 객체에 접근할 수 없습니다. 
    * 백그라운드 동기화나 푸시 알림을 받아 처리할 수 있습니다.

<p align="center">
    <img src="/images/service-worker-api-1.JPG" width="80%" class="image__border">
</p>

## 2. Service Worker Lifecycle and States

서비스 워커는 설치에서 활성화까지 아래와 같은 상태를 거치게 됩니다. 

1. installing
    * `navigator.serviceWorker.register()` 함수 호출에 의해 설치가 시작됩니다.
    * 서비스 워커는 installing 상태가 되며 install 이벤트 콜백 함수가 실행됩니다.
    * 해당 콜백 함수에서 필요한 리소스를 사전에 캐시에 저장하는 등의 작업을 처리합니다.
    * 설치에 실패하는 경우 redundant 상태로 변경됩니다.
1. installed / waiting
    * 서비스 워커 설치가 완료되면 installed 상태가 됩니다.
    * 현재 활성화 된 서비스 워커가 없다면 activating 상태가 됩니다.
    * 현재 활성화 된 서비스 워커가 있다면 waiting 상태가 됩니다.
    * 현재 서비스 워커가 동작 중에 정지되는 것을 방지하고자 제어 중인 모든 웹 어플리케이션이 종료되면 대기 중인 새로운 워커로 변경됩니다.
    * `skipWaiting()` 함수를 통해 대기 상태 없이 즉시 새로운 서비스 워커를 사용할 수도 있습니다.
1. activating
    * 서비스 워커가 활성화되기 전 상태이며 activate 이벤트 콜백 함수가 실행됩니다.
    * HTML 문서가 서비스 워커에 의해 제어되려면 리로드(reload)되어야 하지만, `client.claim()` 함수 호출을 통해 리로드 없이 재정의할 수 있습니다.
1. activated
    * 서비스 워커가 활성화 된 상태이며 이 시점부터 fetch, push, sync 등의 이벤트 콜백을 받아 처리할 수 있습니다.
1. redundant
    * 서비스 워커가 설치 중 실패하거나 새로운 버전으로 교체되면 redundant 상태가 됩니다.
    * redundant 상태의 서비스 워커는 앱에 아무런 영향을 미치지 못 합니다.

<p align="center">
    <img src="/images/service-worker-api-2.JPG" width="80%" class="image__border image__padding">
</p>
<center>https://www.oreilly.com/library/view/building-progressive-web/9781491961643/ch04.html</center>

## 3. Practice

서비스 워커는 이벤트 기반으로 동작합니다. 
이번 포스트에선 간단하게 fetch 이벤트를 통해 이미지를 캐싱하는 예제를 다뤄보겠습니다. 
아래 목록은 서비스 워커에서 다룰 수 있는 이벤트 종류입니다.

* Lifecycle Events
    * install
    * activate
* Legacy Events
    * message
    * messageerror
* Functional Events
    * fetch
    * sync
    * push
    * notificationclick
    * notificationclose
    * canmakepayment
    * paymentrequest

### 3.1. index HTML

* HTML 문서 마지막 부분에서 regsiterServiceWorker 함수를 호출해 서비스 워커를 등록합니다.
    * 서비스 워커는 프로젝트 폴더에 `service-worker.js` 스크립트 파일로 존재합니다.
* 두 개의 버튼이 존재하며 각 버튼은 다음과 같은 동작을 수행합니다.
    * Clear Cache 버튼 - 브라우저 캐시를 삭제합니다.
    * Cat Image 버튼 - 고양이 이미지를 서버로부터 받아서 보여줍니다.

```html
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="./style.css">
    <title>Document</title>
</head>

<body>
    <main>
        <div class="image">
            <img id="cat-image" src="https://cdn2.thecatapi.com/images/3k0.jpg" alt="cat">
        </div>
        <div class="buttons">
            <button onclick="clearCache()">Clear Cache</button>
            <button onclick="fetchCat()">Cat Image</button>
        </div>
    </main>
</body>

<script>
    function regsiterServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('./service-worker.js')
                .then(function (registration) {
                    if (registration.active && !navigator.serviceWorker.controller) {
                        window.location.reload();
                    }
                    console.log('register service worker - ', serviceWorker);
                });
        }
    }

    function clearCache() {
        if ('caches' in window) {
            return caches.keys()
                .then(function (keyList) {
                    console.log(keyList)
                    return Promise.all(keyList.map(function (key) {
                        return caches.delete(key);
                    }));
                })
        }
        return Promise.resolve();
    }

    function fetchCat() {
        fetch('https://api.thecatapi.com/v1/images/search?limit=1')
            .then(response => response.json())
            .then(data => {
                const catImage = document.querySelector("#cat-image");
                catImage.src = data[0].url;
            })
            .catch(error => console.log(error));
    }

    regsiterServiceWorker();
</script>

</html>
```

### 3.2. service-worker Script

서비스 워커에서 다음과 같은 이벤트를 처리합니다.

* install event
    * 서비스 워커를 설치 완료 전에 로그를 출력합니다.
* activate event
    * 서비스 워커가 활성화 상태 전에 로그를 출력합니다.
    * clients.claim() 함수를 호출하여 리로드 없이 서비스 워커를 활성화합니다.
* fetch event
    * 네트워크 요청 이벤트를 처리합니다.
    * 캐시에 데이터가 존재하면 이를 반환합니다.
    * 캐시에 데이터가 존재하지 않으면 서버에 요청 후 응답을 캐시에 저장하고 이를 반환합니다.

```js
self.addEventListener('install', event => {
    console.log('[Service Worker] install');
});

self.addEventListener('activate', event => {
    console.log('[Service Worker] activate');
    clients.claim();
});

self.addEventListener('fetch', fetchHandler);

function fetchHandler(event) {
    const { request } = event;
    console.log("[Service Worker] fetch ", request);
    event.respondWith(
        caches.match(request)
            .then(response => {
                return response || fetchAndCaching(request);
            })
    );
}

function fetchAndCaching(request) {
    return fetch(request)
        .then(response =>
            caches.open('my-cache')
                .then(cache => {
                    cache.put(request, response.clone());
                    return response;
                })
                .catch(error => console.log(error))
        );
}
```

### 3.3. Run Web Server

* [live-server][live-server-link] 명령어를 통해 로컬 머신에서 간단하게 웹 서버를 실행합니다.

```
$ live-server             

Serving "/Users/junhyunk/Desktop/2023-06-05-service-worker-api" at http://127.0.0.1:8080
Ready for changes
GET /favicon.ico 404 1.793 ms - 150
```

##### Result of Practice

* 등록된 서비스 워커 정보는 `개발자 도구(F12) > 애플리케이션 > Service Workers`에서 확인할 수 있습니다.
* 사용 중인 캐시 정보는 `개발자 도구 > 애플리케이션 > 캐시 저장공간`에서 확인할 수 있습니다.
* Cat Image 버튼 클릭
    * fetch 함수를 통해 API 요청 시 고양이 이미지 리소스 주소가 담긴 JSON 응답을 받습니다.
    * 요청 정보를 키로 JSON 응답 캐시에 저장합니다.
    * img 엘리먼트의 src 속성을 변경하면 새로운 이미지를 다운로드 받습니다.
        * 네트워크를 통해 이미지를 다운로드 받을 때도 서비스 워커의 fetch 이벤트 콜백 함수가 실행됩니다. 
    * 요청 정보를 키로 다운로드 받은 이미지를 캐시에 저장합니다.
    * 캐시된 데이터가 있으므로 다시 버튼을 누르면 이미지 변경이 발생하지 않습니다.
* Clear Cache 버튼 클릭
    * 캐시에 저장된 데이터를 모두 삭제합니다.
    * 저장된 데이터가 삭제된 후 Cat Image 버튼을 누르면 이미지가 변경됩니다.
    * 이후에 Cat Image 버튼을 누르면 캐시된 데이터에 의해 이미지 변경이 발생하지 않습니다.

<p align="center">
    <img src="/images/service-worker-api-3.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-06-05-service-worker-api>

#### REFERENCE

* <https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API>
* <https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers>
* <https://developer.mozilla.org/en-US/docs/Web/API/Cache>
* <https://web.dev/service-worker-lifecycle/>
* <https://www.w3.org/TR/service-workers/#execution-context-events>
* <https://www.oreilly.com/library/view/building-progressive-web/9781491961643/ch04.html>
* <https://fe-developers.kakaoent.com/2022/221208-service-worker/>
* <https://jdh5202.tistory.com/817>
* <https://so-so.dev/web/service-worker/>
* <https://www.happykoo.net/@happykoo/posts/176>
* <https://www.happykoo.net/@happykoo/posts/178>
* <https://github.com/lukejacksonn/servor/issues/30>
* <https://stackoverflow.com/questions/33704791/how-do-i-uninstall-a-service-worker>
* <https://stackoverflow.com/questions/70331036/why-service-workers-fetch-event-handler-not-being-called-but-still-worked>
* <https://stackoverflow.com/questions/51597231/register-service-worker-after-hard-refresh/66816077#66816077>
* <https://www.youtube.com/watch?v=jVfXiv03y5c>

[live-server-link]: https://junhyunny.github.io/information/live-server/