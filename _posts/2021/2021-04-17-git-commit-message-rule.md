---
title: "Github Commit Message Rules"
search: false
category:
  - information
  - github
last_modified_at: 2021-08-27T09:00:00
---

<br/>

## 0. 들어가면서

얼마 전까지 깃허브(github)는 간단한 프로젝트 코드나 블로그 글을 작성하는 혼자만의 공간이었습니다. 
그렇다보니 커밋(commit) 메세지에 대한 내용을 신경쓰질 않았는데, 최근 친구와 함께 일하게 되면서 커밋 메세지 통일에 대한 필요성을 느끼게 되었습니다. 
같이 일할 때 커밋 메세지에 신경을 쓰지 않으니 다음과 같은 문제점이 있었습니다. 

* 서로 무슨 작업을 했는지 한 눈에 보이지 않는다.
* 상대방이 작업한 내용을 위해 코드를 반드시 읽어봐야 한다. 

이번 포스트에선 팀원들끼리 커밋 메세지를 통일하기 위한 가이드 라인을  정리하였습니다. 
사람마다 메세지가 완벽하게 일치할 필요는 없지만, 통일성 있게 작성하여 메세지만으로 무슨 작업을 진행했는지 확인할 수 있도록 작성하는 것이 중요합니다. 

##### My Recent Commit Messages

<p align="center">
    <img src="/images/github-commit-message-rule-1.JPG" width="80%" class="image__border">
</p>

## 1. Importance of Commit Message Rules

커밋 메세지를 작성할 때 규칙이 필요한 이유는 다음과 같습니다.

* 팀원과의 소통
* 편리한 과거의 기록 추적
* 이슈(issue) 관리

## 2. Formats for Commit Messages

커밋 메세지를 작성할 때 필요한 내용들을 하나씩 정리해보겠습니다. 
전체적인 포맷은 다음과 같습니다.

```
타입(Type): 제목(Subject)

본문(Body)

꼬리말(Footer)
```

### 2.1. Type

해당 커밋은 무엇에 대한 작업인지 키워드를 통해 표시합니다.

* Feat - 새로운 기능 추가
* Fix - 버그 수정
* Build - 빌드 관련 파일 수정
* Ci - CI관련 설정 수정
* Docs - 문서(문서 추가, 수정, 삭제)
* Style - 스타일(코드 형식, 세미콜론 추가: 비즈니스 로직에 변경 없는 경우)
* Refactor -  코드 리팩토링
* Test - 테스트(테스트 코드 추가, 수정, 삭제: 비즈니스 로직에 변경 없는 경우)
* Chore - 기타 변경사항(빌드 스크립트 수정 등)

### 2.2. Subject

커밋 메세지의 제목입니다.

* 제목은 50자를 넘기지 않고, 마침표를 붙이지 않습니다.
* 제목에 커밋 타입을 함께 작성합니다.
* 과거 시제를 사용하지 않고 명령조로 작성합니다.
* 제목과 본문은 한 줄 띄워 분리합니다.
* 제목의 첫 글자는 반드시 대문자로 씁니다.
* 이슈에 관련된 내용이라면 이슈 번호를 붙힙니다.

##### Example of Subject

```
Feat: 신규 RFID 인식 기능 추가
```

### 2.3. Body

커밋 메세지의 본문입니다.

* 선택 사항이므로 모든 커밋에 작성할 필요는 없습니다.
* 한 줄에 72자를 넘기면 안 됩니다.
* 어떻게(how)보다 무엇(what), 왜(why)에 집중하여 내용을 작성합니다.
* 설명뿐만 아니라 커밋의 이유를 작성할 때도 작성합니다.

##### Example of Body

```
신규 RFID 기능 인식 기능 추가
  - RFIDReader.java: 사용자 요건 사항으로 인한 RFID 인식 기능 추가
```

### 2.4. Footer

커밋 메세지의 맺음말입니다.

* 선택 사항이므로 모든 커밋에 작성할 필요는 없습니다.
* 이슈를 추적하기 위한 ID를 추가할 때 사용합니다.
    * 해결 - 해결한 이슈 ID
    * 관련 - 해당 커밋에 관련된 이슈 ID
    * 참고 - 참고할만한 이슈 ID

##### Example of Footer

```
해결: #123
관련: #321
참고: #222
```

##### Exmample of Full Commmit Message

```
Feat: 신규 RFID 인식 기능 추가(#123)

신규 RFID 기능 인식 기능 추가
  - RFIDReader.java: 사용자 요건 사항으로 인한 RFID 인식 기능 추가

해결: #123
```

## 3. Tips

깃허브는 커밋 메세지를 영어로 작성할 때 예약된 키워드가 있다면 특정 기능이 동작합니다. 
커밋 메세지를 사용해 등록된 이슈를 자동으로 종료하는 방법이 있습니다. 
예약된 키워드는 커밋 메세지 어디에 위치해도 동작합니다.

##### How to complete issues with keyword?

사용되는 키워드는 다음과 같습니다. 
키워드와 함께 이슈 번호를 함께 작성합니다.

* close
* closes
* closed
* fix
* fixes
* fixed
* resolve
* resolves
* resolved

##### Example of Close Issue with Keyword

* 아래 메세지로 커밋 후 브랜치에 푸시(push)하면 이슈가 자동으로 종료됩니다.
* 이슈 종료는 커밋하는 브랜치에 따라 조금 다르게 동작합니다. 
* 만약 디폴트 브랜치가 `master`이라고 가정해보겠습니다.
    * `master` 브랜치에서 커밋 후 원격 서버로 푸시하면 해당 이슈가 종료됩니다.
    * `other` 브랜치에서 커밋하면 추후 원격 서버의 `master` 브랜치에 머징(merging)될 때 이슈가 종료됩니다.

```
# 제목에 이슈 한 개 닫기를 적용한 사례
Close #31 - refactoring wrap-up

* This is wrap-up of refactoring main code.
* main.c
  * removed old comments
  * fixed rest indentations
  * method extraction at line no. 35


# 본문에 이슈 여러 개 닫기를 적용한 사례
Update policy 16/04/02

* This closes #128 - cab policy, closes #129 - new hostname, and fixes #78 - bug on logging.
* cablist.txt: changed ACL due to policy update delivered via email on 16/04/02, @mr.parkyou
* hostname.properties: cab hostname is updated
* BeautifulDeveloper.java: logging problem on line no. 78 is fixed. The `if` statement is never happening. This deletes the `if` block.
```

#### REFERENCE

* <https://tttsss77.tistory.com/58>
* <https://meetup.toast.com/posts/106>
* <https://chris.beams.io/posts/git-commit/>
* <https://doublesprogramming.tistory.com/256>
* <https://junwoo45.github.io/2020-02-06-commit_template/>