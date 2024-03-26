---
title: "How to set weights and styles with @font-face"
search: false
category:
  - html
  - css
last_modified_at: 2024-03-26T23:55:00
---

<br/>

## 0. 들어가면서

폰트(font)를 적용할 때 HTML 문서 헤더에 링크를 정의하는 방법도 있지만, 다운로드 받은 폰트를 함께 번들링(bundling)해서 제공할 수 있다. 경험상 네트워크가 불안정하거나 제한된 환경에서 폰트 파일을 함께 빌드했었다. 이런 경우 `@font-face` 지시어를 사용했는데 적용 방법이 매번 헷갈려 시간이 허비한 경우가 종종 있었다. 적용 방법을 정확히 이해하고자 글로 정리했다.

## 1. Download font files

[구글 폰트 사이트](https://fonts.google.com/)에 접속해 필요한 폰트를 다운로드 받는다. @font-face 지시어가 적용되었는지 확인하기 위해 특이한 폰트를 다운로드 받았다. 

- `Get font` 버튼을 누른다.

<p align="center">
  <img src="/images/posts/2024/how-to-set-weights-and-styles-with-font-face-01.png" width="100%" class="image__border">
</p>

- `Download all` 버튼을 누른다.

<p align="center">
  <img src="/images/posts/2024/how-to-set-weights-an d-styles-with-font-face-02.png" width="100%" class="image__border">
</p>

## 2. @font-face directive

`@font-face` 지시어는 웹 페이지의 텍스트에 온라인 폰트를 적용하는 방법이다. 다음과 같은 문법을 갖는다. 

- `<a-remote-font-name>`
  - font 속성에서 폰트명(font face)으로 지정될 이름을 설정한다.
  - 여기서 지정한 폰트 이름을 CSS 파일에서 사용할 수 있다.
- `<source>`
  - 원격 폰트(remote font) 파일의 위치를 나타내는 URL 값을 지정한다. 프로젝트 내 폰트 위치거나 원격 서버의 주소일 수 있다.
  - 사용자 컴퓨터에 설치된 폰트명을 local("Font Name")형식으로 지정할 수 있다.
- `<weight>`
  - 폰트 굵기 값
- `<style>`
  - 폰트 스타일 값

```css
@font-face {
  font-family: <a-remote-font-name>;
  src: <source> [,<source>]*;
  [font-weight: <weight>];
  [font-style: <style>];
}
```

## 3. Using @font-face directive

@font-face 지시어를 사용해 폰트를 적용하는 방법은 두 가지 있다. 두 가지 방법을 모두 알아본다. 프로젝트 구조는 다음과 같다.

- src/assets/fonts 경로에 폰트 파일들이 위치한다.

```
./
├── README.md
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src
│   ├── App.tsx
│   ├── assets
│   │   └── fonts
│   │       ├── EduNSWACTFoundation-Bold.ttf
│   │       ├── EduNSWACTFoundation-Medium.ttf
│   │       ├── EduNSWACTFoundation-Regular.ttf
│   │       └── EduNSWACTFoundation-SemiBold.ttf
│   ├── index.css
│   ├── index.tsx
│   ├── logo.svg
│   ├── react-app-env.d.ts
│   ├── reportWebVitals.ts
│   └── setupTests.ts
└── tsconfig.json
```

애플리케이션에서 폰트 적용 여부를 확인할 수 있도록 App.tsx 파일을 아래처럼 구현한다.

```tsx
import React from "react";

function App() {
  return (
    <div>
      <p className="u400">Hello World(Regular)</p>
      <p className="u500">Hello World(Medium)</p>
      <p className="u600">Hello World(SemiBold)</p>
      <p className="u700">Hello World(Bold)</p>
    </div>
  );
}

export default App;
```

### 3.1. Unique font-family name

고유한 font-family 이름을 지정하는 방법이다. 고유한 이름이므로 필요한 클래스에서 해당 폰트 이름을 사용하면 된다.

- @font-face 지시자 블록
  - font-family 이름 뒤에 폰트 굵기 정보를 추가한다.
  - font-weight, font-style 속성은 normal 값으로 지정한다.
- 각 클래스에서 필요한 font-family 이름을 사용한다.

```css
@font-face {
    font-family: 'EduNSWACTFoundationRegular';
    src: url("assets/fonts/EduNSWACTFoundation-Regular.ttf") format('truetype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'EduNSWACTFoundationMedium';
    src: url("assets/fonts/EduNSWACTFoundation-Medium.ttf") format('truetype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'EduNSWACTFoundationSemiBold';
    src: url("assets/fonts/EduNSWACTFoundation-SemiBold.ttf") format('truetype');
    font-weight: normal;
    font-style: normal;
}

@font-face {
    font-family: 'EduNSWACTFoundationBold';
    src: url("assets/fonts/EduNSWACTFoundation-Bold.ttf") format('truetype');
    font-weight: normal;
    font-style: normal;
}

.u400 {
    font-family: 'EduNSWACTFoundationRegular', sans-serif;
}

.u500 {
    font-family: 'EduNSWACTFoundationMedium', sans-serif;
}

.u600 {
    font-family: 'EduNSWACTFoundationSemiBold', sans-serif;
}

.u700 {
    font-family: 'EduNSWACTFoundationBold', sans-serif;
}
```

<p align="center">
  <img src="/images/posts/2024/how-to-set-weights-and-styles-with-font-face-03.png" width="80%" class="image__border">
</p>

#### 3.1.1. Mismatch font-weight and font-style

주의할 점은 font-weight, font-style 속성의 값을 정확하게 `normal`로 맞춰 사용해야 한다는 것이다. font-weight 속성을 다른 값으로 지정해버리면 사파리(safari) 브라우저에서 폰트 굵기가 이상하게 출력된다. 

- @font-face 지시어 블록들은 그대로 사용한다.
- SemiBold, Bold 폰트의 경우 font-weight 속성에 normal 값이 아닌 실제 굵기 값을 준다.
  - 600 - SemiBold
  - 700 - Bold

```css
.u400 {
    font-family: 'EduNSWACTFoundationRegular', sans-serif;
}

.u500 {
    font-family: 'EduNSWACTFoundationMedium', sans-serif;
}

.u600 {
    font-family: 'EduNSWACTFoundationSemiBold', sans-serif;
    font-weight: 600;
}

.u700 {
    font-family: 'EduNSWACTFoundationBold', sans-serif;
    font-weight: 700;
}
```

<p align="center">
  <img src="/images/posts/2024/how-to-set-weights-and-styles-with-font-face-04.png" width="80%" class="image__border">
</p>

### 3.2. Style Linking

동일한 font-family 이름을 지정하지만, 폰트 굵기와 스타일을 맞추는 방법이다. 이름이 같으므로 font-family 속성은 body 블록에 지정하고 클래스에선 font-weight, font-style 속성을 동일하게 맞춰 사용한다. 

- @font-face 지시자 블록
  - font-family 이름은 동일한 값을 사용한다.
  - font-weight 속성은 폰트 굵기에 따라 적절한 값을 사용한다.
  - font-style 속성은 스타일에 따라 적절한 값을 사용한다. 이 예제에서 스타일 변경은 없다.
- body 요소의 font-family 속성을 @font-face 지시자 블록에서 선언한 이름으로 지정한다. body 하위 요소들에 모두 적용된다.
- 각 클래스의 font-weight 속성을 @font-face 지시자 블록에서 선언한 값으로 지정한다.

```css
@font-face {
    font-family: 'EduNSWACTFoundation';
    src: url("assets/fonts/EduNSWACTFoundation-Regular.ttf") format('truetype');
    font-weight: 400;
    font-style: normal;
}

@font-face {
    font-family: 'EduNSWACTFoundation';
    src: url("assets/fonts/EduNSWACTFoundation-Medium.ttf") format('truetype');
    font-weight: 500;
    font-style: normal;
}

@font-face {
    font-family: 'EduNSWACTFoundation';
    src: url("assets/fonts/EduNSWACTFoundation-SemiBold.ttf") format('truetype');
    font-weight: 600;
    font-style: normal;
}

@font-face {
    font-family: 'EduNSWACTFoundation';
    src: url("assets/fonts/EduNSWACTFoundation-Bold.ttf") format('truetype');
    font-weight: 700;
    font-style: normal;
}

body {
    font-family: 'EduNSWACTFoundation', sans-serif;
}

.u400 {
    font-weight: 400;
}

.u500 {
    font-weight: 500;
}

.u600 {
    font-weight: 600;
}

.u700 {
    font-weight: 700;
}
```

<p align="center">
  <img src="/images/posts/2024/how-to-set-weights-and-styles-with-font-face-05.png" width="80%" class="image__border">
</p>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-03-26-how-to-set-weights-and-styles-with-font-face>

#### REFERENCE

- <https://fonts.google.com/>
- <https://www.smashingmagazine.com/2013/02/setting-weights-and-styles-at-font-face-declaration/>
- <https://webclub.tistory.com/261>
