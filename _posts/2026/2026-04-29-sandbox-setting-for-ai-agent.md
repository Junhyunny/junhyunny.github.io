---
title: "도커 샌드박스(docker sandboxes)를 통한 AI 에이전트 개발 환경 구축"
search: false
category:
  - docker-sandbox
  - micro-vm
  - ai
  - ai-agent
last_modified_at: 2026-04-29T16:01:06+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [하네스 엔지니어링(Harness Engineering)][harness-engineering-link]
- [안전한 AI 에이전트 개발 환경을 위한 샌드박스(sandbox)][sandbox-for-ai-agent-coding-link]

## 0. 들어가면서

[이전 글][sandbox-for-ai-agent-coding-link]에서 AI 에이전트를 위한 샌드박스 환경이 무엇인지 살펴봤다. 이번 글에서는 샌드박스 환경을 직접 구축해보면서 배운 내용들을 정리해보려 한다.

## 1. Why docker sandboxes?

[이전 글][sandbox-for-ai-agent-coding-link]에서도 다뤘지만, 샌드박스를 구축할 수 있는 방법은 다양하다.

- AI 에이전트에 임베드된 샌드박스 환경
- 컨테이너(container) 환경
- 유저스페이스(userspace) 커널 환경
- 마이크로VM(micro VM) 환경
- 일반 가상 머신(VM, virtual machine) 환경

이 방법들 중 호스트 머신의 커널을 공유하지 않아 격리 수준이 강력하면서도 실행 속도가 가상 머신만큼 무겁지 않은 마이크로VM을 사용해 샌드박스 환경을 구축하기로 했다. 나는 AI 에이전트로 클로드 코드(claude code), 코덱스(codex), 코파일럿(copilot)을 사용하고 있다. 각 에이전트마다 임베디드 샌드박스 환경 설정을 맞추는 것도 불편하기 때문에 특정 AI 에이전트 기술에 종속되지 않고 샌드박스를 구축할 수 있다는 사실도 장점으로 느껴졌다.

마이크로VM으로 샌드박스 환경을 구축할 수 있는 방법도 여러 가지 있지만, 도커 샌드박스(docker sandboxes)를 선택했다. 도커 샌드박스는 다음과 같은 AI 에이전트들을 지원한다.

- Claude Code
- Codex
- Copilot (GitHub Copilot CLI)
- Droid
- Gemini (Gemini CLI)
- Kiro
- OpenCode
- Docker Agent

일반적인 환경에서 에이전트에게 도커 소켓을 마운트(mount)해 주면 호스트 환경 전체에 대한 제어권을 넘겨주는 위험이 존재한다. 도커 샌드박스는 호스트와 분리된 별도의 프라이빗 도커 데몬(docker daemon)을 제공한다. 덕분에 에이전트가 샌드박스 안에서 자유롭게 이미지를 빌드하고 자체 컨테이너를 띄우거나 도커 컴포즈(docker compose)를 사용할 수 있다.

각각의 샌드박스는 서로 독립적으로 작동하며 자체적인 도커 이미지 캐시와 패키지 설치 상태를 유지한다. 샌드박스가 생성된 후 에이전트가 다운로드한 도커 이미지나 설치한 의존성 패키지, 에이전트의 상태 내역 등은 마이크로VM이 삭제(`sbx rm` 명령어)되기 전까지 재시작하더라도 영구적으로 보존된다.

개발자의 로컬 프로젝트 디렉토리는 파일시스템 패스스루(filesystem passthrough) 방식을 통해 샌드박스 내부로 직접 마운트된다. 동기화 프로세스를 거치지 않고 호스트의 실제 파일이 그대로 연결되기 때문에 변경 사항이 양방향으로 즉시 반영된다. 또한, 호스트 시스템에서 사용하는 것과 동일한 '절대 경로'가 샌드박스 내부에서도 그대로 유지되어 에러 메시지나 빌드 경로의 혼란을 줄여준다.

도커 샌드박스는 브랜치 모드(branch mode)를 지원한다. 동일한 코드베이스에서 사용자와 에이전트가 동시에 작업해야 할 때, 샌드박스의 --branch 옵션을 사용하면 에이전트 전용 Git 워크트리(worktree)와 독립적인 브랜치를 생성해준다. 에이전트의 수정 사항이 메인 작업 디렉토리에 실시간으로 반영되지 않으므로, 여러 에이전트를 동시에 돌리거나 개발자가 다른 작업을 하더라도 코드 충돌을 방지할 수 있다.

샌드박스 내부의 에이전트가 외부 인터넷으로 보내는 모든 HTTP/HTTPS 트래픽은 호스트 시스템에 위치한 프록시를 반드시 거치게 된다. 이 프록시는 두 가지 중요한 역할을 수행한다.

- **네트워크 제어**
  - 설정된 네트워크 정책(Policies)에 따라 트래픽을 허용하거나 차단한다.
- **자격 증명 주입**
  - 대부분의 AI 에이전트는 작동을 위해 모델 제공자(OpenAI, Anthropic 등)의 API 키가 필요하다.
  - 도커 샌드박스는 API 키를 VM 내부에 환경 변수나 파일 형태로 절대 저장하지 않는다.
  - 호스트 시스템에 안전하게 저장된 API 키 등의 자격 증명을 가로챈 요청 헤더에 주입한다.
  - 이 구조 덕분에 샌드박스 내부에는 API 키가 직접 노출되지 않는다.

위 내용을 바탕으로 도커 샌드박스의 아키텍처를 그려보면 다음과 같다.

```text
[ 호스트 시스템 (Host System) ]
  │
  ├── 1. 로컬 작업 공간 (Workspace)
  │      └── (양방향 파일시스템 패스스루 동기화)
  │
  ├── 2. 호스트 측 HTTP/HTTPS 프록시 (Host-side Proxy)
  │      ├── 네트워크 정책 강제 (Network Policy Enforcement)
  │      └── API 자격 증명 주입 (Credential Injection)
  │
  └── [ 하이퍼바이저 (Hypervisor / Native Virtualization) ]
       │
       └── [ 도커 샌드박스 (경량 마이크로VM) ]
             │
             ├── 독립된 리눅스 커널 (Private Linux Kernel)
             ├── 프라이빗 도커 엔진 (Private Docker Engine)
             │    └── 자체 컨테이너, 이미지, 볼륨 등
             ├── 시스템 도구 및 패키지 (apt, pip, npm 등)
             └── AI 코딩 에이전트 (Claude, Copilot 등)
```

## 2. Setup docker sandboxes

[토이 프로젝트](https://github.com/Junhyunny/todo-agent)에 샌드박스 환경을 적용해보기로 했다. 도커 데스크탑(docker desktop)에 통합되어 있던 docker sandbox 명령어는 deprecated(사용 중단)되었다. 기존의 통합 명령어는 독립적으로 실행할 수 있는 `sbx` CLI로 대체되었다. 새로운 `sbx` CLI는 완전한 도커 샌드박스 워크플로우를 제공하므로, 이제 샌드박스 기능을 사용하기 위해 더 이상 도커 데스크탑을 설치하거나 실행할 필요가 없다.

아래 명령어를 통해 `sbx` CLI를 설치할 수 있다.

```
$ brew install docker/tap/sbx
```

설치가 완료되면 아래 명령어를 사용해 샌드박스 환경을 실행할 수 있다. 아래는 클로드 코드 AI 에이전트를 위한 샌드박스 구축 명령어다.

```
$ sbx run claude .
```

위 명령어를 실행하면 도커 로그인을 요청한다.

```
You are not authenticated to Docker. Starting the sign-in flow...

Your one-time device confirmation code is: OOOO-OOOO
Open this URL to sign in: https://login.docker.com/activate?user_code=OOOO-OOOO

By logging in, you agree to our Subscription Service Agreement. For more details, see https://www.docker.com/legal/docker-subscription-service-agreement/

Waiting for authentication...
Signed in as <docker-username>.
```

도커 로그인을 완료하면 샌드박스 환경의 네트워크 정책을 결정한다. 네트워크 정책은 세 가지다.

- **Open:** 모든 외부 트래픽을 제한 없이 허용한다.
- **Balanced:** 기본적으로 외부 통신을 차단하지만, AI 모델 프로바이더 API, 패키지 관리자, 코드 저장소, 컨테이너 레지스트리 등 필수적인 개발 서비스는 기본적으로 허용한다.
- **Locked Down:** 기본적으로 모든 외부 통신을 철저히 차단하므로, 작동에 필요한 모든 도메인을 사용자가 일일이 허용 목록에 추가해야 한다.

```
Daemon started (PID: 87222, socket: /Users/<username>/Library/Application Support/com.docker.sandboxes/sandboxes/sandboxd/sandboxd.sock)
Logs: /Users/<username>/Library/Application Support/com.docker.sandboxes/sandboxes/sandboxd/daemon.log

Select a default network policy for your sandboxes:

     1. Open         — All network traffic allowed, no restrictions.
  ❯  2. Balanced     — Default deny, with common dev sites allowed.
     3. Locked Down  — All network traffic blocked unless you allow it.

  Use ↑/↓ or 1–3 to navigate, Enter to confirm, Esc to cancel.

Network policy set to "Balanced". Default deny, with common dev sites allowed.
  To change this anytime, run:
    sbx policy reset

  To configure additional policies, run:
    sbx policy allow network <host>
    sbx policy deny network <host>
```

나는 Balanced 모드를 선택했다. 필요하다면 `sbx policy reset` 명령어를 통해 네트워크 정책을 초기화할 수 있다. 네트워크 정책을 선택하면 도커 샌드박스는 로컬에 필요한 환경을 구축하고 프로젝트 경로를 마이크로VM 위에 마운트한다.

```
Creating new sandbox 'claude-todo-agent'...

...

Digest: sha256:86ecfd5d626f375bb4447843733fa92935052d992fc98be5b535b6a3098e64f7
Status: Downloaded newer image for docker/sandbox-templates:claude-code-docker
INFO: Configuring Docker
✓ Created sandbox 'claude-todo-agent'
  Workspace: /Users/<username>/Desktop/workspace/projects/personal/todo-agent (direct mount)
  Agent: claude

To connect to this sandbox, run:
  sbx run claude-todo-agent

INFO: Starting Docker daemon
Starting claude agent in sandbox 'claude-todo-agent'...
Workspace: /Users/<username>/Desktop/workspace/projects/personal/todo-agent
```

위에서 구축한 샌드박스에 재접속하려면 다음과 같은 명령어를 수행하면 된다.

```
$ sbx run claude-todo-agent
```

클로드 코드가 실행되면 로그인을 수행한다.

```
╭─── Claude Code v2.1.122 ────────────────────────────────────────────────────────────────────╮
│                                                    │ What's new                             │
 ▐▛███▜▌   Claude Code v2.1.122
▝▜█████▛▘  Sonnet 4.6 · Claude Team
  ▘▘ ▝▝    /Users/<username>/Desktop/workspace/projects/personal/todo-agent

  Opus 4.7 xhigh is now available! · /model to switch

❯ /login
```

코덱스의 경우 샌드박스를 실행할 때 로그인을 수행하면, 로그인 이후 자동으로 AI 에이전트 세션으로 진입하지 않는다. 샌드박스를 다시 실행하면 로그인된 상태로 CLI 세션에 진입한다.

### 2.1. MCP servers

도커 샌드박스는 호스트 전역(사용자 레벨) 설정(e.g. ~/.claude, ~/.codex)이나 호스트 로컬 네트워크에 직접 접근할 수 없다. 따라서 샌드박스 환경에서 MCP(model context protocol) 서버 및 설정을 사용하려면 MCP 서버 설정이 포함된 환경 설정 파일을 현재 작업 중인 '프로젝트 디렉토리' 내부에 배치해야 한다.

호스트 머신에서 로컬로 실행 중인 MCP 서버에 에이전트가 연결해야 한다면, 네트워크 격리로 인해 `127.0.0.1`이나 로컬 IP 주소로는 접근할 수 없다. 대신 다음 과정을 거쳐야 한다.

- 네트워크 정책 허용
  - 호스트 측 프록시가 요청을 전달할 수 있도록, 먼저 `sbx policy allow` 명령어로 호스트의 특정 포트를 명시적으로 허용해야 한다.
- 호스트 주소 변경
  - 프로젝트 디렉토리에 위치한 MCP 설정 파일에서 서버 URL을 지정할 때, `localhost` 대신 **host.docker.internal**을 사용해야 한다.

예를 들어, 먼저 호스트 머신에서 아래 명령어를 통해 특정 포트를 명시적으로 허용해준다.

```
$ sbx policy allow network localhost:11434
```

다음 샌드박스 내부에서 **host.docker.internal** 호스트 이름을 사용하면 호스트 머신의 프로세스에 접근할 수 있다.

```
$ curl http://host.docker.internal:11434
```

MCP 서버 설정에 `http://host.docker.internal:<MCP포트번호>` 형시의 URL을 설정하면 호스트 머신의 로컬 호스트에서 실행 중인 MCP 서버에 접근이 가능하다.

### 2.2. Customize template

만약 MCP 툴이나 서버가 호스트가 아닌 샌드박스 내부에서 직접 실행되어야 하고 특정 패키지나 의존성이 필요하다면, 커스텀 템플릿(Custom templates)을 빌드하는 것이 좋다. 이렇게 하면 필요한 툴이 사전에 모두 설치된 재사용 가능한 샌드박스 이미지를 만들어 사용할 수 있다.

클로드 코드, 코덱스, 코파일럿은 아래와 같은 공식 템플릿을 베이스 이미지로 사용한다. 원하는 AI 에이전트의 공식 샌드박스 템플릿을 기반으로 베이스 이미지(base image)를 빌드할 수 있다.

- Claude Code: docker/sandbox-templates:claude-code
- Codex: docker/sandbox-templates:codex
- Copilot: docker/sandbox-templates:copilot

샌드박스의 기본 환경은 Ubuntu 25.10을 기반으로 구성되어 있으며, 에이전트는 sudo 권한이 있는 루트가 아닌(non-root) 사용자로 실행된다. apt, pip, npm과 같은 패키지 관리자가 기본적으로 포함되어 있다. 커스텀 템플릿 이미지를 만들려면 위 템플릿 이미지를 베이스로 사용하는 도커 파일(Dockerfile)을 호스트 머신에 준비한다. 예를 들어, 아래와 같은 도커 파일을 작성할 수 있다.

- protobuf-compiler 패키지를 설치한다.

```dockerfile
FROM docker/sandbox-templates:claude-code
USER root
RUN apt-get update && apt-get install -y protobuf-compiler
USER agent
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

위 도커 파일을 이미지로 빌드한 후 원격 Docker Hub로 푸시한다. 도커 샌드박스에서 사용하는 도커 데몬은 원격 레지스트리(registry)에서 템플릿을 직접 가져오며, 호스트에 있는 로컬 도커 데몬의 이미지 저장소를 공유하지 않는다. 공개 레지스트리에 푸시할 템플릿 이미지에는 API 키, 인증 파일, 개인 설정 파일 같은 자격 증명을 포함하지 않는다. 아래 명령어를 호스트 머신에서 실행한다.

```
$ docker build -t my-org/my-template:v1 --push .
```

이미지를 다운로드받아야 하기 때문에 원격 레지스트리 주소에 대한 네트워크 접근을 허용해야 한다. 호스트 머신에서 아래 명령어를 실행한다.

```
$ sbx policy allow network "*.example.com:443,example.com:443"
```

다음 샌드박스를 실행할 때 위에서 만든 커스텀 템플릿 이미지를 사용한다. `--template` 옵션을 사용할 수 있다.

```
$ sbx run --template docker.io/my-org/my-template:v1 claude
```

### 2.3. Host-Sandbox port forwarding

`sbx ls` 명령어를 통해 현재 호스트에 준비된 샌드박스 환경들을 확인할 수 있다.

```
$ sbx ls

SANDBOX             AGENT    STATUS    PORTS   WORKSPACE
claude-todo-agent   claude   running           /Users/<username>/Desktop/workspace/projects/personal/todo-agent
```

필요하다면 호스트의 포트를 샌드박스 프로세스로 포트 포워딩(port forwarding)할 수 있다.

```
$ sbx ports claude-todo-agent --publish 8080:3000

Published 127.0.0.1:8080 -> 3000/tcp
```

다시 `sbx ls` 명령어를 실행하면 호스트 머신의 8080 포트가 샌드박스의 3000 포트로 포워딩된 상태임을 확인할 수 있다.

```
$ sbx ls

SANDBOX             AGENT    STATUS    PORTS                      WORKSPACE
claude-todo-agent   claude   running   127.0.0.1:8080->3000/tcp   /Users/<username>/Desktop/workspace/projects/personal/todo-agent
```

아래 명령어를 통해 포트 포워딩을 중지할 수도 있다.

```
$ sbx ports claude-todo-agent --unpublish 8080:3000

Unpublished 127.0.0.1:8080 -> 3000/tcp
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/todo-agent>

#### REFERENCE

- <https://docs.docker.com/ai/sandboxes/agents/>
- <https://docs.docker.com/ai/sandboxes/security/isolation/>
- <https://docs.docker.com/ai/sandboxes/get-started/#run-your-first-sandbox>
- <https://docs.docker.com/ai/sandboxes/docker-desktop/>
- <https://docs.docker.com/ai/sandboxes/architecture/>
- <https://docs.docker.com/ai/sandboxes/customize/templates/#build-a-custom-template>

[harness-engineering-link]: https://junhyunny.github.io/ai/ai-agent/coding-agent/harness-engineering/harness-engineering/
[sandbox-for-ai-agent-coding-link]: https://junhyunny.github.io/sandbox/virtual-machine/micro-vm/ai/ai-agent/sandbox-for-ai-agent-coding/
