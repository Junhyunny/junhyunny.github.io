---
title: "일렉트론(electron) 프레임워크 기반 리액트(react) 프로젝트 준비"
search: false
category:
  - electron
  - react
  - frontend
  - desktop-application
last_modified_at: 2026-03-14T23:55:00
---

<br/>

## 0. 들어가면서

올해는 토이 프로젝트로 AI 에이전트를 개발해 볼 생각이다. AI 에이전트가 내부적으로 어떻게 동작하는지 공부하고 싶다. 앞으로 일반적인 시스템이나 애플리케이션보다 AI가 결합된 서비스들이 많아질 것 같다는 생각에 관련된 역량을 키우고 싶다. 아쉽게도 회사에서 이런 프로젝트가 열리지 않을 것 같다. 토이 프로젝트를 통해 혼자서라도 작은 애플리케이션을 만들어 볼 생각이다.

토이 프로젝트를 진행하면서 설계에 대한 고민이나 새로 배운 내용들을 앞으로 꾸준히 블로그에 업로드할 생각이다. 서버 비용이나 호스팅하는 것을 고려하지 않아도 되도록 첫 번째 주제로 일렉트론 프레임워크 기반 리액트 프로젝트를 준비하는 방법에 대해 정리해봤다. 

## 1. Setup project

일렉트론은 리액트 애플리케이션 프로젝트를 한 번에 구축하는 보일러플레이트(boilerplate)는 지원하지 않는다. Vite 프로젝트를 만들고 그 위에 리액트 애플리케이션 환경을 구축해야 한다. 일렉트론은 Vite, 타입스크립트(typescript) 프로젝트를 위한 템플릿은 제공하기 때문에 이를 사용한다.

```
$ npx create-electron-app@latest frontend --template=vite-typescript
```

다음 리액트 의존성을 추가한다.

```
$ npm install --save react react-dom
$ npm install --save-dev @types/react @types/react-dom
```

타입스크립트가 리액트 문법을 인식하지 못하기 때문에 tsconfig.json 파일에 아래와 같은 설정을 추가한다.

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "commonjs",
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noImplicitAny": true,
    "sourceMap": true,
    "baseUrl": ".",
    "outDir": "dist",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "jsx": "react" // this
  }
}
```

main.tsx 파일을 만들고 다음과 같은 코드를 작성한다. 'react' 모듈을 임포트(import)하는 코드가 없다면 정상적으로 동작하지 않는다.

```tsx
import React from 'react';
import {createRoot} from 'react-dom/client';
import {App} from "./App";

const root = createRoot(document.body);
root.render(<App/>);
```

App.tsx 파일은 다음과 같이 정의한다. 위의 코드와 마찬가지로 'react' 모듈을 임포트(import)하는 코드가 없다면 정상적으로 동작하지 않는다.

```tsx
import React from 'react';

export const App = () => <h1>Hello Electron + React World</h1>
```

마지막으로 renderer.ts 파일에 main.tsx 모듈을 임포트(import)한다.

```ts
import './index.css';
import './main.tsx';

console.log(
    '👋 This message is being logged by "renderer.ts", included via Vite',
);
```

애플리케이션을 실행한다.

```
$ npm run start
```

다음과 같은 화면이 열린다.

<div align="center">
  <img src="/images/posts/2026/elctron-react-project-setup-01.png" width="100%" class="image__border">
</div>

## 2. Trouble shooting

위에서 언급한 것처럼 리액트 컴포넌트 코드 상단에 아래 'react' 모듈을 임포트하는 코드가 없다면 화면이 정상적으로 렌더링되지 않는다. 이를 반드시 추가하도록 한다.

```tsx
import React from 'react'
```

최초 프로젝트를 셋업 후 위 코드를 추가하면 아래와 같은 컴파일 에러가 발생한다. 

```
can only be default-imported using the esModuleInterop flag index.d.ts(67, 1): This module is declared with using export =, and can only be used with a default import when using the esModuleInterop flag.
```

이 에러는 타입스크립트에서 CommonJS 방식(export =)으로 작성된 모듈을 ES6 방식(import default)으로 가져오려 할 때 발생한다. 타입스크립트에서 호환성을 맞추기 위해 tsconfig.json 파일에 `esModuleInterop` 속성을 true 값으로 설정해도 동일한 에러가 계속 발생했다. 이 부분은 타입스크립트 버전을 올리면 해결된다.

npm outdated 명령어를 통해 최신 버전이 아닌 의존성을 확인한다.

```
$ npm outdated
Package                           Current  Wanted  Latest  Location                                       Depended by
@electron/fuses                     1.8.0   1.8.0   2.1.0  node_modules/@electron/fuses                   frontend
@typescript-eslint/eslint-plugin   5.62.0  5.62.0  8.57.0  node_modules/@typescript-eslint/eslint-plugin  frontend
@typescript-eslint/parser          5.62.0  5.62.0  8.57.0  node_modules/@typescript-eslint/parser         frontend
eslint                             8.57.1  8.57.1  9.39.4  node_modules/eslint                            frontend
typescript                          4.5.5   4.5.5   5.9.3  node_modules/typescript                        frontend
vite                               5.4.21  5.4.21   8.0.0  node_modules/vite                              frontend
```

타입스크립트가 4.5.5 버전으로 메이저(major) 버전이 5보다 낮다. 이를 업데이트하면 타입스크립트 컴파일 에러가 사라진다.

```
$ npm install typescript@5.9.3
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/todo-agent>

#### REFERENCE

- <https://www.electronforge.io/templates/vite-+-typescript>
- <https://www.electronforge.io/guides/framework-integration/react-with-typescript#src-app.tsx>