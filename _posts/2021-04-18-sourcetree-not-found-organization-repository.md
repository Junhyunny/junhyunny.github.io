---
title: "Sourcetree - not found organization repository"
search: false
category:
  - information
  - git
last_modified_at: 2021-04-18T00:00:00
---

<br>

얼마 전까지만 해도 터미널을 이용해 git을 사용하곤 했습니다. 
굳이 무거운 어플리케이션을 설치할 필요가 없다고 생각했는데, 
이번 [Github commit 메세지 규칙][commit-message-rule-blogLink] 포스트를 작성하면서 이 참에 Sourcetree를 사용해보자고 생각했습니다. 
터미널에서 commit 메세지를 길게 작성하는 일은 당연히 불편할테니까요. 
Sourcetree 설치 후 Github의 repository들을 클론(clone)하던 중 일부 문제가 발생되었습니다. 

##### '유효한 소스 경로 URL이 아닙니다.' 경고 메세지
<p align="center"><img src="/images/grant-sourcetree-app-1.JPG" width="50%"></p>

**`'음...?🤔 분명히 존재하는 repository 인데?'`** 
일단 해당 URL을 찾지 못하는 점이 이상했습니다. 
개인 repository 들은 정상적으로 탐색이 되는걸로 미루어볼 때 organization에 소속된 repository라는 점이 마음에 걸렸습니다. 
관련된 내용을 찾아보던 중 우연히 해당 이슈를 해결할 수 있었습니다. 

## 문제 원인과 해결 과정
Sourcetree 어플리케이션을 이용해 organization 접근 시 해당 organization에 대한 접근 승인이 되지 않았기 때문입니다. 
해결 방법을 정리한 후 Github 초보인 팀원들에게 이를 공유해줄 필요가 있어 보입니다. 

간략하게 정리하면 다음과 같은 순서로 진행됩니다. 
1. User Settings
1. Applications > Authorized OAuth Apps
1. SourcetreeForWindows(or Mac)
1. target oranization grant

##### Settings > Applications > Authorized OAuth Apps
<p align="center"><img src="/images/grant-sourcetree-app-2.JPG" width="80%"></p>

##### SourcetreeForWindows
- 이미지 아래 빨간 네모 칸에 grant 버튼을 눌러 승인하기
<p align="center"><img src="/images/grant-sourcetree-app-3.JPG" width="50%"></p>

##### 정상적인 동작 확인
<p align="center"><img src="/images/grant-sourcetree-app-4.JPG" width="50%"></p>

## OPINION
이전 회사에선 CI/CD 팀에서 이런 이슈들을 처리해줬기 때문에 쉽게 사용했었는데, 
스타트업에서 이런 부분들까지 하나씩 맞춰나가다보니 다소 시간이 허비되는 중입니다. 
대기업의 R&R에 맞춰 일하는 방식은 개인의 개발 역량을 제한한다는 느낌을 많이 받았는데, 
스타트업에서 하나, 둘 씩 체계를 정립해나가다보니 바쁘지만 많을 것을 배우고 성장하고 있다고 생각됩니다. 

#### REFERENCE
- <https://junhyunny.github.io/information/git/git-commit-message-rule/>
 
 [commit-message-rule-blogLink]: https://junhyunny.github.io/information/git/git-commit-message-rule/