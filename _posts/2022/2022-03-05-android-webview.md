---
title: "안드로이드 웹뷰(Android WebView) 예제"
search: false
category:
  - android
last_modified_at: 2026-01-23T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [React 서비스 화면과 Android WebView 통신][react-android-webview-communication-link]

## 0. 들어가면서

네이티브 애플리케이션에서 웹뷰(Webview)를 이용해 새로 개발하는 리액트 서비스를 호출할 생각이다. 웹뷰로 단순히 화면을 보여주면 문제가 없겠지만, 네이티브에서 제공하는 모듈들을 리액트 서비스에서 호출할 가능성이 컸다. 네이티브 애플리케이션은 우리 팀의 일이 아니었지만, 리액트 서비스가 어떻게 네이티브 앱과 통신하는지 이해하고자 간단한 예시 코드를 작성했다. 이번에는 리액트 서비스와 통신할 간단한 웹뷰 애플리케이션을 만들어본다.

## 1. Packages

안드로이드 애플리케이션은 다음과 같은 패키지 구조를 갖는다.

```
 % tree -I 'build|libs|test|androidTest|values*|mipmap*' .
.
├── app
│   ├── build.gradle
│   ├── proguard-rules.pro
│   └── src
│       └── main
│           ├── AndroidManifest.xml
│           ├── java
│           │   └── com
│           │       └── example
│           │           └── myapplication
│           │               ├── FirstFragment.java
│           │               └── MainActivity.java
│           └── res
│               ├── drawable
│               │   └── ic_launcher_background.xml
│               ├── drawable-v24
│               │   └── ic_launcher_foreground.xml
│               ├── layout
│               │   ├── activity_main.xml
│               │   ├── content_main.xml
│               │   └── fragment_first.xml
│               ├── menu
│               │   └── menu_main.xml
│               └── navigation
│                   └── nav_graph.xml
├── build.gradle
├── gradle
│   └── wrapper
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
├── gradle.properties
├── gradlew
├── gradlew.bat
├── local.properties
└── settings.gradle
```

## 2. Android user permission

안드로이드 애플리케이션이 사용자로부터 필요한 권한을 받을 수 있도록 AndroidManifest XML 파일을 일부 수정한다.

- uses-permission 태그 - android:name="android.permission.INTERNET"
  - 애플리케이션에서 인터넷을 사용하기 위한 권한을 요청한다.
- application 태그 - android:usesCleartextTraffic="true"
  - HTTP 호출 시 안드로이드 OS 9 파이(Pie) 버전부터 추가적인 설정이 필요하다.

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myapplication">

    <uses-permission android:name="android.permission.INTERNET"/>

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MyApplication"

        android:usesCleartextTraffic="true"
        >
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.MyApplication.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

안드로이드는 HTTP 접근을 허용하지 않는다. HTTPS 방식으로 접근하면 문제되지 않지만, 로컬 서비스는 HTTP 방식을 통해 접근하므로 이를 설정한다. usesCleartextTraffic 설정을 'true'로 지정한다.

> [Opt out of cleartext traffic][cleartext-traffic-link]<br/>
> Applications intending to connect to destinations using only secure connections can opt-out of supporting cleartext (using the unencrypted HTTP protocol instead of HTTPS) to those destinations.

## 3. Setting layout

Android Studio Bumblebee 버전에서 제공하는 베이직(basic) 프로젝트를 일부 변경했다.

- fragment_second.xml 파일은 제거했다.
- nav_graph.xml 파일에서 fragment_second.xml 화면 전환과 관련된 코드는 삭제했다.
- activity_main.xml, content_main.xml 관련 내용에는 변경이 없다.

fragment_first XML 파일을 다음과 같이 수정한다.

- `EditText` 태그는 URL을 변경할 수 있는 텍스트 박스 뷰(view)이다.
- `WebView` 태그는 웹뷰이다.
- `ProgressBar` 태그는 로딩 중임을 보여주기 위한 뷰이다.

```xml
<?xml version="1.0" encoding="utf-8"?>

<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical">

    <EditText
        android:id="@+id/urlEt"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:hint="주소를 입력하세요."
        android:inputType="textUri" />

    <FrameLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:layout_weight="1">

        <WebView
            android:id="@+id/wView"
            android:layout_width="match_parent"
            android:layout_height="match_parent" />

        <ProgressBar
            android:id="@+id/pBar"
            style="?android:attr/progressBarStyle"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:layout_gravity="center" />
    </FrameLayout>

</LinearLayout>
```

화면 이동 관계를 표현하는 nav_graph XML 파일을 살펴보자. 베이직 프로젝트를 만들면 기본적으로 존재하는 SecondFragment 관련 내용은 삭제했다.

- 네비게이션에서 가장 먼저 시작하되는 프래그먼트(fragment)는 FirstFragment이다. 
  - navigation 태그 - app:startDestination="@id/FirstFragment"
- fragment_first 레이아웃과 FirstFragment 클래스를 매칭한다.
  - fragment 태그 - android:name="com.example.myapplication.FirstFragment"
  - fragment 태그 - tools:layout="@layout/fragment_first"

```xml
<?xml version="1.0" encoding="utf-8"?>

<navigation
    xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/nav_graph"
    app:startDestination="@id/FirstFragment">

    <fragment
        android:id="@+id/FirstFragment"
        android:name="com.example.myapplication.FirstFragment"
        android:label="@string/first_fragment_label"
        tools:layout="@layout/fragment_first">
    </fragment>

</navigation>
```

## 4. WebView setting with callback event

fragment_first.xml 레이아웃과 매칭되는 FirstFragment 클래스에서 필요한 설정과 콜백(callback) 함수를 정의한다. 

- onAttach 메서드
  - 프래그먼트가 만들어질 때 가장 먼저 실행하는 메서드다.
  - 뒤로가기(back press) 버튼을 눌렀을 때 액티비티가 하나이기 때문에 애플리케이션이 종료되는 현상을 막기 위한 콜백 메서드를 등록한다. 웹 페이지 히스토리에서 뒤로 갈 페이지가 있다면 이전 페이지로 돌아간다. 웹뷰에서 뒤로 갈 페이지가 없다면 액티비티의 뒤로가기 이벤트를 실행한다.
- onCreateView 메서드
  - 레이아웃에 등록된 뷰 객체들을 멤버 변수들과 연결한다.
  - 웹뷰를 초기화하는 함수를 호출한다.
    - initWebView 메서드 호출
  - EditText의 값을 이용하여 웹뷰의 URL을 변경하는 콜백 함수를 등록한다.
- initWebView 메서드
  - 웹뷰에서 다른 화면 링크 클릭 시 웹뷰의 URL을 변경하는 메서드를 추가한다.
    - WebViewClient 클래스 shouldOverrideUrlLoading 메서드 오버라이드
  - 웹뷰에서 자바스크립트를 사용할 수 있도록 허용한다.
    - webSettings.setJavaScriptEnabled(true) 메서드 호출
  - 웹뷰의 초기 URL은 https://junhyunny.github.io/로 지정한다.

```java
package com.example.myapplication;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.ProgressBar;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.example.myapplication.databinding.FragmentFirstBinding;

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
        webView.loadUrl("https://junhyunny.github.io/");
    }

    @Override
    public View onCreateView(
            LayoutInflater inflater,
            ViewGroup container,
            Bundle savedInstanceState
    ) {

        binding = FragmentFirstBinding.inflate(inflater, container, false);

        webView = binding.wView;
        progressBar = binding.pBar;
        urlEditText = binding.urlEt;

        progressBar.setVisibility(View.GONE);

        urlEditText.setOnEditorActionListener((textView, actionId, keyEvent) -> {
            if (actionId == EditorInfo.IME_ACTION_NEXT) {
                webView.loadUrl("https://" + urlEditText.getText().toString());
            }
            return false;
        });

        initWebView();

        return binding.getRoot();
    }

    public void onViewCreated(@NonNull View view, Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    @Override
    public void onAttach(@NonNull Context context) {
        super.onAttach(context);
        onBackPressedCallback = new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    requireActivity().onBackPressed();
                }
            }
        };
        requireActivity().getOnBackPressedDispatcher().addCallback(this, onBackPressedCallback);
    }
}
```

안드로이드 에뮬레이터에서 안드로이드 애플리케이션을 실행하면 다음과 같이 동작한다.

<div align="left">
  <img src="/images/posts/2022/android-webview-01.gif" width="25%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-05-android-webview-communication>

#### REFERENCE

- <https://jhshjs.tistory.com/57>

[react-android-webview-communication-link]: https://junhyunny.github.io/react/android/react-android-webview-communication/
[cleartext-traffic-link]: https://developer.android.com/training/articles/security-config#CleartextTrafficPermitted