---
title: "Vue JS computed 속성 함수처럼 사용하기"
search: false
category:
  - vue.js
last_modified_at: 2025-12-25T00:00:00
---

<br/>

## 0. 들어가면서

이 글의 예시에서 `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작한다.

## 1. Computed 속성

Vue JS는 템플릿 내의 표현이 깔끔하도록 복잡한 연산이 필요한 데이터들은 `computed` 속성을 사용한다. computedMessage는 '안녕하세요' 문자열을 뒤집어서 '요세하녕안'을 반환한다.

```vue
<template>
    <div>
        <p>계산된 메시지: "{ { computedMessage } }"</p>
    </div>
</template>

<script>
export default {
    name: 'ParameterComputed',
    data() {
        return {
            message: '안녕하세요'
        }
    },
    computed: {
        computedMessage() {``
            return this.message.split('').reverse().join('')
        }
    }
}
</script>
```

## 2. Computed with parameter

단순하게 계산만 하면 좋겠지만, 간혹 computed 속성에 파라미터(parameter)가 필요한 경우도 발생한다. computed 속성은 함수 형태이므로 파라미터 전달이 가능해보이지만, 함수처럼 파라미터를 정의하면 에러가 발생한다. 아래 예제 코드는 에러가 발생하는 코드다.

```vue
<template>
    <div>
        <p>계산된 메시지 with true: "{ { computedMessage(true) } }"</p>
        <p>계산된 메시지 with false: "{ { computedMessage(false) } }"</p>
    </div>
</template>

<script>
export default {
    name: 'ParameterComputed',
    data() {
        return {
            message: '안녕하세요'
        }
    },
    computed: {
        computedMessage(flag) {
            if (flag) {
                return this.message.split('').reverse().join('')
            }
            return this.message;
        }
    }
}
</script>
```

위 코드를 브라우저에서 실행하면 `computedMessage`는 함수가 아니라는 에러 메시지를 확인할 수 있다.

<div align="left">
  <img src="/images/posts/2021/vue-js-computed-with-parameter-01.png" width="50%" class="image__border">
</div>

<br />

스택 오버플로우(Stack Overflow)에서 다음과 같은 답변을 찾을 수 있었다.

> StackOverflow<br/>
> Technically you can use a computed property with a parameter like this:

```vue
computed: {
   fullName() {
      return salut => `${salut} ${this.firstName} ${this.lastName}`
   }
}
```

computed 속성에서 함수를 반환하는 아이디어다. 스택 오버플로우의 답변에 따라 코드를 아래와 같이 수정하였다.

```vue
<template>
    <div>
        <p>계산된 메시지 with true: "{ { computedMessage(true) } }"</p>
        <p>계산된 메시지 with false: "{ { computedMessage(false) } }"</p>
    </div>
</template>

<script>
export default {
    name: 'ParameterComputed',
    data() {
        return {
            message: '안녕하세요'
        }
    },
    computed: {
        computedMessage() {
            return (flag) => {
                if (flag) {
                    return this.message.split('').reverse().join('')
                }
                return this.message;
            }
        }
    }
}
</script>
```

위 코드는 정상적으로 동작한다.

<div align="left">
  <img src="/images/posts/2021/vue-js-computed-with-parameter-02.png" width="50%" class="image__border">
</div>

## CLOSING

스택 오버플로우 답변을 자세히 읽어보면 추가적으로 도움이 되는 내용을 확인할 수 있다.

- `computed` 속성은 캐싱되어 있다가 연관된 데이터가 바뀔 시점에 함께 바뀐다.
- 함수는 호출될 때마다 매번 값을 새로 계산한다.
- `computed` 속성을 파라미터를 전달받는 함수로 반환하여 사용하는 경우 캐싱의 이점을 가져갈 수 없다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-24-vue-js-computed-with-parameter>

#### REFERENCE

- <https://kr.vuejs.org/v2/guide/computed.html>
- <https://stackoverflow.com/questions/40522634/can-i-pass-parameters-in-computed-properties-in-vue-js>
- <https://vuejs.org/v2/guide/computed.html#Computed-Caching-vs-Methods>