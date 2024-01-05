---
title: "Sprite Animation in CSS"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2023-08-11T23:55:00
---

<br/>

## 1. Sprite Animation

CSS @keyframes 기능과 여러 개의 프레임(frame)으로 나눠진 이미지를 사용하면 영상처럼 보이는 스프라이트 애니메이션(sprite animation)을 만들 수 있습니다. 
다음과 같은 사이즈(1900×240)를 가진 이미지로 애니메이션을 구현하겠습니다. 

<p align="center">
    <img src="/images/sprite-animation-in-css-1.JPG" width="100%" class="image__border image__padding">
</p>
<center>CSS 스프라이트 애니메이션</center>

### 1.1. How to make animation?

원리는 일반적인 애니메이션 영상을 만드는 것과 동일합니다. 

* 이미지 전체 중에서 한 프레임 크기만큼만 보여줍니다.
    * 해당 영역은 고정되어 있습니다.
* 시간이 지남에 따라 한 프레임 단위로 백그라운드 이미지 위치를 이동시킵니다.

<p align="center">
    <img src="/images/sprite-animation-in-css-2.JPG" width="100%" class="image__border">
</p>

## 2. Practice

코드펜(codepen)을 사용해 스프라이트 애니메이션을 구현하였습니다. 

### 2.1. HTML Code

* wrapper 클래스를 가진 엘리먼트가 프레임 사이즈를 제한합니다. 
* sprite-animation 클래스를 가진 엘리먼트 영역에서 애니메이션이 수행됩니다. 

```html
<div class="wrapper">
  <div class="sprite-animation"/>  
</div>
```

### 2.2. CSS Code

* wrapper 클래스
    * 한 프레임 사이즈만큼 영역을 제한합니다.
* sprite-animation 클래스
    * 애니메이션 이미지가 동작하는 엘리먼트 사이즈를 부모 엘리먼트만큼 확장합니다.
    * 백그라운드 이미지는 애니메이션에 사용할 이미지로 지정합니다.
    * 백그라운드 이미지 사이즈는 다음과 같습니다.
        * 폭(width) = 한 프레임 폭 사이즈 X 프레임 개수
        * 높이(height) = 한 프레임 높이 사이즈
    * 애니메이션을 정보를 지정합니다.
        * 애니메이션은 0.5초씩 무한 반복됩니다.
        * 10개의 프레임을 사용합니다.
        * 백그라운드 포지션을 왼쪽에서 오른쪽으로 움직이며 마지막 위치는 -1900px 입니다. 

```css
.wrapper {
  width: 190px;
  height: 240px;
  border: 1px lightgrey solid;
  border-radius: 5px;
}

.sprite-animation {
  width: 100%;
  height: 100%;
  background-image: url("https://junhyunny.github.io/images/sprite-animation-in-css-1.JPG");
  background-size: 1900px 240px;
  animation: drinking 0.5s infinite steps(10);
}

@keyframes drinking {
  to {
    background-position: -1900px;
  }
}
```

### 2.3. Result

{% include codepen.html hash="JjeQRKj" tab="css,result" title="Sprite Image Animation" %}

#### RECOMMEND NEXT POSTS

* [Restart CSS Animation by JavaScript][restart-css-animation-by-javascript-link]

#### REFERENCE

* [CSS 스프라이트 애니메이션](https://simsimjae.medium.com/css-%EC%8A%A4%ED%94%84%EB%9D%BC%EC%9D%B4%ED%8A%B8-%EC%95%A0%EB%8B%88%EB%A9%94%EC%9D%B4%EC%85%98-a9958cdcd617)

[restart-css-animation-by-javascript-link]: https://junhyunny.github.io/html/css/javascript/restart-css-animation-by-javascript/