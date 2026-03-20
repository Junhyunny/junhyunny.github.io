---
title: "ReAct 에이전트 Playwright를 사용한 브라우저 조작 및 웹 검색"
search: false
category:
  - ai
  - ai-agent
  - react-agent
  - playwright
  - playwright-browser-toolkit
  - browser
  - web-search
last_modified_at: 2026-03-20T12:29:56+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [LLM 랭체인(LangChain) 예제][lang-chain-link]
- [Playwright MCP 서버를 통한 E2E 테스트 워크플로우][using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-link]
- [ReAct(Reasoning and Acting) 에이전트][react-agent-link]

## 0. 들어가면서

[이전 글][react-agent-link]에선 리액트(ReAct) 에이전트의 개념과 간단한 예시 코드를 살펴봤다. 이번에는 이전 예제를 확장해서 브라우저를 조작하는 리액트 에이전트를 만들어 볼 생각이다. 이 에이전트는 브라우저를 직접 조작할 수 있기 때문에 웹 검색이나 이메일을 정리하는 등의 작업을 수행할 수 있다. 토이 프로젝트로 TODO 에이전트를 만들어보고 있는데, 브라우저를 조작해서 사용자의 업무를 대신 해주는 에이전트이기 때문에 이 기능이 가장 핵심 역할이라고 생각된다.

## 1. Setup environment

프로젝트에 파이썬 가상 환경을 구축한다.

```
$ python3 -m venv .venv
```

프로젝트 가상 환경을 활성화한다.

```
$ source .venv/bin/activate
```

다음과 같은 의존성들이 필요하다.

```
$ pip install -U langchain\
 langchain-aws\
 langchain-community\
 playwright\
 lxml\
 beautifulsoup4\
 dotenv\
 rich\
 ruff\
 nest_asyncio
```

## 2. Playwright Browser Toolkit

Playwright는 마이크로소프트(microsoft)가 개발한 오픈소스 자동화 도구다. Chromium, Firefox, WebKit 등 다양한 웹 브라우저를 프로그래밍 방식(프로그래밍 코드)으로 제어하고 자동화할 수 있다. E2E 테스트, 스크래핑, 웹 작업 자동화를 위해 설계되었고, 나는 E2E 테스트 프레임워크로 주로 사용하고 있다. 

[Playwright MCP 서버][using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-link]를 사용하면 Github 코파일럿(copilot), 클로드 코드(claude code) 같은 AI 에이전트가 브라우저를 조작할 수 있다. 이를 응용해서 토이 프로젝트의 AI 에이전트가 Playwright MCP 서버를 통해 브라우저를 조작하도록 구현하려고 했다. 

찾아보니 이미 마이크로소프트에서 AI 에이전트가 브라우저를 조작할 수 있는 [Playwright 브라우저 툴킷(toolkit)](https://docs.langchain.com/oss/python/integrations/providers/microsoft#playwright-browser-toolkit)를 만들어뒀다. 랭체인(langchain)은 Playwright 브라우저 툴킷을 langchain-community 패키지를 통해 제공한다. AI 에이전트는 이를 통해 브라우저를 직접 다룰 수 있다. Requests 같은 도구는 정적 사이트에 적합하지만, PlayWright 브라우저 툴킷은 에이전트가 웹을 탐색하고 동적으로 렌더링된 사이트와 상호작용할 수 있도록 한다.

다음과 같은 도구들을 제공한다.

| 클래스명 | 메서드명 | 설명 |
|---|---|---|
| NavigateTool | navigate_browser | URL로 이동 |
| NavigateBackTool | previous_page | 이전 페이지로 이동 |
| ClickTool | click_element | CSS 셀렉터로 요소 클릭 |
| ExtractTextTool | extract_text | BeautifulSoup으로 텍스트 추출 |
| ExtractHyperlinksTool | extract_hyperlinks | BeautifulSoup으로 하이퍼링크 추출 |
| GetElementsTool | get_elements | CSS 셀렉터로 요소 선택 |
| CurrentPageTool | current_page | 현재 페이지 URL 반환 |

## 3. Example

이제 본격적으로 예제 코드를 살펴보자. 설명의 가독성을 위해 코드를 나눠서 설명한다. 전체 코드는 [이 레포지토리의 778c0a 커밋](https://github.com/Junhyunny/todo-agent/commit/778c0a583fcef2d3e43f024a6b9d30649339a52c)에서 확인할 수 있다. 다음과 같은 의존성이 필요하다.

```python
import asyncio
import json
from typing import Any, Dict

import nest_asyncio
from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain_aws import ChatBedrockConverse
from langchain_community.agent_toolkits import PlayWrightBrowserToolkit
from langchain_core.runnables import RunnableConfig
from playwright.async_api import ViewportSize, async_playwright
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
```

아래 코드를 통해 중첩된 이벤트 루프 실행을 허용하고, 환경변수를 주입하며, 보기 좋은 로깅을 위한 콘솔 객체를 준비한다.

```python
nest_asyncio.apply()
load_dotenv()

console = Console(soft_wrap=True)
```

토이 프로젝트는 AWS 베드록(bedrock)을 사용하는 중이다. ChatBedrockConverse 클래스를 사용해 LLM(large language model) 객체를 생성한다. 클로드(claude sonnet 4.6)을 사용했다.

```py
llm = ChatBedrockConverse(
  model="jp.anthropic.claude-sonnet-4-6",
  region_name="ap-northeast-1",
  temperature=0.5,
)
```

Playwright 의존성을 통해 브라우저를 생성한다. 브라우저를 생성할 때 headless 옵션을 false 값으로 설정하면 실제로 브라우저가 조작되는 모습을 확인할 수 있다. true 값으로 설정하면 백그라운드에서 동작한다.

```python
async def create_browser():
  playwright = await async_playwright().start()
  browser = await playwright.chromium.launch(headless=False)
  viewport_size: ViewportSize = {"width": 1280, "height": 800}
  context = await browser.new_context(
    viewport=viewport_size,
    locale="ko-KR",
  )
  return browser, context
```

이제 main 함수를 살펴보자. 설명의 가독성을 위해 주석으로 설명을 추가한다.

```python
async def main():
  # [1] 브라우저를 생성한다.
  browser, context = await create_browser()
  # [2] 해당 브라우저를 사용해서 툴킷 객체를 생성한다.
  toolkit = PlayWrightBrowserToolkit.from_browser(async_browser=browser)
  # [3] 해당 툴킷이 제공하는 도구 리스트를 반환한다.
  tools = toolkit.get_tools()
  # [4] create_agent 함수로 에이전트를 생성한다.
  agent = create_agent(
    model=llm,
    tools=tools,
    system_prompt="""
    You are a web assistant.
    If you need to wait for user's actions, then DO NOT stop the process.
    Wait it until meeting the condition in the user prompt while refetch the web page.
    Fetching interval is at least 5 seconds to use token efficiently.""",
  )

  result = ""
  # [5] 프롬프트를 정의한다.
  command = {
    "messages": [
      {
        "role": "user",
        "content": search_prompt,
      }
    ]
  }
  config: RunnableConfig = {"recursion_limit": 1000}

  # [6] 에이전트가 프롬프트를 실행한다. 리액트 에이전트의 추론-행동-관찰을 로그로 살펴보기 위해 스트림으로 처리한다.
  async for event in agent.astream_events(command, config=config):
    kind = event["event"]
    name = event.get("name", "")
    data = event.get("data")
    if kind == "on_chat_model_start":
      print_rule("Agent is Thinking", "yellow")
    elif kind == "on_tool_start":
      tool_input = get_input(data)
      print_panel(tool_input, name, "cyan")
    elif kind == "on_tool_end":
      output = str(data.get("output", ""))[:300]
      print_panel(output, "Tool Result", "green")
    elif kind == "on_chain_end" and name == "LangGraph":
      result = get_message(data)

  # [7] 최종 결과를 출력한다.
  console.print()
  print_rule("Final Answer", "magenta")
  console.print(Markdown(result))
  print_rule("", "magenta")
```

메인 함수를 실행하는 코드를 맨 마지막에 작성한다.

```python
if __name__ == "__main__":
  asyncio.run(main())
```

이제 코드를 실행해보자. 먼저 웹 검색을 수행하는 프롬프트를 실행해보자. 다음과 같은 프롬프트를 AI 에이전트에게 전달한다.

```python
search_prompt = """
  1. 인터넷에서 "Junhyunny"라는 키워드로 검색한다.
  2. 검색 결과 중 TOP 5 사이트들에 방문한다.
  3. 방문 내용들을 요약, 정리 후 최종 답변으로 제시한다.
"""
```

위 프롬프트를 실행하면 AI 에이전트가 브라우저를 조작해서 웹 검색을 수행하고 내용을 요약한다.

<div align="center">
  <img src="/images/posts/2026/react-agent-web-search-with-playwright-browser-toolkit-01.gif" width="100%" class="image__border">
</div>

<br/>

AI 에이전트는 다음과 같이 사이트 내용들을 요약해줬다.

```
───────────────────────────────────────────────────── Final Answer ─────────────────────────────────────────────────────
5개 사이트 모두 방문 완료했습니다! 이제 수집한 모든 정보를 종합하여 최종 답변을 드리겠습니다.

------------------------------------------------------------------------------------------------------------------------

🔍 "Junhyunny" 검색 결과 TOP 5 사이트 요약 정리

------------------------------------------------------------------------------------------------------------------------

1️⃣ GitHub 프로필 — github.com/Junhyunny

▌ 강준현(Junhyun Kang)의 공식 GitHub 계정                                                                             

 • 이름: 강준현 (Junhyun Kang)                                                                                          
 • 직책: 시니어 소프트웨어 엔지니어 (Senior Software Engineer)                                                          
 • 소속: @Bekind-Labs (서울, 한국)                                                                                      
 • 블로그: https://junhyunny.github.io/                                                                                 
 • LinkedIn: in/junhyun-kang-32b972201                                                                                  
 • 주요 활동: 최근 1년간 1,251회 커밋 (야간 활동 33.1%로 가장 활발)                                                     
 • 주요 레포지토리: blog-in-action (블로그 PoC 코드 저장소, HTML, ⭐14)                                                 
 • 최근 기여: junhyunny.github.io, todo-agent, blog-in-action 등 다수 레포지토리에 기여 중                              

------------------------------------------------------------------------------------------------------------------------

2️⃣ 개인 기술 블로그 — junhyunny.github.io

▌ "Junhyunny's Devlogs" — 소프트웨어 엔지니어 / 작가의 기술 블로그                                                    

 • 운영 기간: 2020년 ~ 2026년 현재 (총 약 489개 이상의 포스트)                                                          
 • 연도별 포스트 수: 2020(4), 2021(119), 2022(117), 2023(118), 2024(72), 2025(45), 2026(14)                             
 • 주요 기술 주제:                                                                                                      
    • ☕ Java/Spring Boot, JPA, Spring Security                                                                         
    • ⚛️ React, TypeScript, JavaScript                                                                                  
    • 🐳 Docker, Kubernetes, CI/CD                                                                                      
    • ☁️ AWS (ECS, DynamoDB, Lambda, CDK, Bedrock)                                                                      
    • 🤖 AI/LLM (LangChain, RAG, MCP, ReAct 에이전트)                                                                   
    • 🔒 보안 (OAuth2, JWT, CSRF, XSS)                                                                                  
    • 🧪 테스트 (TestContainer, Jest, Playwright)                                                                       
 • 최신 포스트: ReAct 에이전트, Electron 프레임워크, AWS API Gateway, Axios 보안 취약점(CVE) 등                         
 • 저서: 📚 안쪽까지 들여다보는 스프링 시큐리티 집필                                                                    

------------------------------------------------------------------------------------------------------------------------

3️⃣ Stack Overflow 프로필 — stackoverflow.com/users/14859847/junhyunny

▌ 개발 커뮤니티 Q&A 활동 프로필                                                                                       

 • 가입: 5년 3개월 전                                                                                                   
 • 평판(Reputation): 924점                                                                                              
 • 도달 범위: 약 150,000명에게 답변 영향                                                                                
 • 활동 내역: 23개 답변, 4개 질문                                                                                       
 • 주요 태그: reactjs, json, java, javascript, html, spring-boot                                                        
 • 대표 답변: "Cannot use import statement outside a module" with Axios (점수 53 — 가장 높은 답변)                      
 • 배지: 은배지 6개, 동배지 15개                                                                                        

------------------------------------------------------------------------------------------------------------------------

4️⃣ GitHub README 레포지토리 — github.com/Junhyunny/Junhyunny

▌ 자기소개 README 레포지토리                                                                                          

 • 본인을 **시니어 소프트웨어 엔지니어 겸 작가(author)**로 소개                                                         
 • 블로그, Stack Overflow, LinkedIn 링크 공유                                                                           
 • 저서 안쪽까지 들여다보는 스프링 시큐리티 소개                                                                        
 • 최근 업데이트: 2026년 2월 28일                                                                                       

------------------------------------------------------------------------------------------------------------------------

5️⃣ CodePen 프로필 — codepen.io/Junhyunny

▌ 프론트엔드 UI/UX 코드 실험 공간                                                                                     

 • 팔로워: 1명                                                                                                          
 • 주요 Pen 작품 (7개):                                                                                                 
                                                                                                                        
    작품명                         조회수                                                                               
    ─────────────────────────────────────                                                                               
    Customizing Pagination Swiper  1,071                                                                                
    Customizing Navigation         994                                                                                  
    Carousel text fade in          187                                                                                  
    Custom Radio Button            109                                                                                  
    Webcam Frame Filters           102                                                                                  
    Custom slider                  64                                                                                   
    Sprite Image Animation         48                                                                                   
                                                                                                                        
 • 블로그 포스트와 연계된 UI 컴포넌트 데모 중심                                                                         

------------------------------------------------------------------------------------------------------------------------

📌 종합 결론

**Junhyunny(강준현)**는 서울에 거주하는 한국인 시니어 풀스택 소프트웨어 엔지니어 겸 기술 작가입니다.

                                                                                  
 항목             내용                                                            
 ──────────────────────────────────────────────────────────────────────────────── 
 주요 기술 스택   Java/Kotlin, Spring Boot, TypeScript, React                     
 현 소속          Bekind Labs (2025.01 ~ 현재)                                    
 경력             POSCO ICT → Geneuin → VMWare Tunzu Labs → Bekind Labs (약 8년+) 
 주요 클라이언트  Toyota, Honda, KB국민은행, LG U+, 한국보건산업진흥원 등         
 저서             안쪽까지 들여다보는 스프링 시큐리티                             
 블로그 포스트    약 489개+ (2020~2026)                                           
 학력             한성대학교 정보통신공학과 (학점 4.45/4.5, 최우수 졸업)          
 특이사항         최근 AI/LLM, MCP, AWS Bedrock 등 최신 기술 학습 및 공유 활발    
                                                                                  

꾸준한 기술 블로그 운영과 오픈소스 기여를 통해 개발 커뮤니티에 지식을 공유하는 활발한 개발자입니다! 🚀
───────────────────────────────────────────────────────────  ───────────────────────────────────────────────────────────
```

이메일 내용 요약을 시켜보자. 다음과 같은 프롬프트를 실행한다. AI 에이전트가 직접 로그인을 하는 것이 아니라 사용자가 로그인을 완료하는 것을 기다리도록 프롬프트를 작성한다.

```python
email_prompt = """
  1. 네이버 로그인 화면으로 진입한다. 사용자의 로그인을 기다린다.
  2. 로그인이 완료된 것을 확인했다면 메일 화면으로 이동한다.
  3. 메일 화면에서 보이는 메일들을 하나씩 열어서 읽는다.
  4. 메일 내용을 요약 후 사용자에게 전달한다.
"""
```

위 프롬프트를 실행하면 AI 에이전트가 사용자 로그인을 기다린다. AI 에이전트가 사용자 로그인이 완료되었다고 판단을 내리면, 브라우저를 조작해서 이메일을 읽고 내용을 요약한다.

<div align="center">
  <img src="/images/posts/2026/react-agent-web-search-with-playwright-browser-toolkit-02.gif" width="100%" class="image__border">
</div>

<br/>

AI 에이전트는 다음과 같이 메일 내용을 요약해줬다.

```
───────────────────────────────────────────────────── Final Answer ─────────────────────────────────────────────────────
모든 메일을 다 읽었습니다! 이제 전체 내용을 요약해서 전달드리겠습니다.

------------------------------------------------------------------------------------------------------------------------

📬 받은 메일함 요약 (총 4개)

------------------------------------------------------------------------------------------------------------------------

📧 메일 1 — Spring Boot Pre-release v4.1.0-M3

 • 발신: Spring Builds (GitHub notifications)                                                                           
 • 수신일: 2026년 3월 20일 (금) 오전 11:51                                                                              
 • 내용 요약:                                                                                                           
    • spring-projects/spring-boot 저장소의 v4.1.0-M3 사전 릴리즈 알림                                                   
    • ⚠️ 주의 사항: OpenTelemetry의 ZipkinSpanExporter 제거 예정 사전 경고, Tomcat 기본 max part count 이슈             
    • ⭐ 신규 기능 (주요):                                                                                              
       • Generic AMQP 1.0 클라이언트 지원 추가                                                                          
       • spring-boot-amqp → spring-boot-rabbitmq 이름 변경                                                              
       • OTLP 메트릭/트레이스/로깅에 SslBundles 지원 추가                                                               
       • Spring gRPC 서버/클라이언트 지원 전면 추가 (보안, 헬스체크, 테스팅 포함)                                       
       • LiveReload 지원 Deprecated 처리                                                                                
       • Spring Batch MongoDB 지원 추가                                                                                 
    • 🐞 버그 수정: 12건 (EndpointRequest, CloudFoundry, Docker, RSocket 등)                                            
    • 📔 문서 개선: 14건                                                                                                
    • 🔨 의존성 업그레이드: 다수 (Spring Framework 7.0.6, Spring Security 7.1.0-M3, Kotlin 2.3.20, Hibernate 7.2.7 등)  

------------------------------------------------------------------------------------------------------------------------

📧 메일 2 — Spring Boot Release v3.5.12

 • 발신: Spring Builds (GitHub notifications)                                                                           
 • 수신일: 2026년 3월 19일 (목) 오후 11:04                                                                              
 • 내용 요약:                                                                                                           
    • spring-projects/spring-boot 저장소의 v3.5.12 정식 릴리즈 알림                                                     
    • 🐞 버그 수정 (주요):                                                                                              
       • EndpointRequest health group 매처 복잡도 문제 수정                                                             
       • spring.main.cloud-platform=none 클라우드 기능 비활성화 안 되던 문제 수정                                       
       • Docker Compose SSL 지원 문제 수정                                                                              
       • spring.config.import 순서 불일치 문제 수정                                                                     
    • 📔 문서 개선: 10건                                                                                                
    • 🔨 의존성 업그레이드: Spring Framework 6.2.17, Spring Security 6.5.9, Micrometer 1.15.10, Hibernate 6.6.44 등     

------------------------------------------------------------------------------------------------------------------------

📧 메일 3 — Spring Boot Release v4.0.4

 • 발신: Spring Builds (GitHub notifications)                                                                           
 • 수신일: 2026년 3월 19일 (목) 오후 10:54                                                                              
 • 내용 요약:                                                                                                           
    • spring-projects/spring-boot 저장소의 v4.0.4 정식 릴리즈 알림                                                      
    • ⚠️ 주의 사항: OpenTelemetry ZipkinSpanExporter 제거 예정 경고, Jackson BOM 업그레이드, Tomcat max part count 이슈 
    • 🐞 버그 수정 (주요):                                                                                              
       • EndpointRequest, CloudFoundry, Docker, RSocket 관련 수정                                                       
       • Authorization server Customizer bean 설정 덮어쓰기 문제 수정                                                   
       • WAR 배포 시 ErrorPageRegistrarBeanPostProcessor 미설정 문제 수정                                               
       • HTTP Service Interface가 네이티브 이미지에서 동작 안 하는 문제 수정                                            
    • 📔 문서 개선: 14건 (Java 26 지원 문서 포함)                                                                       
    • 🔨 의존성 업그레이드: Spring Framework 7.0.6, Spring Security 7.0.4, Hibernate 7.2.7, Testcontainers 2.0.4 등     

------------------------------------------------------------------------------------------------------------------------

📧 메일 4 — Open Claw GitHub Contributors Airdrop: 5003 $CLAW ⚠️ 주의!

 • 발신: 0penCIaw-334619 (notifications@github.com)                                                                     
 • 수신일: 2026년 3월 18일 (수) 오후 10:16                                                                              
 • 내용 요약:                                                                                                           
    • GitHub 기여자들을 대상으로 5,000 $CLAW 에어드랍 지급 대상자로 선정됐다는 내용                                     
    • @Junhyunny 계정이 선정 목록에 포함되어 있으며, 특정 링크를 통해 지갑을 등록하라고 유도                            
    • ⚠️ 피싱/스캠 의심 메일입니다! 실제 GitHub 공식 알림처럼 위장했지만, 암호화폐 에어드랍을 미끼로 외부 링크 접속을 유

------------------------------------------------------------------------------------------------------------------------


▌ 📌 총 요약: Spring Boot 관련 릴리즈 알림 3건 (v4.1.0-M3 프리릴리즈, v3.5.12 및 v4.0.4 정식 릴리즈)과 피싱 의심 에어 
───────────────────────────────────────────────────────────  ───────────────────────────────────────────────────────────
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/todo-agent>

#### REFERENCE

- <https://docs.langchain.com/oss/python/releases/langchain-v1>
- <https://docs.langchain.com/oss/python/migrate/langchain-v1>
- <https://reference.langchain.com/python/langchain/agents/factory/create_agent>
- <https://docs.langchain.com/oss/python/integrations/providers/aws>
- <https://docs.langchain.com/oss/python/integrations/chat/bedrock>
- <https://reference.langchain.com/python/langchain-community/agent_toolkits/playwright/toolkit/PlayWrightBrowserToolkit>
- <https://docs.langchain.com/oss/python/integrations/tools/playwright>
- <https://docs.langchain.com/oss/python/langgraph/streaming>
- <https://docs.aws.amazon.com/ko_kr/bedrock/latest/APIReference/API_runtime_Converse.html>
- <https://docs.langchain.com/oss/python/integrations/providers/aws#amazon-bedrock-agentcore-browser>
- <https://docs.langchain.com/oss/python/integrations/providers/microsoft#playwright-browser-toolkit>

[lang-chain-link]: https://junhyunny.github.io/ai/large-language-model/langchain/lang-chain/
[react-agent-link]: https://junhyunny.github.io/ai/ai-agent/langchain/react-agent/react-agent/
[using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test-link]: https://junhyunny.github.io/e2e-test/playwright/tracker-boot/ai-agent/large-language-model/model-context-protocol/context-engineering/using-playwright-mcp-and-tracker-boot-mcp-for-e2e-test/