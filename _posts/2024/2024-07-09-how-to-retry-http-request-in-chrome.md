---
title: "How to retry HTTP request in Chrome"
search: false
category:
  - information
last_modified_at: 2024-07-09T23:55:00
---

<br/>

## 0. 들어가면서

24년 5월 다른 팀의 [애플(apple) OAuth2 클라이언트 기능 개발](https://junhyunny.github.io/spring-boot/spring-security/spring-security-oauth2-client-for-apple/)을 해줬다. 애플은 보안 정책 때문에 OAuth2 인증 과정에서 `http://localhost:port`를 지원하지 않는다. 이 문제 때문에 디버깅이 어려웠는 데 브라우저가 제공하는 HTTP 요청 재시도 기능 덕분에 어렵게나마 원인 분석과 문제 해결이 가능했다. 이번 글은 실패한 HTTP 요청을 재시도하는 방법에 대해 정리했다. 

## 1. HTTP Request copy in Network

크롬(chrome)을 기준으로 설명한다. 개발자 도구의 네트워크 탭을 보면 HTTP 요청 리스트를 확인할 수 있다. 해당 리스트에서 재시도 할 요청을 찾는다. 

1. 재시도하고 싶은 HTTP 요청을 오른쪽 클릭한다. 
2. copy 항목 중 원하는 재요청 방식을 선택한다.

<div align="center">
  <img src="/images/posts/2024/how-to-retry-http-request-in-chrome-01.png" width="80%" class="image__border">
</div>

## 2. Copy as cURL

애플에서 돌아온 리다이렉트(redirect) 요청은 여러 가지 정보를 담고 있다. 자세한 정보가 궁금하다면 이 [링크](https://junhyunny.github.io/spring-boot/spring-security/spring-security-oauth2-client-for-apple/#1-problem-context)를 참고하길 바란다.

- state 정보
- code 정보
- user 정보

디버깅을 위해 HTTP 요청을 직접 만들기엔 너무 많은 데이터가 필요했다. 필자는 크롬의 HTTP 요청 재시도 옵션들 중 `Copy as cURL`을 선택했다. 이를 선택하면 실패한 요청과 동일한 cURL 명령어를 만들어준다. 복사된 cURL 명령어의 몇 가지 정보를 추가, 변경 후 사용한다. 

- cURL 요청과 응답 상세 정보를 확인하기 위해 -v 옵션을 추가한다.
- 리다이렉트 경로를 http://localhost:800 주소로 변경한다.
- 로컬 호스트의 세션이 필요하다면 쿠키를 함께 전달한다.

```
$ curl 'http://localhost:8080/login/oauth2/code/apple' \
  -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'accept-language: ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7' \
  -H 'cache-control: max-age=0' \
  -H 'content-type: application/x-www-form-urlencoded' \
  -H 'origin: https://appleid.apple.com' \
  -H 'priority: u=0, i' \
  -H 'referer: https://appleid.apple.com/' \
  -H 'sec-ch-ua: "Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  -H 'sec-fetch-dest: document' \
  -H 'sec-fetch-mode: navigate' \
  -H 'sec-fetch-site: cross-site' \
  -H 'sec-fetch-user: ?1' \
  -H 'upgrade-insecure-requests: 1' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' \
  -v \
  --cookie "JSESSIONID=EA6D38A407702D2677F0DAF8E53753FD" \
  --data-raw 'state=Ta81PM2VxBDD9f820uAjZKTBjMRaTqZhe164QxBfxsc%3D&code=c906ba23a983f4ede905b1624b6715d64.0.pyxv.UVlxGVi0jhbvl5Sp5d1z_Q&user=%7B%22name%22%3A%7B%22firstName%22%3A%22%EC%A4%80%ED%98%84%22%2C%22lastName%22%3A%22%EA%B0%95%22%7D%2C%22email%22%3A%22kang3966%40naver.com%22%7D'
```

## CLOSING

외부 서버로부터 오는 리다이렉트 요청은 개발자가 핸들링 할 수 없다. 이는 문제 분석과 해결을 어렵게 만들지만, 이번에 새로운 디버깅 수단을 배울 수 있어서 좋았다.

[spring-security-oauth2-client-for-apple-link]: https://junhyunny.github.io/spring-boot/spring-security/spring-security-oauth2-client-for-apple/