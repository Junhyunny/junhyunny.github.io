---
title: "Github commit 메세지 규칙"
search: false
category:
  - information
  - git
last_modified_at: 2021-04-17T00:00:00
---

<br>

얼마 전까지만 해도 저에게 Github는 사이드 프로젝트 혹은 블로그 글을 작성해 올리는 혼자만의 공간이었습니다. 
그렇다보니 commit 메세지도 제 멋대로 올리고 있었습니다. 
사실 혼자 작업을 하다보니 commit 메세지 읽을 사람도 없고, 귀찮기도 했습니다. 

##### 최근 내 commit 메세지들
<p align="center"><img src="/images/github-commit-message-rule-1.JPG" width="80%"></p>

하지만 최근에 회사를 관두고, 친구가 새롭게 시작한 사업을 돕게 되면서 Github을 이용한 협업이 필요하게 되었습니다. 
회사의 형상 관리를 TortoiseSVN에서 Github로 변경하자는 의견을 내었고, 원할한 협업을 위한 commit 메세지 규칙을 정하자고 제안하습니다. 
다른 개발자들과 공유하기 위해 commit 메세지 규칙에 대한 포스트를 작성해보았습니다.  

## Github commit 메세지 규칙의 필요성
일단 commit 메세지 규칙의 필요성에 대해 공감이 이루어져야 잘 지켜질 것 같아서 규칙의 필요성을 정리해보았습니다. 
- 팀원과의 소통
- 편리한 과거의 기록 추적
- Footer에 관련된 이슈를 함꼐 작성하면서 이슈 관리가 가능

## Commit 메세지 작성 요령
대부분 공통된 특징들이 존재했고, 이를 바탕으로 저희 팀이 사용할 메세지 규칙을 지정하였습니다. 
영어로 작성하는 편이 좋지만 영어와 친하지 않은 사람은 단어를 찾는라 시간이 오래 걸릴테니 메세지는 대부분 한글로 작성키로 하였습니다. 

```
타입(Type): 제목(Subject)

본문(Body)

꼬리말(Footer)
```

### 타입(Type)
- Feat - 새로운 기능에 대한 commit
- Fix - 버그 수정에 대한 commit
- Build - 빌드 관련 파일 수정에 대한 commit
- Chore - 그 외 자잘한 수정에 대한 commit
- Ci - CI관련 설정 수정에 대한 commit
- Docs - 문서 수정에 대한 commit
- Style - 코드 스타일 혹은 포맷 등에 관한 commit
- Refactor -  코드 리팩토링에 대한 commit
- Test - 테스트 코드 수정에 대한 commit

### 제목(Subject)
- 제목은 50자를 넘기지 않고, 마침표를 붙이지 않습니다.
- 제목에는 commit 타입을 함께 작성합니다.
- 과거 시제를 사용하지 않고 명령조로 작성합니다.
- 제목과 본문은 한 줄 띄워 분리합니다.
- 제목의 첫 글자는 반드시 대문자로 씁니다.
- 제목이나 본문에 이슈 번호(가 있다면) 붙여야 합니다.

##### 타입(Type) - 제목(Subject) 예시
```
Feat: 신규 RFID 인식 기능 추가
```

### 본문(Body)
- 선택 사항이기에 모든 commit에 본문 내용을 작성할 필요는 없습니다.
- 한 줄에 72자를 넘기면 안 됩니다.
- 어떻게(How)보다 무엇을, 왜(What, Why)에 맞춰 작성합니다.
- 설명뿐만 아니라, commit의 이유를 작성할 때에도 씁니다.

```
신규 RFID 기능 인식 기능 추가
  - RFIDReader.java: 사용자 요건 사항으로 인한 RFID 인식 기능 추가
```

### 꼬리말(Footer)
- 선택 사항이므로 모든 commit에 꼬리말을 작성할 필요는 없습니다.
- Issue tracker ID를 작성할 때 사용합니다.
- 해결: 이슈 해결 시 사용
- 관련: 해당 commit에 관련된 이슈 번호
- 참고: 참고할 이슈가 있는 경우 사용

```
해결: #123
관련: #321
참고: #222
```

##### 작성할 Commit 메세지 예시

```
Feat: 신규 RFID 인식 기능 추가(#123)

신규 RFID 기능 인식 기능 추가
  - RFIDReader.java: 사용자 요건 사항으로 인한 RFID 인식 기능 추가

해결: #123
```

## Tip, Commit 메세지로 이슈 자동 종료시키는 방법
Github는 commit 메세지에 영어를 작성할 때 예약된 키워드를 사용하면 이슈가 자동으로 종료되는 기능을 탑재하고 있습니다. 
예약어는 commit 메세지 어느 위치에서나 사용 가능합니다. 

##### 키워드를 이용한 이슈 종료 방법
```
키워드 #이슈번호
```

### 사용되는 키워드
- close
- closes
- closed
- fix
- fixes
- fixed
- resolve
- resolves
- resolved

사용되는 키워드 별로 성격에 맞춰서 사용하면 됩니다. 
close 계열은 일반 개발 이슈, fix 계열은 버그 픽스나 핫 픽스 이슈, resolve 계열은 문의나 요청 사항에 대응한 이슈에 사용하면 적당합니다. 

##### 이슈 종료 예시
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

위 처럼 commit 메세지를 작성하여 push하면 브랜치에 따라 이슈가 자동으로 종료됩니다. 

예를 들어, Github 저장소의 default branch가 master인 case
- master 브랜치에 commit 후 push - 해당 번호의 이슈 종료
- child 브랜치에 commit 후 push - child 브랜치가 master 브랜치로 merge 하는 시점에 이슈 종료

## OPINION
전 회사는 Bitbucket을 사용하기는 했지만, commit 메세지를 규칙에 맞춰서 작성하진 않았습니다. 
생각해보면 다음과 같은 이유들이 있었던 것 같습니다.
- 최근 추세에 맞는 개발 문화가 정착되어 있지 않습니다. 
- 최근 소스 코드 형상 관리 방식이 Bitbucket으로 바뀌면서 이에 맞는 규칙을 별도로 지정하지 않습니다. 

이전 팀원들과 이런 규칙을 적용하기 위한 노력을 하지 않아 아쉬움이 남습니다. 
앞으로 함께 일하는 동료들과는 Commit 메세지를 규칙에 작성하는 습관을 들이도록 하겠습니다. 

#### REFERENCE
- <https://tttsss77.tistory.com/58>
- <https://meetup.toast.com/posts/106>
- <https://chris.beams.io/posts/git-commit/>
- <https://doublesprogramming.tistory.com/256>