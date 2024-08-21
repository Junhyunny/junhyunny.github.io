---
title: "Setup ESLint and Prettier in Vite"
search: false
category:
  - vite
  - react
last_modified_at: 2024-08-21T23:55:00
---

<br/>

## 0. 들어가면서

프론트엔드 관련된 기술들은 특히 빠르게 변하는 것 같다. 이 글을 읽는 개발자들이 오래된 버전 때문에 헤메지 않도록 프로젝트 환경에 대해 먼저 고지한다. 

```json
{
  ...
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "eslint": "^9.9.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.9",
    "globals": "^15.9.0",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^5.4.1"
  }
}
```

## 1. Install Prettier

Vite 번들러를 사용하면 ESLint와 이에 관련된 의존성들과 설정들은 자동으로 준비된다. Prettier와 ESLint와 관련된 의존성들을 추가적으로 설치한다.

- prettier
  - Prettier 라이브러리로 코드 포맷팅(formatting)을 수행한다.
- eslint-config-prettier
  - ESLint가 Prettier 코드 포맷을 따라 린팅(linting)할 수 있도록 설정을 맞춰준다.
- eslint-plugin-prettier
  - ESLint가 Prettier 코드 포맷을 따라 린팅할 수 있도록 플러그인을 제공한다.

```
$ npm install -D prettier\
  eslint-config-prettier\
  eslint-plugin-prettier
```

## 2. Setup configuration for ESLint

Prettier는 포맷팅 작업을 수행한다. 포매팅은 코드 스타일을 검사하고 수정하는 작업이다. 린팅 작업은 ESLint가 수행한다. 린팅은 코드의 구조를 검사하고 잘못 작성된 코드가 없는지 확인한다. 즉, 코드의 정적 분석을 수행한다. 엄밀히 말하면 역할이 서로 다르지만, 어찌됐든 코드에 대한 검사, 수정 작업을 수행하기 때문에 포맷팅 규칙과 린팅 규칙이 충돌할 수도 있다. 두 규칙이 충돌하지 않도록 설정이 필요하다. 

린팅 작업을 수행할 때 Prettier의 포맷팅 규칙을 따르도록 만든다. 코드 포맷이 다른 경우 에러를 발생시키도록 만들어보자. 현재 Vite 번들러로 프로젝트를 만들면 ESLint 규칙을 위한 `eslint.config.js` 파일이 생긴다. 이 파일에 Prettier 관련 설정을 추가한다. 만약 `.eslintrc.cjs` 파일을 사용한다면 이 글의 내용을 참고하기 어려울 수 있다.

먼저 Prettier 기본 설정 파일을 만든다.

```
$ echo "{}" > .prettierrc
```

다음 `eslint.config.js` 파일에 `eslint-config-prettier` 모듈을 설정에 추가한다.

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from "eslint-config-prettier"; // this line

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  eslintConfigPrettier // this line
)
```

린팅 작업을 수행할 때 Prettier 규칙을 따르지 않는 경우 에러가 발생하도록 규칙을 지정한다.  

1. Prettier 플러그인을 설정한다.
2. Prettier 포맷 규칙에 맞지 않는 경우 에러를 발생시키도록 한다.

```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier"; // this line

export default tseslint.config(
    {ignores: ['dist']},
    {
        extends: [js.configs.recommended, ...tseslint.configs.recommended],
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            prettier  // 1 
        },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                {allowConstantExport: true},
            ],
            "prettier/prettier": "error"  // 2
        },
    },
    eslintConfigPrettier
)
```

모든 설정이 끝났다. 터미널에서 린팅 커맨드를 실행하면 다음과 같은 에러 메시지를 볼 수 있다. 에러가 발생한 이유는 린팅 작업을 수행할 때 프로젝트 내 대상 파일들이 Prettier 포맷을 따르지 않기 때문이다.

```
$ npm run lint

> action-in-blog@0.0.0 lint
> eslint .


/Users/junhyunkang/Desktop/action-in-blog/src/App.tsx
   1:26  error  Replace `'react'` with `"react";`                            prettier/prettier
   2:23  error  Replace `'./assets/react.svg'` with `"./assets/react.svg";`  prettier/prettier
   3:22  error  Replace `'/vite.svg'` with `"/vite.svg";`                    prettier/prettier
   4:8   error  Replace `'./App.css'` with `"./App.css";`                    prettier/prettier
   7:40  error  Insert `;`                                                   prettier/prettier
  32:4   error  Insert `;`                                                   prettier/prettier
  35:19  error  Insert `;`                                                   prettier/prettier

/Users/junhyunkang/Desktop/action-in-blog/src/main.tsx
   1:28  error  Replace `'react'` with `"react";`                        prettier/prettier
   2:28  error  Replace `'react-dom/client'` with `"react-dom/client";`  prettier/prettier
   3:17  error  Replace `'./App.tsx'` with `"./App.tsx";`                prettier/prettier
   4:8   error  Replace `'./index.css'` with `"./index.css";`            prettier/prettier
   6:36  error  Replace `'root'` with `"root"`                           prettier/prettier
  10:2   error  Insert `;`                                               prettier/prettier

/Users/junhyunkang/Desktop/action-in-blog/vite.config.ts
  1:30  error  Replace `'vite'` with `"vite";`                                  prettier/prettier
  2:19  error  Replace `'@vitejs/plugin-react'` with `"@vitejs/plugin-react";`  prettier/prettier
  7:3   error  Insert `;`                                                       prettier/prettier

✖ 16 problems (16 errors, 0 warnings)
  16 errors and 0 warnings potentially fixable with the `--fix` option.
```

## 3. Enable Prettier plugin in IntelliJ

커맨드를 사용하는 것도 좋지만, 코드를 수정할 때마다 자동으로 반영되게 하는 편이 더 작업 효율이 좋을 것이다. 필자는 인텔리제이를 IDE(Integrated Development Environment)로 사용하고 있기 때문에 관련된 설정 방법을 정리한다. IDE 프로젝트 설정(`CMD + ,`)에서 Prettier 플러그인 설정으로 들어간다.

- Prettier 모듈을 선택한다.
  - 프로젝트에 설치된 것을 사용한다.
- `Run on save` 체크 박스를 선택한다.
  - 코드 저장 시 자동으로 포맷팅 된다.

<div align="center">
  <img src="/images/posts/2024/eslint-and-prettier-setup-in-vite-01.png" width="80%" class="image__border">
</div>

<br/>

코드를 저장하면 자동으로 포매팅이 완료되고 린팅 에러가 사라지는 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/eslint-and-prettier-setup-in-vite-02.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-08-21-eslint-and-prettier-setup-in-vite>

#### REFERENCE

- <https://ko.vitejs.dev/guide/>
- <https://github.com/prettier/eslint-config-prettier>
- <https://shawnkim.tistory.com/132>
