---
title: "Playwright MCP 서버를 통한 E2E 테스트 워크플로우"
search: false
category:
  - e2e-test
  - playwright
  - tracker-boot
  - ai-agent
  - large-language-model
  - model-context-protocol
  - context-engineering
last_modified_at: 2025-11-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [MCP(Model Context Protocol)와 MCP 서버-클라이언트][mcp-and-mcp-server-link]
- [피그마(figma) MCP 서버 사용하기][using-figma-mcp-server-link]
- [트래커 부트(tracker boot) MCP 서버로 프롬프트 컨텍스트 공유하기][using-tracker-boot-mcp-server-link]

## 0. 들어가면서

지난 달에 한국 멤버들끼리 AI 도구를 사용한 개발 핸즈-온 시간을 가졌다. 나는 [피그마 MCP 서버][using-figma-mcp-server-link]를 사용해 간단한 애플리케이션에 피그마 디자인을 입히는 실습과 Playwright MCP 서버를 사용한 E2E 테스트 워크플로우를 만들어보는 실습을 준비했다. MCP 서버를 통해 개발 프로세스를 개선할 수 있는 사례가 될 것 같아서 블로그에 정리했다. MCP 서버에 대한 개념이 부족하다면 [이 글][mcp-and-mcp-server-link]을 참조하길 바란다.

## 1. What is Playwright MCP?

[Playwright](https://playwright.dev)는 E2E(end-to-end) 테스트를 위한 프레임워크다. E2E 테스트는 프론트엔드, 백엔드, 데이터베이스까지 시스템을 구성하는 모든 구성 요소가 실제 환경처럼 연결된 상태에서 정확히 상호 작용하는지 검증하기 위한 테스트 코드다. 이를 통해 단위 테스트나 통합 테스트에서 발견할 수 없는 문제를 발견할 수 있다. 

`User Journey as Code`라고 할 수 있다. Playwright 프레임워크를 통해 실제 사용자가 경험하는 시나리오 전체를 처음부터 끝까지 테스트하는 코드를 작성할 수 있다. Playwright 프레임워크에 작성된 코드는 브라우저를 직접 조작할 수 있기 때문에 사용자 플로우를 테스트하고, 자동화 할 수 있다.

LLM(large language model) 같은 AI 모델은 브라우저를 직접 제어할 수 없다. 물론 AI 에이전트도 직접 브라우저를 제어하는 것은 불가능하다. Playwright MCP 서버는 AI 에이전트가 LLM과 협업하여 브라우저를 조작할 수 있도록 도구다. 사람이 자연어로 작성한 테스트 시나리오는 AI 에이전트에 의해 수행된다. AI 에이전트는 시나리오를 테스트하기 위해 Playwright MCP 서버를 통해 브라우저 조작한다.

<div align="center">
  <img src="/images/posts/2025/using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-01.png" width="100%" class="image__border">
</div>

<br/>

[이 글][mcp-and-mcp-server-link]에서 설명한 것처럼 MCP 서버는 AI 에이전트가 사용할 수 있는 도구들을 제공한다. Playwright MCP 서버는 어떤 도구들을 제공할까? 아래 테이블에서 볼 수 있듯이 브라우저를 조작하는 도구들을 제공한다. 이 외에도 다른 도구들을 제공하며, 자세한 내용은 [이 링크](https://github.com/microsoft/playwright-mcp?tab=readme-ov-file#tools)를 참조하길 바란다.

| Tool | Description | Parameters |
|------|-------------|------------|
| browser_click | Perform click on a web page | element, ref, doubleClick, button, modifiers |
| browser_close | Close the page | - |
| browser_console_messages | Returns all console messages | onlyErrors |
| browser_drag | Perform drag and drop between two elements | startElement, startRef, endElement, endRef |
| browser_evaluate | Evaluate JavaScript expression on page or element | function, element, ref |
| browser_file_upload | Upload one or multiple files | paths |
| browser_fill_form | Fill multiple form fields | fields |
| browser_handle_dialog | Handle a dialog | accept, promptText |
| browser_hover | Hover over element on page | element, ref |
| browser_navigate | Navigate to a URL | url |
| browser_navigate_back | Go back to the previous page | - |
| browser_network_requests | Returns all network requests since loading the page | - |
| browser_press_key | Press a key on the keyboard | key |
| browser_resize | Resize the browser window | width, height |
| browser_select_option | Select an option in a dropdown | element, ref, values |
| browser_snapshot | Capture accessibility snapshot of the current page | - |
| browser_take_screenshot | Take a screenshot of the current page | type, filename, element, ref, fullPage |
| browser_type | Type text into editable element | element, ref, text, submit, slowly |
| browser_wait_for | Wait for text to appear or disappear or a specified time to pass | time, text, textGone |
| browser_tabs | 브라우저 탭 목록 조회, 생성, 닫기 또는 선택 | action, index |

## 2. E2E test workflow with MCP servers

[트래커 부트(tracker boot) MCP 서버로 프롬프트 컨텍스트 공유하기 글][using-tracker-boot-mcp-server-link]에선 트래커 부트(Tracker Boot) MCP 서버를 사용해 각 프롬프트 사이에 컨텍스트를 연결해주는 작업을 했다. 이번엔 이슈 트래커에 작성된 스토리를 기반으로 E2E 테스트를 수행하는 작업까지 AI 에이전트를 통해 수행해보자.

1. AI 에이전트는 트래커 부트에 작성된 사용자 스토리를 기반으로 테스트 시나리오를 작성한다.
2. AI 에이전트는 자신이 작성한 시나리오를 기반으로 E2E 테스트를 수행한다.
3. AI 에이전트는 테스트가 성공하면 시나리오를 기반으로 E2E 테스트 코드를 작성한다.

<div align="center">
  <img src="/images/posts/2025/using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-02.png" width="100%" class="image__border">
</div>

## 3. Run E2E test workflow

지금부터 AI 에이전트를 통해 E2E 테스트를 수행하자. AI 에이전트는 코파일럿을 사용한다. 인텔리제이에 MCP 서버를 설정하는 방법은 [이 글](https://junhyunny.github.io/tracker-boot/ai-agent/large-language-model/model-context-protocol/context-engineering/using-tracker-boot-mcp-server/#3-setting-tracker-boot-mcp-server)을 참조하길 바란다. `mcp.json` 파일에 다음과 같이 MCP 서버들을 등록하면 된다.

```json
{
  "servers": {
    "tracker-boot-mcp-server": {
      "type": "local",
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

[이전 글](https://junhyunny.github.io/ai/ai-agent/copilot/prompt/improve-development-process-by-vibe-coding/)에서 설명했듯이 코파일럿은 프롬프트를 파일로 작성해서 재사용할 수 있다. `.github/propmtps` 경로에 아래와 같은 `user-journey-test.prompt.md` 프롬프트 파일을 만들었다.

```
---
mode: agent
description: E2E 테스트를 수행하는 프롬프트
---

# 역할 설정

당신은 소프트웨어 개발 경험이 풍부한 테크 리드입니다. E2E 테스트 코드를 작성하여 테스트를 자동화하는 것에 익숙합니다.

# 입력 정보

- STORY_ID(required) - 사용자 스토리 ID

# 지시사항

- 트래커 부트(tracker boot) MCP 서버에서 `STORY_ID`를 사용해 스토리 정보를 조회한다. `tb_get_story` 도구를 사용한다.
- 사용자 스토리를 읽고, 인수 기준(acceptance criteria)를 통과시킬 수 있는 사용자 테스트 시나리오를 도출한다. 작은 단계로 테스트를 분리하지 않고 전체 사용자 여정을 포괄하는 시나리오를 작성한다.
- 사용자 테스트 시나리오는 사용자의 액션을 기준으로 순차적으로 작성하되, 사용자가 이를 인식할 수 있도록 숫자를 앞에 표기한다.
- 테스트 시나리오가 작성되면 이를 사용자에게 확인 받는다. 프롬프트 실행을 임시 중단한다.
- 사용자 시나리오에 대한 승인을 받으면 Playwright MCP 서버의 도구(tools)를 사용해 브라우저를 제어하면서 E2E 테스트를 수행한다.
- E2E 테스트가 완료되면 결과를 사용자에게 보고한다. 테스트가 실패한 경우, 실패한 테스트 케이스와 그 원인을 상세히 설명한다.

# 금지사항

- 프로젝트의 구현 코드를 **절대** 직접 생성하지 않는다.
- 프로젝트의 구현 코드를 **절대** 수정하지 않는다.

# 후속 작업

테스트가 통과하면 E2E 테스트 코드를 작성한다. 테스트 파일 이름은 `{story-id}.spec.ts` 형식을 따른다.
테스트 코드는 `e2e/**` 경로 하위에 존재한다. 현재 프로젝트 경로에서 `e2e/**` 경로에 테스트 코드가 없다면, 원격 레포지토리의 `e2e/**` 경로를 참조한다.
```

위에서 작성한 프롬프트를 실행한다.

```
/user-journey-test

STORY_ID=#200010919
```

AI 에이전트는 트래커 부트에 작성된 사용자 스토리를 바탕으로 테스트 시나리오를 생성한다.

<div align="center">
  <img src="/images/posts/2025/using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-03.gif" width="100%" class="image__border">
</div>

<br/>

테스트 실행을 허가하면 AI 에이전트는 자신이 만든 시나리오를 바탕으로 테스트를 실행한다. Playwright MCP 서버로 브라우저를 조작한다.

<div align="center">
  <img src="/images/posts/2025/using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-04.gif" width="100%" class="image__border">
</div>

<br/>

AI 에이전트는 E2E 테스트가 통과하면 테스트 코드를 작성한다. 개발자는 테스트 코드를 리뷰 후 커밋한다.

<div align="center">
  <img src="/images/posts/2025/using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-05.gif" width="100%" class="image__border">
</div>

## CLOSING

깃허브(github) MCP 서버까지 연결하면 테스트 코드를 작성 후 다른 브랜치에 PR(pull request)를 올릴 수 있다. AI 에이전트를 사용하면 PM, 디자이너 같은 비개발자라도 자동화 할 수 있는 테스트 코드를 작성할 수 있다. 다음은 깃허브 MCP 서버를 연결하는 방법을 정리할 생각이다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-11-15-using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test>

#### REFERENCE

- <https://playwright.dev/>
- <https://github.com/microsoft/playwright-mcp>
- <https://insight.infograb.net/blog/2025/05/28/playwright-mcp/>
- [Playwright MCP 서버 완벽 가이드: AI 기반 브라우저 자동화의 새로운 시대](https://skywork.ai/skypage/ko/Playwright%20MCP%20%EC%84%9C%EB%B2%84%20%EC%99%84%EB%B2%BD%20%EA%B0%80%EC%9D%B4%EB%93%9C%3A%20AI%20%EA%B8%B0%EB%B0%98%20%EB%B8%8C%EB%9D%BC%EC%9A%B0%EC%A0%80%20%EC%9E%90%EB%8F%99%ED%99%94%EC%9D%98%20%EC%83%88%EB%A1%9C%EC%9A%B4%20%EC%8B%9C%EB%8C%80/1972521566375440384)

[mcp-and-mcp-server-link]: https://junhyunny.github.io/ai/ai-agent/model-context-protocol/mcp-server/mcp-client/mcp-and-mcp-server/
[using-figma-mcp-server-link]: https://junhyunny.github.io/ai/ai-agent/figma-mcp/mcp-server/copilot/prompt/using-figma-mcp-server/
[using-tracker-boot-mcp-server-link]: https://junhyunny.github.io/tracker-boot/ai-agent/large-language-model/model-context-protocol/context-engineering/using-tracker-boot-mcp-server/