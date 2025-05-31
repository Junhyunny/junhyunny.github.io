---
title: "NPM 버전과 관리"
search: false
category:
  - npm
  - react
  - dependency-version
last_modified_at: 2025-05-29T23:55:00
---

<br/>

## 1. Semantic Versioning

시맨틱 버전(semantic versioning)은 가장 많이 사용하는 버전 관리 방법이다. 버전은 3개의 숫자로 구성되며 다음과 같은 의미를 갖는다.

> MAJOR.MINOR.PATCH

- MAJOR version
  - 호환되지 않는 API 변경이 발생하는 경우 주 버전이 변경된다.
  - e.g. 1.2.3 → 2.0.0
- MINOR version
  - 기존 버전과 호환되면서 새로운 기능이 추가될 때 부 버전이 변경된다.
  - e.g. 1.2.3 → 1.3.0 
- PATCH version 
  - 기존 버전과 호환되면서 버그 수정이나 내부적인 개선이 있을 때 수 버전이 변경된다.
  - e.g. 1.2.3 → 1.2.4

구체적인 규칙이나 부가적인 버전 정보를 추가하는 방법에 대해선 [이 링크](https://semver.org/#semantic-versioning-specification-semver)를 참고하길 바란다.

## 2. package.json and package-lock.json

`npm` 커맨드를 사용하면 `package.json`, `package-lock.json` 파일이 생성된다. 각 파일은 어떤 정보가 담겨있을까? 우선 package.json 파일을 살펴보자. package.json 파일은 프로젝트에 대한 메타데이터와 의존성 목록을 정의한 파일이다. 이 파일에 포함되는 내용들 중 자주 사용되는 것들은 다음과 같다.

- name
  - 패키지 이름
- version 
  - 현재 프로젝트 버전
- main 
  - 패키지의 진입점(entry point)이 되는 파일 경로
- scripts 
  - 주로 사용되는 실행 커맨드들을 정의
  - e.g. npm run start
- dependencies 
  - 실행에 필요한 패키지들
  - 서버 런타임 라이브러리
- devDependencies 
  - 개발에만 필요한 패키지들
  - e.g. 테스트 도구, lint, format

```json
{
  "name": "my-sample-app",
  "version": "1.0.0",
  "description": "A simple Node.js app example",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \"No tests yet\""
  },
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}
```

프로젝트에 필요한 의존성들은 package.json 파일에 정의되어 있는데, package-lock.json 파일은 왜 필요할까? package-lock.json 파일은 node_modules 경로에 설치된 패키지들의 의존성 트리를 기록하는 파일이다. `npm install` 명령어에 의해 자동으로 생성되고 업데이트되므로 개발자가 직접 수정하는 것을 권장하지 않는다. 다음과 같은 정보가 들어있다.

- 프로젝트에서 사용하는 의존성들의 실제 버전과 무결성 해시(integrity hash)
- 프로젝트에서 사용하는 의존성들이 필요로 하는 다른 하위 패키지들(의존성 트리)의 정확한 버전 정보

```json
{
  "name": "my-sample-app",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "dependencies": {
        "express": "^4.18.2"
      },
      "devDependencies": {
        "nodemon": "^2.0.22"
      }
    },
    "node_modules/express": {
      "version": "4.18.2",
      "resolved": "https://registry.npmjs.org/express/-/express-4.18.2.tgz",
      "integrity": "sha512-AbCdEfGhIjK...",
      "dependencies": {
        "body-parser": "~1.20.1",
        "cookie": "0.5.0"
      }
    },
    "node_modules/nodemon": {
      "version": "2.0.22",
      "resolved": "https://registry.npmjs.org/nodemon/-/nodemon-2.0.22.tgz",
      "integrity": "sha512-XyZ123...",
      "dev": true
    }
  }
}
```

package-lock.json 파일에 정확한 버전 정보를 표기하는 이유는 왜일까? package.json 파일에 npm 패키지 버전을 명시할 때 정확한 정보를 명시하지 않고, 버전 범위(version range)를 지정하는 경우가 많다. 간단히 예를 들어보자. 

- `^1.2.3`는 주(major) 버전이 동일한 범위 내에서 최신 버전을 허용한다. 1.2.3 <= version < 2.0.0 범위의 버전이 설치될 수 있다.
- `~1.2.3`는 부(minor) 버전이 동일한 범위 내에서 최신 버전을 허용한다. 1.2.3 <= version < 1.3.0 범위의 버전이 설치될 수 있다.
- `1.2.3`는 정확히 이 버전만을 허용한다.

캐럿(caret, ^)의 경우에는 왼쪽에서부터 주 버전까지 0인지 마이너 버전까지 0인지에 따라 동작 범위가 달라진다. 틸드(tilde, ~)의 경우에는 주 버전만 표시하는냐 부 버전까지 표시하느냐에 따라 동작 범위가 달라진다. 자세한 내용은 [이 글](https://velog.io/@vekkary/semantic-Version%EA%B3%BC-Version-Range-Syntax)를 참조하길 바란다. 버전 범위를 사용하는 이유는 패키지 버전을 업데이트할 때 프로젝트가 특정 버전의 패키지와 하위 호환성을 유지하면서도 새로운 기능을 추가하거나 버그 수정이 이뤄진 최신 버전을 안전하게 사용하기 위함이다. 하지만 편의를 위한 버전 범위 때문에 문제가 발생한다. package-lock.json 파일이 없을 떄 발생할 수 있는 문제의 예를 들어보겠다. 다음과 같은 의존성을 사용하는 프로젝트가 있다.

```
"express": "^4.18.0"
```

새로운 개발자A가 팀에 합류했다. 원격 레포지토리에서 프로젝트를 클론(clone)하고 npm install 명령어를 수행했을 떄 `4.18.1`가 설치됐다. 다음날 개발자B가 팀에 합류했다. 동일하게 프로젝트를 클론하고 npm install 명령어를 수행하니 `4.19.0`이 설치됐다. 서로 다른 버전을 사용하기 때문에 개발자A와 개발자B의 로컬 환경에서 실행 결과가 서로 다를 가능성이 생겼다. 매일 수십번씩 동작하는 파이프라인이 동작할 때마다 서로 다른 버전으로 설치될 가능성도 있다. 

package-lock.json 파일이 있는 경우 npm은 기록된 정확한 버전과 해시 정보를 기반으로 패키지를 설치한다. 그러므로 항상 동일한 결과를 보장한다. CI/CD 환경이나 협업 시 의존성이 불일치하는 것을 방지한다. 부가적으로 무결성 해시는 패키지가 변조되었거나 의도치 않게 다른 버전으로 설치되는 경우 발생하는 보안 리스크를 방지하는 용도로 사용된다.

## 3. npm commands with regard to version

프로젝트 버전 관리에 도움이 되는 몇 가지 npm 명령어를 살펴보자. 

#### 3.1. npm oudated

현재 설치된 패키지 중 업데이트가 가능한 것들을 목록으로 출력한다. 터미널 상에서 보면 색상이 표시된다. 

- Current - 현재 설치된 버전
- Wanted - package.json 파일에 명시된 버전 범위를 만족하는 버전 중 최신 버전
- Latest - 패키지 레지스트리(registry)에 최신으로 태그된 버전(SemVer 규칙을 무시한 최신 버전)

```
$ npm outdated
Package                      Current    Wanted    Latest  Location                                  Depended by
@eslint/js                    9.24.0    9.27.0    9.27.0  node_modules/@eslint/js                   frontend
@mantine/charts               7.17.3    7.17.7     8.0.2  node_modules/@mantine/charts              frontend
@mantine/core                 7.17.3    7.17.7     8.0.2  node_modules/@mantine/core                frontend
@mantine/hooks                7.17.3    7.17.7     8.0.2  node_modules/@mantine/hooks               frontend
@tabler/icons-react           3.31.0    3.33.0    3.33.0  node_modules/@tabler/icons-react          frontend
@types/node                  22.14.0  22.15.24  22.15.24  node_modules/@types/node                  frontend
@types/react                 18.3.20   18.3.23    19.1.6  node_modules/@types/react                 frontend
@types/react-dom              18.3.6    18.3.7    19.1.5  node_modules/@types/react-dom             frontend
@vitejs/plugin-react           4.3.4     4.5.0     4.5.0  node_modules/@vitejs/plugin-react         frontend
@vitest/coverage-v8            2.1.9     3.1.4     3.1.4  node_modules/@vitest/coverage-v8          frontend
axios                          1.8.4     1.9.0     1.9.0  node_modules/axios                        frontend
date-fns                       3.6.0     3.6.0     4.1.0  node_modules/date-fns                     frontend
eslint                        9.14.0    9.14.0    9.27.0  node_modules/eslint                       frontend
eslint-config-prettier         9.1.0     9.1.0    10.1.5  node_modules/eslint-config-prettier       frontend
eslint-plugin-prettier         5.2.6     5.4.0     5.4.0  node_modules/eslint-plugin-prettier       frontend
eslint-plugin-react-refresh   0.4.19    0.4.20    0.4.20  node_modules/eslint-plugin-react-refresh  frontend
globals                      15.15.0   15.15.0    16.2.0  node_modules/globals                      frontend
jsdom                         24.1.3    24.1.3    26.1.0  node_modules/jsdom                        frontend
msw                            2.7.3     2.8.6     2.8.6  node_modules/msw                          frontend
react                         18.3.1    18.3.1    19.1.0  node_modules/react                        frontend
react-dom                     18.3.1    18.3.1    19.1.0  node_modules/react-dom                    frontend
react-router-dom              6.30.0    6.30.1     7.6.1  node_modules/react-router-dom             frontend
sass                          1.86.3    1.89.0    1.89.0  node_modules/sass                         frontend
typescript-eslint             8.29.1    8.33.0    8.33.0  node_modules/typescript-eslint            frontend
vite                          5.4.17     6.3.5     6.3.5  node_modules/vite                         frontend
vitest                         2.1.9     3.1.4     3.1.4  node_modules/vitest                       frontend
vitest-sonar-reporter          2.0.0     2.0.1     2.0.1  node_modules/vitest-sonar-reporter        frontend
```

#### 3.2. npm update

package.json 파일에 명시된 버전 범위 내에서 패키지들을 최신 버전(Wanted 버전)으로 업데이트한다. 업데이트 후에는 package-lock.json 파일도 자동으로 갱신된다.

```
$ npm update

added 10 packages, removed 1 package, changed 103 packages, and audited 514 packages in 29s

117 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

```
$ npm outdated
Package                 Current   Wanted  Latest  Location                             Depended by
@mantine/charts          7.17.7   7.17.7   8.0.2  node_modules/@mantine/charts         frontend
@mantine/core            7.17.7   7.17.7   8.0.2  node_modules/@mantine/core           frontend
@mantine/hooks           7.17.7   7.17.7   8.0.2  node_modules/@mantine/hooks          frontend
@types/react            18.3.23  18.3.23  19.1.6  node_modules/@types/react            frontend
@types/react-dom         18.3.7   18.3.7  19.1.5  node_modules/@types/react-dom        frontend
date-fns                  3.6.0    3.6.0   4.1.0  node_modules/date-fns                frontend
eslint                   9.14.0   9.14.0  9.27.0  node_modules/eslint                  frontend
eslint-config-prettier    9.1.0    9.1.0  10.1.5  node_modules/eslint-config-prettier  frontend
globals                 15.15.0  15.15.0  16.2.0  node_modules/globals                 frontend
jsdom                    24.1.3   24.1.3  26.1.0  node_modules/jsdom                   frontend
react                    18.3.1   18.3.1  19.1.0  node_modules/react                   frontend
react-dom                18.3.1   18.3.1  19.1.0  node_modules/react-dom               frontend
react-router-dom         6.30.1   6.30.1   7.6.1  node_modules/react-router-dom        frontend
```

#### 3.3. npm install

npm install 명령어는 프로젝트를 만든 후 package.json 파일에 정의된 의존성들을 설치할 떄 사용한다. npm update 명령어는 버전 범위 자체를 변경하지 못한다. 버전 범위를 초과하는 주 버전의 변경이 필요한 경우 `npm install <package-name>@<version|tag>` 명령어를 사용한다.

```
$ npm install date-fns@4

changed 1 package, and audited 514 packages in 816ms

117 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

```
$ npm list date-fns

frontend@0.0.0 /Users/junhyunny/Desktop/workspace/projects/project/frontend
└── date-fns@4.1.0
```

#### 3.4. Peer Dependencies

의존성의 주 버전을 올리다보면 충돌에 의해 설치가 실패할 떄가 있다. 보통 피어 의존성들(peer dependencies)이 맞지 않는 경우인 것 같다. 피어 의존성이란 특정 패키지가 제대로 작동하기 위해 필요한 다른 패키지(의존성)의 버전을 명시적으로 요구할 때 사용하는 개념이다. package-lock.json 파일에 정의된 eslint-config-prettier 패키지 정보를 살펴보자.

- eslint-config-prettier 패키지가 정상적으로 동작하기 위해선 7.0.0 이상 버전의 eslint 패키지가 필요하다. 

```json
    "node_modules/eslint-config-prettier": {
      "version": "9.1.0",
      "resolved": "https://registry.npmjs.org/eslint-config-prettier/-/eslint-config-prettier-9.1.0.tgz",
      "integrity": "sha512-NSWl5BFQWEPi1j4TjVNItzYV7dZXZ+wP6I6ZhrBGpChQhZRUaElihE9uRRkcbRnNb76UMKDF3r+WTmNcGPKsqw==",
      "dev": true,
      "license": "MIT",
      "bin": {
        "eslint-config-prettier": "bin/cli.js"
      },
      "peerDependencies": {
        "eslint": ">=7.0.0"
      }
    },
```

피어 의존성을 확인하는 방법이 몇 가지 있다. `npm view` 명령어를 통해 피어 의존성을 확인할 수 있다.

- eslint-config-prettier 패키지는 7.0.0 이상 버전의 eslint 패키지가 필요하다.

```
$ npm view eslint-config-prettier peerDependencies

{ eslint: '>=7.0.0' }
```

`npm explain` 명령어는 해당 패키지가 왜 설치되었는지, 어떤 패키지가 의존하고 있는지 설명한다. 피어 의존성으로 인해 특정 버전이 요구되는 경우 등 의존성 문제를 디버깅하는 데 도움이 된다.

- `eslint@"9.14.0"` 패키지가 루트 프로젝트에 설치되어 있다.
- `eslint-config-prettier@9.1.0` 패키지는 `eslint@">=7.0.0"` 조건을 만족하는 피어 의존성이 필요하다.

```
$ npm explain eslint

eslint@9.14.0 dev
node_modules/eslint
  dev eslint@"9.14.0" from the root project
  ...
  peer eslint@">=7.0.0" from eslint-config-prettier@9.1.0
  node_modules/eslint-config-prettier
    dev eslint-config-prettier@"^9.1.0" from the root project
    peerOptional eslint-config-prettier@">= 7.0.0 <10.0.0 || >=10.1.0" from eslint-plugin-prettier@5.4.0
    node_modules/eslint-plugin-prettier
      dev eslint-plugin-prettier@"^5.2.1" from the root project
  ...
```

#### REFERENCE

- <https://semver.org/>
- <https://docs.npmjs.com/cli/v11/configuring-npm/package-lock-json>
- <https://velog.io/@vekkary/semantic-Version%EA%B3%BC-Version-Range-Syntax>
- <https://docs.npmjs.com/about-semantic-versioning>
- <https://docs.npmjs.com/cli/v11/commands/npm-outdated>
- <https://docs.npmjs.com/cli/v11/commands/npm-update>
- <https://docs.npmjs.com/cli/v11/commands/npm-install>