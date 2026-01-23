---
title: "React 서비스 화면과 Android WebView 통신"
search: false
category:
  - react
  - android
last_modified_at: 2025-12-13T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Android WebView 사용 예제][android-webview-link] 

## 0. 들어가면서

이번엔 [Android WebView 사용 예제][android-webview-link]에서 만든 애플리케이션과 리액트 서비스 화면끼리 데이터를 주고 받는다.

## 1. Android WebView

리액트 서비스 화면과 안드로이드 웹 뷰의 통신을 이해하기 위해선 둘 사이의 관계를 파악할 필요가 있다. 웹 뷰는 안드로이드에겐 하나의 뷰(view)이지만, HTML 문서 입장에서 자신을 렌더링해주는 브라우저이다. 웹 뷰가 리액트 서비스로 요청을 보내면 HTML 문서를 응답으로 받는다.

1. 웹 뷰는 전달받은 HTML 문서를 렌더링한다.
2. 웹 뷰는 리액트 서비스로부터 전달받은 HTML 문서에서 호출할 수 있는 네이티브 함수를 제공할 수 있다.
  - 브라우저가 `window` 객체를 통해 `Web API` 기능을 제공하듯이 웹 뷰도 `window` 객체를 통해 네이티브 기능을 제공한다.
  - `JavaScript` 코드를 이용해 `window` 객체의 네이티브 함수를 호출한다.
3. 웹 뷰는 `JavaScript` 코드를 실행할 수 있다.
  - `JavaScript` 코드를 실행하여 자신이 렌더링 중인 HTML 문서를 조작할 수 있다. 

<div align="center">
  <img src="/images/posts/2022/react-android-webview-communication-01.png" width="85%" class="image__border">
</div>

<br/>

안드로이드 웹 뷰와 HTML 문서 통신는 아래와 같은 방법을 통해 통신한다.

- 웹 뷰 인스턴스에게 렌더링 중인 HTML 문서에게 네이티브 메서드를 호출할 수 있는 인터페이스를 제공한다.
- 웹 뷰 인스턴스는 자신의 `evaluateJavascript` 메서드를 통해 `JavaScript` 코드를 실행할 수 있다.

<div align="center">
  <img src="/images/posts/2022/react-android-webview-communication-02.png" width="55%" class="image__border">
</div>

## 2. Add JavaScript interface for Android WebView

안드로이드 웹 뷰가 HTML 문서와 통신하기 위한 JavaScript 인터페이스를 만들어보자. HTML 문서에서 호출할 수 있는 메서드를 정의한다. 호출할 수 있는 메서드에 `@JavascriptInterface` 애너테이션을 추가한다.

- `showToastMessage` 메서드
  - HTML 문서에서 전달한 메시지를 토스트 기능을 통해 화면에 띄운다.
- `callJavaScriptFunction` 메서드
  - 5초 뒤 `JavaScript` 코드를 이용해 커스텀 이벤트(CustomEvent)를 발행한다.
  - 커스텀 이벤트의 이름은 `"javascriptFunction"` 이다.
  - 발행한 이벤트를 이용해 리액트 서비스의 상태를 변경한다.

```java
package com.example.myapplication.web;

import android.app.Activity;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

public class JavascriptCallbackClient {

    private Activity mContext;
    private WebView webView;

    public JavascriptCallbackClient(Activity activity, WebView webView) {
        this.mContext = activity;
        this.webView = webView;
    }

    private String publishEvent(String functionName, String data) {
        StringBuffer buffer = new StringBuffer()
                .append("window.dispatchEvent(\n")
                .append("   new CustomEvent(\"").append(functionName).append("\", {\n")
                .append("           detail: {\n")
                .append("               data: ").append(data).append("\n")
                .append("           }\n")
                .append("       }\n")
                .append("   )\n")
                .append(");");
        return buffer.toString();
    }

    @JavascriptInterface
    public void showToastMessage(final String message) {
        Toast.makeText(mContext, message, Toast.LENGTH_SHORT).show();
    }

    @JavascriptInterface
    public void callJavaScriptFunction() {
        webView.postDelayed(() -> {
            webView.evaluateJavascript(publishEvent("javascriptFunction", "\"Hello, I'm message from Android\""),
                    (result) -> {
                        Toast.makeText(mContext, result, Toast.LENGTH_SHORT).show();
                    }
            );
        }, 5000);
    }
}
```

인터페이스를 만들었으면 이를 등록한다. 전체 코드를 확인하시려면 [Android WebView 사용 예제][android-webview-link]를 참고하길 바란다.

- `WebView` 클래스의 `addJavascriptInterface` 메서드로 이전 단계에서 만든 `JavascriptCallbackClient` 클래스를 등록한다.
- `HTML` 문서에서 사용할 수 있도록 이름을 `android`로 지정한다.
  - `window` 객체로부터 `android` 객체를 꺼내 사용할 수 있다.
- 리액트 서비스를 호출할 수 있도록 주소를 변경한다.
  - 안드로이드 앱은 리액트 서비스 주소를 모르기 때문에 `LAN IP`를 전달한다.

```java
package com.example.myapplication;

public class FirstFragment extends Fragment {

    private FragmentFirstBinding binding;

    private WebView webView;
    private ProgressBar progressBar;
    private EditText urlEditText;
    private OnBackPressedCallback onBackPressedCallback;

    public void initWebView() {

        webView.setWebViewClient(new WebViewClient() {

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);

        // JavaScript 인터페이스 등록
        webView.addJavascriptInterface(new JavascriptCallbackClient(requireActivity(), webView), "android");
        webView.loadUrl("http://192.168.0.216:3000/");
    }

    // ...
}
```

## 3. React application

지금부턴 안드로이드 웹뷰와 통신하기 위한 리액트 애플리케이션을 작성해보자. `window` 객체에서 관리 중인 `android` 객체를 사용한다.

- `showToastMessage` 함수 
  - "Hello Native Callback" 메시지를 전달하여 토스트 메시지를 띄운다.
- `callJavaScriptFunction` 함수 
  - 네이티브 앱에서 5초 뒤에 `javascriptFunction` 이벤트를 발행한다.
- `javascriptFunction` 이벤트
  - 안드로이드 웹 뷰에서 발행시키는 이벤트를 리스너에 등록한다.
  - 네이티브 앱으로부터 전달받은 내용으로 화면에 보이는 메시지를 변경한다.

```jsx
import logo from './logo.svg'
import './App.css'
import {useEffect, useState} from "react";

function App() {

    const [messageFromAndroid, setMessageFromAndroid] = useState('Hello Vite + React!');

    useEffect(() => {

        const eventFromAndroid = async (event) => {
            setMessageFromAndroid(event.detail.data);
        }

        window.addEventListener('javascriptFunction', eventFromAndroid);

        if (window.android) {
            window.android.showToastMessage("Hello Native Callback");
            window.android.callJavaScriptFunction();
        }

        return () => {
            window.removeEventListener('javascriptFunction', eventFromAndroid);
        };
    }, []);

    return (<div className="App">
        <header className="App-header">
            <img src={logo} className="App-logo" alt="logo"/>
            <p>{messageFromAndroid}</p>
            <p>
                Edit <code>App.jsx</code> and save to test HMR updates.
            </p>
            <p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
                {' | '}
                <a
                    className="App-link"
                    href="https://vitejs.dev/guide/features.html"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Vite Docs
                </a>
            </p>
        </header>
    </div>)
}

export default App
```

## 4. Test in Andorid emulator

안드로이드 에뮬레이터에서 테스트를 수행한다. 정상적으로 토스트 이벤트가 호출되는 것을 확인할 수 있다.

<div align="left">
  <img src="/images/posts/2022/react-android-webview-communication-03.gif" width="25%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-05-android-webview-communication>

#### REFERENCE

- <https://developer.mozilla.org/ko/docs/Web/API/CustomEvent/CustomEvent>
- <https://programmer-eun.tistory.com/54>

[android-webview-link]: https://junhyunny.github.io/android/android-webview/
[mozilla-custom-event-link]: https://developer.mozilla.org/ko/docs/Web/API/CustomEvent/CustomEvent