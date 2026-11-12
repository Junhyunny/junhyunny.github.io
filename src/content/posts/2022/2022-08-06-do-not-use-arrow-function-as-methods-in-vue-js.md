---
title: "Vue.js에서 메서드에 화살표 함수를 사용하지 말아야 하는 이유"
publishedAt: "2022-08-06"
updatedAt: "2026-11-12T16:18:37+09:00"
canonicalPath: "/javascript/do-not-use-arrow-function-as-methods-in-vue-js/"
categories:
  - "javascript"
summary: "Vue.js의 methods 속성에 화살표 함수를 정의하면 this를 찾지 못하는 현상을 createApp, applyOptions 함수 디버깅으로 분석하고 해결 방법을 정리했다."
---

## 0. 들어가면서

Jekyll 문법과 충돌하므로 `{ { someValue } }`으로 표기된 코드는 공백을 제거해야 정상적으로 동작한다.

## 1. 문제 현상

`Vue.js`에서 컴포넌트를 만들 때 화살표 함수(arrow function, =>)를 사용하면 `this` 키워드를 정상적으로 찾지 못하는 현상이 있었다. 간단한 코드로 문제를 살펴보자.

`HelloWorld` 컴포넌트의 `methods` 속성에 있는 `hideAndVisible` 함수를 화살표 함수 형태로 선언하고, `this` 객체를 `alert` 함수로 출력한다. 출력되는 `this` 객체가 `undefined`인지 확인해 보자.

```vue
<template>
  <div class="hello">
    <h1>{ { msg } }</h1>
    <p>
      For a guide and recipes on how to configure / customize this project,<br/>
      check out the
      <a href="https://cli.vuejs.org" target="_blank" rel="noopener">vue-cli documentation</a>.
    </p>
    <button @click="hideAndVisible">{ { visible } }</button>
    <div v-if="visible === 'HIDE'">
      <h3>Installed CLI Plugins</h3>
      <ul>
        <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel" target="_blank" rel="noopener">babel</a></li>
        <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint" target="_blank" rel="noopener">eslint</a></li>
      </ul>
      <h3>Essential Links</h3>
      <ul>
        <li><a href="https://vuejs.org" target="_blank" rel="noopener">Core Docs</a></li>
        <li><a href="https://forum.vuejs.org" target="_blank" rel="noopener">Forum</a></li>
        <li><a href="https://chat.vuejs.org" target="_blank" rel="noopener">Community Chat</a></li>
        <li><a href="https://twitter.com/vuejs" target="_blank" rel="noopener">Twitter</a></li>
        <li><a href="https://news.vuejs.org" target="_blank" rel="noopener">News</a></li>
      </ul>
      <h3>Ecosystem</h3>
      <ul>
        <li><a href="https://router.vuejs.org" target="_blank" rel="noopener">vue-router</a></li>
        <li><a href="https://vuex.vuejs.org" target="_blank" rel="noopener">vuex</a></li>
        <li><a href="https://github.com/vuejs/vue-devtools#vue-devtools" target="_blank" rel="noopener">vue-devtools</a></li>
        <li><a href="https://vue-loader.vuejs.org" target="_blank" rel="noopener">vue-loader</a></li>
        <li><a href="https://github.com/vuejs/awesome-vue" target="_blank" rel="noopener">awesome-vue</a></li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      visible: "VISIBLE"
    }
  },
  methods: {
    hideAndVisible: () => {
      alert(this) // this is undefined
      if (this.visible === "VISIBLE") {
        this.visible = "HIDE"
      } else {
        this.visible = "VISIBLE"
      }
    }
  }
}
</script>

<style scoped>
/* styles */
</style>
```

## 2. 문제 원인

화살표 함수를 사용하면 `this` 객체가 바인딩되지 않는 이유가 궁금해서 원인을 찾아봤다.

### 2.1. createApp 함수 탐색하기

`Vue` 애플리케이션을 만들 때 사용하는 `createApp` 함수를 탐색해 봤다. `methods` 속성과 해당 컴포넌트 객체를 연결하는 코드가 있을 것이라 예상하고, 관련 코드를 `createApp` 함수 내부에서 찾아봤다. 파이어폭스(firefox) 디버깅으로 해당 기능으로 의심되는 코드가 실행되는지 확인했다.

`@vue/runtime-core/dist` 폴더에 있는 `runtime-core.esm-bundler.js` 파일에서 다음과 같은 `applyOptions` 함수를 확인했다. 이 함수는 Vue 컴포넌트를 생성할 때 함께 정의하는 data, computed, methods, watch 등의 속성을 `options` 객체에서 필요한 이름으로 디스트럭처링(destructuring)한다. 그리고 `methods` 속성에 정의된 함수들을 반복문으로 순회하며 다음과 같이 처리한다.

- 배포 환경이 아닌 경우 Object 객체의 `defineProperty` 함수로 Vue 컴포넌트 객체와 대상 함수 객체를 연결한다.
- 배포 환경인 경우 대상 함수 객체의 `bind` 함수를 사용해 Vue 컴포넌트 객체를 연결한다.

```javascript
function applyOptions(instance) {

    const options = resolveMergedOptions(instance);
    const publicThis = instance.proxy;
    const ctx = instance.ctx;

    // ... other logics

    const {
    // state
    data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions,
    // lifecycle
    created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch,
    // public API
    expose, inheritAttrs,
    // assets
    components, directives, filters } = options;

    // ... other logics

    if (methods) {
        for (const key in methods) {
            const methodHandler = methods[key];
            if (isFunction(methodHandler)) {
                // In dev mode, we use the `createRenderContext` function to define
                // methods to the proxy target, and those are read-only but
                // reconfigurable, so it needs to be redefined here
                if ((process.env.NODE_ENV !== 'production')) {
                    Object.defineProperty(ctx, key, {
                        value: methodHandler.bind(publicThis),
                        configurable: true,
                        enumerable: true,
                        writable: true
                    });
                }
                else {
                    ctx[key] = methodHandler.bind(publicThis);
                }
                if ((process.env.NODE_ENV !== 'production')) {
                    checkDuplicateProperties("Methods" /* METHODS */, key);
                }
            }
            else if ((process.env.NODE_ENV !== 'production')) {
                warn(`Method "${key}" has type "${typeof methodHandler}" in the component definition. ` +
                    `Did you reference the function correctly?`);
            }
        }
    }

    // ... other logics
}
```

위 코드가 실행되는 시점의 콜 스택(call stack)과 각 변수의 값도 확인해 봤다. `createApp` 함수로 만든 `app` 객체의 `mount` 함수부터 콜 스택을 따라가면 `applyOptions` 함수를 만날 수 있다.

<div class="block-break" align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/do-not-use-arrow-function-as-methods-in-vue-js-01.png" width="55%" class="image__border">
</div>

디버깅 표현식(debugging expressions)으로 각 변수의 값을 보면 반복문에서 사용하는 `key` 값은 메서드 이름인 `hideAndVisible`이고, `methodHandler`는 `hideAndVisible`이라는 이름의 함수 객체다. `publicThis`는 `HelloWorld` 컴포넌트 객체를 타깃(target)으로 지닌 프록시 객체다.

<div align="left">
  <img src="https://raw.githubusercontent.com/Junhyunny/junhyunny-blog-2022/main/do-not-use-arrow-function-as-methods-in-vue-js-02.png" width="45%" class="image__border">
</div>

### 2.2. 그래서 원인은?

코드만 봐서는 크게 문제가 없어 보이지만, 사실 화살표 함수는 `bind` 함수로 `this`를 재정의할 수 없다.

> MDN<br/>
> 화살표 함수 표현(arrow function expression)은 전통적인 함수 표현(function)의 간편한 대안입니다. 하지만, 화살표 함수는 몇 가지 제한점이 있고 모든 상황에 사용할 수는 없습니다.<br/>
> * this나 super에 대한 바인딩이 없고, methods 로 사용될 수 없습니다.
> * new.target키워드가 없습니다.
> * 일반적으로 스코프를 지정할 때 사용하는 call, apply, bind methods를 이용할 수 없습니다.
> * 생성자(Constructor)로 사용할 수 없습니다.
> * yield를 화살표 함수 내부에서 사용할 수 없습니다.

즉, Vue 프레임워크는 `methods` 속성에 정의한 함수의 스코프를 해당 Vue 컴포넌트로 지정할 때 `bind` 함수를 사용하는데, 화살표 함수로 정의하면 스코프가 재정의되지 않아서 문제가 발생한 것이다. 운영 환경이 아닌 경우엔 `Object` 객체의 `defineProperty` 함수를 사용하지만, 결국 `methodHandler` 객체의 `bind` 함수를 사용하기 때문에 화살표 함수로 정의하면 스코프가 정상적으로 연결되지 않는다.

아래 예시 코드로 확인할 수 있다.

```javascript
const module = {
  x: 42
};

function normalFunc () {
    return this.x
}

console.log('call normalFunc - ', normalFunc()) // undefined

const bounedNormalFunc = normalFunc.bind(module)

console.log('call bounedNormalFunc - ', bounedNormalFunc()) // 42

const arrowFunc = () => {
    return this.x
}

console.log('call arrowFunc - ', arrowFunc()) // undefined

const boundedArrowFunc = arrowFunc.bind(module)
console.log('call boundedArrowFunc - ', boundedArrowFunc()) // undefined
```

실행 결과는 다음과 같다.

```
> "call normalFunc - " undefined
> "call bounedNormalFunc - " 42
> "call arrowFunc - " undefined
> "call boundedArrowFunc - " undefined
```

## 3. 문제 해결

해결 방법은 단순하다. `methods` 속성에 함수를 정의할 때 화살표 함수를 사용하지 않으면 된다.

```vue
<template>
    <!-- ... vue elements -->
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      visible: "VISIBLE"
    }
  },
  methods: {
    // bind error
    // hideAndVisible: () => {
    //   alert(this)
    //   if (this.visible === "VISIBLE") {
    //     this.visible = "HIDE"
    //   } else {
    //     this.visible = "VISIBLE"
    //   }
    // }
    hideAndVisible() {
      if (this.visible === "VISIBLE") {
        this.visible = "HIDE"
      } else {
        this.visible = "VISIBLE"
      }
    }
  }
}
</script>

<style scoped>
    /* ... styles */
</style>
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-08-06-do-not-use-arrow-function-as-methods-in-vue-js>

#### REFERENCE

- <https://stackoverflow.com/questions/33308121/can-you-bind-this-in-an-arrow-function>
- <https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Functions/Arrow_functions>
- <https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty>
