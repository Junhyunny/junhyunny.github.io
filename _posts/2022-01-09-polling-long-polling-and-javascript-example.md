---
title: "폴링(Polling), 롱 폴링(Long polling) 그리고 JavaScript 예제"
search: false
category:
  - information
  - javascript
last_modified_at: 2022-01-09T23:55:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [폴링(Polling), 롱 폴링(Long polling) 그리고 스프링 예제][polling-long-polling-and-spring-example-link]

👉 이어서 읽기를 추천합니다.
- [Recursive setTimeout test with Jest (feat. advanceTimersByTime 열어보기)][recursive-set-timeout-test-link]

## 0. 들어가면서

[폴링(Polling), 롱 폴링(Long polling) 그리고 스프링 예제][polling-long-polling-and-spring-example-link] 포스트에서 개념은 한번 정리하였으므로 
이번 포스트에서는 간단한 개념 복습과 `JavaScript`를 사용한 예시 코드를 정리하였습니다. 
자세한 개념을 확인하시고 싶은 분들은 이전 글을 읽어보시길 바랍니다. 

## 1. JavaScript 폴링 구현하기

클라이언트가 일정 주기로 서버에게 데이터를 요청합니다. 
`setTimeout` 함수와 `setInterval` 함수를 사용할 때 미묘하게 기능이 다르기 때문에 관련된 내용도 함께 정리하였습니다. 

<p align="center">
    <img src="/images/polling-long-polling-and-javascript-example-1.JPG" width="50%" class="image__border">
</p>
<center>https://rubberduck-debug.tistory.com/123</center>

### 1.1. setTimeout(callback, timeout) 사용

#### 1.1.1. 테스트 코드

```javascript
    it('given 6 seconds, timeout 1 second when call polling method then 6 times call', async () => {

        // setup
        jest.useFakeTimers();
        const spyFunc = jest.fn();

        // act
        timeoutPolling(spyFunc, 1000);
        for (let i = 0; i < 6; i++) {
            jest.advanceTimersByTime(1000);
            await Promise.resolve();
        }

        // assert
        expect(spyFunc).toHaveBeenCalledTimes(6)
    });
```

#### 1.1.2. 구현 코드

```javascript
export const timeoutPolling = (func, timeout, maxAttempts = -1) => {
    if (maxAttempts === 0) {
        return;
    }
    setTimeout(async () => {
        try {
            await func();
        } catch (error) {
            console.error(error);
        }
        timeoutPolling(func, timeout, maxAttempts - 1);
    }, timeout);
};
```

#### 1.1.3. 함수 실행 간격
- 콜백 함수 실행 시간과 상관없이 콜백 함수 실행 간격이 일정하게 보장됩니다.

<p align="center">
    <img src="/images/polling-long-polling-and-javascript-example-2.JPG" width="50%" class="image__border">
</p>
<center>https://ko.javascript.info/settimeout-setinterval</center>

### 1.2. setInterval(callback, timeout) 사용

#### 1.2.1. 테스트 코드

```javascript
    it('given 6 seconds, interval 1 second, maximum attempts 5 times when call polling method then 5 times call', async () => {

        // setup
        jest.useFakeTimers();
        const spyFunc = jest.fn();

        // act
        intervalPolling(spyFunc, 1000, 5);
        for (let i = 0; i < 6; i++) {
            jest.advanceTimersByTime(1000);
        }

        // assert
        expect(spyFunc).toHaveBeenCalledTimes(5)
    });
```

#### 1.2.2. 구현 코드

```javascript
export const intervalPolling = (func, interval, maxAttempts = -1) => {
    let attempts = 0;
    let intervalId = setInterval(() => {
        if (maxAttempts === attempts) {
            clearInterval(intervalId);
            return;
        }
        attempts++;
        func();
    }, interval);
};
```

#### 1.1.3. 함수 실행 간격
- 콜백 함수 실행 시간이 길어지면 콜백 함수 실행 간격이 짧아집니다. 
- 예를 들어, `interval`이 100ms 인 경우
    - 콜백 함수 실행 시간이 30ms라면 다음 콜백 함수 실행은 70ms 뒤 입니다.
    - 콜백 함수 실행 시간이 60ms라면 다음 콜백 함수 실행은 40ms 뒤 입니다.

<p align="center">
    <img src="/images/polling-long-polling-and-javascript-example-3.JPG" width="50%" class="image__border">
</p>
<center>https://ko.javascript.info/settimeout-setinterval</center>

### 1.3. sleep(timeout) 함수 사용 (feat. [@jskim1991][jskim1991-github-link])

시간 간격을 만들 수 있는 `sleep(timeout)` 함수를 정의하여 폴링을 제어합니다. 
`Jest`의 `mockResolvedValue(혹은 mockResolvedValueOnce)`함수와 `useFakeTimers` 함수를 사용하는 경우 테스트 코드가 지저분해집니다. 
리얼 타이머를 사용하여 테스트 하되 `timeout`이 크면 테스트 시간이 길어지므로 짧게 지정하여 테스트합니다.

#### 1.3.1. 테스트 코드

```javascript
    it('sleep 100 ms, getting data what you want at 2nd trial when call polling method then 2 times call', async () => {

        const mockCallback = jest
            .fn()
            .mockResolvedValueOnce({
                data: 'Welcome',
            })
            .mockResolvedValueOnce({
                data: 'Junhyunny',
            })
            .mockResolvedValueOnce({
                data: 'Dev',
            })
            .mockResolvedValueOnce({
                data: 'Log',
            });

        const validateFn = (result) => 'Junhyunny' === result.data;

        const data = await sleepPolling(mockCallback, validateFn, 100);

        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(data).toEqual({
            data: 'Junhyunny',
        });
    });
```

#### 1.3.2. 구현 코드

```javascript
const sleep = (timeout = 100) => {
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}

export const sleepPolling = async (func, validateFunc, timeout) => {
    let result = await func();
    while (!validateFunc(result)) {
        await sleep(timeout);
        try {
            result = await func();
        } catch (e) {
            console.log(e.message);
        }
    }
    return result;
}
```

## 2. JavaScript 롱 폴링 구현하기

서버는 클라이언트 요청에 대해 즉시 응답을 주지 않습니다. 
다음과 같은 순서로 진행됩니다. 
- 클라이언트가 서버에게 요청을 보냅니다.
- 서버는 즉시 응답을 주지 않습니다.
- 특정 이벤트가 발생하거나 타임아웃(timeout)이 발생하면 응답을 전달합니다.
- 클라이언트는 응답을 받은 후 다시 서버에게 데이터를 요청합니다. 

##### 롱 폴링 방식

<p align="center">
    <img src="/images/polling-long-polling-and-javascript-example-4.JPG" width="50%" class="image__border">
</p>
<center>https://rubberduck-debug.tistory.com/123</center>

### 2.1. 롱 폴링 구현하기

[Long polling][long-polling-link] 포스트의 코드를 일부 변경하였습니다. 

### 2.1.1. 테스트 코드

```javascript
    it('sleep 100 ms, getting data what you want at 3rd trial when call polling method then 3 times call', async () => {

        const mockCallback = jest
            .fn()
            .mockResolvedValueOnce({
                status: 500
            })
            .mockResolvedValueOnce({
                status: 502
            })
            .mockResolvedValueOnce({
                status: 200,
                data: 'Junhyunny'
            })
            .mockResolvedValueOnce({
                status: 200,
                data: 'Log',
            });

        const validateFn = (response) => 'Junhyunny' === response.data;

        const data = await longPolling(mockCallback, validateFn, 100);

        expect(mockCallback).toHaveBeenCalledTimes(3);
        expect(data).toEqual({
            status: 200,
            data: 'Junhyunny'
        });
    });
```

### 2.1.2. 구현 코드

```javascript
export const longPolling = async (func, validateFunc, timeout) => {
    try {
        let response = await func();
        if (response.status === 200 && validateFunc(response)) {
            return response;
        }
        // status 502 is a connection timeout
        if (response.status !== 502) {
            // when not connection timeout, sleep and try
            await sleep(timeout);
        }
    } catch (error) {
        await sleep(timeout);
    }
    return await longPolling(func, validateFunc, timeout);
}
```

## CLOSING

클라이언트 측 폴링과 롱 폴링 기능을 구현하면서 아래와 같은 것들을 배웠습니다. 
- `jest.useFakeTimers()` 기능을 사용하면 테스트가 어려워집니다.
- `advanceTimersByTime(ms)` 호출시 내부에서 `setTimeout`, `setInterval`의 콜백 함수를 동기적으로 처리합니다. 
- 클라이언트 측 폴링과 롱 폴링 코드의 다른 점은 서버의 타임아웃 처리 여부로 보입니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-09-polling-long-polling-and-javascript-example>

#### REFERENCE
- <https://rubberduck-debug.tistory.com/123>
- <https://ko.javascript.info/settimeout-setinterval>
- <https://ko.javascript.info/long-polling>

[jskim1991-github-link]: https://github.com/jskim1991

[long-polling-link]: https://javascript.info/long-polling

[polling-long-polling-and-spring-example-link]: https://junhyunny.github.io/information/spring-boot/polling-long-polling-and-spring-example/

[recursive-set-timeout-test-link]: https://junhyunny.github.io/react/jest/exception/recursive-set-timeout-test/