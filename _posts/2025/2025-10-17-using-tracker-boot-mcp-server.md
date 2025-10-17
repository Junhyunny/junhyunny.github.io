---
title: "트래커 부트(tracker boot) MCP 서버로 프롬프트 컨텍스트 공유하기"
search: false
category:
  - tracker-boot
  - ai-agent
  - large-language-model
  - model-context-protocol
  - context-engineering
last_modified_at: 2025-10-16T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [바이브 코딩(vibe coding)을 통한 개발 프로세스 개선][improve-development-process-by-vibe-coding-link]
- [MCP(Model Context Protocol)와 MCP 서버-클라이언트][mcp-and-mcp-server-link]

## 0. 들어가면서

우리 팀은 고객들과 일할 때 `피보탈 트래커(pivotal tracker)`를 이슈 트래커로 사용했다. 나는 탄주 랩스일 때 합류했지만, [피보탈 랩스(pivotal labs)](https://en.wikipedia.org/wiki/Pivotal_Labs) 시절 직접 개발한 서비스를 여전히 사용 중이라는 사실이 멋지다고 생각했다. 필요한 도구는 우리가 스스로 개발한다는 정신에 감동한 것 같다.

VMWare가 브로드컴에 인수된 후 [피보탈 트래커 서비스가 종료](https://news.hada.io/topic?id=16846)됐다. 그래서 우리 팀의 프랙티스에 필요한 이슈 트래커인 [트래커 부트(tracker boot)](https://trackerboot.com/)를 직접 개발 및 메인테이닝(maintaining)하고 있다. 최근 [트래커 부트 MCP 서버](https://github.com/Bekind-Labs/tracker-boot-mcp-server?tab=readme-ov-file)가 릴리즈 됐다. AI 개발 팀을 서포트 할 떄 고민했던 부분을 트래커 MCP 서버를 사용하면 도움이 될 것 같아서 탐구한 내용들을 글로 정리했다.

MCP(model context protocol)나 MCP 서버에 대한 개념이 부족하다면, [이 글][mcp-and-mcp-server-link]을 먼저 읽어보길 바란다.

## 1. What is tracker boot?

[트래커 부트](https://trackerboot.com/)에 대한 설명이 먼저 필요할 것 같다. 트래커 부트는 지라(jira) 같은 일반적인 이슈 트래킹 도구는 아니다. [XP(extreme programming)](https://en.wikipedia.org/wiki/Extreme_programming) 애자일 방법론을 따라 프로덕트를 개발할 떄 필요한 사용자 스토리(user story)를 관리하는 도구다. 사용자 스토리는 XP 개발 사이클에서 기본적인 작업 단위를 의미한다. 사용자의 요구사항 또는 기능(feature)에 대한 내용이 작성되어 있다. PM(product manager)나 디자이너가 작성한 스토리들은 아이스 박스(ice box)에서 관리된다. 

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-01.png" width="100%" class="image__border">
</div>

<br/>

PM, 디자이너들이 작성한 스토리는 기술적 검증이나 개발에 착수할 수 있는 상태인지 등의 검토가 되지 않은 상태다. IPM(iteration planning meeting), Pre-IPM 같은 활동을 통해 스토리를 검증하고, 구현 복잡도를 고려해 스토리에 점수를 매긴다. 점수가 매겨진 사용자 스토리는 아이스 박스에서 백로그(backlog)으로 옮긴 후 개발에 착수한다.

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-02.png" width="100%" class="image__border">
</div>

<br/>

스토리 점수는 매 주 이터레이션이 끝나면 팀의 속도(velocity)를 측정할 떄 사용된다. 속도 외에도 프로젝트가 얼마나 건강한지 여부를 확인할 수 있는 지표들을 분석해서 제공한다.

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-03.png" width="100%" class="image__border">
</div>

## 2. Context management

최근 AI를 사용할 떄 "프롬프트 엔지니어링(prompt engineering)"에서 한 단계 발전한 "컨텍스트 엔지니어링(context engineering)"으로 논의가 전환되고 있다. 컨텍스트(context)란 단순한 프롬프트 문장이 아니라, LLM이 답변을 생성하기 전 볼 수 있는 모든 정보(지침, 대화이력, 장기 메모리, 외부 정보, 가용 도구 등)를 의미한다. 기존 "프롬프트 엔지니어링"이 단일 질문 또는 명령문 설계에 집중했다면, 컨텍스트 엔지니어링은 그보다 더 폭넓고 강력한 접근이다. 

에이전트 시스템에서 성공적으로 작동하는지 여부는 작업 메모리(working memory)에 어떤 정보가 포함될지에 의해 크게 좌우된다. 대부분의 에이전트 실패는 모델 문제가 아니라, 적절한 컨텍스트 부족에서 발생하기 때문이다. AI 에이전트가 효율적으로 일을 처리할 수 있는 컨텍스트를 구성하기 위해선 다음과 같은 정보들이 포함되어야 한다.

- 시스템 프롬프트/지침 - 모델의 행동을 정의하는 기본 지침과 예시, 규칙 등
- 유저 프롬프트 - 사용자의 즉각적인 요청이나 질문
- 상태/대화 히스토리 - 현재까지의 대화 흐름 및 맥락 정보
- 장기 기억 - 여러 단계를 거친 이전 대화, 사용자 선호도, 과거 프로젝트 요약, 모델이 장기적으로 기억하도록 학습된 정보 모음
- RAG(검색 기반 증강) - 외부 문서, 데이터베이스, API 등에서 가져온 최신의 관련성 높은 정보
- 사용 가능한 도구 - 모델이 호출할 수 있는 함수, 내장 툴들의 정의 (e.g. check_inventory, send_email 등)
- 구조화 된 출력 - 모델이 따라야 할 응답 형식 정의 (e.g.: JSON)

[이전 글][improve-development-process-by-vibe-coding-link]에서 이야기했지만, AI가 만드는 작업 결과물은 매우 크다. 한번에 많은 내용을 검토하는 일은 개발자의 피로도를 높이고, 놓치는 부분이 많아질 확률이 커진다. 한 번의 프롬프트(prompt)로 실행할 작업의 크기를 의미있는 결과를 얻을 수 있지만, 너무 크지 않도록 최대한 작게 분리헀다. 하나의 사용자 스토리를 개발한다면 여러 개의 프롬프트들을 실행한다. 

예를 들어, 사용자 스토리를 개발할 때 다음과 같은 태스크(task)들을 실행한다고 가정해보자. 각 태스크에 매칭되는 프롬프트 파일을 만들어 사용한다.

1. API 엔드포인트 스키마 정의 - design-api.prompt.md 파일 사용
2. 프론트엔드 테스트 - frontend-test.prompt.md 파일 사용
3. 프론트엔드 구현 - frontend-impl.prompt.md 파일 사용
4. 리팩토링 - frontend-refactoring.prompt.md 파일 사용

각 프롬프트가 실행될 때 이들은 서로 독립적이지 않다. 이전 프롬프트 결과물에 의존한다. 예를 들면, 프론트엔드 테스트 프롬프트는 테스트 코드를 작성한다. 프론트엔드 구현 프롬프트는 앞서 만들어진 실패하는 테스트들을 성공시키기 위한 구현 코드를 작성한다. 코파일럿(copilot)을 사용하는 경우 동일한 채팅 세션에선 이전 프롬프트에 대한 컨텍스트가 남아 있지만, 새로운 채팅 세션을 열어서 작업하는 경우 이전 작업에 대한 컨텍스트가 끊어진다. 이를 보완하기 위한 장치가 필요하다.

아이디어는 간단하다. 파일 시스템에 사용자 스토리에 대한 컨텍스트 파일을 만든다. 새로운 채팅 세션을 열어 사용하더라도 기존 작업에 대한 컨텍스트를 이어서 수행할 수 있다. 컨텍스트 파일에는 사용자 스토리를 개발할 때 수행해야 하는 태스크들에 대한 내용과 각 태스크를 수행했을 때 결과에 대한 로그가 남겨져 있다. 각 프롬프트는 이전 프롬프트들에서 어떤 작업을 수행했는지 참조한다. 

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-04.png" width="100%" class="image__border">
</div>

<br/>

컨텍스트 파일은 사용자 스토리 단위로 관리되며, `story-{id}.yaml` 이름의 파일로 저장된다. 해당 파일에는 다음과 같은 정보가 포함되어 있다.

- `tasks` 객체는 수행할 작업들에 대한 내용이다.
- `logs` 객체는 수행 완료한 작업들에 대한 내용이다.

```yaml
tasks:
  - task_number: 1
    area: 프론트엔드
    task_name: 로그인 페이지 컴포넌트 테스트 작성
    summary: 로그인 페이지의 React 컴포넌트 단위 테스트 작성. 화면 요소 존재 확인 및 폼 입력 기본 동작 테스트
  - task_number: 2
    area: 프론트엔드
    task_name: 로그인 페이지 컴포넌트 구현
    summary: Figma 디자인에 기반해 로그인 페이지의 React 컴포넌트를 구현하고, TailwindCSS로 스타일링
  - task_number: 3
    area: 프론트엔드
    task_name: 로그인 페이지 리팩토링
    summary: 코드 가독성과 유지보수성을 높이기 위한 리팩토링. 불필요한 코드 제거 및 성능 최적화

logs:
  1:
    modified_files:
      - frontend/tests/LoginPage.test.tsx
      - frontend/tests/setup.ts
      - frontend/vite.config.ts
    note:
      - "TDD Red 단계: 로그인 페이지 테스트 작성"
      - "컴포넌트 미구현으로 테스트 실패 예상"
      - "Vitest, React Testing Library 설정 추가"
  2:
    modified_files:
      - frontend/src/pages/LoginPage.tsx
    note:
      - "TDD Green 단계: 로그인 페이지 최소 구현"
      - "요구된 모든 UI 요소 렌더링 구현"
```

이제부터 파일 시스템에서 관리하는 위 컨텍스트 파일을 MCP 서버를 통해 트래커 부트에서 관리해보자.

## 3. Setting Tracker Boot MCP server

우선 MCP 서버 셋팅이 필요하다. 인텔리제이 코파일럿 플러그인을 기준으로 설명한다. VSCode에서 연결하고 싶다면, [이 글](https://junhyunny.github.io/ai/ai-agent/figma-mcp/mcp-server/copilot/prompt/using-figma-mcp-server/#21-vscode-copilot)을 참고하길 바란다. 

- 인텔리제이에서 `CMD + ,(comma)`을 단축키로 설정 화면을 연다. 
- 코파일럿 MCP 설정(configure) 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-05.png" width="80%" class="image__border">
</div>

<br/>

`mcp.json` 파일이 열린다. 해당 파일에 트래커 부트 MCP 서버 설정을 추가한다. MCP 서버를 도커 컨테이너 기반으로 제공하고 있다. MCP 서버를 설정하면 AI 에이전트에 의해 컨테이너가 실행 후 연결된다.

```json
{
  "servers": {
    "tracker-boot-mcp-server": {
      "type": "local",
      "tools": [
        "tb_get_story",
        "tb_get_current_iteration",
        "tb_get_story_tasks",
        "tb_create_comment",
        "tb_get_story_comments",
        "tb_create_task",
        "tb_create_story",
        "tb_update_task",
        "tb_update_story_title",
        "tb_update_story_description",
        "tb_update_story_status",
        "tb_get_projects"
      ],
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "TRACKER_BOOT_API_KEY",
        "public.ecr.aws/tracker-boot/mcp-server:latest"
      ],
      "env": {
        "TRACKER_BOOT_API_KEY": "{YOUR_TRACKER_BOOT_API_KEY}"
      }
    }
  }
}
```

`YOUR_TRACKER_BOOT_API_KEY` 변수는 트래커 부트에서 확인할 수 있다. 우측 상단에 이니셜 아이콘을 누르면 셋팅(setting) 페이지로 이동할 수 있는 창이 나온다.

<div align="left">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-06.png" width="40%" class="image__border">
</div>

<br/>

왼쪽 사이드에서 API 메뉴를 선택하면 내 계정에 연결된 API 키를 획득할 수 있다. API 키를 mcp.json 파일에 추가한다.

<div align="left">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-07.png" width="80%" class="image__border">
</div>

## 4. Tools of Tracker Boot MCP server

트래커 부트 MCP 서버는 다음과 같은 도구를 제공한다. 

| 도구 | 설명 | 매개변수 | 반환값 |
|------|------|----------|--------|
| tb_get_story | 스토리 상세 정보 조회 | storyId | 완전한 스토리 상세 정보 |
| tb_get_story_tasks | 스토리의 태스크 목록 조회 | storyId | 스토리 내 태스크 목록 (제목, 완료 여부) |
| tb_get_story_comments | 스토리의 댓글 목록 조회 | storyId | 스토리 내 댓글 목록 (내용) |
| tb_get_current_iteration | 스토리가 포함된 현재 이터레이션 조회 | projectId | 사이클 타임 상세 정보를 포함한 스토리 목록이 있는 이터레이션 데이터 |
| tb_create_story | 새로운 스토리 생성 | projectId,<br/>title,<br/>description(선택),<br/>storyType(선택) | 생성된 스토리의 상세 정보 |
| tb_update_story_title | 스토리 제목 수정 | storyId,<br/>title | 수정된 스토리의 상세 정보 |
| tb_update_story_description | 스토리 설명 수정 | storyId,<br/>description | 수정된 스토리의 상세 정보 |
| tb_update_story_status | 스토리 상태 수정 | storyId,<br/>status | 수정된 스토리의 상세 정보 |
| tb_create_task | 스토리에 새로운 태스크 생성 | storyId,<br/>title | 생성된 태스크의 상세 정보 |
| tb_update_task | 스토리의 태스크 수정 | taskId,<br/>storyId,<br/>finished,<br/>title (선택) | 수정된 태스크의 상세 정보 |
| tb_create_comment | 스토리에 새로운 댓글 생성 | storyId,<br/>content | 생성된 댓글의 상세 정보 |
| tb_get_projects | 프로젝트 목록 조회 | - | 사용자가 접근 가능한 프로젝트 목록 |

이번 예제에서 사용할 도구는 다음과 같다.

- tb_get_story - 스토리 상세 정보 조회
- tb_get_story_tasks - 스토리 태스크 목록 조회
- tb_get_story_comments - 스토리 댓글 목록 조회
- tb_update_task - 스토리 태스크 업데이트
- tb_create_comment - 스토리 댓글 생성

## 5. Write work histories on Tracker Boot via MCP server

지금부터 본격적으로 트래커 부트 MCP 서버를 사용해보자. 트래커 부트에 다음과 같은 스토리가 존재한다. 

```
### Why

**As personaName** 강준현은
**I want** 해야하는 일들을 효율적으로 관리하고 싶다.
**So that** TODO 애플리케이션을 사용한다.

### Acceptance Criteria

``gherkin
Scenario: 
Given 사용자가 TODO 애플리케이션에 접속했다.
When 사용자가 화면을 본다.
Then 다음과 같은 항목들이 있는 것을 볼 수 있다.
- "TODO 리스트" 텍스트 형식 타이틀 
- 입력 가능한 폼
  - 입력 박스(input type=text)
  - "추가" 버튼
``

``gherkin
Scenario: 
Given 사용자가 TODO 애플리케이션에 접속했다.
When 사용자가 입력 창에 TODO 항목을 입력 후 추가 버튼을 누른다.
Then 
- 입력 박스 하단에 보이는 리스트에 새로 입력한 TODO 항목이 추가된다.
- 입력 박스에 작성한 TODO 항목은 지워진다.
- 새로운 TODO 항목을 추가할 때마다 TODO 리스트 최상단에 추가된다.
- 새로 고침을 수행해도 사라지지 않는다.
``

**Notes:**
- 별도 서버 없이 로컬 스토리지(local storage)를 사용한다.
```

[이전 글][improve-development-process-by-vibe-coding-link]에서 다뤘던 것처럼 각 태스크를 위한 프롬프트 파일을 만들었다. 이번 예시에선 다음과 같은 프롬프트를 사용한다.

- generate-task.prompt.md - 태스크 생성
- frontend-test.prompt.md - 프론트엔드 테스트 작성
- frontend-impl.prompt.md - 프론트엔드 구현 코드 작성

### 5.1. Generate tasks

나는 사용자 스토리를 보고 어떤 작업들이 필요할지 고민 후 태스크에 작성한다. 이 부분을 AI 에이전트를 통해 자동화한다. 다음과 같은 프롬프트를 통해 태스크 분리 작업을 수행한다. 

```markdown
---
mode: agent
description: 사용자 스토리를 태스크로 분리하는 프롬프트
---

# 역할 설정

당신은 소프트웨어 개발 경험이 풍부한 테크 리드입니다. 애자일 개발 방법론에 정통하며, 유저 스토리를 개발자가 바로 착수할 수 있는 수준의 태스크로 분해하는 것을 잘합니다.

# 입력 정보

- STORY_ID(required) - 사용자 스토리 ID

# 지시사항

- 트래커 부트(tracker boot) MCP 서버에서 `STORY_ID`를 사용해 스토리 정보를 조회한다. `tb_get_story` 도구를 사용한다.
- 사용자 스토리를 기반으로 개발 태스크를 가능한 상세하게 분리한다. 태스크에 대한 설명은 60자 이내로 작성한다.
- 태스크는 **반드시** 다음과 같은 순서를 지켜 생성한다.
  1. API 설계
  2. 프론트엔드 화면 및 컴포넌트
  3. 프론트엔드 API 클라이언트
  4. 프론트엔드 화면 디자인
  5. 백엔드 엔드포인트
  6. 백엔드 서비스
  7. 백엔드 리포지토리
- 사용자 스토리를 보고 **API 호출이 불필요하다**고 판단한 경우, API 설계 관련 태스크를 생성하지 않는다.
- 사용자 스토리를 보고 **프론트엔드 작업이 불필요하다**고 판단한 경우, 프론트엔드 관련 태스크를 생성하지 않는다.
- 사용자 스토리를 보고 **백엔드 서버 작업이 불필요하다**고 판단한 경우, 백엔드 서버 관련 태스크를 생성하지 않는다.
- 사용자 스토리를 보고 **DB 작업이 불필요하다**고 판단한 경우, DB 관련 태스크를 생성하지 않는다.
- 태스크 분리 작업이 완료되면 트래커 부트 MCP 서버의 `tb_create_task` 도구를 사용해 태스크를 생성한다.

# 금지사항

- **중요** 다른 파일들은 편집하지 않는다.
- **중요** Figma 링크가 없는 경우, 디자인 관련 태스크를 생성하지 않는다.

# 후속 작업

태스크 분리가 완료되면 **반드시** 확인을 받는다. 확인을 받으면 트래커 부트 MCP 서버의 `tb_create_task` 도구를 사용해 태스크를 생성한다. 
사용자의 수정 사항이 있다면 이를 반영 후 태스크로 생성한다.
```

AI는 프롬프트의 내용을 이해하기 때문에 필요한 도구를 직접적으로 명시할 필요는 없다. AI는 도구 이름이 없더라도 스스로 판단 후 사용한다. 하지만, 매번 정확하게 동작하지 않기 때문에 프롬프트에 직접 명시하는 편이 사용하기 원할하다. 위 프롬프트를 실행하면 해당 스토리를 조회한다. 이후 해당 스토리를 구현할 때 필요한 태스크들을 정리 후 트래커 부트 서비스에 생성한다. 

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-08.gif" width="100%" class="image__border">
</div>

### 5.2. Write test codes

다음은 프론트엔드 테스트를 작성해보자. 다음과 같은 프롬프트를 실행한다. 태스크 생성과 마찬가지로 필요한 MCP 도구를 명시적으로 작성한다.

```markdown
---
mode: agent
description: 프론트엔드 테스트 코드를 작성하는 프롬프트
---

# 역할 설정

당신은 소프트웨어 개발 경험이 풍부한 테크 리드입니다. 테스트 주도 개발 방법론에 정통합니다.

# 입력 정보

- STORY_ID(required) - 사용자 스토리 ID

# 지시사항

- TDD(test driven development)의 `Red` 단계를 수행한다. 구현이 아닌 테스트 코드만 작성한다. 단, 테스트 대상(system under test)가 없는 경우 컴파일 에러가 발생하므로, 빈 함수 혹은 컴포넌트를 생성하는 것까지는 허가한다.
- 트래커 부트(tracker boot) MCP 서버에서 `tb_get_story` 도구를 사용해 스토리 정보를 조회한다.
- 트래커 부트 MCP 서버에서 `tb_get_story_tasks` 도구를 사용해 태스크 목록을 가져온다. 완료되지 않은 태스크 중 **첫번쨰 태스크만 실행**한다. 해당 태스크를 실행하기 전에 반드시 확인을 받는다.
- 트래커 부트 MCP 서버에서 `tb_get_story_comments` 도구를 사용해 코멘트 목록을 가져온다. 코멘트는 이전에 작업한 정보에 대한 정보이므로 이를 참고한다.
- 수행할 태스크를 만족하는 **최소한**의 테스트만 작성한다. 
- 기본적으로 테스트에서 사용하는 라이브러리는 다음과 같다. 패키지가 설치되어 있지 않다면 이를 설치한다. 다른 라이브러리가 필요하다면 사용자에게 반드시 확인을 받은 후 설치한다. 
  - vitest
  - @testing-library/user-event
  - @testing-library/react
- `tests/**` 하위에 테스트 파일들을 생성한다. 해당 디렉토리가 없다면 이를 생성한다.
- 테스트 코드 작성이 완료되면 반드시 전체 테스트를 수행한다.

# 금지사항

- 테스트 대상을 **절대** 구현하지 않는다.
- 테스트 코드를 작성하는 단계이므로 `tb_update_task` 도구를 **절대** 수행하지 않는다.

# 후속 작업

테스트 작성이 모두 완료되면 사용자에게 작업 내용 업데이트 완료 여부를 확인한다.
트래커 부트 MCP 서버의 `tb_create_comment` 도구를 사용해 현재 작업한 내용을 요약 후 생성한다. 
아래 항목들 외에 다른 정보는 **추가하지 않는다**. 코드 내용은 **절대** 포함시키지 않는다.
- 변경된 파일 리스트(생성, 수정, 삭제)
- 100자 이내로 요약된 작업 내용
```

테스트 코드를 작성하기 전에 스토리 정보, 현재 완료되지 않은 태스크 리스트, 코멘트 리스트를 조회한다. 스토리의 승인 기준(acceptance criteria)나 코멘트에 작성된 이전 활동(activity) 리스트는 AI 에이전트를 위한 컨텍스트가 된다.

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-09.gif" width="100%" class="image__border">
</div>

<br/>

모든 테스트 코드 구현이 완료되면 작업 내용을 요약하여 트래커 부트 서버에 업데이트한다.

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-10.gif" width="100%" class="image__border">
</div>

### 5.3. Implement codes

마지막으로 프론트엔드 구현을 작성해보자. 다음과 같은 프롬프트를 실행한다.

```markdown
---
mode: agent
description: 프론트엔드 구현 코드를 작성하는 프롬프트
---

# 역할 설정

당신은 소프트웨어 개발 경험이 풍부한 테크 리드입니다. 테스트 주도 개발 방법론에 정통합니다.

# 입력 정보

- STORY_ID(required) - 사용자 스토리 ID

# 지시사항

- TDD(test driven development)의 `Green` 단계를 수행한다. 구현 코드를 작성한다.
- 트래커 부트(tracker boot) MCP 서버에서 `STORY_ID`를 사용해 스토리 정보를 조회한다. `tb_get_story` 도구를 사용한다.
- 트래커 부트 MCP 서버에서 `tb_get_story_tasks` 도구를 사용해 태스크 목록을 가져온다. 완료되지 않은 태스크 중 **첫번쨰 태스크만 실행**한다. 해당 태스크를 실행하기 전에 반드시 확인을 받는다.
- 트래커 부트 MCP 서버에서 `tb_get_story_comments` 도구를 사용해 코멘트 목록을 가져온다. 코멘트는 이전에 작업한 정보에 대한 정보이므로 이를 참고한다.
- 테스트 코드에 문제가 있는 것으로 판단된다면, 프롬프트 실행을 멈추고 사용자에게 확인을 요청한다.
- 테스트를 통과할 수 있는 **최소한**의 구현만 수행한다. 리팩토링, 최적화, 설계 변경 등은 하지 않는다.
- `tests/**` 하위에 테스트 파일들을 생성한다. 해당 디렉토리가 없다면 이를 설치한다.

# 금지사항

- 테스트 코드를 **절대** 수정하지 않는다.

# 후속 작업

구현 코드 작성이 완료되면 반드시 전체 테스트를 수행한다. 
실패한 테스트를 통과시키기 위한 조치를 수행한다.
코드 구현이 모두 완료되면 사용자에게 작업 내용 업데이트 완료 여부를 확인한다.
트래커 부트 MCP 서버의 `tb_update_task` 도구를 사용해 해당 태스크를 **완료**로 표시한다.
트래커 부트 MCP 서버의 `tb_create_comment` 도구를 사용해 현재 작업한 내용을 요약 후 생성한다.
아래 항목들 외에 다른 정보는 **추가하지 않는다**. 코드 내용은 **절대** 포함시키지 않는다.
- 변경된 파일 리스트(생성, 수정, 삭제)
- 100자 이내로 요약된 작업 내용
```

테스트 프롬프트와 동일하게 스토리 정보, 현재 완료되지 않은 태스크 리스트, 코멘트 리스트를 조회한다. 이전 활동(activity)에 작성된 테스트 코드 작성 내용이 구현 코드를 작성할 때 필요한 컨텍스트가 된다.

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-11.gif" width="100%" class="image__border">
</div>

<br/>

리팩토링 수행 여부는 선택적이므로 구현 코드가 완료되면 해당 태스크를 완료시킨다. 작업한 내용을 요약하여 트래커 부트 코멘트에 생성한다.

<div align="center">
  <img src="/images/posts/2025/using-tracker-boot-mcp-server-12.gif" width="100%" class="image__border">
</div>

## CLOSING

지난 팀을 서포트하면서 처음으로 유료 AI 에이전트를 사용해 바이브 코딩(vibe coding)을 해봤다. AI 도구라곤 무료 ChatGPT 정도만 사용해 본 나로썬 매우 흥미로웠다. AI는 분명 대단한 발전이고 세상을 바꿀 힘이 있다고 생각한다. 다만, 아직까지 모든 개발 업무를 AI에게 맡기기엔 부족한 면이 많다는 인상을 받았다. 그래도 작은 단위의 작업들은 꽤 잘하는 편이기 때문에 이런 부분들을 맡겨도 좋을 것 같다.

트래커 부트 MCP 서버와 AI 도구를 사용하면, 트래커 부트 서비스를 중심으로 프로젝트에 참여하는 PM, 디자이너, 개발자들의 협업이나 워크플로우를 개선할 여지가 있을 것 같다는 생각이 들었다. 종종 아이디어가 떠오르면 글로 정리해야곘다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-10-17-using-tracker-boot-mcp-server>

#### REFERENCE

- <https://trackerboot.com/>
- <https://github.com/Bekind-Labs/tracker-boot-mcp-server>
- <https://en.wikipedia.org/wiki/Pivotal_Labs>
- <https://news.hada.io/topic?id=16846>
- <https://news.hada.io/topic?id=21752>

[improve-development-process-by-vibe-coding-link]: https://junhyunny.github.io/ai/ai-agent/copilot/prompt/improve-development-process-by-vibe-coding/
[mcp-and-mcp-server-link]: https://junhyunny.github.io/ai/ai-agent/model-context-protocol/mcp-server/mcp-client/mcp-and-mcp-server/