---
title: "[Vue.js] v-model 한글 입력시 에러"
search: false
category:
  - vue.js
last_modified_at: 2021-11-16T23:55:00
---

<br>

⚠️ Vue.js 코드에서 `{ { } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.(github blog theme 예약어로 인한 표기 에러)

## 1. v-model 사용시 문제 상황
`Vue.js` 프레임워크를 사용하다보면 한글 입력과 관련된 에러를 마주치게 됩니다. 
`v-model` 속성을 이용하여 한글을 입력받는 경우 제대로 처리가 안 되는 현상이 발생합니다. 

##### v-model 속성을 사용한 입력 코드

```vue
<template>
    <div>
        <h3>{ { this.value } }(길이:{ { this.value.length } })</h3>
        <input v-model="value"/>
    </div>
</template>

<script>
export default {
    name: 'KoreanInput',
    data() {
        return {
            value: ''
        }
    },
    methods: {}
}
</script>
```

##### 정상적인 영어 입력
<p align="left"><img src="/images/vue-js-korean-length-1.gif"></p>

##### 비정상적인 한글 입력
- 입력한 한글 길이가 맞지 않습니다.

<p align="left"><img src="/images/vue-js-korean-length-2.gif"></p>

`Vue.js` 측에서도 해당 문제점을 인지하고 있습니다. 
공식 홈페이지를 가면 다음과 같이 설명되어 있습니다. 

#### 공식 홈페이지 설명

> For languages that require an IME (Chinese, Japanese, Korean, etc.), 
> you’ll notice that v-model doesn’t get updated during IME composition. 
> If you want to cater to these updates as well, use the input event instead.

설명에 따르면 `IME`가 필요한 언어들은 `v-model`이 정상적으로 동작하지 않으니 input 이벤트를 사용해야 합니다. 
우선 익숙하지 않은 용어인 `IME`가 무엇인지 알아보겠습니다.

## 2. IME, Input Method Editor

> IME, Input Method Editor<br>
> An input method (or input method editor, commonly abbreviated IME) is an operating system component or program 
> that enables users to generate characters not natively available on their input devices by using sequences of characters (or mouse operations) 
> that are natively available on their input devices. 
> Using an input method is usually necessary for languages that have more graphemes than there are keys on the keyboard. 

위키피디아(wikipedia) 설명에 따르면 `IME`는 운영체제의 컴포넌트(component) 혹은 프로그램입니다. 
이 프로그램은 입력 기기를 사용해 입력할 수 있는 문자열이 아니라 이를 조합하여 새로운 문자를 만들어내는 기능을 제공합니다. 
이 기능을 통해 사용자는 라틴(latin) 계열 키보드로 중국어, 일본어, 한국어 등을 입력할 수 있습니다.

## 3. @input 바인딩 처리
공식 홈페이지에서 설명대로 input 이벤트를 사용하여 해당 에러를 처리해보겠습니다.

##### @input 바인딩 처리 코드
```vue
<template>
    <div>
        <h3>{ { this.value } }(길이:{ { this.value.length } })</h3>
        <input @input="changeValue($event)"/>
    </div>
</template>

<script>
export default {
    name: 'KoreanInput',
    data() {
        return {
            value: ''
        }
    },
    methods: {
        changeValue(event) {
            this.value = event.target.value;
        }
    }
}
</script>
```

##### 정상저인 한글 입력 확인
- 입력과 동시에 문자열 길이가 정확하게 변경됩니다.

<p align="left"><img src="/images/vue-js-korean-length-3.gif"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-16-vue-js-korean-length>

#### REFERENCE
- <https://vuejs.org/v2/guide/forms.html>
- <https://en.wikipedia.org/wiki/Input_method>