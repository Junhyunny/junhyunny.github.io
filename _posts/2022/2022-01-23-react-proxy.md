---
title: "React 개발 서버 CORS 문제 해결" 
search: false
category:
  - information
  - react
last_modified_at: 2022-01-23T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [CORS(Cross Origin Resource Sharing)][cors-link] 
- [Spring 서버 CORS(Cross Origin Resource Sharing) 헤더 처리][cors-server-example-link]
- [Forward/Reverse Proxy][forward-reverse-proxy-link]

## 1. CORS(Cross Origin Resource Sharing)

먼저 CORS(Cross Origin Resource Sharing) 개념을 정리해보자. 자세한 내용이 알고 싶다면 [이전 글][cors-link]을 읽어보길 바란다. 일반적으로 브라우저는 보안 때문에 동일 출처 정책(SOP, Same Origin Policy)을 따른다. 두 URL의 **프로토콜, 호스트, 포트**가 모두 같아야 동일한 출처(origin)로 본다. 예를 들어 `a-service.com` 서버에서 받은 HTML 페이지에서 `b-service.com` 호스트로 요청을 보내면 해당 에러가 발생한다. 

CORS 프리플라이트(preflight)가 필요하지 않은 요청인 경우에 서버는 요청을 정상적으로 처리하고 응답한다. 다만, 응답을 받은 브라우저에서 에러가 발생한다. 보통 리액트 같은 싱글 페이지 애플리케이션(SPA, Single Page Application)은 데이터를 별도 API 서비스에서 받아오기 때문에 크로스 오리진(cross origin) 요청이 되는 것이다.

아래 표를 통해 동일 출처 여부를 확인해보자.

- `http://store.company.com(기본 포트, 80)`와 동일한 출처는 다음과 같다.

| URL | 동일 여부 | 이유 |
|---|:---:|:---|
| http://store.company.com/dir2/other.html | 동일 출처 | 경로만 다름 |
| http://store.company.com/dir/inner/another.html | 동일 출처 | 경로만 다름 |
| https://store.company.com/secure.html | 다른 출처 | 프로토콜 다름 |
| http://store.company.com:81/dir/etc.html | 다른 출처 | 포트 다름 (http://는 80이 기본값) |
| http://news.company.com/dir/other.html | 다른 출처 | 호스트 다름 |

## 2. React dev server proxy setting

CORS 위반은 크로스 오리진 요청인 경우에 브라우저가 서버로부터 적절한 응답 헤더를 받지 못 했을 때 발생한다. CORS 정책 위반 문제를 정석으로 해결하는 방법은 서버에서 응답 헤더에 필요한 값들을 담아서 반환하는 것이다. [이전 예제][cors-server-example-link]에선 @CrossOrigin 애너테이션을 통해 CORS 정책 문제를 해결했다. 

로컬 개발 환경에서 서버 쪽에 별도로 CORS 설정을 하고 싶지 않다면 어떻게 처리할 수 있을까? 프론트 개발 서버에 [프록시(proxy)][forward-reverse-proxy-link]를 설정하면 이를 해결할 수 있다. 이 글은 CRA(Create React App) 보일러 플레이트로 생성한 리액트 애플리케이션을 대상으로 설명한다. 다른 도구를 사용한다면 다른 방식으로 프록시를 설정해야 한다. 이 글을 통해 컨셉을 이해한다면 설정하는 방법은 쉬울 것이다.

리액트 개발 서버에 프록시를 구축하면 다음과 같이 동작한다.

- 리액트 애플리케이션으로부터 화면을 전달받다. 이때 호스트는 `http://localhost:3000`이다. 
- 화면 버튼을 눌렀을 때 브라우저는 리액트 애플리케이션에게 요청한다. 
- 리액트 애플리케이션에 구축된 프록시를 통해 백엔드 서비스(`http://localhost:8080`)를 호출한다. 
- 백엔드 서비스는 요청에 대한 응답을 반환한다.
- 리액트 애플리케이션은 이를 다시 브라우저에게 전달한다.

<p align="center">
  <img src="/images/posts/2022/react-proxy-02.png" width="60%">
</p>

<br/>

위 흐름이기 때문에 브라우저는 크로스 오리진 요청을 하지 않은 것과 동일하다. 반대로 잠시 언급했던 스프링 부트 서버에서 CORS 처리를 구축하면 다음과 같이 처리된다.

- 리액트 애플리케이션으로부터 화면을 전달받다. 이때 호스트는 `http://localhost:3000`이다. 
- 화면 버튼을 눌렀을 때 브라우저가 백엔드 서비스(`http://localhost:8080`)로 직접 요청한다. 
- 백엔드 서비스는 요청에 대한 응답을 반환한다.
- 응답 헤더 정보에 `Access-Control-Allow-Origin: http://localhost:3000`가 추가된다.
  - 이는 백엔드 서비스가 `http://localhost:3000` 출처로부터 오는 요청은 허가한다는 의미이다.

<p align="center">
  <img src="/images/posts/2022/react-proxy-01.png" width="60%">
</p>

## 3. Example

이제 간단한 예제 코드를 작성해보자. 프록시 설정을 살펴보기 전에 먼저 구현 코드를 살펴본다.

### 3.1. React application

리액트 코드를 먼저 살펴본다. `axios`는 `URI`가 상대 경로인지 절대 경로인지에 따라 동작 방법이 다르다. 상대 경로는 페이지 출처(origin)로 요청을 보내고, 절대 경로는 지정한 도메인에 해당하는 서버로 요청을 보낸다.

- non cors header 버튼 
  - `localhost:8080` 서버로 직접 요청하고, CORS 관련 응답 헤더 정보를 받지 못한다.
- cors header 버튼 
  - `localhost:8080` 서버로 직접 요청하고, CORS 관련 응답 헤더 정보를 받다.
- nonProxy 버튼 
  - `localhost:3000` 리액트 애플리케이션으로 요청하고, 경로에 따른 프록시 설정을 하지 않는다. 
- proxy 버튼 
  - `localhost:3000` 리액트 애플리케이션으로 요청하고, 경로에 따른 프록시 설정을 수행한다. 

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

### 3.2. Spring server controller

다음과 같은 코드를 통해 요청을 처리한다. 

- /not-cors 경로
  - 별도 CORS 정책 설정이 없다.
- /cors 경로
  - `http://localhost:3000` 서버를 위한 CORS 정책을 설정한다.
- /not-proxy 경로
  - 별도 CORS 정책 설정이 없다.
- /proxy 경로
  - 별도 CORS 정책 설정이 없다.

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

### 3.3. Setting proxy in package.json 

CRA를 통해 생성한 리액트 애플리케이션은 `package.json` 파일을 통해 쉽게 프록시를 설정할 수 있다. package.json 파일에 `proxy` 프로퍼티를 추가한다. `react-scripts`가 `0.2.3` 버전 이상일 경우에 가능한 것으로 보인다.

> Proxying API Requests in Development<br/>
> Note: this feature is available with react-scripts@0.2.3 and higher.

아래와 같이 설정한다.

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
  
  ...

  "proxy": "http://localhost:8080" // this
}
```

위처럼 프록시를 설정하고 브라우저에서 각 버튼을 눌러 응답을 살펴보자. 

- non cors header 버튼
  - `localhost:8080` 서버로 직접 요청한다.
  - CORS 정책 위반에 대한 에러 메시지가 출력된다.
  - `axios` 모듈의 `catch` 부분에서 에러 메시지를 화면에 출력한다. 
- cors header 버튼 
  - `localhost:8080` 서버로 직접 요청한다.
  - 서버로부터 전달받은 데이터를 정상적으로 화면에 출력한다.
  - 스프링 서버에서 CORS 정책 관련된 설정을 수행하고 있기 때문이다.
- nonProxy 버튼 
  - `localhost:3000` 리액트 애플리케이션으로 요청한다.
  - 프록시 설정으로 인해 백엔드 서비스로 요청이 전달된다.
  - 서버로부터 전달받은 데이터를 정상적으로 화면에 출력한다.
- proxy 버튼 
  - `localhost:3000` 리액트 애플리케이션으로 요청한다.
  - 프록시 설정으로 인해 백엔드 서비스로 요청이 전달된다.
  - 서버로부터 전달받은 데이터를 정상적으로 화면에 출력한다.

<p align="center">
  <img src="/images/posts/2022/react-proxy-03.gif" width="100%" class="image__border">
</p>

## 3.4. http-proxy-middleware library

위 테스트를 보면 nonProxy 버튼과 proxy 버튼의 차이점을 느끼지 못 했을 것이다. 사실 두 기능은 동일하게 동작한다. package.json 파일을 통해 프록시를 설정한 경우 상대 경로 URI로 보내는 모든 요청은 프록시를 통해 스프링 서버로 연결되기 때문이다. 

package.json 설정처럼 모든 요청이 프록시를 거쳐가는 것이 아니라 특정 요청만 프록시를 사용하고 싶다면 어떻게 해야 할까? 이를 조금 더 유연하게 설정하고 싶은 경우 `http-proxy-middleware` 라이브러리를 사용할 수 있다. 라이브러리이기 때문에 CRA 프로젝트 여부는 중요하지 않다.

> Proxying API Requests in Development<br/>
> If the proxy option is not flexible enough for you, alternatively you can:
> - Configure the proxy yourself (this option is using http-proxy-middleware.)
> - Enable CORS on your server (here’s how to do it for Express).
> - Use environment variables to inject the right server host and port into your app.

아래 명령어를 사용하 설치한다.

```
$ npm install http-proxy-middleware
```

프록시 미들웨어를 위한 설정 파일을 만든다.

- `/src` 폴더에 `setupProxy.js` 파일을 생성한다.
- API 요청 경로가 `/proxy`인 경우만 `http://localhost:8080` 서버로 요청을 전달한다.

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

위 설정 후 테스트를 하면 다음과 같은 결과를 얻는다.

- nonProxy 버튼 
  - `localhost:3000` 리액트 애플리케이션으로 요청한다.
  - `/not-proxy` 경로에 해당하는 프록시 설정이 존재하지 않다.
  - `localhost:3000` 호스트에는 `/not-proxy` 요청을 받아줄 경로가 없으므로 `404(NOT FOUND)` 에러가 발생한다.
- proxy 버튼
  - `localhost:3000` 리액트 애플리케이션으로 요청한다.
  - `/proxy` 경로에 해당하는 프록시 설정이 존재한다.
  - `http://localhost:8080` 호스트 서버로부터 전달받은 데이터를 정상적으로 화면에 출력한다.

<p align="center">
  <img src="/images/posts/2022/react-proxy-04.gif" width="100%" class="image__border">
</p>

## CLOSING

크로스 오리진 요청은 서버에서 정상적인 요청과 응답은 일어나지만, 브라우저에서 에러가 발생한다는 사실을 명심하길 바란다. 포스트맨(PostMan), 인썸니아(Insomnia), cURL 같은 도구를 사용하면 CORS 정책 위반 관련 에러가 발생하지 않지만, 브라우저에서 발생한다. 

package.json 파일을 통한 프록시 설정은 로컬 개발 환경에서만 적용 가능하다. nginx 같은 웹 서버를 따로 사용할 것이라면 `nginx.conf` 설정으로 트래픽을 애플리케이션 서버로 라우팅하면 된다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-23-react-proxy>

#### RECOMMEND NEXT POSTS

- [React 환경 변수 설정과 실행 환경 분리][react-env-variable-setting-link]

#### REFERENCE

- <https://github.com/chimurai/http-proxy-middleware>
- <https://create-react-app.dev/docs/proxying-api-requests-in-development/>
- <https://evan-moon.github.io/2020/05/21/about-cors/>
- [React 개발환경에서의 CORS를 위한 proxy 설정][react-dev-cors-link]

[cors-link]: https://junhyunny.github.io/information/cors/
[cors-server-example-link]: https://junhyunny.github.io/spring-boot/vue.js/cors-example/
[forward-reverse-proxy-link]: https://junhyunny.github.io/information/forward-reverse-proxy/
[react-env-variable-setting-link]: https://junhyunny.github.io/react/react-env-variable-setting/

[react-dev-cors-link]: https://velog.io/@tw4204/React-%EA%B0%9C%EB%B0%9C%ED%99%98%EA%B2%BD%EC%97%90%EC%84%9C%EC%9D%98-CORS%EB%A5%BC-%EC%9C%84%ED%95%9C-proxy-%EC%84%A4%EC%A0%95
