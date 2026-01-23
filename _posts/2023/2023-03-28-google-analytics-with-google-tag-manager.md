---
title: "Google Analytics with Google Tag Manager"
search: false
category:
  - information
  - data-science
last_modified_at: 2023-03-28T23:55:00
---

<br/>

## 0. 들어가면서

사용자로부터 인사이트(insight)를 얻으려면 데이터가 필요합니다. 
이를 위해 구글 애널리틱스(GA, google analytics)를 많이 사용합니다. 
애널리틱스를 더 효율적으로 사용하기 위해 구글 태그 매니저(GTM, google tag manager)을 함께 사용합니다. 
최근 진행 중인 프로젝트에서도 사용자의 행동을 파악하기 위해 GA, GTM을 도입하였습니다. 

이번 포스트에선 직접 도입하면서 배운 내용들을 하나씩 정리해보겠습니다. 
다음과 같은 환경에서 작업하였습니다.

* AWS EC2 Container
* React Application

## 1. Google Tag Manager

블로그를 운영하기 때문에 애널리틱스는 친숙했지만, 태그 매니저는 잘 몰랐습니다. 
어떤 서비스를 제공하는지 찾아봤습니다. 

* 브라우저가 보여주는 웹 페이지에서 발생하는 이벤트를 트래킹(tracking)하는 도구입니다.
* 태그를 기반으로 사용자의 활동을 추적하고 기록합니다.
* 웹 분석, 광고 성과 측정, 제휴 페이지 추적 등을 위해 사용합니다.

태그 매니저를 잘 활용하려면 태그(tag), 트리거(trigger), 변수(variable)에 대한 개념을 잡아야 합니다. 
이번 포스트는 애널리틱스와 태그 매니저를 연결하는 방법만 다루기 때문에 관련된 내용은 추후 이어질 포스트에서 다루겠습니다. 

## 2. In Google Analytics

애널리틱스에서 필요한 작업에 대해 먼저 알아보겠습니다. 

### 2.1. Add Property

* 왼쪽 아래 설정을 눌러 관리자 탭으로 이동합니다.
* 자신의 계정 하위에 속성을 추가합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-1.JPG" width="100%" class="image__border">
</p>

* 속성의 이름, 시간대, 통화를 지정합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-2.JPG" width="100%" class="image__border">
</p>

* 기타 정보를 입력 후 만들기 버튼을 누릅니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-3.JPG" width="100%" class="image__border">
</p>

## 2.2. Add Data Stream for Property

* 만든 속성에서 데이터 스트림을 지정합니다.
* 웹 플랫폼 방식을 사용합니다. 

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-4.JPG" width="100%" class="image__border">
</p>

* 데이터를 수집할 서버의 공개 도메인(public domain)을 추가합니다.
    * 테스트를 위해 AWS EC2 컨테이너를 사용했습니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-5.JPG" width="100%" class="image__border">
</p>

* 데이터 스트림 설정이 완료되면 아래와 같은 창을 볼 수 있습니다.
* 구글 태그 매니저와 연결하기 위해선 `G-`로 시작하는 측정 ID가 필요합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-6.JPG" width="100%" class="image__border">
</p>

## 3. In Google Tag Manager

태그 매니저에서 필요한 작업을 살펴보겠습니다. 
이번 포스트에선 태그 매니저의 기능들에 대한 상세한 설명은 다루지 않습니다. 
간단한 클릭 이벤트만 만들어 구글 애널리틱스에서 감지되는지 살펴보겠습니다. 

### 2.1. Create Account

* 계정 만들기 버튼을 클릭합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-7.JPG" width="100%" class="image__border">
</p>

* 계정에 관련된 정보를 입력합니다.
* 컨테이너 이름은 도메인 이름을 입력하였습니다.
* 대상 플랫폼은 웹(web)입니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-8.JPG" width="100%" class="image__border">
</p>

* 계정을 만들면 태그 관리자를 설치할 수 있는 스크립트를 받습니다.
    * 상단 스크립트는 모든 페이지의 헤더(header) 최상단에 위치시킵니다.
    * 하단 스크립트는 모든 페이지의 바디(body) 바로 아래 위치시킵니다.
* 리액트(react)는 SPA(single page application)이므로 `index.html` 파일에 스크립트를 추가합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-9.JPG" width="100%" class="image__border">
</p>

### 2.2. Install Tag Manager

* 계정을 생성한 직후 스크립트를 복사하는 페이지를 놓쳤다면 다음 페이지에서 찾을 수 있습니다. 
* 관리 탭에서 Google 태그 관리자 설치를 선택합니다. 

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-10.JPG" width="100%" class="image__border">
</p>

* 설치 스크립트를 확인할 수 있습니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-11.JPG" width="100%" class="image__border">
</p>

##### index.html in React Project

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','GTM-YOUR_GTM_CODE');</script>
    <!-- End Google Tag Manager -->
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <!--
      manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the `public` folder during the build.
      Only files inside the `public` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running `npm run build`.
    -->
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
  </body>
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-YOUR_GTM_CODE"
                    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
</html>
```

### 2.3. Create Trigger

* 트리거를 만들어 이벤트를 감지할 방법을 정의합니다. 
* 새로 만들기 버튼을 클릭합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-12.JPG" width="100%" class="image__border">
</p>

* 모든 요소에서 발생하는 모든 클릭을 감지합니다.
* `Click`이라는 이름으로 트리거를 생성합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-13.JPG" width="100%" class="image__border">
</p>

### 2.4. Create Tag

* 태그를 만들어 이벤트를 구글 애널리틱스에 연결합니다.
* 새로 만들기 버튼을 클릭합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-14.JPG" width="100%" class="image__border">
</p>

* 태그 구성과 트리거를 지정합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-15.JPG" width="100%" class="image__border">
</p>

* 태그 구성을 눌러 태그 종류를 선택합니다.
* 구글 애널리틱스 GA4 이벤트를 선택합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-16.JPG" width="100%" class="image__border">
</p>

* 트리거를 눌러 트리거를 선택합니다.
* 이전 단계에서 만든 `Click` 트리거를 선택합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-17.JPG" width="100%" class="image__border">
</p>

* 태그 이름을 `Click`으로 지정합니다.
* 측정 ID는 구글 애널리틱스 생성 시 발급받은 `G-`로 시작하는 코드를 입력합니다.
* 이벤트 이름을 `click`으로 지정합니다.
    * 지정한 이벤트 이름으로 구글 애널리틱스에서 확인 가능합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-18.JPG" width="100%" class="image__border">
</p>

### 2.5. Public Tag

* 태그 매니저에서 만든 변경 사항들을 배포합니다.
* 상단 제출 버튼을 클릭합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-19.JPG" width="100%" class="image__border">
</p>

* 게시 버튼을 클릭합니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-20.JPG" width="100%" class="image__border">
</p>

* 버전 2로 배포되었습니다.
* 버전 변경사항엔 생성한 태그, 트리거 정보를 볼 수 있습니다.

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-21.JPG" width="100%" class="image__border">
</p>

## 3. In Google Analytics

해당 리액트 애플리케이션을 서버에 배포한 후 구글 애널리틱스에서 발생하는 이벤트들을 살펴보겠습니다.

* 애널리틱스에서 `click` 이벤트가 감지됨을 확인할 수 있습니다. 

<p align="center">
    <img src="/images/google-analytics-with-google-tag-manager-22.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-03-28-google-analytics-with-google-tag-manager>

#### RECOMMEND NEXT POSTS

* [Using Google Tag Manager][using-google-tag-manager-link]
* [Custom Event in Google Tag Manager][custom-event-in-google-tag-manager-link]

#### REFERENCE

* <https://yozm.wishket.com/magazine/detail/1888/>
* <https://evan-moon.github.io/2020/04/19/what-is-gtm-google-tag-manager/>

[using-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/using-google-tag-manager/
[custom-event-in-google-tag-manager-link]: https://junhyunny.github.io/information/data-science/custom-event-in-google-tag-manager/