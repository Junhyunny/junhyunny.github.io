---
title: "Use git-remote-codecommit for AWS CodeCommit"
search: false
category:
  - aws
last_modified_at: 2024-08-23T23:55:00
---

<br/>

## 1. GRC(Git Remote CodeCommit) in AWS CodeCommit

CodeCommit은 AWS에서 호스팅하는 코드 버전 관리 서비스다. 깃허브(github)나 깃랩(gitlab)처럼 소스 코드의 형상 관리나 병합 서비스를 제공한다. CodeCommit도 소스 코드를 클론(clone)하는 방법은 HTTPS, SSH 두 가지를 기본적으로 제공한다. 이 두 가지 방법은 IAM 사용자를 사용해 자격 증명이나 공개 키를 등록하는 작업이 필요하다. 

필자는 SSO 사용자로 PowerUser 권한밖에 없기 때문에 IAM 사용자를 등록하고 필요한 권한을 주는 것이 불가능하다. 이런 권한 문제가 있다면 `GRC(Git Remote CodeCommit)`을 사용하는 것이 편리하다. GRC를 사용하면 임시 보안 인증 정보를 사용하여 CodeCommit 레포지토리에 접근할 수 있다. 

- `HTTPS(GRC)`를 사용한다.

<div align="center">
  <img src="/images/posts/2024/grc-for-aws-code-commit-01.png" width="100%" class="image__border">
</div>

## 2. Install git-remote-codecommit

`git-remote-codecommit` 도구를 설치하면 HTTPS(GRC) 프로토콜을 사용할 수 있다. `git-remote-codecommit`을 먼저 설치한다. `pip`을 통해 설치하는 방법도 있지만, 맥북을 사용하는 경우 `brew`를 사용하면 쉽게 설치할 수 있다.

```
$ brew install git-remote-codecommit
```

클라이언트 액세스(access)를 위해 임시로 획득한 환경 변수를 터미널 세션에 준비한다.

- 액세스 아이디, 시크릿, 토큰을 환경 변수에 등록한다.

```
$ export AWS_ACCESS_KEY_ID=ABCDEFGHIJKLEMNOPQRSTUVWXYZ
$ export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLEMNOPQRSTUVWXYZ/1234567890/BCDE
$ export AWS_SESSION_TOKEN=ABCDEFG ... 1234567890
```

나머지는 깃(git)을 사용하는 것과 동일하지만, 리모트(remote) 주소가 다음과 `codecommit::region://repository-name` 같은 형태를 갖는다. 

```
$ git clone codecommit::ap-northeast-1://repository-name

Cloning into 'repository-name'...
remote: Counting objects: 9377, done.
Receiving objects: 100% (9377/9377), 15.54 MiB | 1.77 MiB/s, done.
Resolving deltas: 100% (5770/5770), done.
```

#### REFERENCE

- <https://docs.aws.amazon.com/ko_kr/codecommit/latest/userguide/setting-up-git-remote-codecommit.html>
- <https://waspro.tistory.com/780>
- <https://honglab.tistory.com/193>
