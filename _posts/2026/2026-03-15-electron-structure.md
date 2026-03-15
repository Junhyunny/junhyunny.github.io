---
title: "일렉트론(electron) 프레임워크의 프로세스 모델(process model)"
search: false
category:
  - electron
  - desktop-application
  - chromium
last_modified_at: 2026-03-15T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [일렉트론(electron) 프레임워크 기반 리액트(react) 프로젝트 준비][elctron-react-project-setup-link]

## 0. 들어가면서

일렉트론(electron) 프로젝트를 생성하면 3개의 스크립트 코드가 눈에 띈다.

- main.ts
- preload.ts
- renderer.ts

3개로 분리된 스크립트마다 용도가 있을 것이라 예상할 수 있다. 이를 이해하려면 일렉트론 프레임워크의 `프로세스 모델(process model)`에 대해 알고 있어야 한다. 일렉트론 애플리케이션 개발을 시작하기 전에 프레임워크 구조에 대해 이해하기 위해 글로 정리해봤다.

## 1. Process model

일렉트론은 크로미움(chromium)의 다중 프로세스(multi-process) 아키텍처를 상속받아서 현대적인 웹 브라우저와 유사하게 동작한다. 이 모델은 하나의 페이지에서 오류가 발생하거나 충돌이 일어나더라도 애플리케이션 전체가 다운되는 것을 방지하기 위해 도입되었다.

크롬 브라우저 팀은 브라우저의 각 탭마다 독립적인 프로세스가 동작하여 화면을 렌더링하도록 만들었다. 이로 인해 버그가 있거나 악의적인 코드가 웹 페이지에 존재하더라도 애플리케이션 전체에 미치는 피해를 제한했다. 일렉트론의 다중 프로세스 모델도 이와 유사한 구조로 설계되었다. 

<div align="center">
  <img src="/images/posts/2026/electron-structure-01.png" width="100%" class="image__border">
</div>

<br />

앱 개발자는 크롬의 프로세스 구조와 상응하는 다음 두 가지 유형의 프로세스를 제어하게 된다.

- 메인 프로세스 (main process)
  - 크롬의 단일 브라우저 프로세스와 같은 역할을 담당한다. 
  - 일렉트론 애플리케이션에서 단 하나만 존재한다. 앱의 진입점(entry point) 역할을 한다.
  - 노드(Node.js) 런타임 환경에서 실행된다.
- 렌더러 프로세스 (renderer process)
  - 크롬의 각 탭이 개별 프로세스를 갖는 것과 같은 역할을 담당한다.
  - 메인 프로세스에서 BrowserWindow 모듈을 통해 각 애플리케이션 창이 생성된다. 각 창은 별도의 렌더러 프로세스를 갖는다.
  - 크로미움 런타임 환경에서 실행된다.

지금부터 두 프로세스가 하는 역할과 차이점에 대해 살펴보자.

## 2. Main process

메인 프로세스는 노드(Node.js) 환경에서 실행된다. 일렉트론 애플리케이션에서 단 하나만 존재한다. 앱의 진입점 역할을 한다. 프로젝트의 `package.json` 파일을 보면 main.ts 스크립트가 진입점으로 지정되어 있다.

```json
{
  "name": "frontend",
  "productName": "frontend",
  "version": "1.0.0",
  "description": "My Electron application description",
  "main": ".vite/build/main.js",
  ...
}
```

메인 프로세스의 주요 역할은 애플리케이션 윈도우들을 관리하는 것이다. BrowserWindow 모듈을 통해 각 브라우저 화면을 관리한다. main.ts 스크립트를 보면 다음과 같이 브라우저 윈도우 객체를 생성 후 화면을 로딩하는 코드를 확인할 수 있다.

- 브라우저 윈도우의 사이즈, 프리로드(preload) 스크립트 지정, 렌더링할 index.html 파일 지정 등을 할 수 있다.
- `webContents` 객체를 사용하면 메인 프로세스는 웹 콘텐츠와 상호 작용할 수 있다. 예를 들어, webContents 객체를 통해 브라우저의 개발자 도구를 연다. 

```ts
const createWindow = () => {
  // 브라우저 윈도우를 생성한다.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // index.html 파일을 로드
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // 개발자 도구를 연다.
  mainWindow.webContents.openDevTools();
};

...
```

메인 프로세스에서는 일렉트론 애플리케이션의 라이프 사이클을 관리 및 제어한다. 위에서 확인한 ready 이벤트도 애플리케이션의 라이프 사이클 단계들 중 하나다. 일렉트론은 멀티 플랫폼을 지원하기 때문에 운영체제 특성에 따라 라이프 사이클 관리가 조금 다를 수 있다.

일렉트론 애플리케이션의 라이프사이클들을 살펴보자.

1. 초기화 및 준비 완료 (ready 이벤트)
  - 일렉트론 애플리케이션의 사용자 인터페이스를 담당하는 브라우저 창은 app 모듈의 ready 이벤트가 발생한 이후에만 생성할 수 있다.
  - 개발자는 직접 이벤트를 수신하는 대신 app.whenReady() API를 사용하여 앱 초기화가 완료될 때까지 기다린 후, 프로미스(Promise)가 이행되면 창을 생성(createWindow())하는 방식이 권장된다.
2. 모든 창 닫힘 (window-all-closed 이벤트)
  - 운영 체제의 특성에 따라 애플리케이션의 창 닫힘 동작은 다르게 처리되어야 한다. 
  - 윈도우즈(Windows)와 리눅스(Linux) 환경에서는 일반적으로 모든 창이 닫히면 애플리케이션도 완전히 종료된다.
  - 이를 구현하기 위해 app.on('window-all-closed') 이벤트를 수신하고, 현재 운영 체제가 맥OS(MacOS)가 아닌 경우 app.quit()를 호출하여 앱을 완전히 종료시킨다.
3. 앱 활성화 (activate 이벤트 - 맥OS 특화)
  - 윈도우즈나 리눅스와 달리, 맥OS 애플리케이션은 열려 있는 창이 없더라도 프로그램이 종료되지 않고 계속 실행되는 것이 일반적이다.
  - 사용자가 독(Dock) 등에서 앱을 다시 활성화했을 때 표시할 창이 없다면, activate 이벤트를 감지하여 새로운 창을 다시 생성해야 한다.
  - 주의할 점은 창 생성이 ready 이벤트 이후에만 가능하므로, 이 activate 이벤트 리스너는 반드시 whenReady() 콜백 내부에서 설정해야 한다.

프로젝트 생성 시 기본적으로 생성된 main.ts 스크립트를 보면 다음과 같은 코드들을 볼 수 있다. 위에서 설명한 라이프사이클 관리에 대한 코드가 작성되어 있다.

```ts
...

// 일렉트론 프레임워크가 애플리케이션 초기화가 완료된 후 브라우저 윈도우를 생성하도록 콜백 함수 지정
app.on("ready", createWindow);

// 모든 윈도우가 닫힌 경우 맥OS가 아닌 경우 애플리케이션을 종료
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // 애플리케이션이 활성화되었을 때 표시할 창이 없는 경우 새로운 윈도우를 생성
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

메인 프로세스는 노드 환경에서 실행되기 때문에 require 함수를 통해 모듈을 불러오고, 노드의 내장된 API를 자유롭게 사용할 수 있다. 이를 통해 일렉트론은 단순히 웹 콘텐츠를 보여주는 크로미움 래퍼(wrapper)의 역할을 넘어, 사용자의 운영 체제와 상호 작용할 수 있는 기능을 제공할 수 있다.

- 메뉴(menus), 대화 상자(dialogs), 시스템 트레이 아이콘(tray icons) 등 PC 데스크톱의 고유한 네이티브 기능들을 직접 제어하고 표시할 수 있다.
- 파일 시스템, 네트워킹 같이 보안상 운영체제에 대한 접근 특권이 필요한(privileged) 작업들을 전담하여 수행할 수 있다.
- npm을 통해 설치된 외부 패키지들도 활용할 수 있다. 

## 3. Render process

렌더러 프로세스는 애플리케이션의 시각적인 웹 콘텐츠(UI)를 화면에 렌더링(표시)하는 핵심적인 역할을 담당한다. 일렉트론 애플리케이션은 열려 있는 각각의 BrowserWindow 및 웹 임베드 요소마다 완전히 분리된 독립적인 렌더러 프로세스를 생성한다. 

각 렌더러 프로세스는 자신이 속한 창의 수명 주기와 연결되어 있으며, 해당 BrowserWindow 인스턴스가 파괴(종료)되면 렌더러 프로세스 역시 함께 종료된다.

렌더러 프로세스는 기본적으로 크로미움을 기반으로 하므로 웹 표준에 따라 동작한다. HTML 파일을 진입점으로 사용하며, CSS를 통해 UI 스타일을 지정하고 `<script>` 태그를 통해 자바스크립트 코드를 실행한다. HTML, CSS, 자바스크립트 코드가 동작하는 영역이다.

웹 페이지와 매우 유사하게 작동하기 때문에, 일반적인 프론트엔드 웹 개발에서 사용하는 웹팩(webpack), 리액트(React)와 같은 도구와 패러다임을 동일하게 활용할 수 있다. 

렌더러 프로세스는 보안상의 이유로 기본적으로 노드 환경을 실행하지 않는다. 따라서 require 함수나 노드의 내장 API에 직접 접근할 권한이 없다. 과거에는 개발 편의를 위해 전체 노드 환경을 허용하는 것이 기본값이었으나 보안을 위해 비활성화되었다고 한다.

렌더러 프로세스는 운영 체제의 네이티브 기능이나 파일 시스템 등에 직접 접근할 수 없으므로, 특권이 필요한 작업은 메인 프로세스에 요청해야 한다. 이런 제한 사항을 처리하기 위해 필요한 것이 프리로드 스크립트(preload script)다.

## 4. Preload scripts and IPC

일렉트론에서 메인 프로세스와 렌더러 프로세스는 철저히 분리되어 있다. 보안상의 이유로 렌더러 프로세스는 노드 API나 일렉트론의 모듈(ipcRenderer)에 직접 접근할 권한이 없다. 반대로 메인 프로세스는 사용자의 화면(DOM)을 직접 제어할 수 없다. 이 분리된 두 프로세스가 통신하려면 IPC(Inter-Process Communication)가 필수적이다.

권한이 없는 렌더러 프로세스를 대신해 프리로드 스크립트가 IPC 기능(ipcRenderer)을 가져와 웹 페이지에서 쓸 수 있는 형태로 넘겨준다. 프리로드 스크립트는 IPC 기능을 웹 페이지에 전달하는 가교 역할을 한다.

<div align="center">
  <img src="/images/posts/2026/electron-structure-02.png" width="100%" class="image__border">
</div>

<br />

프리로드 스크립트는 BrowserWindow 생성자의 webPreferences 옵션을 통해 메인 프로세스에 연결할 수 있다.

```ts
const { BrowserWindow } = require('electron')
// ...
const win = new BrowserWindow({
  webPreferences: {
    preload: 'path/to/preload.js'
  }
})
```

프리로드 스크립트는 렌더러 프로세스 컨텍스트에서 실행된다. 웹 페이지(HTML)가 렌더러에 로드되기 직전에 먼저 실행된다. 렌더러 프로세스는 보안상 노드 API에 접근할 수 없지만, 프리로드 스크립트는 HTML DOM(document object model)뿐만 아니라 제한적인 노드 및 일렉트론 API에 접근할 수 있는 권한을 가진다. 따라서 운영체제 접근이 가능한 메인 프로세스와 화면을 그리는 렌더러 프로세스 사이를 연결하는 다리 역할을 한다. 참고로 일렉트론 20부터 프리로드 스크립트는 샌드박스 처리되어 전체 노드 환경이 아닌 제한된 API만 사용할 수 있다.

프리로드 스크립트는 렌더러와 동일한 전역 윈도우(window) 인터페이스를 공유한다. 웹 콘텐츠가 사용할 수 있는 임의의 API를 전역 window 객체에 노출시켜 렌더러의 기능을 향상시키는 역할을 할 수 있다. 단, 렌더러 프로세스의 메인 환경과 엄격히 격리되어 있다. 이 컨텍스트 격리(context isolation) 정책 덕분에 권한이 높은 API가 일반 웹 콘텐츠 코드에 유출되는 것을 방지할 수 있다. `contextIsolation`이 기본값으로 설정되어 있기 때문에 프리로드 스크립트의 변수를 window 객체에 직접 연결할 수는 없다.

```ts
// preload.js
window.myAPI = {
  desktop: true
}

// renderer.js
console.log(window.myAPI) // undefined
```

대신 contextBridge 모듈을 사용하여 메인 프로세스의 기능 중 일부를 렌더러 프로세스의 window 전역 객체에 안전하게 노출시킬 수 있다.

```ts
// preload.js
const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('myAPI', {
  desktop: true
})

// renderer.js
console.log(window.myAPI) // { desktop: true }
```

#### REFERENCE

- <https://www.electronjs.org/docs/latest/tutorial/process-model>
- <https://www.electronjs.org/docs/latest/tutorial/tutorial-preload>
- <https://www.electronjs.org/docs/latest/tutorial/tutorial-first-app#quit-the-app-when-all-windows-are-closed-windows--linux>
- <https://velog.io/@ckstn0777/Electron-%EC%9D%B4%ED%95%B4%ED%95%98%EA%B8%B0>
- <https://berom.tistory.com/563>
- <https://lifeinprogram.tistory.com/4>
- <https://todayscoding.tistory.com/60>

[elctron-react-project-setup-link]: https://junhyunny.github.io/electron/react/frontend/desktop-application/elctron-react-project-setup/