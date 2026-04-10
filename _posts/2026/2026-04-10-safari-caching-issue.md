---
title: "사파리(safari) 브라우저 캐시 정책과 이미지 재로딩 문제"
search: false
category:
  - browser
  - safari
  - javascript
  - typescript
last_modified_at: 2026-04-10T11:00:00+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [리액트(React) 스켈레톤 이미지(Skeleton Image)][react-skeleton-image-link]

## 0. 들어가면서

[이전 글][react-skeleton-image-link]에서 썸네일(thumbnail)이 생성되는 시점까지 이미지 로딩을 재시도하는 코드를 살펴봤다. 이번 글에서는 사파리(safari) 브라우저가 캐시 컨트롤(cache-control)이 적용된 응답을 다루는 방식이 다른 브라우저와 달라서 발생한 문제를 정리했다.

## 1. Problem Context

클라이언트 사이드에서 S3 presigned URL을 사용해서 이미지를 직접 호출하고 있었다. 이미지와 동영상이 많은 애플리케이션이기 때문에 미디어 리소스들에 브라우저 캐싱(caching)을 적용하고 싶었지만, presigned URL은 매번 변경되기 때문에 [Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control) 헤더를 적용할 수 없었다. 이를 개선하기 위해 AWS 클라우드 프론트(cloudfront)를 CDN(Content Delivery Network)으로 구축했다. 캐시 컨트롤 응답 헤더는 클라우드 프론트의 `Response Headers Policy`를 통해 지정했다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/safari-caching-issue-01.png" width="100%" class="image__border">
</div>

<br/>

해당 인프라를 구축한 이후 문제가 발생했다. 증상은 다음과 같다.

- 크롬이나 파이어폭스 같은 브라우저에서는 썸네일 이미지가 정상적으로 로딩되지만, 사파리 브라우저에서는 썸네일 이미지가 제대로 조회되지 않았다. 
- 사파리 브라우저는 화면을 새로고침해도 이미지가 조회되지 않았다. 
- 사파리 브라우저의 일반 모드에서 캐싱을 모두 지운 후 다시 접속하면 이미지가 정상적으로 확인됐다.
- 사파리 브라우저의 시크릿 모드를 사용하면 이미지가 정상적으로 로딩된다.

## 2. Problem Cause

문제 현상을 확인해봤다. 파이어폭스나 크롬에서는 에러가 발생하면 예상대로 이미지 로딩을 재시도한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/safari-caching-issue-02.png" width="100%" class="image__border">
</div>

<br/>

반면, 사파리는 첫 이미지 로딩 시 실패한 응답을 디스크에 캐싱하고, 이를 그대로 사용한다. 아래 이미지처럼 디스크에 저장된 json 응답을 계속 재사용한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/safari-caching-issue-03.png" width="100%" class="image__border">
</div>

<br/>

[RFC 9111](https://httpwg.org/specs/rfc9111.html) 명세서엔 명시적으로 Cache-Control 헤더가 있을 때 상태 코드에 따라 응답을 캐싱할지 말지에 대한 별도 제한이 없다. RFC 9111에서 "저장 가능한 조건"을 충족하면 어떤 상태 코드든 캐싱 가능하다. [RFC 9111 섹션 3](https://httpwg.org/specs/rfc9111.html#response.cacheability)에서 캐시가 응답을 저장할 수 있는 조건을 정의하고 있다. 응답 헤더에 다음 중 하나가 포함되어야 한다.

- public 디렉티브
- Expires 헤더
- max-age 디렉티브
- s-maxage 디렉티브

Cache-Control 헤더 같은 명시적인 유효 기간이 없는 경우에는 캐시가 스스로 응답을 얼마나 오래 저장해도 될지 추정하는 저장 방식이 있다. 이를 **휴리스틱 캐싱(heuristic caching)**이라고 한다. HTTP 특정 상태 코드들에 한해서만 캐시가 자체적으로 수명을 추정해 저장하는 휴리스틱 신선도(heuristic freshness) 캐싱을 허용한다. 이번 케이스의 경우 명시적인 캐싱 헤더가 존재하기 때문에 휴리스틱 캐싱과는 무관하다.

[RFC 9111 섹션 2](https://httpwg.org/specs/rfc9111.html#rfc.section.2)를 보면 캐싱은 선택적(optional)이기 때문에 브라우저가 이를 구현할 의무는 없다. 

> Although caching is an entirely OPTIONAL feature of HTTP, it can be assumed that reusing a cached response is desirable and that such reuse is the default behavior when no requirement or local configuration prevents it. Therefore, HTTP cache requirements are focused on preventing a cache from either storing a non-reusable response or reusing a stored response inappropriately, rather than mandating that caches always store and reuse particular responses.

따라서 브라우저마다 명시적 캐싱 헤더가 있는 경우 상태 코드에 따라 다르게 구현되는 것이 이상한 것은 아니다.

## 3. Solve the problem

처음에는 `CloudFront Function` 기능을 이용해서 캐싱 헤더를 조작하려고 했다. [하지만 CloudFront Function의 viewer-response 이벤트는 오리진(origin)이 400 이상의 HTTP 에러를 반환하면 실행되지 않는다.](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html#functions-event-structure-status-body) 즉, S3가 이미지가 없어서 403 응답을 반환하면 CloudFront Function은 동작하지 않는다.

이 외에도 인프라의 정책이나 람다 등을 이용해서 캐싱 응답을 바꿔치는 방법이 있는 것 같았지만, 비용이 가장 저렴한 방법으로 이 문제를 해결했다. 브라우저에서 이미지 로딩이 실패해서 재시도를 할 때 브라우저 `fetch()` API를 사용해서 캐싱을 무시하고 이미지를 직접 로딩하는 방법을 적용했다. 

기본적으로 fetch() 함수를 통해 다운로드된 리소스는 브라우저가 다운로드하는 다른 리소스들과 마찬가지로 HTTP 캐시의 적용을 받는다. 즉 동일한 URL이라면 `fetch()`, `<img>`, `Image 객체` 모두 같은 HTTP 캐시 영역을 공유한다. 그렇기 때문에 fetch() 함수를 통해 이미지가 정상적으로 로딩되면 이후에 `<img>` 태그나 Image 객체를 통해 이미지를 로딩할 때 캐싱이 적용된다.

fetch() 함수의 `cache` 옵션을 통해 캐싱된 값을 사용하는 것이 아니라 강제적으로 서버에 요청을 보낼 수 있다. cache 옵션을 통해 요청이 브라우저 HTTP 캐시와 어떻게 상호작용할지 제어할 수 있다.

- default - 브라우저가 HTTP 캐시에서 일치하는 요청을 찾는다. 일치하는 항목이 있고 신선하면 캐시에서 반환한다. 일치하지만 오래됐다면 서버에 조건부 요청을 보낸다. 리소스가 변경되지 않았으면 캐시에서, 변경됐으면 서버에서 새로 받아 캐시를 업데이트한다. 일치하는 항목이 없으면 일반 요청을 보내고 캐시를 업데이트한다.
- no-store - 브라우저가 캐시를 먼저 확인하지 않고 원격 서버에서 리소스를 가져오며, 다운로드한 리소스로 캐시를 업데이트하지 않는다.
- reload - 브라우저가 캐시를 먼저 확인하지 않고 원격 서버에서 리소스를 가져오지만, 다운로드한 리소스로 캐시를 업데이트한다.
- no-cache - 브라우저가 HTTP 캐시에서 일치하는 요청을 찾는다. 신선하든 오래됐든 일치하는 항목이 있으면 서버에 조건부 요청을 보낸다. 리소스가 변경되지 않았으면 캐시에서, 변경됐으면 서버에서 새로 받아 캐시를 업데이트한다. 일치하는 항목이 없으면 일반 요청을 보내고 캐시를 업데이트한다.
- force-cache - 브라우저가 HTTP 캐시에서 일치하는 요청을 찾는다. 신선하든 오래됐든 일치하는 항목이 있으면 캐시에서 반환한다. 일치하는 항목이 없으면 일반 요청을 보내고 캐시를 업데이트한다.

이 글에서는 `no-cache` 옵션을 사용했다. [이전 글][react-skeleton-image-link]의 이미지 재로딩 로직에서 에러가 발생한 경우 fetch() 함수 호출 코드를 추가한다.

```ts
export const loadImageWithRety = async (
  url: string,
  timeout: number = 1000,
  retry: number = 4,
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      // 이미지 로딩 실패 시 강제 재조회
      fetch(url, { cache: "no-cache" });
      setTimeout(() => {
        if (retry > 0) {
          loadImageWithRety(url, timeout, retry - 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error("over maximum retry"));
        }
      }, timeout);
    };
    image.src = url;
  });
};
```

이미지 로딩이 실패했을 때만 fetch() 함수를 통해 강제적으로 로딩을 수행한다. 이후 재귀적으로 Image 객체를 통해 이미지를 다시 로딩할 때 이전 onerror 콜백 함수에서 fetch() 함수를 통해 갱신된 캐시 정보를 사용한다. 

- 이전 fetch() 함수가 로딩에 성공했다면 캐싱된 이미지를 정상적으로 재사용한다.
- 이전 fetch() 함수가 로딩에 실패했다면 정상적인 이미지가 아니기 때문에 onerror 콜백 함수가 호출되고, 다시 fetch() 함수로 캐시를 갱신한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/safari-caching-issue-04.png" width="100%" class="image__border">
</div>

<br/>

위 로직을 적용하면 사파리에서도 정상적으로 이미지가 조회된다. 아래 이미지를 보면 이미지 로딩에 실패한 경우 fetch 함수를 호출해서 이미지를 다시 로딩한다. 

<div align="center">
  <img src="{{ site.image_url_2026 }}/safari-caching-issue-05.png" width="100%" class="image__border">
</div>

<br/>

이후 호출에서는 재조회 없이 정상적으로 캐싱된 이미지를 사용한다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/safari-caching-issue-06.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-04-10-safari-caching-issue>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control>
- <https://developer.mozilla.org/ko/docs/Web/HTTP/Guides/Caching>
- <https://developer.mozilla.org/ko/docs/Web/API/Window/fetch>
- <https://developer.mozilla.org/en-US/docs/Web/API/Request/cache>
- <https://httpwg.org/specs/rfc9111.html>
- <https://www.mnot.net/blog/2017/03/16/browser-caching>
- <https://www.raymondcamden.com/2015/07/16/safari-and-http-caching>
- <https://hacks.mozilla.org/2016/03/referrer-and-cache-control-apis-for-fetch/>
- <https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html#functions-event-structure-status-body>

[react-skeleton-image-link]: https://junhyunny.github.io/react/javascript/typescript/usability/react-skeleton-image/