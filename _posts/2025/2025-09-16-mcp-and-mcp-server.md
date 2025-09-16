---
title: "MCP(Model Context Protocol)과 MCP 서버"
search: false
category:
  - ai
  - ai-agent
  - model-context-protocol
  - mcp-server
last_modified_at: 2025-09-16T23:55:00
---

<br/>

## 0. 들어가면서

피그마 MCP 서버에 연결하기 전에 MCP(model context protocol)과 이에 관련된 아키텍처, 명세(specification)을 정리하고 넘어간다.

## 1. What is the MCP(Model Context Protocol)?

MCP(Model Context Protocol)은 AI 애플리케이션이 외부 시스템과 연결하기 위한 오픈 소스 표준이다. 클로드(claud)나 ChatGPT 같은 AI 애플리케이션이 데이터소소(datasource), 도구(tools) 혹은 워크플로우(workflow)에 연결할 수 있다. 구체적으로 다음과 같다.

- 데이터소스는 로컬 파일이나 PostgreSQL, SQLite 같은 데이터베이스를 의미한다.
- 도구는 검색 엔진, 계산기, Git 같은 형상 관리 도구, 슬랙 등이 있다.
- 워크플로우는 한 번의 동작으로 끝나지 않고, 여러 단계가 순차적, 조건적으로 연견될 작업 흐름이 명시된 특별한 프롬프트 같은 것을 의미한다.
  - e.g. (CRM 리소스 조회 → FAQ 검색 → 답변 초안 생성 → 필요 시 지원 티켓 툴 호출 → 사용자에게 전달) 같은 고객 지원 워크플로우

공식 문서엔 MCP를 통해 다음과 같은 작업이 가능하다고 명시되어 있다.

- 에이전트는 Google 캘린더와 Notion에 접근하여, 더 개인화된 AI 어시스턴트 역할을 할 수 있다.
- Claude Code는 Figma 디자인을 활용해 전체 웹 애플리케이션을 생성할 수 있다.
- 엔터프라이즈 챗봇은 조직 내 여러 데이터베이스에 연결되어, 사용자가 채팅을 통해 데이터를 분석할 수 있도록 한다.
- AI 모델은 Blender에서 3D 디자인을 만들고 이를 3D 프린터로 출력할 수 있다.

사실 위의 설명만 봐서는 MCP 도대체 무엇인지 알 수 없다. MCP는 HTTP와 같은 통신 규격(protocol)이다. 그렇다면 구체적인 명세(specificaiton)이 있어야 한다. 어떤 것들이 있는지 살펴보자.

## 2. MCP participants

먼저 MCP 참여자들에 대해 알아보자. 다음과 같은 참여자들이 존재한다.

- MCP 호스트(host)
  - 여러 개의 MCP 클라이언트들을 조정 및 관리하는 AI 애플리케이션 
  - 개발자(사용자)와 실제로 인터랙션하는 인터페이스
- MCP 클라이언트(client)
  - MCP 서버와 연결을 유지하는 컴포넌트
  - MCP 호스트가 사용하기 위한 컨텍스트를 MCP 서버로부터 획득
- MCP 서버(server)
  - MCP 클라이언트에게 컨텍스트를 제공하는 프로그램

MCP는 기본적으로 클라이언트-서버 아키텍처를 따른다. MCP 클라이언트는 AI 애플리케이션(클로드 코드, 클로드 데스크탑 등) 같은 MCP 호스트 내부에서 동작한다. MCP 호스트는 사용자의 입력을 받아 MCP 클라이언트를 구동하고 MCP 서버와 연결하는 오케스트레이션 역할을 담당한다. 예를 들면, 코파일럿 플러그인이 설치된 VSCode는 MCP 호스트다. 사용자가 피그마 링크를 코피일럿에게 챗으로 전달하면 VSCode는 MCP 클라이언트를 구동하고 피그마 MCP 서버와 연결을 시도한다.

<div align="center">
  <img src="/images/posts/2025/mcp-and-mcp-server-01.png" width="80%" class="image__border">
</div>
<center>https://modelcontextprotocol.io/docs/learn/architecture</center>

<br/>

MCP 서버는 컨텍스트 데이터를 제공하는 모든 프로그램을 지칭한다. 어디에서 동작하는지 중요하지 않다. 예를 들어보자.

- 로컬 MCP 서버
  - 클로드 데스크탑(MCP 호스트)는 동일한 호스트 머신의 파일 시스템에 접근하기 위해 로컬 머신에 파일 시스템 MCP 서버를 실행 후 MCP 클라이언트로 연결한다.
  - VSCode 코파일럿(MCP 호스트)는 피그마 디자인 시스템에 접근하기 위해 로컬 머신에 피그마 MCP 서버와 MCP 클라이언트로 연결한다. 피그마 MCP 서버는 피그마 애플리케이션을 통해 실행한다.
- 원격 MCP 서버
  - 공식 센트리(sentry) MCP 서버는 센트리 플랫폼에서 동작한다.

## 3. MCP Layers

MCP는 두 개의 레이어로 구성된다.

- 데이터 계층(data layer)
  - 클라이언트-서버 간 통신을 위해 사용하는 JSON-RPC 기반의 프로토콜이다. 
  - 라이프사이클 관리, 핵심 기본 요소(도구, 리소스, 프롬프트, 알림 등)을 위해 사용된다.
- 전송 계층(transport layer)
  - 클라이언트와 서버 사이의 데이터 교환을 가능하게 하는 통신 메카니즘과 채널을 정의한다.
  - 전송(transport) 방식에 따른 연결 수립, 메시지 프레이밍, 그리고 인증(authorization)을 위해 사용된다.

각 계층이 어떤 일을 수행하는지 알아보자.

### 3.1. Data Layer

`데이터 계층`은 메시지 포맷, 도구 호출, 리소스, 프롬프트 등 어떤 데이터/명령을 주고 받을지 규정하는 층이다. 내용물(payload)에 해당한다. 메시지 구조와 의미를 정의하는 [JSON-RPC 2.0](https://www.jsonrpc.org/) 기반 교환 프로토콜을 구현한다. 데이터 계층에선 다음과 같은 작업들을 수행한다.

- 라이프사이클 관리
  - 클라이언트와 서버 간의 연결 초기화, 기능(capability) 협상, 연결 종료를 처리한다.
- 서버 기능
  - 서버가 핵심 기능을 제공할 수 있게 한다. 
  - 여기에는 AI 동작을 위한 도구, 컨텍스트 데이터를 위한 리소스, 클라이언트와 주고받는 상호작용 템플릿(프롬프트)이 포함된다.
- 클라이언트 기능
  - 서버가 클라이언트에게 호스트 LLM에서 샘플링을 요청하거나, 사용자 입력을 유도하거나, 클라이언트에 메시지를 로그로 남길 수 있도록 한다.
- 유틸리티 기능
  - 실시간 업데이트를 위한 알림(notification), 장시간 실행되는 작업의 진행 상황 추적(progress tracking) 등 추가적인 기능을 지원한다.

서버 기능과 클라이언트 기능은 아래에서 구체적인 예시를 통해 살펴본다. `라이프사이클`은 MCP 통신을 위해 서버-클라이언트 사이에 핸드쉐이킹(handshaking)을 하는 작업과 동일하다.

- 초기화(Initialization) - 기능 협상과 프로토콜 버전 합의
- 운영(Operation) - 정상적인 프로토콜 통신으로 서버, 클라이언트, 유틸리티 기능들을 사용
- 종료(Shutdown) - 연결의 정상적인 종료

<div align="center">
  <img src="/images/posts/2025/mcp-and-mcp-server-02.png" width="80%" class="image__border">
</div>
<center>https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle</center>

<br/>

[기능 협상](https://modelcontextprotocol.io/specification/2025-06-18/architecture#capability-negotiation)은 클라이언트와 서버가 초기화 과정에서 자신이 지원하는 기능을 명시적으로 선언하는 것이다. 세션 내내 선언된 기능만 사용할 수 있다. 기능 협상을 통해 클라이언트와 서버가 지원되는 기능을 명확히 이해하고, 추가 확장성도 확보할 수 있다.

### 3.2. Transport Layer

`전송 계층`은 데이터 계층의 메시지를 담아 어떻게 주고 받을지 담당한다. 연결 수립, 메시지 프레이밍, 스트리밍, 인증 같은 내용물을 감싸는 봉투(envelope) 같은 역할을 수행한다. 클라이언트와 서버 사이의 통신 채널과 인증을 관리한다. MCP 참여자들 사이의 안전한 통신, 메시지 프레이밍, 연결 수립 등을 처리한다. 다음과 같은 두 가지 전송 매커니즘을 지원한다.

- STDIO 전송
  - 동일한 머신에서 로컬 프로세스 간 직접적인 프로세스 통신을 위해 표준 입력/출력 스트림을 사용한다. 
  - 네트워크 오버헤드가 없으므로 최적의 성능을 제공한다.
- 스트리밍 가능한 HTTP 전송
  - 클라이언트에서 서버로 보낼 때 HTTP POST를 사용하며, 선택적으로 서버 전송 이벤트(Server-Sent Events)를 통해 스트리밍 기능을 제공한다. 
  - 이 전송 방식은 원격 서버 통신을 가능하게 하며, Bearer 토큰, API 키, 커스텀 헤더 등 표준 HTTP 인증 방법을 지원한다. 
  - MCP는 인증 토큰을 얻기 위해 OAuth 사용을 권장한다.

스트리밍 가능한 HTTP 전송 방식의 경우 서버와 클라이언트 사이의 약속된 커뮤니케이션을 위해 HTTP 헤더를 사용한다. 다시 시도, 재전송, 세션 관리 등을 위한 커스텀 HTTP 헤더들이 있다.

이렇게 보면 네트워크 계층에서 전송 계층(TCP) 위에서 응용 계층(HTTP)가 동작하는 것과 비슷하다. 전송 계층은 클라이언트-서버 사이의 전송 방식을 표준 입출력(STDIO, Stanard Input/Output) 방식 혹은 HTTP 방식으로 결정하는 것이다. 데이터 계층은 MCP 클라이언트 프로세스와 MCP 서버 프로세스 사이에 약속된 포맷의 JSON 요청과 응답을 주고 받는 것이다.

## 4. Primitives

서버와 클라이언트의 핵심 기본 기능(primitive)을 살펴보자. 

### 4.1. MCP server primitives

`MCP 서버`가 노출하는 있는 세 가지 기본 기능은 다음과 같다.

- 도구(Tools)
  - AI 애플리케이션이 동작을 수행하기 위해 호출할 수 있는 실행 가능한 함수들 (예: 파일 작업, API 호출, 데이터베이스 쿼리)
- 리소스(Resources)
  - AI 애플리케이션에 문맥 정보를 제공하는 데이터 소스 (예: 파일 내용, 데이터베이스 레코드, API 응답)
- 프롬프트(Prompts)
  - 언어 모델과의 상호작용을 구조화하는 데 도움이 되는 재사용 가능한 템플릿 (예: 시스템 프롬프트, few-shot 예시)

구체적인 예시를 들어보자. 데이터베이스에 관련된 컨텍스트를 제공하는 MCP 서버가 있다고 생각해보자. 이 MCP 서버는 데이터베이스를 질의(querying)할 수 있는 도구, 데이터베이스의 스키마 정보를 포함한 리소스, 퓨-샷(few-shot) 프롬프트를 포함한 예제 프롬프트들을 노출할 수 있다. MCP 호스트(VSCode)는 MCP 클라이언트를 통해 데이터베이스에 데이터를 질의하거나, 필요한 스키마 정보를 조회하거나, 이미 잘 정의된 프롬프트를 변경해 사용할 수 있다.

MCP 클라이언트는 요청을 보낼 때 `method`라는 프로퍼티에 어떤 연산을 수행할지 함께 전달한다. 각 기본 기능 유형에는 `발견(*/list)`, `조회(*/get)`, `실행(tools/call)` 등이 존재한다. 예를 들어, MCP 클라이언트가 MCP 서버가 제공하는 도구 리스트를 사용할 때 아래 흐름을 통해 진행된다.

- 클라이언트는 `tools/list`를 통해 사용 가능한 도구를 탐색한다.
- LLM이 도구를 선택하면 클라이언트는 `tools/call`을 통해 해당 도구를 실행한다.

<div align="center">
  <img src="/images/posts/2025/mcp-and-mcp-server-03.png" width="80%" class="image__border">
</div>
<center>https://modelcontextprotocol.io/specification/2025-06-18/server/tools</center>

<br/>

구체적으로 어떤 요청과 응답이 오고 가는지 살펴보자. MCP 서버가 제공하는 도구를 확인할 때 MCP 클라이언트는 아래 요청을 전달한다. 

- `tools/list` 사용할 수 있는 도구 리스트를 볼 때 사용한다.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

MCP 서버는 다음과 같은 응답을 보낸다. 사용할 수 있는 도구 리스트와 어떤 입력이 필요한지에 대한 내용이 포함되어 있다.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "calculator_arithmetic",
        "title": "Calculator",
        "description": "Perform mathematical calculations including basic arithmetic, trigonometric functions, and algebraic operations",
        "inputSchema": {
          "type": "object",
          "properties": {
            "expression": {
              "type": "string",
              "description": "Mathematical expression to evaluate (e.g., '2 + 3 * 4', 'sin(30)', 'sqrt(16)')"
            }
          },
          "required": ["expression"]
        }
      },
      {
        "name": "weather_current",
        "title": "Weather Information",
        "description": "Get current weather information for any location worldwide",
        "inputSchema": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "City name, address, or coordinates (latitude,longitude)"
            },
            "units": {
              "type": "string",
              "enum": ["metric", "imperial", "kelvin"],
              "description": "Temperature units to use in response",
              "default": "metric"
            }
          },
          "required": ["location"]
        }
      }
    ]
  }
}
```

특정 도구를 실행하고 싶다면 MCP 클라이언트를 통해 다음과 같은 요청을 보낸다.

- 조회한 도구 중 `weather_current` 도구를 호출한다.
- 필요한 파라미터는 `location`, `units` 이다.

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "weather_current",
    "arguments": {
      "location": "San Francisco",
      "units": "imperial"
    }
  }
}
```

### 4.2. MCP client primitives

`MCP 클라이언트`가 노출할 수 있는 세 가지 핵심 기본 요소를 알아보자. MCP 클라이언트가 제공하고, MCP 서버가 이를 호출할 수 있다. 다음과 같은 기본 요소들이 있다.

- 샘플링(Sampling)
  - 서버가 클라이언트의 AI 애플리케이션에서 언어 모델 완성(completion)을 요청할 수 있게 한다. 
  - 이는 서버 개발자가 언어 모델에 접근하고 싶지만, 특정 모델에 종속되거나 MCP 서버에 언어 모델 SDK를 포함하고 싶지 않을 때 유용하다. 
  - 이 경우 `sampling/complete` 메서드를 사용하여 클라이언트의 AI 애플리케이션에 언어 모델 완성을 요청할 수 있다.
- 추론 요청(Elicitation)
  - 서버가 사용자에게 추가 정보를 요청할 수 있게 한다. 
  - 이는 서버 개발자가 사용자로부터 더 많은 정보를 얻거나, 특정 작업에 대한 확인을 요청하고 싶을 때 유용하다. 
  - 이 경우 `elicitation/request` 메서드를 사용하여 사용자에게 추가 정보를 요청할 수 있다.
- 로깅(Logging)
  - 서버가 클라이언트에 로그 메시지를 전송하여 디버깅 및 모니터링에 활용할 수 있게 한다.

샘플링은 서버가 클라이언트가 가진 AI 모델에게 질문을 보내고 답을 받아오는 기능이다. 서버가 직접 언어 모델을 갖고 있지 않아도 클라이언트의 AI에게 부탁해서 답을 받아오는 구조다. 이런 경우에 유용하다. 

- 서버 개발자는 특정 모델에 종속되어 있지 않으면서 AI 기능을 사용하고 싶다. 
- MCP 서버 안에 언어 모델 SDK를 직접 넣으면 무겁고 복잡하니깐, 클라이언트에게 사용을 위임한다.

샘플링의 플로우를 살펴보자. `sampling/createMessage` 요청이 서버에서부터 시작한다.

- 여러 단계의 사람 참여(human-in-the-loop) 같은 검증 지점을 통해 보안(security)을 보장한다.
- 사용자는 초기 요청과 생성된 응답을 서버로 반환하기 전에 검토(response-review)하고 수정할 수 있다.

<div align="center">
  <img src="/images/posts/2025/mcp-and-mcp-server-04.png" width="100%" class="image__border">
</div>
<center>https://modelcontextprotocol.io/docs/learn/client-concepts</center>

<br/>

마찬가지로 어떤 요청과 응답이 오고 가는지 살펴보자. MCP 서버가 LLM 기능을 사용하고 싶을 떄 MCP 클라이언트에게 아래 요청을 전달한다. 

- `sampling/createMessage`은 언어 모델에게 메시지를 기반으로 답변을 생성해달라는 요청이다.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "sampling/createMessage",
  "params": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "What is the capital of France?"
        }
      }
    ],
    "modelPreferences": {
      "hints": [
        {
          "name": "claude-3-sonnet"
        }
      ],
      "intelligencePriority": 0.8,
      "speedPriority": 0.5
    },
    "systemPrompt": "You are a helpful assistant.",
    "maxTokens": 100
  }
}
```

MCP 클라이언트는 위 요청을 받으면 AI 모델(ChatGPT)에게 이를 위임힌다. MCP 클라이언트는 MCP 호스트(VSCode 혹은 클로드 데스크탑)와 연결된 AI 모델에게 요청을 포워딩한다. AI 모델로부터 받은 응답을 사용자 리뷰를 거친 후 MCP 서버에게 전달한다. 메시지 포맷은 다음과 같다.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "role": "assistant",
    "content": {
      "type": "text",
      "text": "The capital of France is Paris."
    },
    "model": "claude-3-sonnet-20240307",
    "stopReason": "endTurn"
  }
}
```

## CLOSING

[MCP 명세서](https://modelcontextprotocol.io/specification/2025-06-18)을 보면 위에서 예시로 든 `tools`, `sampling` 외에도 다른 요소들(primitives)에 대한 요청, 응답 예시가 있다. MCP 참여자들의 시퀀스 다이어그램들도 있으니 한번 읽어보면 이 프로토콜에 대한 개념을 잡을 수 있다. 

이 프로토콜은 용어가 헷갈린다. 아래 개념들이 나를 혼란에 빠트린 것 같다.

- 호스트가 물리적 머신을 의미하지 않고, VSCode 같은 애플리케이션을 의미한다.
- 클라이언트가 요청만 수행하는 것이 아니고 서버로부터 요청을 받는다.
- 서버가 받드시 외부에서 동작하는 것이 아니라 MCP 호스트가 설치된 머신에서 실행 중일 수 있다.

#### REFERENCE

- <https://modelcontextprotocol.io/docs/getting-started/intro>
- <https://modelcontextprotocol.io/docs/learn/architecture>
- <https://modelcontextprotocol.io/specification/2025-06-18>
- <https://www.jsonrpc.org/>

[improve-development-process-by-vibe-coding-link]: https://junhyunny.github.io/ai/ai-agent/copilot/prompt/improve-development-process-by-vibe-coding/