---
title: "피그마(figma) MCP 서버 사용하기"
search: false
category:
  - ai
  - ai-agent
  - figma-mcp
  - mcp-server
  - copilot
  - prompt
last_modified_at: 2025-09-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [바이브 코딩(vibe coding)을 통한 개발 프로세스 개선][improve-development-process-by-vibe-coding-link]
- [MCP(Model Context Protocol)와 MCP 서버-클라이언트][mcp-and-mcp-server-link]

## 0. 들어가면서

[이전 글][improve-development-process-by-vibe-coding-link]에서 테스트 코드와 구현 코드를 작성하는 프롬프트를 살펴봤다. 이번엔 피그마 MCP 서버를 사용해 디자인을 입히는 작업을 살펴보자. MCP(model context protocol)을 잘 모르거나 MCP 서버에 대한 개념이 부족하면 [이 글][mcp-and-mcp-server-link]을 참고하길 바란다.

## 1. Figma MCP server

MCP 호스트(VSCode 혹은 IntelliJ 코파일럿)에서 AI 에이전트가 프론트엔드 코드에 디자인을 입히는 작업을 수행하기 위해선 어떠한 컨텍스트가 필요하다. 

- 화면이 어떤 레이아웃을 갖는가?
- 백그라운드 색상은 어떤가?
- 버튼의 디자인은 어떤가?
- 폼(form)의 디자인은 어떤가?

사람도 마찬가지지만 AI 에이전트도 여러 정보가 필요하다. 디자인 도구로 사용되는 피그마(figma)도 MCP(model context protocol) 서버를 통해 AI 에이전트에게 디자인에 관련된 컨텍스트를 제공한다. 피그마는 로컬 MCP 서버 방식을 지원한다. 서버가 활성화 되면 다음과 같은 기능을 수행할 수 있다.

- 피그마 애플리케이션에서 선택한 프레임의 코드를 생성할 수 있다. 
- 디자인 컨텍스트 추출할 수 있다. 변수, 컴포넌트, 레이아웃 데이터를 직접 IDE로 가져올 수 있다.

MCP 서버는 다음과 같은 방법으로 활성화 할 수 있다.

- 피그마 디자인 파일을 연다.
- 왼쪽 상단 모서리에서 피그마 메뉴를 연다.
- `Preferences` 메뉴에서 `Enable Dev Mode MCP Server`를 선택한다.

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-01.png" width="50%" class="image__border">
</div>

<br/>

MCP 서버를 활성화 하면 피그마 애플리케이션 하단에서 접속 주소를 확인할 수 있다.

- `http://127.0.0.1:3845/mcp` 서버를 통해 연결이 가능하다.

<div align="lefr">
  <img src="/images/posts/2025/using-figma-mcp-server-02.png" width="65%" class="image__border">
</div>

## 2. Setting IDE

MCP 호스트에 MCP 서버 정보를 등록해야 한다. VSCode와 인텔리제이에서 MCP 서버 정보를 설정하는 방법에 대해 알아보자.

### 2.1. VSCode Copilot

`CMD + SHIFT + P`를 누른 후 MCP를 검색한다. `MCP 서버 등록(MCP: Add Server)` 항목을 선택한다.

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-03.png" width="65%" class="image__border">
</div>

<br/>

다음 HTTP 전송 계층을 선택한다.

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-04.png" width="65%" class="image__border">
</div>

<br/>

MCP 서버 주소를 등록한다.

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-05.png" width="65%" class="image__border">
</div>

<br/>

MCP 서버 이름을 등록한다.

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-06.png" width="65%" class="image__border">
</div>

<br/>

글로벌에 적용할지, 로컬에 적용할지 선택한다. 

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-07.png" width="65%" class="image__border">
</div>

<br/>

다음 피그마 MCP 서버가 등록되면 mcp.json 파일에 다음과 같은 정보가 등록된다.

```json
{
  "servers": {
    "Figma Dev Mode MCP": {
      "type": "http",
      "url": "http://127.0.0.1:3845/mcp"
    }
  },
  "inputs": []
}
```

### 2.2. IntelliJ Copilot

인텔리제이에선 직접 http 전송 방식을 사용하지 못 한다. `mcp-remote` 패키지를 통해 간접적으로 연결한다. `CMD + ,(comma)`을 눌러 MCP 관련 설정을 찾는다.

- Github Copliot 도구의 MCP 화면에서 configure 버튼을 클릭한다.

<div align="center">
  <img src="/images/posts/2025/using-figma-mcp-server-08.png" width="80%" class="image__border">
</div>

<br/>

configure 버튼을 클릭하면 mcp.json 파일로 연결도니다. 이 파일에 피그마 MCP 서버와 연결하기 위한 설정을 추가한다.

- `mcp-remote` 패키지와 피그마 MCP 서버 주소를 인자(arguments)로 전달한다.

```json
{
  "servers": {
    "figma-dev-mode-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://127.0.0.1:3845/mcp"
      ],
      "env": {}
    }
  }
}
```

코파일럿 프롬프트를 통해 피그마 MCP 서버에 잘 연결됐는지 확인할 수 있다. 피그마 디자인 파일에서 선택한 프레임 링크에 접속이 가능한지 프롬프트를 통해 확인한다.

```
https://www.figma.com/design/abcdefghijklmnopqrstuvwxyz/helloworld?node-id=12345-1234567&m=dev

해당 링크에서 필요한 컨텍스트 정보를 가져올 수 있는지 확인한다.
```

위 프롬프트 실행 결과는 다음과 같다.

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-09.png" width="65%" class="image__border">
</div>

## 3. Figma MCP server tools

피그마 MCP 서버가 제공하는 도구들을 알아보자. 

- `get_code` 도구
  - 피그마 선택 영역에 대한 코드를 생성한다.
  - 기본 출력은 리액트(react), 테일윈드(tailwind) 이다. 
  - 프롬프트에 "Figma 선택 항목을 일반 HTML + CSS로 생성한다." 같은 프레임워크 변경에 대한 내용이 있다면 이를 AI 에이전트가 처리한다.
- `get_variable_defs` 도구
  - 선택된 프레임에 사용된 변수와 스타일(e.g. 색상, 간격, 타이포그래피)를 반환한다.
  - 사용된 토큰 모두 나열하거나 변수 이름과 값을 가져오는 등의 작업을 수행할 수 있다.
- `get_code_connect_map` 도구
  - 피그마 노드 ID와 코드베이스의 해당 코드 컴포넌트 간의 매핑을 검색한다. 
  - 이 매핑은 피그마 디자인 요소를 리액트(혹은 다른 프레임워크) 구현에 직접 연결하는 데 사용된다.
  - 디자인이 코드로 원활하게 전환되고 디자인의 각 부분에 올바른 컴포넌트가 사용되도록 보장한다.
  - 피그마 노드가 코드 컴포넌트에 연결되어 있으면, 이 기능을 통해 프로젝트에서 정확한 컴포넌트를 식별하고 사용할 수 있다.
- `get_image` 도구
  - 선택 항목의 레이아웃을 정확히 보존하기 위한 스크린샷을 찍는다.

get_code 도구가 가장 중요하다. AI 에이전트의 실행 과정을 보면 get_code를 통해 선택 영역의 코드를 가져온다. 이 코드를 기반으로 실제 컴포넌트의 디자인을 변경한다. get_variable_defs는 피그마에 정리된 디자인 시스템을 코드로 정리하기에 유용할 것 같다. 이에 관련된 내용은 앞으로 경험이 쌓이면 정리해보겠다.

## 4. Run design prompts

피그마 디자인을 기반으로 디자인 작업을 수행해보자. 위에서 언급했듯이 피그마 MCP 서버의 get_code 응답은 리액트, 테일윈드 기반이다. 사전에 프로젝트에 테일윈드 환경이 준비되어 있어야 한다. 현재 애플리케이션은 다음과 같다.

<div align="center">
  <img src="/images/posts/2025/using-figma-mcp-server-10.png" width="100%" class="image__border">
</div>

<br/>

위 애플리케이션에 아래와 같은 피그마 디자인을 입힌다.

<div align="center">
  <img src="/images/posts/2025/using-figma-mcp-server-11.png" width="100%" class="image__border">
</div>

<br/>

[이전 글][improve-development-process-by-vibe-coding-link]에서 이야기했듯이 프롬프트 템플릿은 `.github/prompts/*.prompt.md` 파일에 작성하고 유연하게 변경되는 부분은 함수 파라미터처럼 사용한다. 사용한 프롬프트는 다음과 같다. 프롬프트 파일 이름은 `figma.prompt.md`다.

```markdown
# 역할 설정

당신은 시니어 프론트엔드 엔지니어입니다. 프론트엔드 테스트 코드를 작성하는 데 도움을 줍니다.

## 입력

- (Required) `FIGMA_URL`: 피그마 디자인 섹션 링크

## 지시

- Figma 링크(`FIGMA_URL`)의 컴포넌트를 `frontend/src/temp` 경로에 `Temp.tsx`로 구현한다.
- Figma MCP 서버에 연결할 때, `FIGMA_URL`이 유효한지 확인한다.
- Figma MCP 서버에서 필요한 리소스를 가져와 사용한다.
- Figma 디자인 시스템에 없는 컴포넌트는 구현하지 않는다.
- Figma 디자인 시스템에 엄격히 맞춰 구현한다. 추가 작업은 일절 하지 않는다.
- 컴포넌트의 스타일, 색상, 폰트, 간격 등을 Figma 디자인 시스템에 맞춰 구현한다.
- 컴포넌트의 상태(hover, active, disabled 등)를 Figma 디자인 시스템에 맞춰 구현한다.
- 컴포넌트의 접근성(ARIA 속성 등)을 고려한다.
- 컴포넌트의 반응형 디자인을 고려한다.
- 아이콘(svg, png, jpeg 등)은 Figma 디자인 시스템에서 제공되는 것을 다운로드한 후, `frontend/src/assets` 경로에 저장하고, **반드시** 이것을 사용해야 한다.
- 아이콘의 크기와 색상을 Figma 디자인 시스템에 맞춰 구현한다.

## 주의사항

- `Required` 항목은 반드시 입력되어야 합니다. 입력되지 않은 경우, 에이전트는 작업을 수행할 수 없습니다. 프롬프트 실행을 중단하고, 누락된 항목을 사용자에게 알립니다.
- Figma MCP 서버 연결에 실패한 경우, 에이전트는 작업을 수행할 수 없습니다. 프롬프트 실행을 중단하고, 누락된 항목을 사용자에게 알립니다.
- 기능적인 부분(예: event handler, state, useState 등)은 **절대** 작성하지 않습니다.
```

위 프롬프트를 템플릿으로 기반으로 코파일럿 채팅에 아래 프롬프트를 실행한다.

```
/figma

FIGMA_URL=https://www.figma.com/design/abcdefghijklmnopqrstuvwxyz/helloworld?node-id=12345-1234567&m=dev
```

디자인 작업 완료되면 필요한 에셋(asset)들이 다운로드 되고, 선택한 피그마 프레임에 해당하는 코드가 생성된다. 

<div align="left">
  <img src="/images/posts/2025/using-figma-mcp-server-12.png" width="45%" class="image__border">
</div>

<br/>

선택한 피그마 프레임은 Temp.tsx 파일로 생성된다. 이 컴포넌트를 기반으로 특정 컴포넌트를 디자인한다. 아래와 같은 프롬프트를 사용한다. 프롬프트 파일 이름은 `design.prompt.md`다.

```markdown
# 역할 설정

당신은 디자인 시스템에 정통한 프론트엔드 개발자입니다. 컴포넌트의 일관성을 유지하면서, 디자인 작업을 수행합니다.

# 입력 정보

- (Required) `TARGET`: 디자인 대상 컴포넌트 경로 (예: `src/components/Button/Button.tsx`)
- (Required) `BASE`: 디자인 기준 컴포넌트 경로 (예: `src/temp/Temp.tsx`)

# 지시

- `TARGET` 컴포넌트의 디자인을 `BASE` 컴포넌트를 기준으로 리팩터링하세요.
- 동일한 디자인 결과가 되도록 컴포넌트를 리팩터링하세요.
- 컴포넌트의 스타일, 색상, 폰트, 간격 등을 `BASE` 컴포넌트에 맞추어 리팩터링하세요.
- 컴포넌트의 상태(hover, active, disabled 등)를 `BASE` 컴포넌트에 맞추어 리팩터링하세요.
- 컴포넌트의 접근성(ARIA 속성 등)을 고려하세요.
- 컴포넌트의 반응형 디자인을 고려하세요.
- 컴포넌트의 성능 최적화를 고려하세요.
- 컴포넌트의 재사용성을 고려하세요.
- 컴포넌트의 유지보수성을 고려하세요.
- 타입 정의를 적절히 작성하세요.
- 가독성을 중시하세요.
- 디자인을 반영할 때는 관련된 서브 컴포넌트의 디자인도 동시에 수정하세요.
- 디자인 및 레이아웃 요소는 `BASE`를 참조합니다., 기능적 부분(e.g. 이벤트 핸들러, 상태)은 절대 수정하지 마세요.

# 금지 사항

- `Required` 항목은 반드시 입력되어야 합니다. 입력되지 않은 경우, 에이전트는 작업을 수행할 수 없습니다. 프롬프트 실행을 중단하고, 누락된 항목을 사용자에게 알립니다.
- **중요: `TARGET` 컴포넌트의 기능, 동작, 텍스트 등을 임의로 변경하지 않습니다.**
- **중요: `TARGET` 컴포넌트에 없는 기능, 동작, 텍스트를 `BASE` 컴포넌트를 따라 임의로 추가하지 않습니다.**
- **중요: 디자인의 일관성을 해치는 변경은 하지 않습니다.**
- BASE 컴포넌트의 데이터 속성 `(data-*)`은 TARGET 컴포넌트에 반영하지 않습니다.
```

위 프롬프트를 템플릿으로 코파일럿 채팅에 아래 프롬프트를 실행한다.

```
/design 

TARGET=src/pages/TodoPage.tsx
BASE=src/temp/Temp.tsx
```

프롬프트 실행이 완료되면 다음과 같이 디자인이 반영된 것을 확인할 수 있다. hover 시 버튼의 색상이 바뀌는 등의 이펙트도 함께 반영된다. 텍스트 정렬 등의 사소한 문제가 있지만, 개발자가 직접 자잘한 작업들을 마무리 해주면 될 것 같다.

<div align="center">
  <img src="/images/posts/2025/using-figma-mcp-server-13.gif" width="100%" class="image__border">
</div>

## CLOSING

디자인에 관련된 스텝을 두 단계로 나눠서 수행했다.

1. 피그마 MCP 서버를 통해 Temp.tsx 파일 생성
2. Temp.tsx 파일을 기반으로 디자인 작업

이유는 한 단계로 한번에 실행하는 경우 AI 에이전트가 내놓는 결과가 그렇게 좋지 않았다. 에이전트가 피그마 MCP 서버로부터 정보를 받고, 이를 바탕으로 디자인까지 반영하는 작업을 수행하면서 일부 컨텍스트가 누락되는 것 같다. 두 단계로 나눈 것이 번거롭긴 하지만, 장점도 있다. 

- 피그마 디자인 원본을 Temp.tsx 파일을 통해 확인할 수 있다. 디자인을 입히는 과정에 문제가 발생된 것인지 피그마 디자인 자체가 잘못된 것인지 확인하기 쉽다.  
- data-node-id 값과 같이 유니크한 정보가 있다면, id 맵핑을 통해 점진적으로 디자인을 반영하는 것이 가능하다.

[피그마 MCP 안내서](https://help.figma.com/hc/ko/articles/32132100833559-Dev-Mode-MCP-%EC%84%9C%EB%B2%84-%EC%95%88%EB%82%B4%EC%84%9C) 마지막 부분에 사용자 지정 규칙에 대한 예시가 제공된다. 

```markdown
- 중요: 가능하면 항상 `/path_to_your_design_system`의 컴포넌트를 사용하세요.
- 디자인과 정확히 일치하도록 Figma의 완성도를 우선시하세요.
- 하드코딩된 값을 피하고, 가능한 경우 Figma의 디자인 토큰을 사용하세요.
- 접근성을 위해 WCAG 요구 사항을 따르세요.
- 컴포넌트 문서를 추가하세요.
- 꼭 필요한 경우가 아니면 인라인 스타일을 피하고 `/path_to_your_design_system`에 UI 컴포넌트를 배치하세요.
```

사용자 지정 규칙을 살펴보니 프로젝트 내부에 디자인 시스템을 구축하고, UI 컴포넌트를 재구성하면 피그마 MCP 서버를 더 효율적으로 사용할 수 있을 것 같다. 다음은 피그마에 정의된 디자인 시스템, 디자인 토큰 등을 테일윈드 기반 프로젝트에 구성하는 방법을 탐구해봐야 할 것 같다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-09-20-using-figma-mcp-server>

#### REFERENCE

- <https://help.figma.com/hc/ko/articles/32132100833559-Dev-Mode-MCP-%EC%84%9C%EB%B2%84-%EC%95%88%EB%82%B4%EC%84%9C>
- <https://wikidocs.net/283496>

[improve-development-process-by-vibe-coding-link]: https://junhyunny.github.io/ai/ai-agent/copilot/prompt/improve-development-process-by-vibe-coding/
[mcp-and-mcp-server-link]: https://junhyunny.github.io/ai/ai-agent/model-context-protocol/mcp-server/mcp-client/mcp-and-mcp-server/