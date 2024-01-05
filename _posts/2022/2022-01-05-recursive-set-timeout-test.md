---
title: "Recursive setTimeout test with Jest (feat. advanceTimersByTime 열어보기)"
search: false
category:
  - react
  - jest
  - exception
last_modified_at: 2022-01-04T23:55:00
---

<br/>

⚠️ 해당 포스트는 2022년 1월 7일에 재작성되었습니다.
- 최초 작성일 1월 5일
- 코드 흐름에 대한 설명 불충분 - 매크로태스크, 마이크로태스크 수행에 대한 공부 후 코드 흐름 재작성

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Asynchronous Task In JavaScript][how-to-work-javascript-async-link]
- [Microtask & Macrotask in Javascript][microtask-macrotask-in-javascript-link]

## 0. 들어가면서

간단한 폴링(polling) 기능을 구현하다가 마주친 문제입니다. 
`setTimeout` API 함수와 재귀적인 호출로 구현했는데 `Jest`를 사용한 테스트 코드 작성이 쉽지 않았습니다. 
실제 구현 코드는 정상적으로 동작했지만, 테스트를 정상적으로 통과시키지 못 했습니다. 
스택 오버플로우를 뒤적이다 찾은 해결 방법에 대해 정리하였습니다. 
비슷한 문제를 겪으시는 분들께 도움이 되길 바랍니다.

## 1. 문제 상황

구현 코드를 먼저 살펴보고, 문제가 발생한 테스트 코드에 대한 설명을 이어나가겠습니다. 

### 1.1. 구현 코드
- 해당 폴링 코드는 실제 브라우저에서 의도한대로 동작합니다.

```jsx
import axios from 'axios';

const polling = (callback, path, config, interval) => {
    setTimeout(async () => {
        try {
            const response = await axios.get(`http://localhost:8080${path}`, config);
            callback(response);
        } catch (error) {
            console.error(error);
        }
        polling(callback, path, config, interval);
    }, interval);
};
```

### 1.2. 테스트 코드
- 문제가 되었던 테스트 코드에 대해 간단히 설명해보겠습니다. 
    - `jest.useFakeTimers()` - 가짜 타이머를 사용하도록 설정합니다.
    - 테스트 정상 동작 여부를 확인할 스파이, 스텁(stub)을 생성합니다.
    - `polling(callback, '/second-auth', {}, 1000)` - 폴링 함수를 실행합니다.
    - `jest.advanceTimersByTime(6000)` - 타이머를 6초 진행시킵니다. 
    - 결과를 확인합니다.
- `callback` 스파이가 6회 수행되었길 기대하지만, 1회 수행되었다는 결과를 얻게 됩니다.

```jsx
    it('given 1 second interval with 6 seconds waiting when call polling method then 6 times call', async () => {

        jest.useFakeTimers();
        const spyAxios = jest.spyOn(axios, 'get').mockResolvedValue({data: true});
        const callback = jest.fn();

        PollingClient.polling(callback, '/second-auth', {}, 1000);

        jest.advanceTimersByTime(6000);

        await waitFor(() => {
            expect(callback).toHaveBeenCalledTimes(6);
        });
        expect(callback).toHaveBeenLastCalledWith({data: true});
        expect(spyAxios).toHaveBeenCalledTimes(6);
        expect(spyAxios).toHaveBeenLastCalledWith('http://localhost:8080/second-auth', {});
    });
```

## 2. 문제 원인

이제 문제의 원인을 파헤쳐보겠습니다. 
스택 오버플로우에서 찾은 설명을 정리하고, 제 코드에서 문제를 찾아보도록 하겠습니다. 

### 2.1. StackOverflow QnA 정리

#### 2.1.1. StackOverflow 질문
- 9회 수행을 기대하였지만, 실제 2회만 동작하여 테스트가 실패했다고 합니다.

<p align="center">
    <img src="/images/recursive-set-timeout-test-1.JPG" width="75%" class="image__border">
</p>
<center>https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function</center>

#### 2.1.2 Analysis logic flow based on StackOverflow answer 

답변을 보면 문장 중간에 `setTimer(callback)`가 등장하는데, 문맥상 `simpleTimer(callback)`을 잘못 작성한 것으로 보입니다. 
설명과 함께 제가 알고 있는 지식을 일부 추가하여 내용을 작성하였습니다. 
MQ(Macrotask Queue), mQ(Microtask Queue)입니다. 

- `jest.useFakeTimers()` - `setTimeout(callback, timeout)`을 모킹(mocking)합니다.
- `simpleTimer(callback)` 수행 내용
    - `await callback()` - `await` 키워드로 인해 `callback()` 수행 후 남은 작업이 마이크로태스크(microtask) 큐로 빠집니다.
    - `마이크로태스크_1` 생성. (큐 상태, MQ: 0 / mQ: 1)
    - 실행할 작업이 없으므로 `마이크로태스크_1`를 바로 수행합니다. (큐 상태, MQ: 0 / mQ: 0)
    - `setTimeout(callback, timeout)` - `callback` 함수는 모킹된 `setTimeout()`의 콜백 함수로 등록됩니다.
    - `simpleTimer(callback)` 종료
- `await` 키워드로 인해 `simpleTimer(callback)` 수행 후 남은 작업이 마이크로태스크 큐로 빠집니다.
- `마이크로태스크_2` 생성. (큐 상태, MQ: 0 / mQ: 1)
- 실행할 작업이 없으므로 `마이크로태스크_2`를 바로 수행합니다. (큐 상태, MQ: 0 / mQ: 0)
- `jest.advanceTimersByTime(8000)` - 지정한 타임아웃(1000)보다 8000이 크므로 `callback` 함수를 실행합니다. 
- **`callback` 함수는 매크로태스크(macrotask) 큐로 이동하지 않고 advanceTimersByTime 내부에서 바로 실행합니다. ([GitHub Link][advanceTimersByTime-link])**
- (`advanceTimersByTime(msToRun: number) > _runTimerHandle(timerHandle: TimerID) > callback() 순으로 수행`)
- `callback()` 수행 내용 
    - `simpleTimer(callback)` 재귀 함수 호출, 수행 내용
        - `await callback()` - `await` 키워드로 인해 `callback()` 수행 후 남은 작업이 마이크로태스크 큐로 빠집니다.
        - **현재 콜 스택에서 advanceTimersByTime()가 실행 중이므로 마이크로태스크는 큐에서 대기하게 됩니다.**
        - `마이크로태스크_3` 생성. (큐 상태, MQ: 0 / mQ: 1)
    - `callback()` 종료
- `expect(callback).toHaveBeenCalledTimes(9)` - 2회 수행으로 실패

##### StackOverflow 답변

<p align="center">
    <img src="/images/recursive-set-timeout-test-2.JPG" width="75%" class="image__border">
</p>
<center>https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function</center>

#### 2.1.3. Additional Information - PromiseJobs Queue

추가 내용을 달아주셨는데, `JavaScript`가 동작하는 방식에 대한 간략한 설명을 통해 이런 문제가 왜 발생하는지 이해하는데 도움을 줍니다. 
`ECMA` 진영에서 사용하는 용어가 일부 달라서 헷갈릴 수 있으므로 용어도 함께 정리하였습니다.

##### 용어 정리

| ECAM | V8 엔진 | 기타 정보 | 
|:---:|:---:|:---|
| Message Queue | Macrotask Queue | setTimeout, setInterval, setImmediate 콜백 함수 저장 |
| Message | Macrotask | setTimeout, setInterval, setImmediate 콜백 함수 |
| PromiseJobs | Microtask Queue | Promise.then, Promise.catch 콜백 함수 및 await 키워드 이후 로직 저장 |
| PromiseJob | Microtask | Promise.then, Promise.catch 콜백 함수 및 await 키워드 이후 로직 |

##### Additional Information

<p align="center">
    <img src="/images/recursive-set-timeout-test-3.JPG" width="75%" class="image__border">
</p>
<center>https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function</center>

### 2.2. Return to my code

이제 다시 제 코드로 돌아왔습니다. 
테스트 코드의 흐름을 따라가보겠습니다. 
MQ(Macrotask Queue), mQ(Microtask Queue)입니다. 

##### 실행 흐름

- `jest.useFakeTimers()` - `setTimeout(callback, timeout)`을 모킹합니다.
- `polling(...)` 수행 내용
    - `setTimeout(callback, timeout)` - `callback` 함수는 모킹된 `setTimeout()`의 콜백 함수로 등록됩니다.
    - `polling(...)` 종료
- `jest.advanceTimersByTime(6000)` - 지정한 타임아웃(1000)보다 6000이 크므로 `callback` 함수를 실행합니다. 
- **`callback` 함수는 매크로태스크 큐로 이동하지 않고 advanceTimersByTime 내부에서 바로 실행합니다. ([GitHub Link][advanceTimersByTime-link])**
- (`advanceTimersByTime(msToRun: number) > _runTimerHandle(timerHandle: TimerID) > callback() 순으로 수행`)
- `callback()` 수행 내용
    - `console.log(5)` - 5 출력
    - `await axios.get(...)` - `await` 키워드로 인해 `axios.get(...)` 수행 후 남은 작업이 마이크로태스크 큐로 빠집니다.
    - **현재 콜 스택에서 advanceTimersByTime()가 실행 중이므로 마이크로태스크는 큐에서 대기하게 됩니다.**
    - `마이크로태스크_1` 생성 (큐 상태, MQ: 0 / mQ: 1)
    - `callback()` 종료
- `console.log(1)` - 1 출력
- `await waitFor(callback)` - `await` 키워드로 인해 `waitFor(callback)` 수행 후 남은 작업이 마이크로태스크 큐로 빠집니다.
- `callback()` - `waitFor(callback)`의 내부 콜백 함수 `callback`이 실행, 수행 내용
    - `console.log(2)` - 2 반복 출력
    - 정확한 내부 동작은 모르겠지만 타임아웃이 나기까지 동작하는 것으로 보입니다.
- `마이크로태스크_2` 생성 (큐 상태, MQ: 0 / mQ: 2)
- 이후 수행할 별도 로직은 없으므로 마이크로태스크 큐에 먼저 들어있던 `마이크로태스크_1` 수행합니다. (큐 상태, MQ: 0 / mQ: 1)
- `마이크로태스크_1` 수행 내용
    - `console.log(6)` - 6 출력
    - `callback(response)` - 스파이 기능 수행
    - `polling(...)` - 재귀 함수 호출, 수행 내용
        - `setTimeout(callback, timeout)` - `callback` 함수는 모킹된 `setTimeout()`의 콜백 함수로 등록됩니다.
        - `polling(...)` 종료
    - `마이크로태스크_1` 종료
- 테스트 타임아웃 종료

##### 테스트 코드
- 로그 흐름 - `5 > 1 > 2 > 2 > ... > 6 > 2 > 2 > ... 종료`

```jsx
    it('given timeout 1 second with 6 seconds when call polling method then 6 times call', async () => {

        jest.useFakeTimers();
        const spyAxios = jest.spyOn(axios, 'get').mockResolvedValue({data: true});
        const callback = jest.fn();

        PollingClient.polling(callback, '/second-auth', {}, 1000);

        // 1 time run
        jest.advanceTimersByTime(6000);
        console.log(1);

        await waitFor(() => {
            console.log(2);
            expect(callback).toHaveBeenCalledTimes(6);
            console.log(3);
        });
        expect(callback).toHaveBeenLastCalledWith({data: true});
        expect(spyAxios).toHaveBeenCalledTimes(6);
        expect(spyAxios).toHaveBeenLastCalledWith('http://localhost:8080/second-auth', {});
    });
```

##### 구현 코드

```jsx
import axios from 'axios';

const polling = (callback, path, config, interval) => {
    setTimeout(async () => {
        try {
            console.log(5);
            const response = await axios.get(`http://localhost:8080${path}`, config);
            console.log(6);
            callback(response);
        } catch (error) {
            console.error(error);
        }
        polling(callback, path, config, interval);
    }, interval);
};
```

## 3. 문제 해결

`axios`를 `jest.spyOn()` 함수로 모킹(mocking)하는 경우 또 다른 문제가 발생하였는데, 관련된 내용은 아래에서 다루도록 하겠습니다. 
일단 `axios` 관련 로직은 제거하고 이 컨셉(concept)을 이해할 수 있도록 코드를 재구성하였습니다. 
MQ(Macrotask Queue), mQ(Microtask Queue)입니다. 

##### 실행 흐름

- `jest.useFakeTimers()` - `setTimeout(callback, timeout)`을 모킹(mocking)합니다.
- `pocPolling(...)` 수행 내용
    - `setTimeout(callback, timeout)` - `callback` 함수는 모킹된 `setTimeout()`의 콜백 함수로 등록됩니다.
    - `pocPolling(...)` 종료
- 하위 로직은 반복 수행합니다.
    - `jest.advanceTimersByTime(1000)` - 지정한 타임아웃(1000)을 만족하므로 `callback` 함수를 실행합니다. 
    - **`callback` 함수는 매크로태스크(macrotask) 큐로 이동하지 않고 advanceTimersByTime 내부에서 바로 실행합니다. ([GitHub Link][advanceTimersByTime-link])**
    - (`advanceTimersByTime(msToRun: number) > _runTimerHandle(timerHandle: TimerID) > callback() 순으로 수행`)
    - `callback()` 수행 내용
        - `console.log(3)` - 3 출력
        - `await new Promise(resolveFn)` - `await` 키워드로 인해 `new Promise(resolveFn)` 수행 후 남은 작업이 마이크로태스크 큐로 빠집니다.
        - **현재 콜 스택에서 advanceTimersByTime()가 실행 중이므로 마이크로태스크는 큐에서 대기하게 됩니다.**
        - `마이크로태스크_1` 생성 (큐 상태, MQ: 0 / mQ: 1)
        - `callback()` 종료
    - `console.log(1)` - 1 출력
    - `await Promise.resolve()` - `await` 키워드로 인해 `Promise.resolve()` 수행 후 남은 작업이 마이크로태스크 큐로 빠집니다.
    - `마이크로태스크_2` 생성 (큐 상태, MQ: 0 / mQ: 2)
    - 수행할 로직이 없어졌으므로 마이크로태스크 큐에 먼저 들어와있던 `마이크로태스크_1` 을 수행합니다. (큐 상태, MQ: 0 / mQ: 1)
    - `console.log(4)` - 4 출력
    - `pocPolling(...)` 수행 내용
        - `setTimeout(callback, timeout)` - `callback` 함수는 모킹된 `setTimeout()`의 콜백 함수로 등록됩니다.
        - `pocPolling(...)` 종료
    - 수행할 로직이 없어졌으므로 마이크로태스크 큐에 먼저 들어와있던 `마이크로태스크_2` 을 수행합니다. (큐 상태, MQ: 0 / mQ: 0)
    - `console.log(2)` - 2 출력
- 반복 로직 종료 및 테스트 결과 정상

##### 테스트 코드
- 로그 흐름 - `3 > 1 > 4 > 2 > ... > 3 > 1 > 4 > 2 종료`

```jsx
    it('PoC Message queues, PromiseJobs and Mock Timers', async () => {

        jest.useFakeTimers();
        const callback = jest.fn();

        PollingClient.pocPolling(callback, '/second-auth', {}, 1000);

        // 6 times run
        for (let i = 0; i < 6; i++) {
            jest.advanceTimersByTime(1000); // message queue is resolved
            console.log(1)
            await Promise.resolve(); // `await` is resolved here
            console.log(2)
        }

        expect(callback).toHaveBeenCalledTimes(6);
        expect(callback).toHaveBeenLastCalledWith({data: true});
    });
```

##### 구현 코드

```jsx
const pocPolling = (callback, path, config, interval) => {
    setTimeout(async () => {
        try {
            console.log(3);
            const response = await new Promise((response) => response({data: true}));
            console.log(4);
            callback(response);
        } catch (error) {
            console.error(error);
        }
        pocPolling(callback, path, config, interval);
    }, interval);
};
```

## 4. jest.spyOn(axios, 'get') 사용시 생기는 문제

`jest.spyOn()`를 사용하여 `axios.get(...)` 함수를 모킹하면 `await Promise.resolve()` 호출을 2회 추가적으로 수행해야 정상적으로 동작합니다. 
모킹된 함수를 호출하는 시점에 두 개의 프로미스가 추가되는 것 같습니다. 
정확한 답을 찾을 수 없어서 관련된 내용은 `StackOverflow`에 질문으로 남겼습니다. 

##### StackOverflow 질문
- [Does spyAxios mocked by jest.spyOn(axios, 'get') make Promise when it is called?][stack-overflow-question-link]

##### 테스트 코드
- 로그 흐름 - `5 > 1 > 2 > 3 > 6 > 4 > ... > 5 > 1 > 2 > 3 > 6 > 4 종료`

```jsx
    it('guess something two wierd promises are made by axios.get method mocking', async () => {

        jest.useFakeTimers();
        const spyAxios = jest.spyOn(axios, 'get').mockResolvedValue({data: true});
        const callback = jest.fn();

        PollingClient.polling(callback, '/second-auth', {}, 1000);

        // 6 times run
        for (let i = 0; i < 6; i++) {
            jest.advanceTimersByTime(1000); // message queue is resolved
            console.log(1)
            await Promise.resolve(); // something wierd promise
            console.log(2)
            await Promise.resolve(); // something wierd promise
            console.log(3)
            await Promise.resolve(); // `await` is resolved here
            console.log(4)
        }

        expect(callback).toHaveBeenCalledTimes(6);
        expect(callback).toHaveBeenLastCalledWith({data: true});
        expect(spyAxios).toHaveBeenCalledTimes(6);
        expect(spyAxios).toHaveBeenLastCalledWith('http://localhost:8080/second-auth', {});
    });
```

## 5. 다른 테스트 통과 코드

관련된 내용을 팀원들과 공유하여 얻은 또 다른 테스트 코드입니다. 이런 방법은 생각 못 했습니다. 
- `jest.setTimeout()` 함수를 이용해 테스트 타임아웃 시간을 10초로 늘려줍니다. 
- `setTimeout()`함수를 이용해 7초 뒤에 결과를 확인합니다. 
- `done()` 함수를 이용해 비동기 테스트가 끝났음을 알립니다. 

```jsx
import axios from 'axios';
import { polling } from '../src/poll';
import { waitFor } from '@testing-library/react';

jest.setTimeout(10000);

it('given 1 second interval with 6 seconds waiting when call polling method then 6 times call', (done) => {

    const spyAxios = jest.spyOn(axios, 'get').mockResolvedValue({data: true});
    const callback = jest.fn();

    polling(callback, '/second-auth', {}, 1000);

    setTimeout(async() => {
        await waitFor(() => {
            expect(callback).toHaveBeenCalledTimes(6);
        });
        expect(callback).toHaveBeenLastCalledWith({data: true});
        expect(spyAxios).toHaveBeenCalledTimes(6);
        expect(spyAxios).toHaveBeenLastCalledWith('http://localhost:8080/second-auth', {});
        done();
    }, 7000);
});
```

## CLOSING

팀원들은 원인을 파악하기 힘든 `jest magic`을 피할 수 있도록 `jest` 기능을 많이 사용하지 않는 것이 좋다는 의견을 주셨습니다. 
또 다른 팀원이 이전에 작성한 `polling` 함수를 보여주었는데, 타이머 관련된 모킹을 하지 않고도 테스트가 가능한 아주 훌룡한 코드였습니다. 
클라이언트 측 폴링, 롱 폴링 코드는 다음 포스트에서 소개하겠습니다.

여담이지만 현재 `클린 코드(clean code)`를 읽는 중인데 예시로 든 `polling` 함수는 문제가 많은 코드입니다. 

> 클린 코드(clean code)<br/>
> 함수에서 이상적인 인수 개수는 0개다. 
> 다음은 1개고, 다음은 2개다. 
> 3개는 가능한 피하는 편이 좋다. 
> 4개 이상은 특별한 이유가 필요하다. 

별 생각 없이 `callback`, `path`, `config`들을 인수(parameter)로 넘기니 코드가 장황해졌습니다. 
이들을 별도 함수로 묶으면 코드가 어느 정도 깔끔해집니다. 
또 각 함수 별로 한가지 일만 잘하게 됩니다. 
- polling - 전달받은 함수를 `interval` 간격으로 지속적으로 실행
- checkSecondAuthentication - 서버에게 2차 인증이 되었는지 확인하는 함수

```jsx
import axios from 'axios';

const polling = (func, interval) => {
    setTimeout(async () => {
        await func();
        polling(func, interval);
    }, interval);
};

const checkSecondAuthentication = async () => {
    try {
        const response = await axios.get(`http://localhost:8080/second-auth`, { params });
        setSomething(response);
    } catch (error) {
        console.error(error);
    }
};

// polling 기법으로 2차 인증 확인을 5초 간격으로 수행하시오.
polling(checkSecondAuthentication, 5000);
```

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-05-recursive-set-timeout-test>

#### REFERENCE
- <https://jestjs.io/docs/jest-object>
- <https://stackoverflow.com/questions/56124733/how-to-use-jest-to-test-the-time-course-of-recursive-functions>
- <https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function>
- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop>
- <https://262.ecma-international.org/6.0/#sec-jobs-and-job-queues>

[advanceTimersByTime-link]: https://github.com/facebook/jest/blob/790abe71b9e342170c06a9b75783d929cdd2bb89/packages/jest-util/src/fake_timers.js#L260-L294

[stack-overflow-question-link]: https://stackoverflow.com/questions/70600151/does-spyaxios-mocked-by-jest-spyonaxios-get-make-promise-when-it-is-called

[how-to-work-javascript-async-link]: https://junhyunny.github.io/information/javascript/how-to-work-javascript-async/
[microtask-macrotask-in-javascript-link]: https://junhyunny.github.io/information/javascript/microtask-macrotask-in-javascript/