---
title: "CORS(Cross Origin Resource Sharing) 문제"
search: false
category: 
  - main project
  - side project
  - information
last_modified_at: 2021-01-14T00:00:00
---

# CORS(Cross Origin Resource Sharing) 문제<br>

최근 개발 추세인 SPA(Single Page Application) 개발시 자주 발생하는 문제입니다. 
웹 어플리케이션에서 외부 서버의 경로로 AJAX 요청시 브라우저에서 에러를 내는 현상입니다. 
[이전에 사용하던 블로그에 정리한 내용][before-blogLink]이 있지만 다시금 정리해보도록 하겠습니다. 
우선 CORS 문제를 살펴보기 전에 동일 출처 정책(Same-Origin Policy)에 대해서 알아보도록 하겠습니다.

## 동일 출처 정책 (Same-Origin Policy)

> 동일 출처 정책(same-origin policy)은 어떤 출처에서 불러온 문서나 스크립트가 다른 출처에서 가져온 리소스와 상호작용하는 것을 제한하는 중요한 보안 방식입니다. 
> 동일 출처 정책은 잠재적으로 해로울 수 있는 문서를 분리함으로써 공격받을 수 있는 경로를 줄여줍니다. -MDN Web Docs

두 URL의 **프로토콜, 호스트, 포트**가 모두 같아야 동일한 출처라고 말할 수 있습니다. 
아래 이미지처럼 **http://domain-a.con/** 에서 **http://domain-a.con/** 서버로의 요청은 same-origin, **http://domain-b.con/** 서버로의 요청은 cross-origin 입니다. 
same-origin 서버로의 요청은 정상적인 응답을 받을 수 있지만 cross-origin 서버로의 요청은 응답받는 헤더 정보에 따라 정상적이거나 아닐 수 있습니다. 

<p align="center"><img src="/images/cors-problem-1.JPG" width="450"></p>
<center>이미지 출처, https://developer.mozilla.org/ko/docs/Web/HTTP/CORS</center><br>

아래 표는 웹 어플리케이션이 http://store.company.com (기본 포트, 80) 프로토콜, 호스트, 포트 정보를 가질 때 요청 성공 여부입니다.

| URL | 결과 | 이유 |
|---|:---:|:---|
| http://store.company.com/dir2/other.html | 성공 | 경로만 다름 |
| http://store.company.com/dir/inner/another.html | 성공 | 경로만 다름 |
| https://store.company.com/secure.html | 실패 | 프로토콜 다름 |
| http://store.company.com:81/dir/etc.html | 실패 | 포트 다름 (http://는 80이 기본값) |
| http://news.company.com/dir/other.html | 실패 | 호스트 다름 |

## 교차 출처 자원 공유 (CORS, Cross Origin Resource Sharing)

> 교차 출처 리소스 공유(Cross-Origin Resource Sharing, CORS)는 추가 HTTP 헤더를 사용하여, 
> 한 출처에서 실행 중인 웹 애플리케이션이 다른 출처의 선택한 자원에 접근할 수 있는 권한을 부여하도록 브라우저에 알려주는 체제입니다. -MDN Web Docs

동일 출처 정책에 대한 불편함을 해결하기 위해 등장한 정책입니다. 
웹 브라우저에서 외부 도메인 서버와 통신하기 위한 방식을 표준화한 스펙입니다. 
API를 사용하는 웹 어플리케이션은 자신의 추철와 동일한 리소스만 불러올 수 있으며, **다른 출처의 리소스를 불러오려면 그 출처에서 올바른 CORS 헤더를 포함한 응답을 반환받아야 합니다.** 
아래 CORS 작동 방식을 통해 조금 더 자세히 알아보도록 하겠습니다. 

## CORS 작동 방식
### 단순 요청 (Simple requests)
일부 요청은 CORS preflight 트리거를 수행하지 않습니다. 
이런 단순 요청은 아래 조건들을 만족해야 합니다.<br>
(일부만 정리하였으며 구체적인 내용은 [MDN Web Docs - CORS][cors-webDocsLink])
- 메소드
  - GET
  - HEAD
  - POST
- 허용되는 Content-Type 헤더
  - application/x-www-form-urlencoded
  - multipart/form-data
  - text/plain
- 유저 에이전트가 자동으로 설정한 헤더 외에 허용되는 헤더
  - Accept
  - Accept-Language
  - Content-Language
  - Content-Type
  - DPR
  - Downlink
  - Save-Data
  - Viewport-Width
  - Width

- https://foo.example 도메인의 웹 컨텐츠가 https://bar.other 도메인의 컨텐츠를 단순 호출
  - 클라이언트와 서버간에 간단한 통신을 하고, CORS 헤더를 사용하여 권한을 처리합니다.
  - 응답 헤더로 __Access-Control-Allow-Origin: *__ 를 전달받는데 이는 모든 도메인에서 접근할 수 있음을 의미합니다.
  - 특정 도메인의 요청만 허용하려면 **Access-Control-Allow-Origin: https://foo.example** 와 같은 방식의 응답 헤더가 필요합니다.

<p align="center"><img src="/images/cors-problem-2.JPG" width="450"></p>
<center>이미지 출처, https://developer.mozilla.org/ko/docs/Web/HTTP/CORS</center><br>

- 단순 요청
> GET /resources/public-data/ HTTP/1.1<br>
> Host: bar.other<br>
> User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:71.0) Gecko/20100101 Firefox/71.0<br>
> Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8<br>
> Accept-Language: en-us,en;q=0.5<br>
> Accept-Encoding: gzip,deflate<br>
> Connection: keep-alive<br>
> Origin: https://foo.example<br>

- 단순 요청에 대한 응답
> HTTP/1.1 200 OK<br>
> Date: Mon, 01 Dec 2008 00:23:53 GMT<br>
> Server: Apache/2<br>
> __Access-Control-Allow-Origin: *__<br>
> Keep-Alive: timeout=2, max=100<br>
> Connection: Keep-Alive<br>
> Transfer-Encoding: chunked<br>
> Content-Type: application/xml<br>
> <br>
> […XML Data…]<br>

### 프리플라이트 요청 (Preflight requests)
단순 요청과 달리 먼저 OPTIONS 메소드를 통해 다른 도메인의 리소스로 HTTP 요청을 보내 실제 요청이 전송하기에 안전한지 확인하는 방법입니다. 
cross-site 요청은 유저 데이터에 영향을 줄 수 있기 때문에 미리 전송(preflighted)합니다.

- https://foo.example 도메인의 웹 컨텐츠가 https://bar.other 도메인의 컨텐츠를 프리플라이트 호출
  - Preflight 요청을 전송합니다.(Preflight request)
  - 이에 대한 응답을 받은 후 실제 요청을 전달합니다.(Main request)
  - Preflight 요청을 보면 다음과 같은 정보를 확인할 수 있습니다.
    - Access-Control-Request-Method: POST (실제 요청에서 사용할 메소드)
    - Access-Control-Request-Headers: X-PINGOTHER, Content-Type (실제 요청에서 사용할 헤더 정보)
  - Preflight 응답을 보면 다음과 같은 정보를 확인할 수 있습니다.
    - Access-Control-Allow-Origin: https://foo.example (https://foo.example 도메인의 요청만 허용)
    - Access-Control-Allow-Methods: POST, GET, OPTIONS (허용되는 메소드)
    - Access-Control-Allow-Headers: X-PINGOTHER, Content-Type (허용되는 헤더 정보)
    - Access-Control-Max-Age: 86400 (preflight 요청 결과를 캐시할 수 있는 시간)
  
<p align="center"><img src="/images/cors-problem-3.JPG" width="450"></p>
<center>이미지 출처, https://developer.mozilla.org/ko/docs/Web/HTTP/CORS</center><br>

- Preflight 요청
> OPTIONS /resources/post-here/ HTTP/1.1<br>
> Host: bar.other<br>
> User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:71.0) Gecko/20100101 Firefox/71.0<br>
> Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8<br>
> Accept-Language: en-us,en;q=0.5<br>
> Accept-Encoding: gzip,deflate<br>
> Connection: keep-alive<br>
> Origin: http://foo.example<br>
> __Access-Control-Request-Method: POST__<br>
> __Access-Control-Request-Headers: X-PINGOTHER, Content-Type__<br>

- Preflight 응답
> HTTP/1.1 204 No Content<br>
> Date: Mon, 01 Dec 2008 01:15:39 GMT<br>
> Server: Apache/2<br>
> __Access-Control-Allow-Origin: https://foo.example__<br>
> __Access-Control-Allow-Methods: POST, GET, OPTIONS__<br>
> __Access-Control-Allow-Headers: X-PINGOTHER, Content-Type__<br>
> __Access-Control-Max-Age: 86400__<br>
> Vary: Accept-Encoding, Origin<br>
> Keep-Alive: timeout=2, max=100<br>
> Connection: Keep-Alive<br>

## OPINION
[이전 블로그에서 작성한 글][before-blogLink]보다 내용이 더 구체적이 되었습니다. 
예전에는 눈에 보이지 않던 내용들이 지금은 정리할 수 있는 것을 보니 조금은 성장한 듯 합니다. 
다음은 이 CORS 개념을 예제 프로젝트를 통해 실습, 정리해보도록 하겠습니다.

#### 참조글
- <https://brunch.co.kr/@adrenalinee31/1>
- <https://developer.mozilla.org/ko/docs/Web/Security/Same-origin_policy>
- <https://developer.mozilla.org/ko/docs/Web/HTTP/CORS>

[cors-webDocsLink]: https://developer.mozilla.org/ko/docs/Web/HTTP/CORS
[before-blogLink]: https://junhyunny.blogspot.com/2020/01/cors-cross-origin-resource-sharing.html