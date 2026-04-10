---
title: "2026년 3월 Axios 서플라이 체인(supply chain) 공격"
search: false
category:
  - security
  - javascript
  - axios
  - cwe-506
last_modified_at: 2026-04-10T10:00:00+09:00
---

<br/>

## 1. Incident Overview

2026년 3월 30일부터 31일에 걸쳐 발생한 `axios` 서플라이 체인(공급망) 공격은 매주 1억 회 이상 다운로드되는 인기 자바스크립트(JavaScript) HTTP 클라이언트 라이브러리를 표적으로 한 대규모 침해 사건이다. 이 공격은 북한의 지원을 받는 국가 배후 해킹 그룹의 소행으로 파악되고 있다.

서플라이 체인 공격은 최종 타깃을 직접 공격하는 대신, 그 타깃이 신뢰하는 제3자(공급업체, 오픈소스 라이브러리, 빌드 시스템 등)를 먼저 침해하여 간접적으로 공격하는 방식이다. 직접 공격보다 탐지가 훨씬 어렵다. 피해자 입장에서는 "신뢰할 수 있는 출처"에서 온 소프트웨어나 업데이트를 받은 것이기 때문에 의심하지 않기 때문이다. 주요 공격 유형은 다음과 같다.

- 오픈소스 패키지 오염: npm, PyPI, RubyGems 같은 패키지 저장소에 악성 코드를 심는 방식이다.
- 빌드/CI-CD 파이프라인 침해: 소스코드는 정상이지만, 빌드 과정에서 악성 코드가 삽입된다.
- 소프트웨어 업데이트 메커니즘 악용: 정상적인 자동 업데이트 채널을 통해 악성 코드가 배포된다.
- 하드웨어/펌웨어 수준: 제조 단계에서 칩이나 펌웨어에 백도어를 심는 방식이다. 탐지가 사실상 불가능에 가깝다.

감염된 버전은 다음과 같다.

- axios@1.14.1
- axios@0.30.4

공격자는 axios 주요 메인테이너인 `jasonsaayman`의 npm 및 GitHub 계정을 탈취 후 정상적인 CI/CD 배포 파이프라인을 우회하고 탈취된 장기 유효 토큰(long-lived token)을 이용해 악성 버전을 직접 npm 레포지토리에 배포했다. 공격자는 실제 axios 소스 코드는 수정하지 않았다. 대신 `package.json` 파일만을 조작하여, 공격 발생 18시간 전에 미리 만들어둔 악성 패키지인 `plain-crypto-js@4.2.1`을 의존성으로 추가했다.

다음과 같은 과정을 통해 해킹이 이뤄진다.

1. 개발자나 CI/CD 환경에서 `npm install`을 통해 감염된 axios 버전을 다운로드하면 `plain-crypto-js`가 설치된다.
2. `postinstall` 훅(hook)이 자동으로 트리거되어 난독화된 `setup.js` 스크립트가 실행된다. 
3. setup.js 스크립트는 사용자의 운영체제를 판별하여 공격자의 `C2 서버(sfrclak[.]com:8000/6202033)`와 통신하고, 플랫폼 별로 특화된 RAT(원격 접근 트로이목마)를 백그라운드에 설치한다.

각 운영체제별로 다음과 같이 해킹이 이뤄졌다.

- **Windows**에선 PowerShell을 wt.exe(Windows Terminal)로 위장해 복사한 후, VBScript를 이용해 PowerShell RAT(`6202033.ps1`)를 다운로드 및 실행하고 레지스트리에 등록하여 영구적인 백도어를 구축한다.
- **MacOS**에선 AppleScript를 사용해 C++로 컴파일된 기본 바이너리 파일(`/Library/Caches/com.apple.act.mond`)을 다운로드하고 백그라운드에서 실행한다.
- **Linux/기타**에선 Python 기반 RAT(`/tmp/ld.py`) 스크립트를 백그라운드에서 실행한다.

증거 인멸을 위한 치밀한 대응까지 이뤄졌다. 악성 스크립트가 한 번 실행되고 나면, 스스로를 삭제하고 package.json 파일을 아무 스크립트가 없는 깨끗한 가짜 파일(package.md)로 덮어씌워 개발자가 폴더를 확인하더라도 침해 사실을 눈치채지 못하게 만들었다. StepSecurity를 비롯한 커뮤니티가 GitHub에 경고성 이슈를 생성하자, 공격자는 탈취한 메인테이너 계정을 이용해 약 20차례에 걸쳐 실시간으로 이슈를 삭제하며 은폐를 시도했다.

## 2. Timeline

구체적인 타임라인을 살펴보자. 이번 axios 서플라이 체인 공격은 치밀한 사전 준비부터 사태 은폐 시도, 그리고 최종 삭제 조치까지 약 3시간의 노출 시간 동안 매우 긴박하게 진행되었다. 공격에 대한 전체 타임라인(UTC 기준)은 다음과 같다.

1. **3월 중순 (사건 발생 약 2주 전)** 공격자가 실존 기업의 창업자를 사칭해 axios 리드 메인테이너에게 접근하여 가짜 Slack 초대 및 MS Teams 화상 회의를 진행했고, 이를 통해 메인테이너의 PC에 RAT(원격 접근 트로이목마)를 감염시켜 npm 배포 권한을 탈취했다.
2. **2026년 3월 30일 05:57** 공격자가 npm에 `plain-crypto-js@4.2.0` 패키지를 업로드했다. **이 버전은 악성 코드가 전혀 없는 깨끗한 정상 패키지로, 추후 보안 시스템의 의심을 피하기 위해 미리 정상적인 배포 이력을 만들어 둔 미끼(Decoy) 작업**이었다.
3. **2026년 3월 30일 23:59** 본격적인 악성 코드가 포함된 `plain-crypto-js@4.2.1` 버전이 업로드되었다.
4. **2026년 3월 31일 00:21** 공격자가 탈취한 메인테이너 계정을 이용해, 악성 의존성을 주입한 **`axios@1.14.1`을 npm 레지스트리에 정식 배포**했다.
5. **2026년 3월 31일 00:27** 배포 후 불과 약 6분 만에 Socket, StepSecurity 등의 보안 시스템들이 악성 버전의 이상 징후를 최초로 탐지하기 시작했다.
6. **2026년 3월 31일 01:00** 공격자는 레거시 버전을 사용하는 프로젝트들까지 노리기 위해, 동일한 악성 코드를 넣은 **`axios@0.30.4` 버전도 연이어 배포**했다.
7. **2026년 3월 31일 01:00 직후** 외부 보안 전문가들과 커뮤니티 개발자들이 깃허브(GitHub)에 침해 사실을 경고하는 이슈를 생성하기 시작했다. 그러나 **공격자는 여전히 장악하고 있던 메인테이너 계정을 이용해 커뮤니티의 경고 이슈들을 약 20여 차례나 실시간으로 삭제하며 사태를 은폐하려 시도**했다.
8. **2026년 3월 31일 01:38** 사태를 인지한 또 다른 axios 공동 메인테이너가 즉시 악성 버전의 사용을 중지(deprecate)하는 조치를 취하는 PR을 올리고, 삭제된 이슈들에 대해 커뮤니티에 알리며 npm 보안 팀에 긴급 조치를 요청했다.
9. **2026년 3월 31일 03:15 ~ 03:29** npm 측의 강제 조치로 **악성 버전인 `axios@1.14.1`과 `axios@0.30.4`, 그리고 악성 의존성 패키지였던 `plain-crypto-js`가 모두 레지스트리에서 완전히 삭제(unpublish)**되었다.
10. **2026년 3월 31일 04:26** npm 공식 보안 계정이 `plain-crypto-js` 자리에 더 이상 악용될 수 없도록 안전한 빈 껍데기 파일(`0.0.1-security.0`)을 덮어씌우며 긴급 조치가 마무리되었다.

결과적으로 악성 패키지가 대중에게 노출된 시간은 약 3시간에 불과했지만, 주간 다운로드 수가 1억 회에 달하는 라이브러리였기 때문에 그 짧은 노출 시간만으로도 CI/CD 파이프라인과 수많은 개발자들의 환경에 심각한 피해를 입힌 사건으로 기록되었다.

## 3. Am I affected?

다행히 사건 발생 후 몇 시간 만에 npm 측에서 악성 버전을 레지스트리에서 삭제 처리했다. 하지만 해당 패키지가 노출된 3시간 동안 이를 다운로드했을 가능성이 있다. 다음과 같은 스크립트를 통해 자신의 PC가 감염되었는지 확인할 수 있다. 아래 명령어는 OS별로 RAT이 설치되었는지 확인하는 방법이다.

```
# macOS
ls -la /Library/Caches/com.apple.act.mond

# Linux
ls -la /tmp/ld.py

# Windows (PowerShell)
Test-Path "$env:PROGRAMDATA\wt.exe"
```

아래 명령어를 통해 악성 plain-crypto-js 패키지나 오염된 axios 버전이 설치되었는지 확인할 수 있다.

```
# Recursively search for plain-crypto-js across all projects under your home directory
find ~ -type d -name "plain-crypto-js" -path "*/node_modules/*" 2>/dev/null

# Recursively search for compromised axios versions in all package-lock.json files
find ~ -name "package-lock.json" -exec grep -l "axios.*1\.14\.1\|axios.*0\.30\.4" {} \; 2>/dev/null

# Check npm global packages
npm list -g axios 2>/dev/null | grep -E "1\.14\.1|0\.30\.4"
```

## 4. Recovery steps

피해가 확인된 경우, 아래 복구 절차를 침해가 발견된 영역별로 따른다. 기본 원칙은 악성 패키지 또는 RAT 파일 흔적이 발견된 시스템은 완전히 침해된 것으로 간주하고 그에 맞게 대응하는 것이다.

즉시 안전한 이전 버전인 `axios@1.14.0` 또는 `axios@0.30.3`으로 다운그레이드해야 한다.

```
npm install axios@1.14.0   # 1.x 사용자
npm install axios@0.30.3   # 0.x 사용자
```

악성 버전으로 다시 올라가는 것을 막기 위해 package.json에 overrides 블록을 추가한다.

```json
{
  "dependencies": { "axios": "1.14.0" },
  "overrides":    { "axios": "1.14.0" },
  "resolutions":  { "axios": "1.14.0" }
}
```

node_modules에서 plain-crypto-js를 제거하고 클린 재설치한다.

```
npm install --ignore-scripts
rm -rf node_modules/plain-crypto-js
```

CI/CD 파이프라인에서 침해 사실이 확인되는 경우 다음과 같은 조치가 필요하다.

- 셀프 호스티드(self-hosted) 러너를 사용하는 경우 러너를 침해된 개발자 머신으로 간주한다. 머신을 격리하고, 자격증명 목록을 작성한다. 포맷 후 클린 상태에서 재구성한다.
- 임시(ephemeral) 러너를 사용하는 경우(e.g. GitHub 호스티드 러너) 러너 환경 자체는 각 작업 후 폐기된다. 그러나 침해된 실행 중에 워크플로우가 접근할 수 있었던 모든 시크릿과 자격증명은 유출된 것으로 간주한다. 아래를 포함한 모든 주입된 시크릿을 즉시 교체한다.
  - npm 토큰
  - AWS 액세스 키 및 세션 토큰
  - SSH 개인키
  - 클라우드 자격증명 (GCP, Azure 등)
  - CI/CD 시크릿 (GitHub Actions secrets, 환경 변수)
  - 설치 시점에 접근 가능했던 .env 파일의 모든 값

자동화 빌드에서 postinstall 훅 실행을 방지하기 위해, CI/CD의 기본 정책으로 --ignore-scripts를 사용한다.

```
npm ci --ignore-scripts
```

개발자 머신에서 악성 패키지 또는 RAT 파일 흔적이 발견된 경우, 해당 머신은 완전히 침해된 것으로 간주해야 한다. 주요 자격증명 목록을 갱신하고, 머신은 포맷 후 재구성하는 것이 좋다. 주요 자격 증명은 다음과 같다.

- npm 토큰 (~/.npmrc)
- SSH 개인키 (~/.ssh/)
- AWS 자격증명 (~/.aws/credentials, ~/.aws/config)
- GCP 서비스 계정 키 및 애플리케이션 기본 자격증명
- Azure CLI 토큰
- Git 자격증명 및 개인 액세스 토큰 (GitHub, GitLab, Bitbucket)
- Docker 레지스트리 자격증명 (~/.docker/config.json)
- Kubernetes 설정 (~/.kube/config)
- 각 프로젝트의 로컬 .env 파일에 저장된 API 키 및 시크릿
- 브라우저에 저장된 비밀번호 및 세션 쿠키
- 데이터베이스 연결 문자열
- 로컬 패스워드 매니저나 키체인에 저장된 시크릿

예방 차원에서 공격자의 C2 인프라로 향하는 아웃바운드 트래픽을 차단하는 것도 방법이다.

```
# 방화벽으로 차단 (Linux)
iptables -A OUTPUT -d 142.11.206.73 -j DROP

# /etc/hosts로 차단 (macOS/Linux)
echo "0.0.0.0 sfrclak.com" >> /etc/hosts
```

대부분의 악성 npm 패키지는 공개 후 몇 시간 내에 탐지·제거된다. 쿨다운 기간과 최소 버전 연령 정책을 설정하면 새로 배포된 (잠재적으로 악성인) 패키지가 자동으로 도입되는 것을 막는 안전 버퍼를 확보할 수 있다. 이번 사건에서도 plain-crypto-js@4.2.1은 침해된 axios 버전이 배포되기 불과 몇 시간 전에 공개됐다. 아래 정책 중 하나라도 적용했다면 자동 도입을 막을 수 있었다.

Dependabot 쿨다운 설정을 통해 새로 배포된 버전에 대해 PR을 열기 전 Dependabot이 일정 기간 대기하도록 설정한다.

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    cooldown:
      default: 3 # 버전 배포 후 3일이 지나야 PR을 생성
```

npm (v11.10.0+)에서는 지정한 기간 내에 배포된 패키지 설치를 거부하도록 설정한다. `.npmrc`에 아래와 같은 설정을 추가한다.

```
# ~/.npmrc 또는 프로젝트 레벨 .npmrc
min-release-age=7d
```

#### REFERENCE

- <https://github.com/axios/axios/issues/10604>
- <https://github.com/axios/axios/issues/10636>
- <https://www.stepsecurity.io/blog/axios-compromised-on-npm-malicious-versions-drop-remote-access-trojan#indicators-of-compromise>
- <https://www.stepsecurity.io/blog/behind-the-scenes-how-stepsecurity-detected-and-helped-remediate-the-largest-npm-supply-chain-attack#the-alert>
- <https://app.stepsecurity.io/oss-security-feed/axios?version=0.30.4>
- <https://www.microsoft.com/en-us/security/blog/2026/04/01/mitigating-the-axios-npm-supply-chain-compromise/>
- <https://socket.dev/blog/axios-npm-package-compromised>
- <https://snyk.io/blog/axios-npm-package-compromised-supply-chain-attack-delivers-cross-platform/>
- <https://unit42.paloaltonetworks.com/axios-supply-chain-attack/>
- <https://dev.classmethod.jp/articles/npm-v11-min-release-age/>