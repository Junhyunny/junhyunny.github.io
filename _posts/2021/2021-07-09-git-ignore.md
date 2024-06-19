---
title: "Stop file tracking in Git"
search: false
category:
  - github
last_modified_at: 2021-09-04T12:59:00
---

<br/>

## 0. 들어가면서

현재 프로젝트를 마무리하고 있다. 안정적인 시스템 운영을 위해 환경 설정 파일을 분리했다. 이들 중 어떤 설정 파일은 깃(git)으로 관리가 필요하지만, 어떤 파일은 추적이 필요하지 않았다. 필자는 다음 요건에 맞게 application.yml 파일을 관리하고 싶었다.  

- 원격 레포지토리에서 application.yml 파일을 관리한다.
- application.yml 파일에 대한 필요한 변경 사항은 추적 관리가 필요하다.
- 개발자의 로컬 컴퓨터에서 application.yml 파일을 임시 변경한 경우 실수로 업로드하는 상황을 막고 싶다.

이 글은 로컬 컴퓨터에서 임시로 변경한 내용을 원격 레포지토리로 업로드하는 것을 어떻게 방지할 수 있는지에 대해 정리했다.

## 1. .gitignore File

추적에서 제외하고 싶은 경우 `.gitignore` 파일을 사용할 수 있다. 변경 추적을 제외하고 싶은 파일은 `.gitignore`에 추가한다. 

```
HELP.md
target/
/target/
**/target
out/
/out/
**/out
bin/
/bin/
**/bin
!.mvn/wrapper/maven-wrapper.jar

# 추적 대상에서 제외할 파일
/src/main/resources/application.yml
```

이미 추적 관리 중인 파일은 .gitignore 파일에 추가하더라도 추적 대상에서 제외되지 않는다. 필자는 application.yml 파일을 이미 추적을 관리하고 있었기 때문에 이 방법은 사용할 수 없었다.

## 2. Remove Git Cache

스테이지(stage)에 올라간 파일은 캐싱(caching) 되어 있기 때문이다. 캐시를 지우면 깃 추적 대상에서 제외할 수 있다.

```
$ git rm --cached src/main/resources/application.yml
rm 'src/main/resources/application.yml'
```

추적 대상에서 제외하는 경우 원격 레포지토리에 있는 application.yml 파일이 삭제되기 때문에 문제가 될 수 있다. 필자의 경우 원격 레포지토리에 위치한 application.yml 파일을 삭제하면 안 되기 때문에 이 방법은 사용할 수 없었다.

<div align="center">
  <img src="/images/posts/2021/git-ignore-01.png" width="80%" class="image__border">
</div>

## 3. Git Command for update-index

필자는 원격 레포지토리에 application.yml 파일이 존재하지만, 개발자의 로컬 컴퓨터에서 임시로 변경한 설정이 실수로 원격 레포지토리에 업로드 되는 것을 방지하고 싶었다. 프로젝트 `.git/info` 경로에 위치한 `exclude` 파일을 사용하면 특정 파일에 대한 추적을 로컬 컴퓨터에서만 제외할 수 있다는 글들이 있지만, 필자의 경우 정상적으로 동작하지 않았다.

`git update-index` 명령어를 사용하면 특정 파일에 대한 변경 감지를 선택적으로 수행할 수 있다. 명령어는 다음과 같다.

- 변경 감지 대상에서 제외한다.

```
$ git update-index --assume-unchanged src/main/resources/application.yml
```

- 변경 감지 대상에 제외한 것을 취소한다.

```
$ git update-index --no-assume-unchanged src/main/resources/application.yml
```

변경 감지 대상에서 제외하면 개발자 로컬 컴퓨터에서 임시로 변경한 내용이 추적되지 않으므로 원격 레포지토리로 업로드 되지 않는다. 필요한 변경이 있는 경우 변경 감지 대상에서 제외한 것을 취소하면 된다.

#### REFERENCE

- <https://www.campingcoder.com/2018/04/how-to-use-git-flow/>
- <https://gmlwjd9405.github.io/2018/05/17/git-delete-incorrect-files.html>
- <https://modipi.tistory.com/7>