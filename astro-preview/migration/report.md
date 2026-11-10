# 콘텐츠 변환 보고서

`npm run migrate`가 생성한다. 직접 수정하지 않는다.

## 요약

| 항목 | 값 |
| --- | --- |
| 기술 글 | 525편 |
| 회고 | 16편 |
| 독서 기록 | 10편 |
| 운영 사이트맵 대조 | 525개 경로 중 누락 0건, 초과 0건 |
| 경로 충돌 | 0건 |
| 추천 글이 있는 글 | 333편 |
| 원본 묶음 SHA-256 | `235b48152be3b5337db4e4da8ecc3109b01a2eef2a821a6f8163a4cc067ba6b4` |

## 확인 항목

### 추천 섹션을 원문에 남김 (확인 필요) (3)

- `_posts/2021/2021-05-10-transactional-propagation-type.md:13` `RECOMMEND POSTS BEFORE THIS` 섹션을 원문에 남겼습니다: 15행 항목이 링크 하나로 이루어지지 않았습니다.
- `_posts/2021/2021-05-10-transactional-propagation-type.md:1351` `RECOMMEND NEXT POSTS` 섹션을 원문에 남겼습니다: 1353행 항목이 링크 하나로 이루어지지 않았습니다.
- `_posts/2023/2023-06-03-introduction-terraform.md:388` `RECOMMEND NEXT POSTS` 섹션을 원문에 남겼습니다: 390행 항목이 링크 하나로 이루어지지 않았습니다.

### 기준 경로 목록에 없는 내부 링크 (6)

- `_posts/2021/2021-04-09-side-project-slack-chatbot.md` 기준 경로 목록에 없는 내부 링크: python-slack-chatbot-blog-link
- `_posts/2021/2021-12-23-how-to-test-react-redux-thunk.md` 기준 경로 목록에 없는 내부 링크: https://junhyunny.github.io/spring-boot/spring-security/react/jest/test-driven-development/split-login-authorization-resource-service-front-end/
- `_posts/2022/2022-03-05-android-webview.md` 기준 경로 목록에 없는 내부 링크: https://junhyunny.github.io/로
- `_posts/2022/2022-11-25-calculate-number-in-java.md` 기준 경로 목록에 없는 내부 링크: https:/taejunejoung.github.io/2019/12/24/java-primitive/
- `_logs/2023/2023-01-01-life-log-20230101.md` 기준 경로 목록에 없는 내부 링크: https://junhyunny.github.io/book/extreme-programming-explained/
- `_logs/2025/2025-01-01-life-log-20250101.md` 기준 경로 목록에 없는 내부 링크: https://junhyunny.github.io/books/

### 변환하지 못한 Liquid 구문 (0)

없음

### Jekyll과 렌더링이 달라지는 코드 안 Liquid 표기 (3)

- `_posts/2025/2025-05-21-aws-sam-cli.md` Jekyll은 코드 안의 `{{stack-name}}`도 Liquid로 처리했지만 새 사이트는 원문 그대로 표시합니다.
- `_posts/2025/2025-05-21-aws-sam-cli.md` Jekyll은 코드 안의 `{{stack-name}}`도 Liquid로 처리했지만 새 사이트는 원문 그대로 표시합니다.
- `_posts/2025/2025-05-24-integrate-event-bridge-and-lambda-with-aws-sam.md` Jekyll은 코드 안의 `{{stack-name}}`도 Liquid로 처리했지만 새 사이트는 원문 그대로 표시합니다.

### Jekyll 회피용으로 띄어 쓴 중괄호가 있는 코드 (19)

- `_posts/2021/2021-01-15-cors-example.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2021/2021-01-20-multipartfile.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2021/2021-08-30-multipartfile-in-dto.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2021/2021-09-12-spring-boot-vue-js-paging-table.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2021/2021-11-16-vue-js-korean-length.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2021/2021-11-24-vue-js-computed-with-parameter.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2021/2021-12-18-react-debounce-test-with-jest.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2022/2022-03-19-warn-using-user-event-type-in-wait-for.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2022/2022-04-14-how-to-test-intersection-observer.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2022/2022-08-06-do-not-use-arrow-function-as-methods-in-vue-js.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2023/2023-10-29-authentication-router-in-react.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2024/2024-02-23-github-actions-example.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2024/2024-02-29-optimize-github-actions.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2024/2024-08-30-custom-action-in-github-actions.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2026/2026-01-23-record-video-web-camera.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2026/2026-02-11-using-mock-service-worker-with-orval.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2026/2026-02-13-react-query-optimistic-update.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2026/2026-03-06-cve-2026-25639.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.
- `_posts/2026/2026-04-08-react-skeleton-image.md` Jekyll 충돌을 피하려고 띄어 쓴 중괄호(`{ {`, `{ %`)가 코드에 있습니다. 원문을 유지했으며 작성자 확인이 필요합니다.

### 지원하지 않는 코드 언어 표기 (31)

- `_posts/2021/2021-04-11-mvc-pattern.md:184` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2021/2021-09-16-mobile-device-detect.md:351` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2021/2021-09-16-mobile-device-detect.md:369` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-02-02-jenkins-deploy-ec2-using-docker.md:228` 지원하지 않는 코드 언어 표기 `s`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-02-03-jenkins-slack-notification.md:115` 지원하지 않는 코드 언어 표기 `s`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-04-23-open-session-in-view.md:329` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-04-docker-file-expose-instruction.md:58` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-08-reflected-cross-site-scripting.md:73` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-08-reflected-cross-site-scripting.md:145` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-08-reflected-cross-site-scripting.md:298` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-08-reflected-cross-site-scripting.md:315` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-14-stored-cross-site-scripting.md:69` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-14-stored-cross-site-scripting.md:128` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-14-stored-cross-site-scripting.md:266` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-05-16-dom-based-cross-site-scripting.md:63` 지원하지 않는 코드 언어 표기 `jsp`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-09-30-docker-network.md:400` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2022/2022-09-30-react-env-variable-setting.md:362` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-02-21-replication-in-redis.md:475` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-02-21-replication-in-redis.md:483` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-02-23-failover-using-sentinel-for-redis.md:471` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-02-23-failover-using-sentinel-for-redis.md:479` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-03-20-compression-on-nginx.md:46` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-03-20-compression-on-nginx.md:83` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-03-21-cache-control-on-nginx.md:90` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-03-21-cache-control-on-nginx.md:111` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-03-25-adapt-temporal-certificate-on-nginx.md:114` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-05-10-using-nginx-as-reverse-proxy.md:110` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2023/2023-08-23-flyway-cli-for-database-migration.md:199` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2024/2024-01-16-mqtt-subscriber-spring-boot.md:82` 지원하지 않는 코드 언어 표기 `conf`는 일반 텍스트로 표시됩니다.
- `_posts/2025/2025-03-22-aws-elasticache-valkey-and-spring.md:55` 지원하지 않는 코드 언어 표기 `gradle`는 일반 텍스트로 표시됩니다.
- `_posts/2025/2025-10-03-ms-aad-login-thread-lock-problem.md:178` 지원하지 않는 코드 언어 표기 `gradle`는 일반 텍스트로 표시됩니다.

### 옮기지 않은 frontmatter 필드 (0)

없음

### 제거한 빈 추천 섹션 (1)

- `_posts/2023/2023-09-21-sequence-key-update-with-cursor-in-mysql.md:12` 빈 `RECOMMEND POSTS BEFORE THIS` 섹션을 제거했습니다.
