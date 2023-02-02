---
title: "Git 파일 추적 제거하기"
search: false
category:
  - github
last_modified_at: 2021-09-04T12:59:00
---

<br/>

## 1. 배경

현재 맡고 있는 프로젝트가 막바지에 다다랐습니다. 
안정적인 시스템 운영을 위해서는 개발/운영 환경을 분리하여 관리해야 합니다. 
검증이 충분히 되지 않은 코드가 운영 서버에 배포되는 것은 정말 위험한 일입니다. 
만약 JPA를 사용한다면 ddl 설정에 따라 의도치 않은 스키마 변경이 일어나는 끔찍한 참사가 발생할 수도 있습니다. 

작은 규모의 시스템이기에 간단한 브랜치 전략을 운영하자고 제안하였습니다. 
- master: 시스템 배포를 위한 브랜치, 배포되는 자원에 대한 버전 관리 수행(Tag)
- dev: 다음 배포할 버전을 개발하는 브랜치, 버그 수정, 성능 개선 등의 이슈 해결 후 master 브랜치로 머징(merging)
- hotfix: 다음 버전이 배포되기까지 기다릴 수 없는 치명적인 장애 해결을 위한 브랜치, 해결 후 master, dev 브랜치로 머징(merging)
- release, feature 브랜치 운영 제외

<p align="center"><img src="/images/git-ignore-1.JPG" width="65%"></p>
<center>https://www.campingcoder.com/2018/04/how-to-use-git-flow/</center>

##### application.yml
`spring.profiles` 설정을 이용하여 개발/운영 환경을 다음과 같이 나누었습니다. 
- local: 개발 환경 및 어플리케이션 설정
- release: 시스템 배포 환경 및 어플리케이션 설정

```yml
server:
  port: 8080
  max-http-header-size: 10000000
spring:
  profiles:
    active: release # 기본 환경 선택, local
```

##### resources 디렉토리 구조

```
.
|-- META-INF
|   `-- MANIFEST.MF
|-- application-local.yml
|-- application-release.yml
|-- application.yml
```

설정 파일을 나누는 것까지는 좋았는데 다음이 문제였습니다. 
제 경험상 대부분은 개발자의 부주의함으로 인해 큰 문제가 발생합니다. 
개발자가 실수로 올린 application.yml 파일이 master 브랜치까지 전달되는 경우를 막고 싶었습니다. 
한가지 예를 들어보겠습니다. 

1. 개발자가 application.yml 파일의 설정을 `active: local` 로 변경하여 테스트 후 실수로 commit > push
1. master 브랜치까지 전달되어 시스템 배포
1. 시스템 장애 없이 일정 시간 운영, 테스트 용 데이터베이스에 데이터 저장
1. 시간이 흐른 뒤에 설정이 잘못 되었음을 인지하고, 데이터 백업(backup)

생각만해도 머리가 지끈지끈 아파옵니다. 
잘못된 데이터로 계산된 값들이 금전적 손해를 일으킬 수도 있습니다. 
이런 문제를 방지하고자 특정 파일들에 대해 git 추적 제외를 시도해보았습니다. 

## 2. .gitignore 파일 추가
`.gitignore` 파일에 추적에서 제외하고 싶은 파일들을 다음과 같이 추가하였습니다. 

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

# 설정 및 Config 추적 대상에서 제외할 파일
/src/main/resources/application.yml
/src/main/resources/application-local.yml
/src/main/resources/application-release.yml

```

설정을 추가하였음에도 불구하고 정상적으로 Git 추적 대상에서 제외되지는 않았습니다. 

## 3. Git 캐시 지우기
이미 추적되고 있는 파일들은 `.gitignore` 파일에 추가하여도 추적이 멈추지 않습니다. 
스테이지(stage)에 올라간 파일들은 캐시 처리가 되어 추적에 대한 기록이 남아있기 때문입니다. 
그렇다면 캐시를 지워보도록 하겠습니다. 

```
git rm --cached src/main/resources/application.yml
rm 'src/main/resources/application.yml'
```

여기서 또 다른 문제가 발생하였습니다. 
캐시를 지움으로써 Git 추적에서는 제외시킬 수 있지만, 원격 저장소에 있는 파일까지 삭제되어야 합니다. 
하마터면 설정 파일을 날려버릴 뻔했습니다.🥶

<p align="center"><img src="/images/git-ignore-2.JPG" width="75%"></p>

## 4. exclude 파일
제가 원하는 방법은 다음과 같습니다. 
- 개발자가 필요한 설정을 변경/적용할 수 있도록 application.yml 파일 삭제는 불가하고, 파일 변경 이력 관리는 필요
- 원격 레퍼지토리에서 관리되는 application.yml 파일은 원격 저장소 상에서만 관리
- 개발자 실수에 의해 변경되는 일이 없도록 Git 추적 대상에서는 제외

관련된 내용들을 찾아보니 프로젝트 폴더 `.git/info` 경로에 위치한 `exclude` 파일을 이용하면 특정 파일들에 대한 Git 추적을 로컬에서만 제외시킬 수 있다고 합니다. 
exclude 파일에 추적에서 제외하고 싶은 파일을 추가해보았습니다. 

```
vi .git/info/exlude
```

```
# git ls-files --others --exclude-from=.git/info/exclude
# Lines that start with '#' are comments.
# For a project mostly in C, the following would be a good set of
# exclude patterns (uncomment them if you want to use them):
# *.[oa]
# *~
application.yml
/src/main/resources/*
/src/main/resources/application.yml
../../src/main/resources/application.yml
```

exclude 파일에 여러 가지 방법으로 파일을 추가해봤지만 추적에서 제외되지는 않았습니다.  

## 5. git update-index 명령어
exclude 파일로 해결이 되지 않는 경우 git 명령어를 통해 수동으로 이를 제외시킬 수 있습니다. 
저 같은 경우 이 방법을 통해 해결하였습니다. 
`git update-index` 명령어를 통해 특정 파일의 변경 여부 감지를 on/off 할 수 있습니다. 

### 5.1. 제외 명령어
```
git update-index --assume-unchanged <파일명>
git update-index --assume-unchanged src/main/resources/application.yml
```

### 5.2. 제외 취소 명령어
```
git update-index --no-assume-unchanged src/main/resources/application.yml
```

## CLOSING
이전 직장에서는 CI/CD, 운영 환경 분리에 대한 고민과 작업을 다른 팀에서 해주었습니다. 
저는 큰 고민없이 가이드에 맞춰 개발, 운영, 관리하였습니다. 
스타트업에서 일 하다보니 전에는 신경쓰지 않았던 부분까지 고민하고 해결할 방법 찾아나가고 있습니다.

#### REFERENCE
- <https://www.campingcoder.com/2018/04/how-to-use-git-flow/>
- <https://gmlwjd9405.github.io/2018/05/17/git-delete-incorrect-files.html>
- <https://modipi.tistory.com/7>