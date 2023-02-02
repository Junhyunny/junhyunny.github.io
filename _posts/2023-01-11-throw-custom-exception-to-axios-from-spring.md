---
title: "Throw Custom Exception to Axios from Spring"
search: false
category:
  - spring-boot
  - axios
last_modified_at: 2023-01-11T23:55:00
---

<br/>

## 0. 들어가면서

사용자에게 시스템 상황을 쉽게 피드백하는 방법은 화면에서 팝업 창(popup window)을 띄우는 방법입니다. 
프론트엔드(frontend)에서 판단할 수 없는 상황은 백엔드(backend)로부터 피드백을 받아야 합니다. 
업무적으로 정상적인 경우가 아니라면 에러를 통해 피드백을 받는 것이 `if-else` 구문의 사용을 줄이므로 코드의 복잡성을 낮출 수 있습니다. 
이번 포스트에선 스프링(spring) 어플리케이션에서 `axios` 모듈로 커스텀 예외 메세지를 전달하는 방법에 대해 정리하였습니다. 

## 1. Simple Page

간단한 API 요청과 에러 응답에 대한 메세지를 출력하는 페이지입니다. 

* 제출(submit) 버튼을 누르면 `axios`를 통해 백엔드 서비스로 API 요청이 수행됩니다. 
* 서버에 문제가 발생하면 에러 응답을 받고, 메세지를 팝업 창으로 출력합니다.

```jsx
import "./App.css";
import { Fragment, useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";

axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const { data } = error.response;
    return Promise.reject(data);
  }
);

const Modal = (props) => {
  return (
    props.open && (
      <Fragment>
        {ReactDOM.createPortal(
          <div className="dim" />,
          document.getElementById("dim")
        )}
        {ReactDOM.createPortal(
          <div className="modal">{props.children}</div>,
          document.getElementById("modal")
        )}
      </Fragment>
    )
  );
};

function App() {
  const [openModal, setOpenModal] = useState(false);
  const [message, setMessage] = useState("");

  const requestHandler = () => {
    axios.get("/some-request").catch((error) => {
      setOpenModal(true);
      setMessage(`[${error.code}] ${error.message}`);
    });
  };

  const closeModal = () => {
    setOpenModal(false);
  };

  return (
    <div className="App">
      <Modal open={openModal}>
        <h2>{message}</h2>
        <button onClick={closeModal}>OK</button>
      </Modal>
      <h2>Welcome To Sample Page</h2>
      <button onClick={requestHandler}>Submit</button>
    </div>
  );
}

export default App;
```

## 2. Backend Service

이번엔 스프링 어플리케이션의 코드를 살펴보겠습니다.

### 2.1. FooController 클래스

* 해당 컨트롤러는 요청 받는 모든 응답에 대해 의도적으로 예외를 발생시킵니다.
* "This is intentional exception." 메세지와 함께 예외를 상위 콜스택으로 전달합니다.

```java
package action.in.blog.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class FooController {

    private boolean isIntentionalException() {
        return true;
    }

    @GetMapping("/some-request")
    public String someRequest() {
        if (isIntentionalException()) {
            throw new RuntimeException("This is intentional exception.");
        }
        return "Hello World";
    }
}
```

### 2.2. GlobalExceptionHandler 클래스

* `@ControllerAdvice` 애너테이션을 사용해 컨트롤러들의 예외를 처리할 수 있는 빈(bean)을 생성합니다. 
* `@ExceptionHandler` 애너테이션을 사용해 지정한 예외들을 핸들링 할 수 있습니다. 
    * 이번 예제에선 RuntimeException 예외를 명시적으로 핸들링합니다.
* `@ResponseStatus` 애너테이션을 사용해 HTTP 응답 상태를 정의합니다.
    * 이번 예제에선 `INTERNAL_SERVER_ERROR(500)` 상태로 정의합니다.
* `@ResponseBody` 애너테이션을 사용해 처리한 예외를 에러의 응답 데이터로 반환합니다.
    * 별도로 정의한 `ErrorResponse` 클래스를 사용합니다.
    * timestamp - 예외가 발생한 시간
    * message - 에러 메세지
    * code - 비즈니스적으로 정의한 에러 코드
    * status - 서버 에러 상태

```java
package action.in.blog.handler;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDateTime;

@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
class ErrorResponse {
    private final LocalDateTime timestamp = LocalDateTime.now();
    private String message;
    private String code;
    private int status;
}

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    @ResponseBody
    protected ErrorResponse handleRuntimeException(RuntimeException e) {
        return ErrorResponse.builder()
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .code("300010")
                .message(e.getMessage())
                .build();
    }
}
```

## 3. Axios Interceptor

### 3.1. AxiosError 객체

`axios` 모듈은 백엔드 서비스로부터 전달 받은 에러 응답을 별도의 에러 객체로 감싸고 있습니다. 

* 로그 출력을 통해 에러를 출력하면 다음과 같은 내용을 확인할 수 있습니다. 
* 백엔드 서비스로부터 전달받은 에러는 response 객체의 내부애 data 객체에 저장됩니다.

```json
{
  "stack": "AxiosError@http://localhost:3000/static/js/bundle.js:41223:18\nsettle@http://localhost:3000/static/js/bundle.js:41861:12\nonloadend@http://localhost:3000/static/js/bundle.js:40569:66\nEventHandlerNonNull*dispatchXhrRequest@http://localhost:3000/static/js/bundle.js:40582:7\n./node_modules/axios/lib/adapters/xhr.js/__WEBPACK_DEFAULT_EXPORT__<@http://localhost:3000/static/js/bundle.js:40524:10\ndispatchRequest@http://localhost:3000/static/js/bundle.js:41690:10\nrequest@http://localhost:3000/static/js/bundle.js:41140:77\n./node_modules/axios/lib/core/Axios.js/forEachMethodNoData/Axios.prototype[method]@http://localhost:3000/static/js/bundle.js:41162:17\nwrap@http://localhost:3000/static/js/bundle.js:42279:15\nrequestHandler@http://localhost:3000/static/js/bundle.js:68:51\ncallCallback@http://localhost:3000/static/js/bundle.js:10846:18\ninvokeGuardedCallbackDev@http://localhost:3000/static/js/bundle.js:10890:20\ninvokeGuardedCallback@http://localhost:3000/static/js/bundle.js:10947:35\ninvokeGuardedCallbackAndCatchFirstError@http://localhost:3000/static/js/bundle.js:10961:29\nexecuteDispatch@http://localhost:3000/static/js/bundle.js:15105:46\nprocessDispatchQueueItemsInOrder@http://localhost:3000/static/js/bundle.js:15131:26\nprocessDispatchQueue@http://localhost:3000/static/js/bundle.js:15142:41\ndispatchEventsForPlugins@http://localhost:3000/static/js/bundle.js:15151:27\n./node_modules/react-dom/cjs/react-dom.development.js/dispatchEventForPluginEventSystem/<@http://localhost:3000/static/js/bundle.js:15311:16\nbatchedUpdates$1@http://localhost:3000/static/js/bundle.js:29703:16\nbatchedUpdates@http://localhost:3000/static/js/bundle.js:10694:16\ndispatchEventForPluginEventSystem@http://localhost:3000/static/js/bundle.js:15310:21\ndispatchEventWithEnableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay@http://localhost:3000/static/js/bundle.js:12816:42\ndispatchEvent@http://localhost:3000/static/js/bundle.js:12810:88\ndispatchDiscreteEvent@http://localhost:3000/static/js/bundle.js:12787:22\nEventListener.handleEvent*addEventBubbleListener@http://localhost:3000/static/js/bundle.js:13009:14\naddTrappedEventListener@http://localhost:3000/static/js/bundle.js:15233:33\nlistenToNativeEvent@http://localhost:3000/static/js/bundle.js:15177:30\n./node_modules/react-dom/cjs/react-dom.development.js/listenToAllSupportedEvents/<@http://localhost:3000/static/js/bundle.js:15188:34\nlistenToAllSupportedEvents@http://localhost:3000/static/js/bundle.js:15183:25\ncreateRoot@http://localhost:3000/static/js/bundle.js:32466:33\ncreateRoot$1@http://localhost:3000/static/js/bundle.js:32812:14\n./node_modules/react-dom/client.js/exports.createRoot@http://localhost:3000/static/js/bundle.js:32888:16\n./src/index.js@http://localhost:3000/static/js/bundle.js:183:60\noptions.factory@http://localhost:3000/static/js/bundle.js:44567:31\n__webpack_require__@http://localhost:3000/static/js/bundle.js:43991:33\n@http://localhost:3000/static/js/bundle.js:45213:56\n@http://localhost:3000/static/js/bundle.js:45215:12\n",
  "message": "Request failed with status code 500",
  "name": "AxiosError",
  "code": "ERR_BAD_RESPONSE",
  "config": {
    "transitional": {
      "silentJSONParsing": true,
      "forcedJSONParsing": true,
      "clarifyTimeoutError": false
    },
    "adapter": [
      "xhr",
      "http"
    ],
    "transformRequest": [
      null
    ],
    "transformResponse": [
      null
    ],
    "timeout": 0,
    "xsrfCookieName": "XSRF-TOKEN",
    "xsrfHeaderName": "X-XSRF-TOKEN",
    "maxContentLength": -1,
    "maxBodyLength": -1,
    "env": {},
    "headers": {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": null
    },
    "method": "get",
    "url": "/some-request"
  },
  "request": {},
  "response": {
    "data": {
      "timestamp": "2023-01-12T06:52:47.914317",
      "message": "This is intentional exception.",
      "code": "300010",
      "status": 500
    },
    "status": 500,
    "statusText": "Internal Server Error",
    "headers": {
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
      "access-control-allow-origin": "*",
      "connection": "close",
      "content-encoding": "gzip",
      "content-type": "application/json",
      "date": "Wed, 11 Jan 2023 21:52:47 GMT",
      "transfer-encoding": "chunked",
      "vary": "Accept-Encoding",
      "x-powered-by": "Express"
    },
    "config": {
      "transitional": {
        "silentJSONParsing": true,
        "forcedJSONParsing": true,
        "clarifyTimeoutError": false
      },
      "adapter": [
        "xhr",
        "http"
      ],
      "transformRequest": [
        null
      ],
      "transformResponse": [
        null
      ],
      "timeout": 0,
      "xsrfCookieName": "XSRF-TOKEN",
      "xsrfHeaderName": "X-XSRF-TOKEN",
      "maxContentLength": -1,
      "maxBodyLength": -1,
      "env": {},
      "headers": {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": null
      },
      "method": "get",
      "url": "/some-request"
    },
    "request": {}
  }
}
```

### 3.2. Axios Interceptor Error Handling

백엔드 서비스로부터 전달 받은 에러를 AxiosError 객체로부터 구조 분해 할당(destructuring)해야 합니다. 
`axios` 모듈의 인터셉터(interceptor)를 사용하면 처리한 내용을 어플리케이션 전역에 쉽게 적용 가능합니다. 

```js
axios.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const { data } = error.response;
    return Promise.reject(data);
  }
);
```

##### 에러 핸들링 결과

<p align="center">
    <img src="/images/throw-custom-exception-to-axios-from-spring-1.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-01-11-throw-custom-exception-to-axios-from-spring>

#### REFERENCE

* <https://stackoverflow.com/questions/63104384/how-to-get-exception-message-in-axios-from-a-spring-boot-backend>
* <https://tecoble.techcourse.co.kr/post/2021-05-10-controller_advice_exception_handler/>
* <https://incheol-jung.gitbook.io/docs/q-and-a/spring/controlleradvice-exceptionhandler>
* <https://mangkyu.tistory.com/246>
* <https://joojimin.tistory.com/54>
* <https://jeong-pro.tistory.com/195>