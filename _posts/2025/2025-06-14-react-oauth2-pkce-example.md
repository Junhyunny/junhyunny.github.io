---
title: "리액트 애플리케이션 OAuth2.0 PKCE 직접 구현하기"
search: false
category:
  - oauth2
  - pkce
  - react
last_modified_at: 2025-06-14T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [OAuth2.0 PKCE(Proof Key for Code Exchange)를 통한 보안 강화][oauth2-pkce-link]

## 0. 들어가면서

[이전 글][oauth2-pkce-link]에서 `PKCE(Proof Key for Code Exchange)`는 공개 클라이언트가 액세스 토큰을 발급 과정에서 발생하는 보안 리스크를 줄이기 위한 장치라는 내용에 대해 정리했다. 이번 글은 리액트 애플리케이션에서 인가 코드 승인(authorization code grant) 방식에 PKCE를 추가하여 액세스 토큰을 발급 받는 예제에 대해 정리했다.

## 1. Setup environment

다음과 같은 구현 환경에서 실습을 진행한다.

- AWS Cognito - SPA 클라이언트
- 리액트 애플리케이션

AWS Cognito는 SPA 클라이언트를 위한 PKCE 인가 코드 승인 방식을 지원한다. 예제를 위한 AWS Congito에 사용자 풀(user pool)을 하나 만들어보자. 

- 애플리케이션 이름을 `PKCE example`으로 지정한다.
- 옵션을 구성한다. 식별자와 가입에 필요한 필수 속성으로 `email`을 지정한다.
- 리다이렉트 URL을 `http://localhost:5173` 주소로 지정한다.

<div align="center">
  <img src="/images/posts/2025/react-oauth2-pkce-example-01.png" width="100%" class="image__border">
</div>

<br/>

AWS Congito는 PKCE 인가 코드 승인 방식을 지원하는 패키지를 함께 제공한다. 이를 사용하면 쉽게 구현할 수 있다. 사용자 풀을 만들면 다음과 같은 패키지를 설치하는 스크립트와 리액트 예시 코드들을 볼 수 있다. 

```
$ npm install oidc-client-ts react-oidc-context --save
```

리액트 애플리케이션 시작 부분을 `AuthProvider` 컴포넌트로 감싼다.

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: import.meta.env.VITE_APP_AUTHORITY,
  client_id: import.meta.env.VITE_APP_CLIENT_ID,
  redirect_uri: "https://localhost:5173",
  response_type: "code",
  scope: "phone openid email",
};

const root = ReactDOM.createRoot(document.getElementById("root"));

// wrap the application with AuthProvider
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

애플리케이션의 페이지(혹은 컴포넌트)에선 `useAuth` 훅을 통해 로그인 함수, 로그아웃 함수, 사용자 정보, 액세스 토큰 등을 꺼내서 한다.

```tsx
import { useAuth } from "react-oidc-context";

function App() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = import.meta.env.VITE_APP_CLIENT_ID;
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://<user pool domain>";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <pre> Hello: {auth.user?.profile.email} </pre>
        <pre> ID Token: {auth.user?.id_token} </pre>
        <pre> Access Token: {auth.user?.access_token} </pre>
        <pre> Refresh Token: {auth.user?.refresh_token} </pre>
        <button onClick={() => auth.removeUser()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => auth.signinRedirect()}>Sign in</button>
      <button onClick={() => signOutRedirect()}>Sign out</button>
    </div>
  );
}

export default App;
```

예시 코드를 사용해 애플리케이션을 실행하면 다음과 같은 로그인 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2025/react-oauth2-pkce-example-02.png" width="80%" class="image__border">
</div>

<br/>

`Sign in` 버튼을 누르면 AWS Cognito가 지원하는 로그인 페이지를 볼 수 있다. 테스트를 위한 사용자를 생성한다. 

<div align="center">
  <img src="/images/posts/2025/react-oauth2-pkce-example-03.png" width="80%" class="image__border">
</div>

<br/>

사용자 생성 후 로그인하면 다음과 같은 화면을 볼 수 있다.

<div align="center">
  <img src="/images/posts/2025/react-oauth2-pkce-example-04.png" width="80%" class="image__border">
</div>

<br/>

이번 글에선 위 예시 코드와 동일한 동작을 할 수 있는 AuthProvider 컴포넌트와 useAuth 훅을 직접 만들어 볼 에정이다. PKCE 인가 코드 승인 방식은 다음 같은 실행 흐름이 일어난다.

1. 사용자가 myapp.com 서비스에 접속한다.
2. 사용자가 로그인 버튼을 누른다.
3. 클라이언트 애플리케이션은 `code_verifier`을 만들고, 이를 기반으로 `code_challenge`을 만든다.
4. 사용자는 인증 서버로 리다이렉트된다. 리다이렉트 요청에는 `code_challenge`와 해시 알고리즘 정보가 포함된다. 인증 서버는 `code_challenge`와 해시 알고리즘 정보를 저장한다.
4. 사용자가 리소스 소유자임을 인증한다.
5. 사용자는 myapp.com 서버로 리다이렉트된다. 인가 코드(code)와 상태(state)가 리다이렉트 URL 경로에 포함된다.
6. `code_verifier`와 리다이렉트에 포함된 인가 코드, 그 외 기타 정보들과 함께 액세스 토큰 발급 요청을 전달한다. 
7. 인증 서버는 `code_challenge`의 유효성을 검증한다.
8. 액세스 토큰 발급이 성공한다.

<div align="center">
  <img src="/images/posts/2025/react-oauth2-pkce-example-05.png" width="100%" class="image__border">
</div>

## 2. Create CustomAuthProvider component

PKCE 인가 코드 승인 방식을 지원하는 CustomAuthProvider 컴포넌트를 만든다. 다음과 같은 인터페이스를 만든다. 위 예제와 동일한 인터페이스를 갖는 리액트 컨택스트(react context)를 만든다.

```tsx
type CustomAuthContext = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user?: User;
  error?: Error;
  signinRedirect: () => void;
  removeUser: () => void;
};

const Context = createContext<CustomAuthContext | null>(null);

export type CustomAuthContextProps = {
  children: ReactNode;
  authority: string;
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope: string;
};

const CustomAuthProvider = ({
  children,
  authority,
  client_id,
  redirect_uri,
  response_type,
  scope,
}: CustomAuthContextProps) => {
  
  // ...

  return (
    <Context.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        error,
        signinRedirect,
        removeUser,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export default CustomAuthProvider;
```

### 2.1. Sign in redirect process

지금부터 내부 기능들을 하나씩 채워보자. 우선 `Sign in` 버튼을 눌렀을 떄 사용자를 인증 서버로 리다이렉트 시키는 작업이 필요하다. 리다이렉트 요청을 보낼 때 다음 정보들을 URL 쿼리(query) 파라미터로 전송한다.

- response_type - 인증 서버로 인가 방식을 전달한다. 인가 코드 승인 방식은 `code`를 사용한다.
- client_id - 인증 서버에서 발급받은 클라이언트 ID를 전달한다.
- redirect_uri - 인증 서버에 등록한 리다이렉트 URL을 전달한다.
- scope - OAuth2 스코프를 전달한다.
- state - CSRF 공격을 방어하기 위한 상태 코드를 전달한다.
- code_challange - SHA256 해시 함수로 `code_verifier` 코드를 다이제스트(digest)로 만들고 이를 BASE64 인코딩을 수행한 값을 전달한다.
- code_challange_method - 어떤 방식으로 `code_verifier` 코드를 암호화 헀는지 전달한다. `SHA256` 값을 사용한다.

`code_verifier` 코드는 임의의 문자열로 매번 다른 값을 사용한다. 자세한 스펙은 [이전 글](https://junhyunny.github.io/oauth2.0/security/oauth2-pkce/#3-pkceproof-key-for-code-exchange)을 참고하길 바란다. `signinRedirect` 함수를 살펴보자.

- saveAuthConfig 함수
  - 외부로부터 프롭스(props)로 전달받은 클라이언트 ID, 리다이렉트 URI, 스코프, 응답 타입 등을 저장하고, 상태 코드(state)와 코드 확인자(code_verifier)를 반환한다.
- generateCodeChallenge 함수
  - code_verifier를 기반으로 code_challenge를 만든다.
- fetchOpenIdConfig 함수
  - authority 프롭스로 전달받은 주소로부터 인증 서버의 메타 정보를 받는다. authority 프롭스는 well-known configuration URL(혹은 discovery endpoint)이다. 이 경우 인증 서버의 엔드포인트를 획득한다.
- generateQueryParams 함수
  - 리다이렉트 할 때 필요한 정보들을 쿼리 파라미터로 만든다.
  - 위에서 정리한 클라이언트 ID, code_challenge, code_challenge_method, 리다이렉트 URI, 응답 타입, 스코프, 상태 코드 등을 쿼리 파라미터로 전달한다.

```tsx
  const signinRedirect = async () => {
    const { state, codeVerifier } = saveAuthConfig({
      client_id,
      redirect_uri,
      scope,
      response_type,
    });
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const { authorization_endpoint } = await fetchOpenIdConfig(authority);
    const config: RedirectUrlConfig = {
      client_id,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri,
      response_type,
      scope,
      state,
    };
    window.location.href = `${authorization_endpoint}?${generateQueryParams(config)}`;
  };
```

각 함수들을 자세히 살펴보자. 우선 saveAuthConfig 함수는 인증 서버로부터 리다이렉트 된 이후에 사용할 인증 정보를 브라우저 세션 스토리지(session storage)에 저장한다. XSS 공격에 좀 더 안전할 수 있도록 세션 키에 state 코드를 추가한다. 매 요청마다 바뀌는 state 값이 세션 키에 포함되기 때문에 XSS 공격을 더 어렵게 만든다. 

```tsx
export function saveAuthConfig({
  client_id,
  redirect_uri,
  scope,
  response_type,
}: Omit<CustomAuthContextProps, "children" | "authority">): AuthConfig {
  const state = generateOAuthState();
  const authConfig: AuthConfig = {
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: scope,
    responseType: response_type,
    codeVerifier: generateCodeVerifier(),
    state: state,
  };
  sessionStorage.setItem(`AuthConfig$$${state}`, JSON.stringify(authConfig));
  return authConfig;
}
```

code_verifier는 액세스 토큰을 발급 받을 떄 올바른 클라이언트인지 입증하기 위한 코드이고, state는 CSRF 공격을 방어하기 위해 사용한다. 리다이렉트 되면 변수에 저장된 값들이 모두 초기화되기 때문에 로컬 스토리지, 세션 스토리지, 쿠키 혹은 indexed DB처럼 데이터가 보존되는 장소에 code_verifier, state 값을 저장해야 한다. 

AWS에서 제공하는 패키지는 로컬 스토리지를 사용한 것 같지만, 나는 세션 스토리지를 사용했다. state, code_verifier 값은 인증 프로세스 중간에만 일회성으로 사용하는 데이터다. 탭이 닫히면 데이터가 삭제되는 세션 스토리지가 이를 보관하기에 안전하다고 생각했다. 이런 민감 정보는 짧은 생명 주기를 갖는 편이 더 안전한 것 같다.

generateCodeVerifier 함수는 code_verifier를 생성한다. [RFC7636](https://datatracker.ietf.org/doc/html/rfc7636#section-4.1) 표준에 따라 코드를 생성한다.

```tsx
export function generateCodeVerifier(length = 128) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}
```

generateOAuthState 함수는 state 코드를 만든다.

```tsx
export function generateOAuthState(length = 32) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}
```

generateCodeChallenge 함수는 code_verifier를 기반으로 code_challenge를 만든다. [RFC7636](https://datatracker.ietf.org/doc/html/rfc7636#appendix-A) 표준에 따라 코드를 생성한다.

- SHA-256 해시 함수로 code_verifier의 다이제스트를 구한다.
- 해당 다이제스트를 Base64 인코딩을 수행한다. 표준에 따라 `=` 패딩을 제거하고 `+`, `/` 문자는 `-`, `_` 으로 변경한다.

```tsx
export async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
```

fetchOpenIdConfig 함수는 well-known configuration URL로부터 필요한 메타 정보를 불러온다.

```tsx
export const fetchOpenIdConfig = async (
  authority: string,
): Promise<OpenIdConfig> => {
  return await fetch(`${authority}/.well-known/openid-configuration`, {
    method: "GET",
  }).then((res) => res.json());
};
```

generateQueryParams 함수는 URL 쿼리 파라미터를 만든다. 

```tsx
export function generateQueryParams(object: object) {
  return Object.entries(object)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join("&");
}
```

### 2.2. Authorization code grant redirect

이번엔 사용자가 AWS 로그인을 마친 후 인가 코드와 함께 리다이렉트 될 때 동작하는 코드 흐름을 살펴보자. useEffect 훅을 살펴보면 다음과 같이 인증과 예외 처리를 수행한다. CustomAuthProvider 컴포넌트는 애플리케이션이 렌더링 되는 순간에 인증을 수행한다. useRef 참조를 사용해 StrictMode 인 경우에도 API 요청이 한번만 수행되도록 만든다.

```tsx
  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    authentication()
      .catch((err) => setError(err))
      .finally(() => {
        setIsLoading(false)
        ref.current = false
      });
  }, []);
```

액세스 토큰 발급 요청엔 다음과 같은 정보들이 요청 메시지에 포함되어야 한다.

- grant_type - 승인 방식을 전달한다. 인가 코드 승인 방식의 경우엔 `authorization_code` 값을 사용한다.
- code - 인증 서버로부터 발급 받은 인가 코드를 전달한다.
- redirect_uri - 인증 서버에 등록한 리다이렉트 URL을 전달한다.
- client_id - 인증 서버에서 발급받은 클라이언트 ID를 전달한다.
- code_verifier - PCKE 인증에서 이전 요청에 보낸 code_challenge 값을 검증하기 위한 code_verifier를 전달한다.

이제 authentication 함수를 살펴보자. 다음과 같이 구현되어 있다. 위에서 이미 설명한 함수들은 제외하고 설명한다. 

- getAuthorizationCode 함수
  - URL 쿼리 파라미터로부터 state, code 값을 추출한다. 
  - state는 세션 스토리지에 저장된 AuthConfig 객체를 꺼낼 때 사용하고, code는 인증 서버로부터 액세스 토큰을 발급 받을 떄 사용한다.
- clearAuthConfig 함수
  - URL 쿼리 파라미터에 state, code 값이 없는 경우 세션 스토리지를 정리한다.
- popAuthConfig 함수
  - state 코드를 사용해 세션 스토리지에 저장된 AuthConfig 객체를 꺼낸다. 
- fetchAccessToken 함수
  - 인증 서버로부터 액세스 토큰을 발급 받는다.
  - 요청할 때 리다이렉트 URL에 포함된 code, 클라이언트 ID, 사전에 발급한 code_verifier, 승인 타입 등을 요청 메시지로 전달한다.
- saveUser 함수
  - 발급 받은 토큰 정보를 저장한다.
- 모든 프로세스가 끝나면 인증된 사용자를 리액트 상태(state)에 저장한다.
- state 코드로 AuthConfig 객체를 찾지 못하면 에러를 던진다.

```tsx
  const authentication = async () => {
    const { code, state } = getAuthorizationCode();
    if (!code || !state) {
      clearAuthConfig();
      return;
    }
    const config = popAuthConfig(state);
    if (!config) {
      throw new Error("No matching state found in storage")
    }
    setIsLoading(true);
    const { token_endpoint } = await fetchOpenIdConfig(authority);
    const data = {
      grant_type   : "authorization_code",
      code,
      redirect_uri : config.redirectUri,
      client_id    : config.clientId,
      code_verifier: config.codeVerifier
    };
    const formBody = generateQueryParams(data);
    const tokenResponse = await fetchAccessToken(token_endpoint, formBody);
    const savedUser = saveUser(authority, config.clientId, tokenResponse);
    setIsAuthenticated(true);
    setUser(savedUser);
  };
```

getAuthorizationCode 함수는 URL에 포함된 searchParams로부터 code, state를 추출한다.

```tsx
  const getAuthorizationCode = (): AuthorizationCode => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    return {
      code: code,
      state: state,
    };
  };
```

clearAuthConfig 함수는 세션 스토리지에 저장된 데이터 중 `AuthConfig$$` 접미사를 갖는 데이터를 삭제한다. 액세스 토큰을 발급 받을 필요가 없기 때문에 보안상 불필요한 정보를 남기지 않는다.

```tsx
export function clearAuthConfig() {
  const length = sessionStorage.length;
  for (let index = 0; index < length; index++) {
    const key = sessionStorage.key(index);
    if (key && key.includes("AuthConfig$$")) {
      sessionStorage.removeItem(key);
    }
  }
}
```

popAuthConfig 함수는 세션 스토리지에 저장된 AuthConfig 객체를 꺼낸다. 꺼냄과 동시에 삭제함으로써 데이터가 노출되는 시간을 최소화한다.

```tsx
export function popAuthConfig(state: string): AuthConfig | undefined {
  const authConfig = sessionStorage.getItem(`AuthConfig$$${state}`);
  if (!authConfig) {
    return;
  }
  sessionStorage.removeItem(`AuthConfig$$${state}`);
  return JSON.parse(authConfig) as AuthConfig;
}
```

saveUser 함수는 발급 받은 액세스 토큰과 인증된 사용자 정보를 로컬 스토리지에 저장하는 작업을 수행한다. AWS에서 제공하는 패키지에서 만들어주는 인증 사용자 객체의 profile 정보는 `id_token` JWT 토큰을 디코딩하면 얻을 수 있다. 로컬 스토리지에 사용자 정보를 저장하는 이유는 편의상 사용자가 새로운 탭을 열었을 떄 인증 사용자 정보를 사용할 수 있도록 하기 위함이다.

```tsx
export function saveUser(
  authority: string,
  clientId: string,
  token: TokenResponse,
) {
  const user: User = {
    ...token,
    profile: decodeJwt(token.id_token) as Profile,
  };
  localStorage.setItem(`openid.${authority}.${clientId}`, JSON.stringify(user));
  return user;
}
```

### 2.3. Set initial state

인증 과정이 모두 끝나면 사용자는 인증된 사용자로써 애플리케이션을 이용할 수 있다. 다만, 리프레시를 하거나 새로운 탭을 열었을 때 로그인 상태를 유지해야 한다. 이를 위해 초기 리액트 상태를 다음과 같이 설정한다.

- 로컬 스토리지에 저장된 사용자 정보를 꺼낸다.
- 사용자 정보 존재 유무로 인증된 상태를 판단하고 이를 리액트 상태로 저장한다.
- 사용자 정보를 리액트 상태에 저장한다.

```tsx
const CustomAuthProvider = ({
  children,
  authority,
  client_id,
  redirect_uri,
  response_type,
  scope,
}: CustomAuthContextProps) => {
  const sessionUser = getUser(authority, client_id);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionUser !== undefined,
  );
  const [user, setUser] = useState<User | undefined>(sessionUser);
  const [error, setError] = useState<Error>();
  const ref = useRef(false);

  ...

  return (
    <Context.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        error,
        signinRedirect,
        removeUser,
      }}
    >
      {children}
    </Context.Provider>
  );
};
```

### 2.4. Logout

마지막으로 로그아웃을 위한 코드를 살펴보자. 리액트 상태와 스토리지에 저장된 사용자 정보를 정리한다.

```tsx
  const removeUser = () => {
    setUser(undefined);
    setIsAuthenticated(false);
    removeUserFromStorage(authority, client_id);
  };
```

removeUserFromStorage 함수에선 로컬 스토리지에 저장된 사용자 정보를 삭제한다.

```tsx
export function removeUserFromStorage(authority: string, clientId: string) {
  localStorage.removeItem(`openid.${authority}.${clientId}`);
}
```

## 3. Use custom authentication

위 과정에서 만든 커스텀 인증 과정을 사용하기 위해 커스텀 훅을 만든다.

```tsx
export const useCustomAuth = () => {
  return useContext(Context)!;
};
```

이를 필요한 화면 혹은 컴포넌트에서 사용한다.

```tsx
function App() {
  const auth = useCustomAuth(); // this line

  const signOutRedirect = () => {
    const clientId = "7kjsa1ldqg9hrsuokpjgokgfgm";
    const logoutUri = "<logout uri>";
    const cognitoDomain = "https://<user pool domain>";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  if (auth.isAuthenticated) {
    return (
      <div>
        <pre> Hello: {auth.user?.profile.email} </pre>
        <pre> ID Token: {auth.user?.id_token} </pre>
        <pre> Access Token: {auth.user?.access_token} </pre>
        <pre> Refresh Token: {auth.user?.refresh_token} </pre>
        <button onClick={() => auth.removeUser()}>Sign out</button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => auth.signinRedirect()}>Sign in</button>
      <button onClick={() => signOutRedirect()}>Sign out</button>
    </div>
  );
}
```

## CLOSING

위 코드를 실행하면 로딩 상태가 조금 다르게 동작하지만, AWS에서 제공하는 패키지와 거의 유사하게 동작한다. 

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-06-14-react-oauth2-pkce-example>

#### REFERENCE

- <https://datatracker.ietf.org/doc/html/rfc7636>
- <https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1>
- <https://datatracker.ietf.org/doc/html/rfc7636#section-4.2>
- <https://datatracker.ietf.org/doc/html/rfc7636#appendix-A>

[oauth2-pkce-link]: https://junhyunny.github.io/oauth2.0/security/oauth2-pkce/