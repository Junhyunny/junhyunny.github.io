---
title: "Polling & Long Polling in JavaScript"
search: false
category:
  - information
  - javascript
last_modified_at: 2022-01-09T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Long polling in Spring][polling-long-polling-and-spring-example-link]

## 0. 들어가면서

폴링, 폴링에 대한 개념은 전에 [작성한 글][polling-long-polling-and-spring-example-link]을 참고하길 바란다. 이번엔 자바스크립트(javascript)로 폴링을 구현하는 방법을 알아보자. 테스트 코드도 함께 살펴본다. 

## 1. Polling in JavaScript

setTimeout 함수와 setInterval 함수를 사용하면 쉽게 폴링을 구현할 수 있다. 두 함수는 지정한 시간마다 다시 동작하지만, 미묘한 차이가 있으므로 이를 먼저 살펴보자. setTimeout 함수는 콜백 함수 실행 시간과 상관없이 콜백 함수 실행 간격이 일정하게 보장된다. 콜백 함수가 끝난 시점을 기준으로 시간을 잰다.

<div align="center">
    <img src="/images/posts/2022/polling-long-polling-and-javascript-example-02.png" width="50%" class="image__border">
</div>
<center>https://ko.javascript.info/settimeout-setinterval</center>

<br/>

setInterval 함수는 콜백 함수의 실행 시간이 길면 콜백 함수 실행 간격이 짧아진다. 콜백 함수가 시작한 시점을 기준으로 시간을 잰다. 예를 들어 지정한 시간 간격이 100ms라고 가정해보자.

- 콜백 함수 실행 시간이 30ms라면 다음 콜백 함수 실행은 70ms 뒤에 실행된다.
- 콜백 함수 실행 시간이 60ms라면 다음 콜백 함수 실행은 40ms 뒤에 실행된다.

<div align="center">
    <img src="/images/posts/2022/polling-long-polling-and-javascript-example-03.png" width="50%" class="image__border">
</div>
<center>https://ko.javascript.info/settimeout-setinterval</center>

### 1.1. Polling with setTimeout  

먼저 setTimeout 함수를 사용해 폴링을 구현해보자. 

1. setTimeout 함수의 타임 아웃을 지정한다.
2. 전달 받은 함수를 실행한다.
3. timeoutPolling 함수를 재귀적으로 호출한다.

```js
export const timeoutPolling = (func, timeout) => {
  setTimeout(() => {
    func(); // 2
    timeoutPolling(func, timeout); // 3
  }, timeout); // 1
};

```

다음 테스트 코드로 이 기능을 검증할 수 있다. setTimeout 함수를 사용하기 때문에 Jest의 페이크 타이머(fake timer)를 사용한다.

1. Given
  - 페이크 타이머를 설정한다.
  - 검증에 필요한 스파이(spy) 테스트 더블(double)을 만든다.
2. When
  - 타임아웃 폴링을 지정한다.
  - 페이크 타이머를 사용해 6초를 진행시킨다.
3. Then
  - 스파이가 의도한 대로 6번 호출되었는지 확인한다.

```js
describe("PollingClient test", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test("when timeout 1 second for polling then call 6 times in 6 seconds", async () => {
    jest.useFakeTimers(); // 1
    const spyFunc = jest.fn();

    timeoutPolling(spyFunc, 1000); // 2
    for (let i = 0; i < 6; i++) { 
      jest.advanceTimersByTime(1000);
    }

    expect(spyFunc).toHaveBeenCalledTimes(6); // 3
  });

  ...

});
```

### 1.2. Polling with setInterval

이번엔 setInterval 함수를 사용해 폴링을 구현해본다. 이번엔 추가적으로 최대 시도 회수를 지정할 수 있다.

1. 인터벌 시간을 지정한다.
2. 함수를 호출한다.
3. 시도한 횟수와 최대 시도 횟수가 동일한 경우 폴링을 종료한다.

```js
export const intervalPolling = (func, interval, maxAttempts = -1) => {
  let attempts = 0;
  let intervalId = setInterval(() => {
    if (maxAttempts === attempts) { // 3
      clearInterval(intervalId);
      return;
    }
    attempts++;
    func(); // 2
  }, interval); // 1
};
```

다음 테스트 코드를 통해 이 기능을 검증할 수 있다.

1. Given
  - 페이크 타이머를 설정한다.
  - 검증에 필요한 스파이 테스트 더블을 만든다.
2. When
  - 폴링 인터벌을 지정한다.
  - 페이크 타이머를 사용해 6초를 진행시킨다.
3. Then
  - 스파이가 의도한 대로 5번 호출되었는지 확인한다.

```js
describe("PollingClient test", () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  ...

  test("when 1 second interval and max attempt count is 5 for polling then call 5 times in 6 seconds", () => {
    jest.useFakeTimers(); // 1
    const spyFunc = jest.fn();

    intervalPolling(spyFunc, 1000, 5); // 2
    for (let i = 0; i < 6; i++) {
      jest.advanceTimersByTime(1000);
    }

    expect(spyFunc).toHaveBeenCalledTimes(5); // 3
  });

  ...

});
```

### 1.3. Polling with while loop

setTimeout, setInterval 함수 말고 while 루프를 사용하는 방법이 있다. 타이머를 사용하지 않기 때문에 Jest의 페이크 타이머를 사용하지 않아도 폴링을 테스트 할 수 있다. 자바스크립트는 sleep 함수가 별도로 없기 때문에 프로미스를 사용해 직접 구현했다. 때문에 이 sleep 함수는 비동기 블록 안에서만 사용할 수 있다. 

1. 지정된 func 콜백 함수를 호출한다.
2. 원하는 응답인지 확인한다.
  - 다른 응답인 경우 폴링을 수행한다.
  - 원하는 응답인 경우 결과를 반환한다.
3. 지정된 시간만큼 대기한다.

```js
const sleep = (timeout = 100) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export const sleepPolling = async (func, validateFunc, timeout) => {
  let result = await func(); // 1
  while (!validateFunc(result)) { // 2
    await sleep(timeout); // 3
    try {
      result = await func(); // 1
    } catch (e) {
      console.log(e.message);
    }
  }
  return result;
};
```

다음 테스트 코드로 검증한다.

1. Given
  - 스텁(stub)에 필요한 응답을 순차적으로 지정한다.
  - 응답이 유효한지 확인하는 검증 콜백 함수를 정의한다.
2. When
  - 폴링을 수행한다.
3. Then
  - 의도한 대로 2번 호출되었는지 확인한다.
  - 원하는 응답이 반환되었는지 확인한다.

```js
describe("PollingClient test", () => {

  ...

  test("second response is valid when polling then call back function is called 2 times", async () => {
    const mockCallback = jest // 1
      .fn()
      .mockResolvedValueOnce({
        data: "Welcome",
      })
      .mockResolvedValueOnce({
        data: "Junhyunny",
      })
      .mockResolvedValueOnce({
        data: "Dev",
      })
      .mockResolvedValueOnce({
        data: "Log",
      });
    const validateFn = (result) => "Junhyunny" === result.data;

    const data = await sleepPolling(mockCallback, validateFn, 100); // 2

    expect(mockCallback).toHaveBeenCalledTimes(2); // 3
    expect(data).toEqual({
      data: "Junhyunny",
    });
  });

  ...

});
```

## 2. Long Polling in JavaScript

[롱 폴링][polling-long-polling-and-spring-example-link]의 경우 서버는 클라이언트에게 즉시 응답을 주지 않는다. 다음과 같이 진행된다.

1. 클라이언트가 서버에게 요청을 보냅니다.
  - 서버는 즉시 응답을 주지 않습니다.
2. 서버는 특정 이벤트가 발생하면 응답을 보낸다.
  - 시간이 오래 걸리는 경우 클라이언트 쪽에서 타임 아웃이 발생한다.
3. 클라이언트는 서버로부터 응답을 받은 후 다시 서버에게 요청을 보낸다. 

<div align="center">
  <img src="/images/posts/2022/polling-long-polling-and-javascript-example-04.png" width="50%" class="image__border">
</div>
<center>https://rubberduck-debug.tistory.com/123</center>

<br/>

롱 폴링 구현은 [이 글](https://javascript.info/long-polling)의 코드를 일부 변경했다. 다음과 같이 구현한다.

1. 콜백 함수를 수행한다.
2. 원하는 응답을 받은 경우 폴링을 종료하고 응답 값을 반환한다.
3. 에러가 발생한 경우 로그를 출력한다.
  - 타임 아웃, Bad Gateway(502), 서버 에러(500) 등의 에러가 발생하면 이에 맞는 예외 처리를 수행할 수 있다.
  - 예를 들어 타임 아웃은 즉시 롱-폴링을 재수행, 서버 에러는 1초 뒤 롱-폴링 수행 등 각 에러에 맞게 롱 폴링을 재시도한다.
4. 다시 롱 폴링을 수행한다.

```js
export const longPolling = async (func, validateFunc) => {
  try {
    let response = await func(); // 1
    if (validateFunc(response)) { // 2
      return response;
    }
  } catch (error) { // 3
    console.log(error.message);
  }
  return await longPolling(func, validateFunc); // 4
};
```

다음 테스트 코드로 위 로직을 검증할 수 있다.

1. Given
  - 스텁(stub)에 필요한 응답을 순차적으로 지정한다.
  - 응답이 유효한지 확인하는 검증 콜백 함수를 정의한다.
2. When
  - 폴링을 수행한다.
3. Then
  - 의도한 대로 3번 호출되었는지 확인한다.
  - 원하는 응답이 반환되었는지 확인한다.

```js
describe("PollingClient test", () => {

  ...

  test("third response is valid when polling then callback function is called 3 times", async () => {
    const mockCallback = jest // 1
      .fn()
      .mockRejectedValueOnce({
        code: "ECONNABORTED",
      })
      .mockRejectedValueOnce({
        status: 500,
      })
      .mockResolvedValueOnce({
        data: "Junhyunny",
      })
      .mockResolvedValueOnce({
        data: "Tangerine",
      });
    const validateFn = (response) => "Junhyunny" === response.data;

    const data = await longPolling(mockCallback, validateFn, 100); // 2

    expect(mockCallback).toHaveBeenCalledTimes(3); // 3
    expect(data).toEqual({
      data: "Junhyunny",
    });
  });

  ...

});
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-09-polling-long-polling-and-javascript-example>

#### REFERENCE

- <https://rubberduck-debug.tistory.com/123>
- <https://ko.javascript.info/settimeout-setinterval>
- <https://ko.javascript.info/long-polling>

[polling-long-polling-and-spring-example-link]: https://junhyunny.github.io/information/spring-boot/polling-long-polling-and-spring-example/
