---
title: "Recursive setTimeout test with Jest"
search: false
category:
  - react
  - jest
  - exception
last_modified_at: 2022-01-04T23:55:00
---

<br>

## 0. 들어가면서

간단한 폴링(polling) 기능을 구현하다가 마주친 문제입니다. 
`setTimeout` API 함수와 재귀적인 호출로 구현했는데 `Jest`를 사용한 테스트 코드 작성이 쉽지 않았습니다. 
실제 구현 코드는 정상적으로 동작했지만, 테스트를 정상적으로 통과시키지 못 했습니다. 
스택 오버플로우를 뒤적이다 해결 방법을 찾았고 이에 대해 정리하였습니다. 
비슷한 문제를 겪으시는 분들께 도움이 되길 바랍니다.

## 1. 문제 상황

구현 코드를 먼저 살펴보고, 문제가 발생한 테스트 코드에 대한 설명을 이어나가겠습니다. 

### 1.1. 구현 코드
- 해당 폴링 코드는 실제 브라우저에서 의도한대로 동작합니다.

```react
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
    - `jest`를 이용해 가짜 타이머를 사용하도록 설정합니다.
    - 테스트 정상 동작 여부를 확인할 스파이, 스텁(stub)을 생성합니다.
    - `polling` 함수를 실행합니다.
    - `jest` 타이머를 6초 진행시킵니다. 
    - 원하는 횟수만큼 호출되었는지, 원하는 결과를 얻었는지 확인합니다.
- 실제 해당 테스트 코드를 돌리면 `callback` 스파이가 1회 수행되었다는 결과를 얻게 됩니다.

```react
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
해결 방법은 스택 오버플로우에서 찾을 수 있었습니다. 
스택 오버플로우 설명에 대해 이해하고, 제 코드에서 문제를 찾아보도록 하겠습니다. 

### 2.1. Stack Overflow QnA 정리

##### Stack Overflow 질문

<p align="center">
    <img src="/images/recursive-set-timeout-test-1.JPG" width="75%" style="border: 1px solid #ccc; border-radius: 10px;">
</p>
<center>이미지 출처, https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function</center><br>

##### Stack Overflow 답변

답변을 보면 문장 중간에 `setTimer(callback)`가 등장하는데, 문맥상 `simpleTimer(callback)`을 잘못 작성한 것으로 보입니다. 

- `jest.useFakeTimers()`를 사용하면 `setTimeout()`을 목(mock)으로 대체됩니다.
- `jest.advanceTimersByTime(8000)`를 호출하면 1000보다 8000이 크므로 `setTimeout()` 내부 코드가 동작합니다.
- `simpleTimer(callback)` 내부에서 `await callback()` 호출에 의해 프로미스가 생성됩니다. 
- 이로 인해 두번째 `setTimeout()` 함수가 동작하지 않습니다. 
    - `PromiseJobs` 큐에 쌓인 프로미스로 인해 이후 `setTimout()`은 실행될 기회를 얻지 못 합니다.
- `PromiseJobs` 관련 설명 링크 - <https://262.ecma-international.org/6.0/#sec-jobs-and-job-queues>

<p align="center">
    <img src="/images/recursive-set-timeout-test-2.JPG" width="75%" style="border: 1px solid #ccc; border-radius: 10px;">
</p>
<center>이미지 출처, https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function</center><br>

##### Additional Information - PromiseJobs Queue

추가 내용을 달아주셨는데, `JavaScript`가 동작하는 방식에 대한 간략한 설명을 통해 이런 문제가 왜 발생하는지 이해하는데 도움을 줍니다. 

- Message Queue
    - `Message Queue`에 담기는 메세지들은 다음 메세지를 읽기 전에 완전히 종료됩니다. 
    - `setTimeout()` 같은 함수는 `Message Queue`에 담깁니다.
- Job Queues
    - `PromiseJobs`은 여러 `Job Queues` 중 하나입니다. 
    - 안에 담긴 잡(job)은 현재 메세지가 완료된 후 다음 메세지가 시작되기 전에 실행됩니다.
    - 프로미스(promise)의 `then` 함수는 호출된 프로미스가 해결(resolve)되면 잡을 `PromiseJobs`에 담습니다.
- async / await
    - `async` 키워드는 항상 프로미스를 반환합니다.
    - `await` 키워드는 `then` 콜백 함수를 랩핑합니다. 

<p align="center">
    <img src="/images/recursive-set-timeout-test-3.JPG" width="75%" style="border: 1px solid #ccc; border-radius: 10px;">
</p>
<center>이미지 출처, https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function</center><br>

### 2.3. Return to my code

이제 다시 제 코드로 돌아왔습니다. 테스트 코드의 흐름을 따라가보겠습니다. 
콘솔 로그를 통해 실행 흐름을 확인하면서 정리하였습니다.

> 로그 추적<br>
> 5 > 1 > 2 > 2 > ... > 6 > 2 > 2 > ... 종료 

1. `polling` 호출시 `setTimeout()` 메세지 큐에 추가
    - `Message Queue` 상태 - |`setTimeout(func, timeout)`|
    - `PromiseJobs` 상태 - (empty)
1. `jest.advanceTimersByTime(6000)` 호출시 1000보다 6000이 크므로 `setTimeout(func, timeout)` 메세지 실행
    - `Message Queue` 상태 - (empty)
    - `PromiseJobs` 상태 - (empty)
1. `setTimeout()`이 실행한 함수 내부에서 `await`으로 인해 생성된 프로미스 `PromiseJobs` 큐에 추가
    - `Message Queue` 상태 - (empty)
    - `PromiseJobs` 상태 - |`Promise`|
1. `await waitFor(func)` 수행
    - `func` 함수를 계속 반복 실행합니다.
    - 반복 실행 중 `axios.get()` 함수로부터 스터빙(stubing) 된 결과를 받고 코드가 진행됩니다.
1. 내부 `polling` 재귀 호출로 인한 `setTimeout()` 메세지 큐에 추가
    - `Message Queue` 상태 - |`setTimeout(func, timeout)`|
    - `PromiseJobs` 상태 - |`Promise`|
1. `Message Queue`에 담긴 `setTimeout()`을 수행하기 위해선 `PromiseJobs`에 담긴 프로미스 해소 필요
1. 이후 진행되는 로직 없이 종료

##### 테스트 코드

```react
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

```react
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
일단 `axios` 관련 로직은 제거하고 관련된 컨셉을 이해할 수 있도록 코드를 재구성하였습니다. 
테스트 코드의 흐름을 따라가보곘습니다. 
마찬가지로 콘솔 로그를 통해 확인한 실행 흐름을 정리하였습니다.

> 로그 추적<br>
> 3 > 1 > 4 > 2 > ... > 3 > 1 > 4 > 2 종료 

1. `pocPolling` 호출시 `setTimeout()` 메세지 큐에 추가
    - `Message Queue` 상태 - |`setTimeout(func, timeout)`|
    - `PromiseJobs` 상태 - (empty)
1. `for loop`을 통한 반복 호출
    1. `jest.advanceTimersByTime(1000)` 호출시 대기시간 1000을 만족하므로 `setTimeout(func, timeout)` 메세지 실행
        - `Message Queue` 상태 - (empty)
        - `PromiseJobs` 상태 - (empty)
    1. `setTimeout()`이 실행한 함수 내부에서 `await`으로 인해 생성된 프로미스 `PromiseJobs` 큐에 추가
        - `Message Queue` 상태 - (empty)
        - `PromiseJobs` 상태 - |`Promise`|
    1. `await Promise.resolve()` 호출시 `PromiseJobs`에 담긴 프로미스 해소 후 남은 로직 수행
        - 이 시점에 `callback` 스파이 1회 호출 
        - `Message Queue` 상태 - (empty)
        - `PromiseJobs` 상태 - (empty)
    1. 내부 `pocPolling` 재귀 호출로 인한 `setTimeout()` 메세지 큐에 추가
        - `Message Queue` 상태 - |`setTimeout(func, timeout)`|
        - `PromiseJobs` 상태 - (empty)
1. `callback` 스파이 확인시 6회 동작 확인

##### 테스트 코드

```react
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

```react
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

실제로 제가 작성한 폴링 코드를 위와 같은 방법으로 해결하진 못 했습니다. 
`jest.spyOn()`를 사용하여 `axios.get()` 함수를 모킹하면 `await Promise.resolve()` 호출을 2회 추가적으로 수행해야 정상적으로 동작합니다. 
모킹된 함수를 호출하는 시점에 두 개의 프로미스가 추가되는 것 같습니다. 
마찬가지로 콘솔 로그를 통해 확인한 실행 흐름을 정리하면 다음과 같습니다.

> 로그 추적<br>
> 5 > 1 > 2 > 3 > 6 > 4 > ... > 5 > 1 > 2 > 3 > 6 > 4 종료

관련된 내용은 스택 오버플로우 질문 후 해당 포스트에 계속 업데이트하겠습니다. 
- 질문 링크 - [Does spyAxios mocked by jest.spyOn(axios, 'get') make Promise when it is called?][stack-overflow-question-link]
- ~~(스택 오버플로우 첫 질문을 통해 얻는 `student` 브론즈 뱃지가 탐나는 것은 절대 아닙니다.)~~

##### 테스트 코드

```react
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

관련된 내용을 팀원들과 공유하여 얻은 또 다른 테스트 코드입니다.(이런 방법은 생각 못 했습니다.) 
- `jest.setTimeout()` 함수를 이용해 테스트 타임아웃 시간을 10초로 늘려줍니다. 
- `setTimeout()`함수를 이용해 7초 뒤에 결과를 확인합니다. 
- `done()` 함수를 이용해 비동기 테스트가 끝났음을 알립니다. 

```react
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

> 클린 코드(clean code)<br>
> 함수에서 이상적인 인수 개수는 0개(무항)다. 
> 다음은 1개(단항)고, 다음은 2개(이항)다. 
> 3개(삼항)는 가능한 피하는 편이 좋다. 
> 4개 이상(다항)은 특별한 이유가 필요하다. 

별 생각 없이 `callback`, `path`, `config`들을 인수(parameter)로 넘기니 코드가 장황해졌습니다. 
이들을 별도 함수로 묶으면 코드가 어느 정도 깔끔해집니다. 
또 각 함수 별로 한가지 일만 잘하게 됩니다. 
- polling - 전달받은 함수를 `interval` 간격으로 지속적으로 실행
- checkSecondAuthentication - 서버에게 2차 인증이 되었는지 확인하는 함수

```react
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
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-01-05-recursive-set-timeout-test/action-in-blog-react>

#### REFERENCE
- <https://stackoverflow.com/questions/56124733/how-to-use-jest-to-test-the-time-course-of-recursive-functions>
- <https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function>
- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop>
- <https://262.ecma-international.org/6.0/#sec-jobs-and-job-queues>

[stack-overflow-question-link]: https://stackoverflow.com/questions/70600151/does-spyaxios-mocked-by-jest-spyonaxios-get-make-promise-when-it-is-called