---
title: "Error on v-model with Korean in Vue"
search: false
category:
  - vue.js
last_modified_at: 2021-11-16T23:55:00
---

<br/>

* `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.

## 0. 들어가면서

`Vue` 프로젝트에서 `v-model` 속성을 통해 한글을 입력받으면 정상적으로 처리가 되지 않는 현상을 발견했습니다. 
이번 포스트에선 한글 입력 시 발생하는 문제점과 원인, 해결 방법에 대해 정리하였습니다. 

## 1. 문제 현상

`v-model`을 사용해 한글을 입력 받으면 다음과 같은 문제가 발생합니다. 

* 한 박자 늦게 한글 입력이 완성됩니다.
* 그에 따라 입력된 문자열의 길이가 정상적으로 확인되지 않습니다. 

### 1.1. 문제 코드

* `v-model` 속성에 스테이트(state)를 바로 연결한 양방향 바인딩을 통해 데이터를 입력 받습니다.

```vue
<template>
  <div>
    <input v-model="value"/>
    <div class="header">
      <h3>{ { value } }</h3>
      <h4>(길이:{ { value.length } })</h4>
    </div>
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

<style scoped lang="css">
/* some styles */
</style>
```

##### 영어과 한글 입력 비교 결과

<p align="center">
    <img src="/images/vue-js-korean-length-1.gif" width="100%" class="image__border">
</p>

### 1.2. Vue Docs for Languages that require IME

`Vue` 공식 문서에서 다음과 같은 설명을 볼 수 있습니다.

> For languages that require an IME (Chinese, Japanese, Korean, etc.), 
> you’ll notice that v-model doesn’t get updated during IME composition. 
> If you want to cater to these updates as well, use the input event instead.

설명에 따르면 `IME` 기능이 필요한 언어들을 `v-model` 속성으로 입력 받으면 IME 합성 과정 중 업데이트가 일어나지 않는다고 합니다. 
정상적인 업데이트를 위해 `input` 이벤트를 사용을 권장하고 있습니다. 

## 2. IME(Input Method Editor)

우선 `IME(Input Method Editor)`의 개념을 짚고 설명을 이어가곘습니다. 
관련된 내용을 위키피디아(wikipedia)에선 다음과 같이 설명하고 있습니다. 

> IME(Input Method Editor)<br/>
> An input method (or input method editor, commonly abbreviated IME) is an operating system component or program that enables users to generate characters not natively available on their input devices by using sequences of characters (or mouse operations) that are natively available on their input devices. Using an input method is usually necessary for languages that have more graphemes than there are keys on the keyboard.

`IME`는 한글 같은 조합이 필요한 문자의 입력을 지원하기 위한 운영체제(operating system)의 컴포넌트(component) 혹은 프로그램입니다. 
이 기능을 통해 사용자는 입력 기기를 사용해 직접 입력할 수 없는 문자들을 조합하여 작성할 수 있습니다. 
예를 들면 사용자는 라틴(latin) 계열 키보드로 중국어, 일본어, 한국어 등을 입력할 수 있습니다. 
한글처럼 IME 기능이 필요한 언어를 브라우저에서 입력할 땐 정상적인 처리가 안 될 수 있습니다. 
문제 양상은 운영체제, 브라우저 종류마다 다를 수 있습니다. 

## 3. 문제 해결

### 3.1. 문제 해결 코드

공식 홈페이지 설명에 따라 `input` 이벤트 통해 한글 입력을 받습니다. 

* 입력 이벤트를 처리할 핸들러 메소드를 `@input` 속성에 연결합니다. 

```vue
<template>
  <div>
    <input @input="changeValue($event)"/>
    <div class="header">
      <h3>{ { value } }</h3>
      <h4>(길이:{ { value.length } })</h4>
    </div>
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

<style scoped lang="css">
/* some styles */
</style>
```

##### 실행 결과

* 입력과 동시에 문자열 길이가 정확하게 변경됩니다.

<p align="center">
    <img src="/images/vue-js-korean-length-2.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2021-11-16-vue-js-korean-length>

#### REFERENCE

* <https://vuejs.org/v2/guide/forms.html>
* <https://en.wikipedia.org/wiki/Input_method>