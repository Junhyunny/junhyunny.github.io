---
title: "Github MCP 서버를 통한 풀 리퀘스트(pull request) 워크플로우"
search: false
category:
  - github
  - github-mcp
  - playwright
  - playwright-mcp
  - ai-agent
  - large-language-model
  - model-context-protocol
  - context-engineering
last_modified_at: 2025-11-16T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [MCP(Model Context Protocol)와 MCP 서버-클라이언트][mcp-and-mcp-server-link]
- [Playwright MCP 서버를 통한 E2E 테스트 워크플로우][using-playwright-mcp-link]

## 1. Github MCP server

MCP(model context protocol)에 대한 개념이 부족하다면 [이 글][mcp-and-mcp-server-link]을 참고하길 바란다. Github MCP 서버는 AI 도구(예: AI 에이전트, 어시스턴트, 챗봇)를 GitHub 플랫폼에 직접 연결해준다. 가장 큰 특징은 사용자가 자연어를 통해 GitHub의 다양한 기능과 상호작용할 수 있게 해준다는 점이다. 공식 문서를 보면 다음과 같은 유즈 케이스를 소개하고 있다.

- 저장소 관리
  - 코드 저장소를 탐색하고 코드를 검색한다.
  - 파일을 찾고, 커밋 내역을 분석하며, 프로젝트 구조를 파악한다.
- 이슈 및 PR 자동화
  - 이슈(Issue)와 풀 리퀘스트(Pull Request)를 생성, 업데이트, 관리한다.
  - AI가 버그를 분류하거나 코드 변경 사항을 검토하는 데 도움을 줍니다.
- CI/CD 및 워크플로우 인텔리전스
  - GitHub Actions 워크플로우 실행 상태를 모니터링한다.
  - 빌드 실패 원인을 분석하고, 릴리스 관리를 돕습니다.
- 코드 분석
  - 보안 취약점(security findings)이나 디펜다봇(Dependabot) 알림을 검토한다.
  - 코드베이스의 전반적인 패턴과 상태에 대한 통찰력을 제공한다.
- 팀 협업
  - 팀 토론(Discussions)에 접근하고 알림을 관리한다.
  - 팀 활동을 분석하여 프로세스를 간소화한다.

다음과 같은 도구 세트들을 제공한다.

| Toolset | Description |
|---------|-------------|
| context | Strongly recommended: Tools that provide context about the current user and GitHub context you are operating in |
| actions | GitHub Actions workflows and CI/CD operations |
| code_security | Code security related tools, such as GitHub Code Scanning |
| dependabot | Dependabot tools |
| discussions | GitHub Discussions related tools |
| experiments | Experimental features that are not considered stable yet |
| gists | GitHub Gist related tools |
| git | GitHub Git API related tools for low-level Git operations |
| issues | GitHub Issues related tools |
| labels | GitHub Labels related tools |
| notifications | GitHub Notifications related tools |
| orgs | GitHub Organization related tools |
| projects | GitHub Projects related tools |
| pull_requests | GitHub Pull Request related tools |
| repos | GitHub Repository related tools |
| secret_protection | Secret protection related tools, such as GitHub Secret Scanning |
| security_advisories | Security advisories related tools |
| stargazers | GitHub Stargazers related tools |
| users | GitHub User related tools |

도구 세트이기 때문에 각 세트마다 다양한 도구들을 제공한다. 예를 들어 `pull_requests` 도구 세트와 `repos` 도구 세트는 다음과 같은 도구들을 제공한다.

| Toolset | Tool | Description |
|---------|------|-----------|
| pull_requests | add_comment_to_pending_review | Add review comment to the requester's latest pending pull request review |
| pull_requests | create_pull_request | Open new pull request |
| pull_requests | list_pull_requests | List pull requests |
| pull_requests | merge_pull_request | Merge pull request |
| pull_requests | pull_request_read | Get details for a single pull request |
| pull_requests | pull_request_review_write | Write operations (create, submit, delete) on pull request reviews |
| pull_requests | request_copilot_review | Request Copilot review |
| pull_requests | search_pull_requests | Search pull requests |
| pull_requests | update_pull_request | Edit pull request |
| pull_requests | update_pull_request_branch | Update pull request branch |
| repos | create_branch | Create branch |
| repos | create_or_update_file | Create or update file |
| repos | create_repository | Create repository |
| repos | delete_file | Delete file |
| repos | fork_repository | Fork repository |
| repos | get_commit | Get commit details |
| repos | get_file_contents | Get file or directory contents |
| repos | get_latest_release | Get latest release |
| repos | get_release_by_tag | Get a release by tag name |
| repos | get_tag | Get tag details |
| repos | list_branches | List branches |
| repos | list_commits | List commits |
| repos | list_releases | List releases |
| repos | list_tags | List tags |
| repos | push_files | Push files to repository |
| repos | search_code | Search code |
| repos | search_repositories | Search repositories |

## 2. Test user journey workflow for non-developer with Github MCP server

[이전 글][using-playwright-mcp-link]에서 본 것처럼 AI 에이전트를 사용하면 사용자 플로우에 대한 테스트를 자동화 할 수 있는 E2E 테스트 코드를 작성해준다. AI 에이전트가 E2E 테스트 코드를 작성하는 일은 개발자에게도 도움이 되지만, PM이나 디자이너 같은 비개발자 직군인 사람들도 자동화 된 테스트를 구축하는 것에 기여할 수 있도록 도움을 준다.

AI 에이전트를 통해 E2E 테스트를 일회성으로만 실행하고 버리기엔 아쉽기 때문에 테스트 코드로 작성하는 것이 좋다. 테스트 코드를 작성했을 때 장점은 자동화 된 CI/CD 파이프라인을 통해 매번 실행될 수 있다는 것이다. [이전 글][using-playwright-mcp-link]에서 살펴본 것처럼 테스트 코드는 AI 에이전트를 통해 작성할 수 있다. 다만 개발자는 코드를 리뷰하고 Github 같은 원격 코드 저장소의 메인 브랜치에 직접 변경 사항을 적용할 수 있지만, 비개발자 직군들에게 너무 어려운 일이다. 비개발자 직군도 Github MCP 서버와 AI 에이전트를 사용한다면 작성한 E2E 테스트 코드를 Github에 업로드 할 수 있다.

1. AI 에이전트는 트래커 부트에 작성된 사용자 스토리를 기반으로 테스트 시나리오를 작성한다.
2. AI 에이전트는 자신이 작성한 시나리오를 기반으로 E2E 테스트를 수행한다.
3. AI 에이전트는 테스트가 성공하면 시나리오를 기반으로 E2E 테스트 코드를 만들어 원격 코드 저장소에 풀 리퀘스트를 생성한다.

<div align="center">
  <img src="/images/posts/2025/using-github-mcp-server-01.png" width="100%" class="image__border">
</div>

## 3. Run github pull request workflow

지금부터 AI 에이전트를 통해 E2E 테스트를 수행하자. AI 에이전트는 코파일럿을 사용한다. 인텔리제이에 MCP 서버를 설정하는 방법은 [이 글](https://junhyunny.github.io/tracker-boot/ai-agent/large-language-model/model-context-protocol/context-engineering/using-tracker-boot-mcp-server/#3-setting-tracker-boot-mcp-server)을 참조하길 바란다. mcp.json 파일에 다음과 같이 MCP 서버들을 등록하면 된다. 이번 예제에선 다음과 같은 MCP 서버들을 사용한다.

- 트래커 부트(tracker boot)
- Playwright
- Github

```json
{
  "servers": {
    "tracker-boot-mcp-server": {
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
        "TRACKER_BOOT_API_KEY": "{YOUR_TRACKER_BOOT_API_TOKEN}"
      }
    },
    "github": {
      "url": "https://api.githubcopilot.com/mcp/",
      "requestInit": {
        "headers": {
          "Authorization": "Bearer {YOUR_GITHUB_TOKEN}"
        }
      }
    },
    "playwright-mcp-server": {
      "command": "npx",
      "args": [
        "@playwright/mcp@latest"
      ]
    }
  }
}
```

트래커 부트 MCP 서버를 위해 필요한 API 키는 [트래커 부트(tracker boot) MCP 서버로 프롬프트 컨텍스트 공유하기 글](https://junhyunny.github.io/tracker-boot/ai-agent/large-language-model/model-context-protocol/context-engineering/using-tracker-boot-mcp-server/)을 참조하길 바란다. Github 토큰은 사용자 셋팅(setting) 페이지에서 생성할 수 있다. 프로파일 이미지를 클릭하면 셋팅 페이지로 이동하는 버튼을 볼 수 있다.

<div align="left">
  <img src="/images/posts/2025/using-github-mcp-server-02.png" width="30%" class="image__border">
</div>

<br/>

왼쪽 사이드 메뉴 하단의 Developer Settings 페이지로 이동한다.

<div align="left">
  <img src="/images/posts/2025/using-github-mcp-server-03.png" width="50%" class="image__border">
</div>

<br/>

클래식 토큰을 선택 후 해당 화면에서 필요한 토큰을 생성한다. 나는 해당 토큰에 `repo`, `user` 권한을 부여했다.

<div align="center">
  <img src="/images/posts/2025/using-github-mcp-server-04.png" width="100%" class="image__border">
</div>

<br/>

[이전 글](https://junhyunny.github.io/ai/ai-agent/copilot/prompt/improve-development-process-by-vibe-coding/)에서 설명했듯이 코파일럿은 프롬프트를 파일로 작성해서 재사용할 수 있다. `.github/propmtps` 경로에 아래와 같은 `user-journey-test.prompt.md` 프롬프트 파일을 만들었다. 비개발자 직군은 코파일럿이 아니라 클로드 데스크탑 같은 도구를 사용한다. 당연히 프로젝트 코드가 로컬 디렉토리가 존재하지 않기 때문에 코드는 원격 서버에 직접 생성하는 편이 좋다고 생각한다. 이에 관련된 프롬프트를 작성한다.

- 프로젝트 내 코드를 직접 생성하거나 수정하지 않도록 금지사항을 지정한다.
- E2E 테스트가 성공하면 특정 브랜치에 테스트 코드를 푸쉬(push)하고 풀 리퀘스트(pull request)를 만들도록 후속 작업을 지정한다.

```
---
mode: agent
description: E2E 테스트를 수행하는 프롬프트
---

# 역할 설정

당신은 소프트웨어 개발 경험이 풍부한 테크 리드입니다. E2E 테스트 코드를 작성하여 테스트를 자동화하는 것에 익숙합니다.

# 입력 정보

- STORY_ID(required) - 사용자 스토리 ID
- REPOSITORY(required) - Pull Request GitHub 저장소 이름

# 지시사항

- 트래커 부트(tracker boot) MCP 서버에서 `STORY_ID`를 사용해 스토리 정보를 조회한다. `tb_get_story` 도구를 사용한다.
- 사용자 스토리를 읽고, 인수 기준(acceptance criteria)를 통과시킬 수 있는 사용자 테스트 시나리오를 도출한다. 작은 단계로 테스트를 분리하지 않고 전체 사용자 여정을 포괄하는 시나리오를 작성한다.
- 사용자 테스트 시나리오는 사용자의 액션을 기준으로 순차적으로 작성하되, 사용자가 이를 인식할 수 있도록 숫자를 앞에 표기한다.
- 테스트 시나리오가 작성되면 이를 사용자에게 확인 받는다. 프롬프트 실행을 임시 중단한다.
- 사용자 시나리오에 대한 승인을 받으면 Playwright MCP 서버의 도구(tools)를 사용해 브라우저를 제어하면서 E2E 테스트를 수행한다.
- E2E 테스트가 완료되면 결과를 사용자에게 보고한다. 테스트가 실패한 경우, 실패한 테스트 케이스와 그 원인을 상세히 설명한다.

# 금지사항

- 프로젝트에 구현/테스트 코드를 **절대** 직접 생성하지 않는다. PR을 통해 원격 코드 저장소에 직접 생성한다.
- 프로젝트의 구현/테스트 코드를 **절대** 수정하지 않는다.

# 후속 작업

테스트 시나리오에 대한 E2E 테스트 코드를 생성 후 Github `REPOSITORY`의 `e2e/{story-id}` 브랜치(branch)에 push 한다.
push 후 main 브랜치로 pull request를 요청한다.
테스트 파일 이름은 `{story-id}.spec.ts` 형식을 따른다.
테스트 코드는 `e2e/**` 경로 하위에 존재한다. 현재 프로젝트 경로에서 `e2e/**` 경로에 테스트 코드가 없다면, 원격 레포지토리의 `e2e/**` 경로를 참조한다.
```

위에서 작성한 프롬프트를 실행한다. E2E 테스트를 수행할 사용자 스토리와 테스트가 통과했을 때 풀 리퀘스트를 만들기 위한 저장소 이름을 파라미터로 추가한다.

```
/user-journey-test

STORY_ID=#200010919
REPOSITORY=Junhyunny/playwright-mcp-e2e-workflow
```

AI 에이전트는 트래커 부트에 작성된 사용자 스토리를 바탕으로 E2E 테스트를 수행한다. E2E 테스트가 성공하면 테스트 시나리오를 재현한 코드를 `e2e/{story_id}` 브랜치에 업로드한다. 해당 커밋을 메인 브랜치로 머지하기 위해 풀 리퀘스트를 생성한다.

<div align="center">
  <img src="/images/posts/2025/using-github-mcp-server-05.gif" width="100%" class="image__border">
</div>

<br/>

프롬프트 실행이 완료된 후 AI 에이전트가 명시한 링크로 이동하면 풀 리퀘스트가 만들어진 것을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2025/using-github-mcp-server-06.png" width="100%" class="image__border">
</div>

## CLOSING

PM, 디자이너, 개발자의 경계가 점점 무너지는 것 같다. 아니, 경계가 무너진다기 보단 내가 할 수 없는 다른 직군의 일을 AI 에이전트를 통해 수행할 수 있게 됐다는 말이 맞는 것 같다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/playwright-mcp-e2e-workflow>

#### REFERENCE

- <https://github.com/github/github-mcp-server>

[mcp-and-mcp-server-link]: https://junhyunny.github.io/ai/ai-agent/model-context-protocol/mcp-server/mcp-client/mcp-and-mcp-server/
[using-playwright-mcp-link]: https://junhyunny.github.io/e2e-test/playwright/tracker-boot/ai-agent/large-language-model/model-context-protocol/context-engineering/using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test/