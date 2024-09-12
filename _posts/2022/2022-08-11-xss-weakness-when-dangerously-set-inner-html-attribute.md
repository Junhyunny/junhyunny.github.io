---
title: "dangerouslySetInnerHTML Attribute And XSS Attack"
search: false
category:
  - javascript
  - react
  - security
last_modified_at: 2022-08-11T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

* [반사형 XSS(Reflected Cross Site Scripting) 공격과 방어][reflected-cross-site-scripting-link]
* [저장형 XSS(Stored Cross Site Scripting) 공격과 방어][stored-cross-site-scripting-link]
* [DOM 기반 XSS(DOM based Cross Site Scripting) 공격과 방어][dom-based-cross-site-scripting-link]

## 1. dangerouslySetInnerHTML 속성(Attribute)

기능(feature)에 따라 HTML 코드를 그대로 사용하는 경우가 있습니다. 
`React` 라이브러리는 `dangerouslySetInnerHTML` 속성으로 HTML 코드를 그대로 삽입할 수 있습니다. 
이름에서 확인할 수 있듯이 위험한 방법입니다. 
자세한 내용은 예제 코드를 살펴본 후에 알아보겠습니다.

### 1.1. 예제 코드

간단한 예제 코드를 통해 `dangerouslySetInnerHTML` 속성 사용 방법을 알아보겠습니다.

* `App` 함수를 정의합니다.
    * `htmlCode` 함수를 통해 HTML 코드를 `__html` 키에 매칭한 객체를 반환합니다. 
    * `dangerouslySetInnerHTML` 속성에 `htmlCode` 함수의 반환 값을 전달하는 `div` 블록을 반환합니다.
* `ReactDOM.render` 함수를 통해 `App` 함수의 결과를 렌더링(rendering)합니다.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;700&display=swap" rel="stylesheet"/>
    <script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
</head>

<body>
<section id="demo"></section>
</body>

<script type="text/jsx">
    const App = () => {
        const htmlCode = () => {
            return {__html: '<ul><li>Hello</li><li>React</li><li>World</li></ul>'}
        }
        return <div dangerouslySetInnerHTML={htmlCode()}></div>
    }

    ReactDOM.render(
        <App/>,
        document.getElementById('demo')
    )
</script>

<style>
    * {
        box-sizing: border-box;
    }

    html {
        font-family: 'Jost', sans-serif;
    }

    body {
        margin: 0;
    }

    #demo {
        border: 1px solid #ccc;
    }

    #demo {
        margin: 1rem auto;
        width: 50%;
    }
</style>
</html>
```

##### 결과

* `htmlCode` 함수에서 반환하는 HTML 코드가 화면에 비순차 리스트 형태로 출력되는 것을 확인할 수 있습니다.

<p align="center">
    <img src="/images/xss-weakness-when-dangerously-set-inner-html-attribut-1.JPG" width="100%" class="image__border">
</p>

## 2. XSS(Cross Site Script) 공격에 대한 취약성

HTML 코드를 화면에서 그대로 사용하는 것은 XSS 공격에 취약합니다. 
XSS 공격을 간단하게 요약하면 다음과 같은 방법으로 이뤄집니다. 

* 공격자가 악성 스크립트(script) 코드를 HTML 문서에 삽입합니다.
    * 악성 스크립트는 쿠키에 담긴 개인 정보나 사용자 권한을 가진 비밀 키를 빼내는 코드라고 가정하겠습니다.
* 공격자는 악성 스크립트가 담긴 HTML 문서를 일반 사용자에게 전달합니다.
* 일반 사용자가 공격 HTML 문서를 자신의 브라우저에서 열면 악성 스크립트가 실행됩니다.

`dangerouslySetInnerHTML` 속성를 사용하면 HTML 코드를 그대로 사용하기 때문에 함께 전달된 스크립트가 실행됩니다. 
때문에 `dangerouslySetInnerHTML` 속성는 XSS 공격에 취약합니다. 
외부 사용자에 의해 입력된 데이터를 검증 없이 `dangerouslySetInnerHTML` 속성를 통해 화면에 직접 출력하는 것은 지양해야합니다. 

### 2.1. 예제 코드

`dangerouslySetInnerHTML` 속성를 사용할 때 스크립트 코드가 실행되는지 예제 코드를 통해 확인해보겠습니다. 

* `htmlCode` 함수는 이미지 태그를 이용하여 `alert` 함수를 실행하는 코드를 담은 객체를 반환합니다.
    * 이미지 태그의 크기를 0으로 만들어 화면에서 보이지 않게 만듭니다. 
* 해당 HTML 문서를 화면에서 확인합니다.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Title</title>
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;700&display=swap" rel="stylesheet"/>
    <script crossorigin src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/babel-standalone@6/babel.min.js"></script>
</head>

<body>
<section id="demo"></section>
</body>

<script type="text/jsx">
    const App = () => {
        const htmlCode = () => {
            return {__html: '<img src=x onerror=alert("당신의_쿠키_정보를_빼돌렸습니다.") width="0" height="0">'}
        }
        return <div dangerouslySetInnerHTML={htmlCode()}></div>
    }

    ReactDOM.render(
        <App/>,
        document.getElementById('demo')
    )
</script>

<style>
    * {
        box-sizing: border-box;
    }

    html {
        font-family: 'Jost', sans-serif;
    }

    body {
        margin: 0;
    }

    #demo {
        border: 1px solid #ccc;
    }

    #demo {
        margin: 1rem auto;
        width: 50%;
    }
</style>
</html>
```

##### 결과

* `onerror` 이벤트에 지정된 `alert` 함수가 실행되는 것을 확인할 수 있습니다. 

<p align="center">
    <img src="/images/xss-weakness-when-dangerously-set-inner-html-attribut-2.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2022-08-06-do-not-use-arrow-function-as-methods-in-vue-js>

#### REFERENCE

* <https://ko.reactjs.org/docs/cdn-links.html>
* <https://ko.reactjs.org/docs/dom-elements.html>

[reflected-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/reflected-cross-site-scripting/
[stored-cross-site-scripting-link]: https://junhyunny.github.io/information/security/spring-mvc/stored-cross-site-scripting/
[dom-based-cross-site-scripting-link]: https://junhyunny.github.io/information/security/dom-based-cross-site-scripting/
