---
title: "React 개발 서버 CORS 해결하기 with Proxy" 
search: false
category:
  - information
  - react
last_modified_at: 2022-01-23T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.

- [CORS(Cross Origin Resource Sharing)][cors-link] 
- [CORS(Cross Origin Resource Sharing) with Spring Boot][cors-server-example-link]

## 1. CORS(Cross Origin Resource Sharing)

간단하게 CORS(Cross Origin Resource Sharing) 개념을 정리하고 글을 이어가겠습니다. 
자세한 내용은 [CORS(Cross Origin Resource Sharing)][cors-link] 포스트에서 확인할 수 있습니다. 

일반적으로 브라우저는 보안 문제로 인해 동일 출처 정책(SOP, Same Origin Policy)을 따릅니다. 
두 URL의 **프로토콜, 호스트, 포트**가 모두 같아야 동일한 출처로 볼 수 있는데, 
예를 들어 `a-service.com` 호스트에게 받은 페이지에서 `b-service.com` 호스트로 데이터를 요청할 수 없습니다. 
출처가 다른 호스트로 데이터를 요청하는 경우 CORS 정책을 위반하게 됩니다. 
보통 SPA(Single Page Application)은 데이터를 별도 API 서비스에서 받아오기 때문에 Cross Origin 요청이 발생합니다. 

##### 동일 출처 구분
- `http://store.company.com(기본 포트, 80)`와 동일한 출처는 다음과 같습니다.

| URL | 동일 여부 | 이유 |
|---|:---:|:---|
| http://store.company.com/dir2/other.html | 동일 출처 | 경로만 다름 |
| http://store.company.com/dir/inner/another.html | 동일 출처 | 경로만 다름 |
| https://store.company.com/secure.html | 다른 출처 | 프로토콜 다름 |
| http://store.company.com:81/dir/etc.html | 다른 출처 | 포트 다름 (http://는 80이 기본값) |
| http://news.company.com/dir/other.html | 다른 출처 | 호스트 다름 |

## 2. 리액트(React) 어플리케이션 프록시(proxy) 구축하기

CORS 정책 위반 문제를 정석으로 해결하려면 백엔드 서비스 쪽에서 응답 헤더에 필요한 값들을 담아서 전달해야 합니다. 
[CORS(Cross Origin Resource Sharing) with Spring Boot][cors-server-example-link] 포스트에선 @CrossOrigin 애너테이션을 이용해 간단하게 CORS 정책 문제를 해결하였습니다. 
서버로부터 적절한 응답 헤더를 받지 못하면 브라우저에서 에러가 발생합니다. 
백엔드 서비스는 정상적인 요청과 응답은 일어나지만, 브라우저에서 에러가 발생한다는 것에 주의해야 합니다. 
이는 포스트맨(PostMan)이나 인썸니아(Insomnia) 같은 테스트 도구에서는 CORS 정책 위반 관련 에러가 발생하지 않는 이유입니다. 

대표적인 SPA인 리액트 어플리케이션에서도 프록시를 이용하면 이를 CORS 정책을 우회할 수 있습니다. 
별도의 응답 헤더를 받을 필요 없이 브라우저는 리액트 어플리케이션으로 데이터를 요청하고, 해당 요청을 백엔드 서비스로 전달(pass)합니다. 
리액트 어플리케이션이 백엔드 서비스로부터 받은 응답 데이터를 다시 브라우저로 재전달하기 때문에 브라우저는 CORS 정책을 위배한지 모릅니다. 

##### [CORS(Cross Origin Resource Sharing) with Spring Boot][cors-server-example-link] 시나리오 (@CrossOrigin 애너테이션 사용)
- 리액트 어플리케이션으로부터 화면을 전달받습니다. 이때 호스트는 `http://localhost:3000`입니다. 
- 화면 버튼을 눌렀을 때 브라우저가 백엔드 서비스(`http://localhost:8080`)로 직접 요청합니다. 
- 백엔드 서비스는 요청에 대한 응답을 반환합니다.
- 응답 헤더 정보에 `Access-Control-Allow-Origin: http://localhost:3000`가 추가됩니다.
    - 이는 백엔드 서비스가 `http://localhost:3000` 출처로부터 오는 요청은 허가한다는 의미입니다.

<p align="center"><img src="/images/react-proxy-1.JPG" width="60%"></p>

##### 리액트 어플리케이션 프록시 구축
- 리액트 어플리케이션으로부터 화면을 전달받습니다. 이때 호스트는 `http://localhost:3000`입니다. 
- 화면 버튼을 눌렀을 때 브라우저는 리액트 어플리케이션에게 요청합니다. 
- 리액트 어플리케이션에 구축된 프록시를 통해 백엔드 서비스(`http://localhost:8080`)를 호출합니다. 
- 백엔드 서비스는 요청에 대한 응답을 반환합니다.
- 리액트 어플리케이션은 이를 다시 브라우저에게 전달합니다.

<p align="center"><img src="/images/react-proxy-2.JPG" width="60%"></p>

## 3. 테스트 코드

### 3.1. 리액트 어플리케이션 - App.js
- `axios` 모듈에서 사용한 `URI`가 상대 경로인지 절대 경로인지 확인합니다. 
- non cors header 버튼 - `localhost:8080` 서버로 직접 요청하고, CORS 관련 응답 헤더 정보를 받지 못합니다.
- cors header 버튼 - `localhost:8080` 서버로 직접 요청하고, CORS 관련 응답 헤더 정보를 받습니다.
- nonProxy 버튼 - `localhost:3000` 리액트 어플리케이션으로 요청하고, 경로에 따른 프록시 설정을 하지 않습니다. 
- proxy 버튼 - `localhost:3000` 리액트 어플리케이션으로 요청하고, 경로에 따른 프록시 설정을 수행합니다. 

```jsx
import './App.css';
import {useState} from "react";
import axios from "axios";

function App() {

    const [message, setMessage] = useState('');

    const responseHandler = ({data}) => {
        setMessage(data);
        return data;
    };

    const errorHandler = ({message}) => {
        setMessage(message);
        return message;
    };

    const onNonCorsHeaderHandler = () => {
        axios.get('http://localhost:8080/not-cors')
            .then(responseHandler)
            .catch(errorHandler);
    };

    const onCorsHeaderHandler = () => {
        axios.get('http://localhost:8080/cors').then(responseHandler);
    };

    const onNonProxyHandler = () => {
        axios.get('/not-proxy')
            .then(responseHandler)
            .catch(errorHandler);
    };

    const onProxyHandler = () => {
        axios.get('/proxy').then(responseHandler);
    };

    return (
        <div className="App">
            <p>
                {message}
            </p>
            <div>
                <button onClick={onNonCorsHeaderHandler}>non cors header</button>
                <button onClick={onCorsHeaderHandler}>cors header</button>
                <button onClick={onNonProxyHandler}>nonProxy</button>
                <button onClick={onProxyHandler}>proxy</button>
            </div>
        </div>
    );
}

export default App;
```

### 3.2. 스프링 백엔드 서비스 - CorsController 클래스
다음과 같은 코드를 통해 요청과 응답 정보를 확인하겠습니다. 

```java
package blog.in.action.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CorsController {

    @GetMapping(value = {"", "/"})
    public String index() {
        System.out.println("index");
        return "index";
    }

    @GetMapping(value = "/not-cors")
    public String notCors() {
        System.out.println("not-cors");
        return "notCors";
    }

    @CrossOrigin("http://localhost:3000")
    @GetMapping(value = "/cors")
    public String cors() {
        System.out.println("cors");
        return "cors";
    }

    @GetMapping(value = "/not-proxy")
    public String notProxy() {
        System.out.println("not-proxy");
        return "notProxy";
    }

    @GetMapping(value = "/proxy")
    public String proxy() {
        System.out.println("proxy");
        return "proxy";
    }
}
```

## 4. package.json 파일을 이용한 프록시 설정

CRA(create-react-app)을 이용해 리액트 어플리케이션을 만드는 경우 `react-scripts`을 사용하게 됩니다. 
`react-scripts`을 이용하면 `package.json` 파일에 `proxy` 옵션을 추가하여 쉽게 프록시를 구축할 수 있습니다. 
다만, 주의사항으로 `0.2.3` 버전 이상일 경우에 가능한 것으로 보입니다.

> Proxying API Requests in Development<br/>
> Note: this feature is available with react-scripts@0.2.3 and higher.

##### package.json 파일 - proxy 옵션 추가

```json
{
  "name": "front-end",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.1",
    "@testing-library/react": "^12.1.2",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^0.25.0",
    "http-proxy-middleware": "^2.0.1",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-scripts": "5.0.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:8080"
}
```

##### 테스트 결과
- non cors header 버튼
    - `localhost:8080` 서버로 직접 요청합니다.
    - CORS 정책 위반에 대한 에러 메시지가 출력됩니다.
    - `axios` 모듈의 `catch` 부분에서 에러 메시지를 화면에 출력합니다. 
- cors header 버튼 
    - `localhost:8080` 서버로 직접 요청합니다.
    - 서버로부터 전달받은 데이터를 정상적으로 화면에 출력합니다.
- nonProxy 버튼 
    - `localhost:3000` 리액트 어플리케이션으로 요청합니다.
    - 특정 경로에 해당되는 프록시 설정을 하지 않았지만, 백엔드 서비스로 요청이 전달됩니다.
    - 서버로부터 전달받은 데이터를 정상적으로 화면에 출력합니다.
- proxy 버튼 
    - `localhost:3000` 리액트 어플리케이션으로 요청합니다.
    - 특정 경로에 해당되는 프록시 설정을 하지 않았지만, 백엔드 서비스로 요청이 전달됩니다.
    - 서버로부터 전달받은 데이터를 정상적으로 화면에 출력합니다.

<p align="center"><img src="/images/react-proxy-3.gif" width="100%"></p>

## 4. http-proxy-middleware 모듈 사용하기

`package.json` 파일에 proxy 옵션을 추가하는 방법은 프록시 설정이 전역적으로 적용되는 것처럼 보입니다. 
이를 조금 더 유연하게 사용하고 싶은 경우 `http-proxy-middleware` 모듈을 사용합니다. 

> Proxying API Requests in Development<br/>
> If the proxy option is not flexible enough for you, alternatively you can:
> - Configure the proxy yourself (this option is using http-proxy-middleware.)
> - Enable CORS on your server (here’s how to do it for Express).
> - Use environment variables to inject the right server host and port into your app.

### 4.1. http-proxy-middleware 설치

```
% npm install http-proxy-middleware
```

### 4.2. setupProxy.js 파일 생성
- `/src` 폴더에 `setupProxy.js` 파일을 생성합니다.
- API 요청 경로에 `/proxy`가 존재하는 경우 `http://localhost:8080` 호스트로 요청을 전달합니다.

```javascript
const {createProxyMiddleware} = require('http-proxy-middleware')

module.exports = app => {
    app.use('/proxy',
        createProxyMiddleware(
            {
                target: 'http://localhost:8080',
                changeOrigin: true,
            }
        )
    )
}
```

##### 테스트 결과
- non cors header 버튼
    - `localhost:8080` 서버로 직접 요청합니다.
    - CORS 정책 위반에 대한 에러 메시지가 출력됩니다.
    - `axios` 모듈의 `catch` 부분에서 에러 메시지를 화면에 출력합니다. 
- cors header 버튼 
    - `localhost:8080` 서버로 직접 요청합니다.
    - 서버로부터 전달받은 데이터를 정상적으로 화면에 출력합니다.
- nonProxy 버튼 
    - `localhost:3000` 리액트 어플리케이션으로 요청합니다.
    - `/not-proxy` 경로에 해당하는 프록시 설정이 존재하지 않습니다.
    - `localhost:3000` 호스트에는 `/not-proxy` 요청을 받아줄 경로가 없으므로 404 NOT FOUND 에러가 발생합니다.
- proxy 버튼 
    - `localhost:3000` 리액트 어플리케이션으로 요청합니다.
    - `/proxy` 경로에 해당하는 프록시 설정이 존재합니다.
    - `http://localhost:8080` 호스트 서버로부터 전달받은 데이터를 정상적으로 화면에 출력합니다.

<p align="center"><img src="/images/react-proxy-4.gif" width="100%"></p>

## CLOSING

프록시는 개발 환경에서만 적용 가능한 것으로 확인됩니다. 
필요하다면 `nginx.conf` 설정을 통해 특정 `location`은 다른 서비스로 라우팅이 가능한 것으로 알고 있습니다. 
기회가 된다면 관련된 내용을 추후에 포스트하겠습니다.  

특이한 사항으로 `http-proxy-middleware` 모듈을 사용할 때 API 경로를 루트(root)로 설정하는 경우 화면 로딩과 동시에 백엔드 서비스로 요청을 라우팅합니다. 
`http-proxy-middleware` 경로 규칙을 `/`로 설정하는 경우 리액트 어플리케이션 루트 화면 로딩과 동시에 백엔드 서비스로 요청을 전달합니다. 
`pacakge.json` 파일에서 `proxy` 옵션을 주는 것과 다르게 동작합니다. 

자세히 설명하면 다음과 같습니다. 
- `http-proxy-middleware` 경로 규칙을 `/`인 경우
    - `http://localhost:3000` 화면 접속시 리액트 어플리케이션은 `http://localhost:8080` 으로 요청을 전달합니다.
    - `http://localhost:3000` 화면에는 백엔드 서비스에서 보낸 응답은 "index" 문자열이 출력됩니다.
- `pacakge.json` 파일에서 `proxy` 옵션이 `http://localhost:8080`인 경우
    - `http://localhost:3000` 화면 접속시 리액트 어플리케이션의 index.html 파일이 반환됩니다.
    - 별도 백엔드 서비스로 라우팅되지 않습니다.

##### StackOverflow 질문
- 관련 내용은 `StackOverflow`에 질문으로 남겼습니다.
- [What is different between using package.json and usign http-proxy-middleware module to create proxy?][stack-overflow-question-link]

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-23-react-proxy>

#### RECOMMEND NEXT POSTS

* [React 환경 변수 설정과 실행 환경 분리][react-env-variable-setting-link]

#### REFERENCE
- <https://github.com/chimurai/http-proxy-middleware>
- <https://create-react-app.dev/docs/proxying-api-requests-in-development/>
- <https://evan-moon.github.io/2020/05/21/about-cors/>
- [React 개발환경에서의 CORS를 위한 proxy 설정][react-dev-cors-link]

[cors-link]: https://junhyunny.github.io/information/cors/
[cors-server-example-link]: https://junhyunny.github.io/spring-boot/vue.js/cors-example/

[react-dev-cors-link]: https://velog.io/@tw4204/React-%EA%B0%9C%EB%B0%9C%ED%99%98%EA%B2%BD%EC%97%90%EC%84%9C%EC%9D%98-CORS%EB%A5%BC-%EC%9C%84%ED%95%9C-proxy-%EC%84%A4%EC%A0%95

[stack-overflow-question-link]: https://stackoverflow.com/questions/70824183/what-is-different-between-using-package-json-and-usign-http-proxy-middleware-mod

[react-env-variable-setting-link]: https://junhyunny.github.io/react/react-env-variable-setting/