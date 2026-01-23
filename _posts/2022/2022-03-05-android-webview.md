---
title: "Android Webview 사용 예제"
search: false
category:
  - android
last_modified_at: 2022-03-05T23:55:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [React 서비스 화면과 Android WebView 통신][react-android-webview-communication-link]

## 0. 들어가면서

네이티브 애플리케이션의 웹 뷰(Webview)를 이용해 새로 개발하는 리액트 서비스를 호출할 예정이 있다고 합니다. 
웹뷰로 단순히 화면을 보여주면 문제가 없겠지만, 네이티브의 중요 모듈을 리액트 서비스에서 호출할 가능성이 컸습니다. 
네이티브 애플리케이션은 저희 팀의 일이 아니었지만, 리액트 서비스가 어떻게 네이티브 앱과 통신하는지 이해하고자 간단한 예시 코드를 작성해보았습니다. 
일단 이번엔 리액트 서비스와 통신할 간단한 웹 뷰 애플리케이션을 만들어보겠습니다.

## 1. 패키지 구조
- build, libs, test, androidTest 패키지 제외
- values, mipmap 으로 시작하는 패키지 제외

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

## 2. 안드로이드 권한 부여

##### AndroidManifest.xml

- 애플리케이션에서 인터넷 사용하기 위한 권한을 요청합니다.
    - `uses-permissio` 태그 `android:name="android.permission.INTERNET"`
- HTTP 호출 시 안드로이드 OS 9 Pie 버전부터 추가적인 설정이 필요합니다.
    - `application` 태그 `android:usesCleartextTraffic="true"` 설정

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

###### Android for Developers - Network security configuration
- `usesCleartextTraffic` 설정 관련된 내용입니다.

> [Opt out of cleartext traffic][cleartext-traffic-link]<br/>
> Applications intending to connect to destinations using only secure connections 
> can opt-out of supporting cleartext 
> (using the unencrypted HTTP protocol instead of HTTPS) to those destinations. 

## 3. 레아이웃 설정

`Android Studio Bumblebee` 버전에서 제공하는 베이직(basic) 프로젝트를 일부 변경하였습니다. 
- `fragment_second.xml` 파일은 제거하였습니다.
- `nav_graph.xml` 파일에서 `fragment_second.xml` 화면 전환과 관련된 코드는 삭제하였습니다.
- `activity_main.xml`, `content_main.xml` 관련된 내용엔 변경이 없습니다. 

##### fragment_first.xml
- `EditText` 태그 - URL을 변경할 수 있는 텍스트 박스 뷰(view)입니다.
- `WebView` 태그 - 웹뷰입니다.
- `ProgressBar` 태그 - 로딩 중임을 표여주기 위한 뷰입니다.

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

##### nav_graph.xml
- 화면 이동 관계를 표현하는 파일입니다.
- 네비게이션을 이용할 때 가장 먼저 시작하는 프래그먼트(fragment)는 `FirstFragment`입니다.
    - `app:startDestination="@id/FirstFragment"`
- `fragment_first` 레이아웃과 `FirstFragment` 클래스를 매칭합니다.
    - `fragment` 태그 `android:name="com.example.myapplication.FirstFragment"`
    - `fragment` 태그 `tools:layout="@layout/fragment_first"`
- 베이직 프로젝트를 만들면 기본적으로 존재하는 `SecondFragment` 관련 내용을 삭제하였습니다. 

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

## 4. 웹 뷰 설정 및 콜백 이벤트 추가

`fragment_first.xml` 레이아웃과 매칭되는 `FirstFragment` 클래스에서 필요한 설정과 콜백(callback) 함수를 정의합니다. 

##### FirstFragment 클래스
- `onAttach` 메서드
    - 프래그먼트가 만들어질 때 가장 먼저 실행하는 메서드입니다.
    - 뒤로가기(back press) 버튼을 눌렀을 때 액티비티가 하나이기 때문에 애플리케이션이 종료되는 현상을 막기 위한 콜백 메서드를 등록합니다. 
    - 웹 페이지 히스토리에서 뒤로 갈 페이지가 있다면 이전 페이지로 돌아갑니다.
    - 웹 뷰에서 뒤로 갈 페이지가 없다면 액티비티의 뒤로가기 이벤트를 실행합니다.
- `onCreateView` 메서드
    - 레이아웃에 등록된 뷰 객체들을 멤버 변수들과 연결합니다. 
    - 웹뷰를 초기하는 함수를 호출합니다.
        - `initWebView` 메서드 호출
    - `EditText`에 값을 이용하여 웹뷰의 URL을 변경하는 콜백 함수를 등록합니다.
- `initWebView` 메서드
    - 웹 뷰에서 다른 화면 링크 클릭 시 웹 뷰의 URL을 변경하는 메서드를 추가합니다.
        - `WebViewClient` 클래스 `shouldOverrideUrlLoading` 메서드 오버라이드
    - 웹 뷰에서 자바스크립트를 사용할 수 있도록 허용합니다.
        - `webSettings.setJavaScriptEnabled(true)` 메서드 호출
    - 웹 뷰의 초기 URL은 `https://junhyunny.github.io/`로 지정합니다.

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

## 5. 안드로이드 에뮬레이터 테스트

<p align="left">
    <img src="/images/android-webview-1.gif" width="25%" class="image__border">
</p>

##### CLOSING

안드로이드 개발자가 아니기 때문에 잘못된 설명을 하고 있다면 댓글로 알려주시길 부탁드립니다. 감사하겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2022-03-05-android-webview-communication>

#### REFERENCE
- <https://jhshjs.tistory.com/57>

[react-android-webview-communication-link]: https://junhyunny.github.io/react/android/react-android-webview-communication/

[cleartext-traffic-link]: https://developer.android.com/training/articles/security-config#CleartextTrafficPermitted