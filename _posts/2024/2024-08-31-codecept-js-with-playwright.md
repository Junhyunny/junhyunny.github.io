---
title: "CodeceptJS with Playwright for E2E test"
search: false
category:
  - e2e-test
last_modified_at: 2024-08-31T23:55:00
---

<br/>

## 0. 들어가면서

E2E 테스트를 작성할 때 항상 Cypress 프레임워크를 사용했었다. 이번 프로젝트에선 새로운 `CodeceptJS`, `Playwright` 라는 프레임워크를 사용해 볼 기회가 생겼다. 이번 글에선 두 프레임워크에 대한 간단한 소개한다.

## 1. Playwright Framework

`Playwright`는 브라우저 테스트, 웹 스크래핑 테스트를 위해 마이크로소프트(microsoft)에서 개발한 자동화 프레임워크이다. 오픈 소스로 2020년 1월 31일에 공개되었다. 크로미움(chromium), 파이어폭스(firefox) 그리고 웹킷(webkit) 브라우저를 통해 테스트할 수 있다. 윈도우즈, 리눅스, 맥OS 에서 E2E 테스트가 가능하며 모바일 크롬이나 사파리(safari) 에뮬레이션도 가능하다. 다음과 같은 기능이 가능하다.

- 스크린샷
  - E2E 테스트가 실패하는 모습을 스크린샷으로 저장
- 비디오 레코딩
  - E2E 테스트로 동작하는 화면을 비디오로 레코딩 가능
- 테스트 트레이스(trace)
  - DOM 스냅샷 확인 가능
  - 에러, 네트워크, 메타데이터 확인 가능

Playwright 프레임워크 예제 코드를 살펴보면 제공하는 API만 다를 뿐 Cypress 프레임워크와 비슷하다. 

```ts
import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
```

## 2. CodeceptJS Framework

Playwright 프레임워크는 Cypress 프레임워크과 크게 다르지 않다는 인상을 받았다. 반면 `CodeceptJS` 프레임워크는 코드 스타일에 큰 변화를 준다. Playwright, Cypress는 애플리케이션(혹은 브라우저) 관점에서 테스트 코드를 작성한 것 같은 느낌을 주지만, CodeceptJS는 사용자 관점에서 테스트를 작성하는 것처럼 느껴진다. 테스트에 주체가 `page`가 아닌 `I`이기 때문일지도 모르지만, 자연어로 테스트 코드를 작성하기 때문에 코드의 가독성이 좋고 유저 플로우(user flow)를 이해하기 쉽다.

```js
Feature('ToDo');

Scenario('create todo item', ({ I }) => {
  I.amOnPage('http://todomvc.com/examples/react/');
  I.dontSeeElement('.todo-count');
  I.fillField('What needs to be done?', 'Write a guide');
  I.pressKey('Enter');
  I.see('Write a guide', '.todo-list');
  I.see('1 item left', '.todo-count');
});
```

CodeceptJS 프레임워크는 브라우저를 지원하는 도우미(helper) 프레임워크의 도움이 필요하다. CodeceptJS 공식 홈페이지를 보면 다음과 같은 아키텍처를 확인할 수 있다.

- 다음과 같은 도우미 프레임워크를 사용할 수 있다.
  - Playwright
  - Puppeteer
  - WebDriver
  - TestCafe
  - 기타
- CodeceptJS 프레임워크로 작성한 도우미 프레임워크가 지원하는 브라우저 환경에서 테스트가 가능하다.

<div align="center">
  <img src="/images/posts/2024/codecept-js-with-playwright-01.png" width="100%" class="image__border image__padding">
</div>

<br/>

## 3. Testing with Playwright

도우미로 Playwright 프레임워크를 사용한 예제를 살펴본다. 공식 홈페이지에 자세히 나와 있지만, 간단한 로그인 기능을 테스트해본다. 

### 3.1. Setup project for E2E test

E2E 테스트를 위한 프로젝트를 구성한다.

- e2e 디렉토리를 생성한다.
- e2e 디렉토리 내부에서 codeceptjs, playwright 의존성을 설치한다.

```
$ mkdir e2e

$ cd e2e

$ npm install codeceptjs playwright --save
```

프로젝트를 초기화한다. 여러 가지 값들을 지정하지만, 몇 가지만 메모한다.

- 테스트 코드 언어 - 타입스크립트
- 테스트 코드 위치 기본 값 사용 - ./*_test.ts
- 테스트 사이트 - http://localhost:8080
- 테스트 기능 - login

```
$ npx codeceptjs init

  Welcome to CodeceptJS initialization tool
  It will prepare and configure a test environment for you

 Useful links:

  👉 How to start testing ASAP: https://codecept.io/quickstart/#init
  👉 How to select helper: https://codecept.io/basics/#architecture
  👉 TypeScript setup: https://codecept.io/typescript/#getting-started

Installing to /Users/junhyunkang/Desktop/e2e
? Do you plan to write tests in TypeScript? Yes
? Where are your tests located? ./*_test.ts
? What helpers do you want to use? Playwright
? Where should logs, screenshots, and reports to be stored? ./output
? Do you want to enable localization for tests? http://bit.ly/3GNUBbh English (no localization)
Configure helpers...
? [Playwright] Browser in which testing will be performed. Possible options: chromium, firefox, webkit or electron chromium
? [Playwright] Base url of site to be tested http://localhost:8080
? [Playwright] Show browser window Yes

Steps file created at ./steps_file.ts
Config created at /Users/junhyunkang/Desktop/e2e/codecept.conf.ts
Directory for temporary output files created at './output'
Installing packages:  typescript, ts-node, @types/node

added 17 packages, changed 1 package, and audited 1044 packages in 5s

88 packages are looking for funding
  run `npm fund` for details

5 high severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
TypeScript Definitions provide autocompletion in Visual Studio Code and other IDEs
Definitions were generated in steps.d.ts

 Almost ready... Next step:
Creating a new test...
----------------------
? Feature which is being tested (ex: account, login, etc) login
? Filename of a test login_test.ts

Test for login_test.ts was created in /Users/junhyunkang/Desktop/e2e/login_test.ts

--
CodeceptJS Installed! Enjoy supercharged testing! 🤩
Find more information at https://codecept.io
```

## 3.2. Write Login Test

간단하게 로그인 테스트를 작성해보자. 로그인 화면을 서비스하는 애플리케이션 코드는 이 글 하단 예제 코드 레포지토리에 함께 포함되어 있다. 이제 E2E 테스트 코드를 살펴보자. 

1. 로그인 화면으로 진입한다.
2. 로그인 화면에서 사용자 정보를 입력한다.
3. 로그인이 성공하면 메인 화면이 보이는지 확인한다.

```ts
Feature("login");

Scenario("When login Then I can see Hello World ", ({ I }) => {
  I.amOnPage("/login"); // 1
  I.waitForText("Please sign in", 1.5);

  I.fillField("input[name=username]", "junhyunny"); // 2
  I.fillField("input[name=password]", "12345");
  I.click("Sign in");
  I.wait(1.5);

  I.see("Hello World"); // 3
});
```

package.json 파일에 npm 실행 스크립트를 추가한다.

```json
{
  "scripts": {
    "clean:all": "rm -rf ./output || true",
    "test": "codeceptjs run --steps " // this
  },
  "dependencies": {
    "codeceptjs": "^3.6.5",
    "playwright": "^1.46.1"
  },
  "devDependencies": {
    "@types/node": "^22.5.1",
    "prettier": "^3.3.3",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.4"
  }
}
```

아래 명령어를 사용해 E2E 테스트를 실행한다.

```
$ npm run test

> test
> codeceptjs run --steps

CodeceptJS v3.6.5 #StandWithUkraine
Using test root "/Users/junhyunkang/Desktop/2024-08-31-codecept-js-with-playwright/e2e"

login --
  When login Then I can see Hello World 
    I am on page "/login"
    I wait for text "Please sign in", 1.5
    I fill field "input[name=username]", "junhyunny"
    I fill field "input[name=password]", "12345"
    I click "Sign in"
    I wait 1.5
    I see "Hello World"
  ✔ OK in 2650ms
```

브라우저가 열리고 E2E 테스트가 동작하는 모습을 확인할 수 있다.


<div align="center">
  <img src="/images/posts/2024/codecept-js-with-playwright-02.gif" width="100%" class="image__border">
</div>

## 3.3. Refactoring with autoLogin plugin

위 테스트 코드는 몇 가지 개선이 필요하다.

1. 로그인 기능은 자주 사용되기 때문에 재사용 가능하도록 리팩토링한다.
2. 로그에 사용자 아이디와 비밀번호가 그대로 표현된다.
3. 한번 로그인 후 세션이 살아있다면 재사용 할 수 있다.

CodeceptJS 프레임워크에서 제공하는 자동 로그인 플러그인과 자료형을 사용하면 위 문제들을 해결할 수 있다. 먼저 `steps_file.ts` 파일에 actor 객체에 로그인 함수를 추가한다. 

- 로그인 함수를 호출할 때 파라미터는 Secret 타입을 사용한다. 
  - 테스트가 실행될 때 값이 마스킹(masking) 된다.

```ts
import Secret = CodeceptJS.Secret;

export = function () {
  return actor({
    login(username: Secret, password: Secret) { // this
      this.amOnPage("/login");
      this.waitForText("Please sign in", 1.5);
      this.fillField("input[name=username]", username);
      this.fillField("input[name=password]", password);
      this.click("Sign in");
    },
  });
};
```

위 코드는 다음과 같이 재사용이 가능하다.

- 사용자 이름, 비밀번호는 환경 변수를 사용해 형상 관리되지 않도록 구성할 수 있다.

```ts
I.login(secret("junhyunny"), secret("12345"));
```

로그인 기능 재사용과 아이디, 비밀번호가 플레인 텍스트로 표시되는 문제가 해결된다. 다음 로그인 후 세션을 재사용하기 위해선 플러그인을 사용한다. `codecept.conf.ts` 파일에 autoLogin 플러그인을 활성화한다.

- autoLogin 플러그인을 활성화한다.
- 로그인 함수 이름을 지정한다.
    - 기본 값은 `login`이지만, 이름을 `loginAs`로 변경하여 사용한다. 
- JUNHYUNNY 사용자를 추가하고 해당 객체에 두 개의 함수를 추가한다.
    - login 함수
        - 사용자 로그인을 수행한다. 
        - 로그인을 수행하기 전에 기존 쿠키는 정리한다.
        - I 객체에 정의된 login 함수를 사용한다.
    - check 함수
        - 기존에 갖고 있는 쿠키를 사용해 서버 세션을 재사용할 수 있는지 확인한다.
        - 인증된 사용자만 접근할 수 있는 경로로 이동 후 특정 리소스를 확인한다.
        - 리소스 확인이 실패한 경우 로그인을 처음부터 다시 시도한다.

```ts
export const config: CodeceptJS.MainConfig = {
  tests: "./*_test.ts",
  output: "./output",
  helpers: {
    Playwright: {
      browser: "chromium",
      url: "http://localhost:8080",
      show: true,
    },
  },
  include: {
    I: "./steps_file",
  },
  name: "e2e",
  plugins: {
    autoLogin: { // this
      enabled: true,
      saveToFile: true,
      inject: "loginAs",
      users: {
        JUNHYUNNY: {
          login: (I: CodeceptJS.I) => {
            I.clearCookie();
            I.login(secret("junhyunny"), secret("12345"));
          },
          check: (I) => {
            I.amOnPage("/");
            I.see("Hello World");
          },
        },
      },
    },
  },
};
```

이제 테스트 코드에서 `loginAs` 함수를 주입 받아서 사용할 수 있지만, 타입스크립트이기 때문에 타입 에러가 발생한다. 컴파일 에러를 방지하기 위해 `steps.d.ts` 파일을 수정한다.

- SupportObject 인터페이스에 loginAs 함수를 추가한다. 
- 특정 사용자만 로그인 할 수 있도록 User 타입을 지정한다. 
  - 현재 코드에서 User 타입은 "JUNHYUNNY"만 존재한다.

```ts
/// <reference types='codeceptjs' />
type steps_file = typeof import("./steps_file");

declare namespace CodeceptJS {
  type User = "JUNHYUNNY";

  interface SupportObject {
    I: I;
    current: any;
    loginAs: (user: User) => void; // this
  }
  interface Methods extends Playwright {}
  interface I extends ReturnType<steps_file> {}
  namespace Translation {
    interface Actions {}
  }
}
```

테스트 코드는 다음과 같이 변경할 수 있다.

- `"JUNHYUNNY"` 사용자로 로그인한다.

```ts
Feature("login");

Scenario("When login Then I can see Hello World ", ({ I, loginAs }) => {
  loginAs("JUNHYUNNY");
  I.wait(1.5);

  I.see("Hello World");
});
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-08-31-codecept-js-with-playwright>

#### REFERENCE

- <https://en.wikipedia.org/wiki/Playwright_(software)>
- <https://playwright.dev/docs/trace-viewer>
- <https://en.wikipedia.org/wiki/Behavior-driven_development>
- <https://www.devkuma.com/docs/testing/bdd/>
- <https://codecept.io/bdd/>
- <https://codecept.io/playwright/>