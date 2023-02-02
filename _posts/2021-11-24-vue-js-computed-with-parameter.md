---
title: "[Vue.js] Computed with parameter"
search: false
category:
  - vue.js
last_modified_at: 2021-11-24T23:55:00
---

<br/>

* `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.

## 1. Computed 속성

`Vue.js`는 템플릿 내의 표현이 깔끔하도록 복잡한 연산이 필요한 데이터들은 `computed` 속성을 사용합니다. 

##### 예시 코드
- `computedMessage`는 `'안녕하세요'` 문자열을 뒤집어서 `'요세하녕안'`을 반환합니다.

```vue
<template>
    <div>
        <p>계산된 메세지: "{ { computedMessage } }"</p>
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
단순하게 계산만 하면 좋겠지만, 간혹 `computed` 속성에 파라미터(parameter)가 필요한 경우도 발생합니다. 
`computed` 속성은 함수 형태이므로 파라미터 전달이 가능해보이지만, 에러가 발생합니다.

##### 에러 유발 코드

```vue
<template>
    <div>
        <p>계산된 메세지 with true: "{ { computedMessage(true) } }"</p>
        <p>계산된 메세지 with false: "{ { computedMessage(false) } }"</p>
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

##### 브라우저 에러 발생
- `computedMessage`는 함수가 아니라는 에러 메세지를 확인할 수 있습니다.

<p align="left">
    <img src="/images/vue-js-computed-with-parameter-1.JPG" width="50%" class="image__border">
</p>

### 2.1. 에러 해결 방법

`StackOverflow`에서 다음과 같은 답변을 찾을 수 있었습니다.

> StackOverflow<br/>
> Technically you can use a computed property with a parameter like this:

```vue
computed: {
   fullName() {
      return salut => `${salut} ${this.firstName} ${this.lastName}`
   }
}
```

### 2.2. 에러 해결 코드
- `StackOverflow`의 답변에 따라 코드를 아래와 같이 수정하였습니다.

```vue
<template>
    <div>
        <p>계산된 메세지 with true: "{ { computedMessage(true) } }"</p>
        <p>계산된 메세지 with false: "{ { computedMessage(false) } }"</p>
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

##### 정상 동작 확인

<p align="left">
    <img src="/images/vue-js-computed-with-parameter-2.JPG" width="50%" class="image__border">
</p>

## CLOSING

`StackOverflow` 답변을 자세히 읽어보면 추가적으로 도움이 되는 내용을 확인할 수 있습니다. 
- `computed` 속성은 캐싱되어 있다가 연관된 데이터가 바뀔 시점에 함께 바뀝니다.
- 함수는 호출될 때마다 매번 값을 새로 계산합니다.
- `computed` 속성을 파라미터를 전달받는 함수로 반환하여 사용하는 경우 캐싱의 이점을 가져갈 수 없습니다.

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-24-vue-js-computed-with-parameter>

#### REFERENCE
- <https://kr.vuejs.org/v2/guide/computed.html>
- <https://stackoverflow.com/questions/40522634/can-i-pass-parameters-in-computed-properties-in-vue-js>
- <https://vuejs.org/v2/guide/computed.html#Computed-Caching-vs-Methods>