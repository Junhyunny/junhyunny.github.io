---
title: "Customizing SwiperJs"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-06-11T23:55:00
---

<br/>

## 0. 들어가면서

스와이퍼(swiper) 기능이 필요하면 주로 `SwiperJs` 라이브러리를 사용합니다. 
제공되는 스타일을 그대로 사용하진 않고 변경하여 사용합니다. 
이번 포스트에서는 스와이퍼를 커스터마이징(customizing)하는 방법과 몇 가지 예시를 작성하였습니다. 

## 1. 스와이퍼 커스터마이징 방법

다음과 같은 방법으로 스와이퍼를 커스터마이징합니다. 
- 사용하려는 스와이퍼와 동일한 방식으로 동작하는 스와이퍼를 [SwiperJs Demos][swiper-js-demos-link]에서 찾습니다. 
- 선택한 스와이퍼를 생성할 수 있는 코드를 페이지에 삽입합니다. 
- 개발자 도구를 통해 커스터마이징하고 싶은 DOM 요소의 클래스를 찾습니다. 
- CSS 코드로 이를 오버라이드합니다.

<p align="center">
    <img src="/images/customizing-swiper-js-1.gif" width="100%" class="image__border">
</p>

## 2. Customizing Pagination

하단 페이지를 표시하는 불릿(bullet) 스타일을 변경하였습니다. 

### 2.1. HTML 코드

- 코드 상단의 `stylesheet` 링크와 script 코드는 `SwiperJs` 라이브러리를 사용하기 위해 추가하였습니다.
    - 실제 코드에선 `header` 영역에 이를 위치시킵니다.
- `.swiper-slide` 클래스를 지닌 DOM 블럭에 필요한 컨텐츠들을 담습니다.

```html
<link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css" />
<script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>

<div class="swiper" id="my-swiper">
    <div class="swiper-wrapper">
        <div class="swiper-slide">이미지1</div>
        <div class="swiper-slide">이미지2</div>
        <div class="swiper-slide">이미지3</div>
        <div class="swiper-slide">이미지4</div>
        <div class="swiper-slide">이미지5</div>
    </div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-pagination"></div>
</div>
```

### 2.2. CSS 코드

- 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
- 설명에 대한 내용은 가독성을 높이기 위해 주석에 작성하였습니다.

```css
#my-swiper {
    /* 스와이퍼 내 네비게이션 사이즈를 지정해주는 변수 오버라이딩 */
    --swiper-navigation-size: 1.6rem;
    position: relative;
    width: 50%;
    height: 20rem;
    border: 1px solid;
}

#my-swiper .swiper-slide {
    /* 슬라이드 내부 컨텐츠들을 중앙 정렬합니다. */
    display: flex;
    justify-content: center;
    align-items: center;
}

#my-swiper .swiper-pagination-bullet {
    /* 페이징 내부에 들어가는 숫자들의 폰트 사이즈를 지정합니다. */
    font-size: 1rem;
    line-height: 2rem;
    margin: 0;
    width: 10%;
    height: 100%;
    /* 동그라미 모양을 제거하기 위해 border-radidus 값을 변경합니다. */
    border-radius: 0;
    /* 왼쪽 border를 그립니다. */
    border-left: 1px solid #e4eaef;
    background: transparent;
    /* 투명도를 1로 지정하여 글씨가 선명하게 나오도록 만듭니다. */
    opacity: 1;
}

#my-swiper .swiper-pagination-bullet:last-child {
    /* 맨 마지막 페이징 숫자 오른쪽 border를 그립니다. */
    border-right: 1px solid #e4eaef;
}

#my-swiper .swiper-pagination-bullet-active {
    /* 활성화 된 페이지를 나타내는 숫자의 배경색과 글씨 색을 변경합니다. */
    color: #ffffff;
    background: #53c5be;
}

#my-swiper .swiper-horizontal > .swiper-pagination-bullets,
#my-swiper .swiper-pagination-bullets.swiper-pagination-horizontal,
#my-swiper .swiper-pagination-custom,
#my-swiper .swiper-pagination-fraction {
    /* 페이징 처리하는 영역을 맨 하단으로 이동시킵니다. */
    bottom: 0;
    border-top: 1px solid #e4eaef;
    background-color: #ffffff;
}

#my-swiper .swiper-button-next,
#my-swiper .swiper-button-prev {
    /* 네비게이션 처리를 위한 화살표를 아래로 이동시킵니다. */
    top: initial;
    bottom: 0.25rem;
    color: #000000;
    opacity: 1;
}

#my-swiper .swiper-button-prev,
#my-swiper .swiper-rtl .swiper-button-next {
    /* prev 화살표 위치를 조정합니다. */
    z-index: 15;
    left: 5%;
    right: auto;
}

#my-swiper .swiper-button-next,
#my-swiper .swiper-rtl .swiper-button-prev {
    /* next 화살표 위치를 조정합니다. */
    z-index: 15;
    left: auto;
    right: 5%;
}
```

### 2.3. JavaScript 코드

- 스와이퍼를 생성합니다.
- 페이징 영역을 변경할 수 있는 `renderBullet` 함수를 재정의합니다.

```javascript
new Swiper("#my-swiper", {
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
        renderBullet: function (index, className) {
            return '<span class="' + className + '">' + (index + 1) + "</span>";
        }
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    }
});
```

### 2.4. 결과

{% include codepen.html hash="RwQqveE" tab="result" title="Customizing Pagination Swiper" %}

## 3. Customizing Navigation

`SwiperJs` 라이브러리를 사용하면 스와이퍼 내부 컨텐츠들이 `overflow: hidden;` 속성으로 인해 잘리는 현상이 있습니다. 
어떤 스와이퍼들은 네비게이션 화살표가 경계 영역에 걸쳐서 그릴 필요가 있는데, 이를 해결하기 위한 코드를 예시 코드로 작성하였습니다. 

### 3.1. HTML 코드

- 코드 상단의 `stylesheet` 링크와 script 코드는 `SwiperJs` 라이브러리를 사용하기 위해 추가하였습니다.
    - 실제 코드에선 `header` 영역에 이를 위치시킵니다.
- `.swiper-slide` 클래스를 지닌 DOM 블럭에 필요한 컨텐츠들을 담습니다.
- 스와이퍼의 화살표 모양을 담당하는 `.swiper-button-prev`, `.swiper-button-next` 클래스를 스와이퍼 외부로 옮깁니다.
- 스와이퍼 슬라이드들과 네비게이션 화살표 DOM 요소들을 감쌀 수 있는 블럭을 만들고, `.swiper-wrap` 클래스로 지정합니다.

```html
<link rel="stylesheet" href="https://unpkg.com/swiper/swiper-bundle.min.css" />
<script src="https://unpkg.com/swiper/swiper-bundle.min.js"></script>

<div class="swiper-wrap">
    <div class="swiper" id="my-swiper">
        <div class="swiper-wrapper">
            <div class="swiper-slide">이미지1</div>
            <div class="swiper-slide">이미지2</div>
            <div class="swiper-slide">이미지3</div>
            <div class="swiper-slide">이미지4</div>
            <div class="swiper-slide">이미지5</div>
        </div>
        <div class="swiper-pagination"></div>
    </div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
</div>
```

### 3.2. CSS 코드

- 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
- 설명에 대한 내용은 가독성을 높이기 위해 주석에 작성하였습니다.

```css
.swiper-wrap {
    /* 스와이퍼 내 네비게이션 사이즈를 지정해주는 변수 오버라이딩 */
    --swiper-navigation-size: 1.6rem;
    /* 네비게이션 버튼 위치의 기준을 잡을 수 있도록 position: relative 속성을 추가합니다. */
    position: relative;
    width: 50%;
    border: 1px solid;
    margin: auto;
}

#my-swiper {
    /* 스와이퍼 크기를 지정합니다. */
    width: 100%;
    height: 20rem;
}

.swiper-wrap .swiper-slide {
    /* 슬라이드 내부 컨텐츠들을 중앙 정렬합니다. */
    display: flex;
    justify-content: center;
    align-items: center;
}

.swiper-wrap .swiper-horizontal > .swiper-pagination-bullets,
.swiper-wrap .swiper-pagination-bullets.swiper-pagination-horizontal,
.swiper-wrap .swiper-pagination-custom,
.swiper-wrap .swiper-pagination-fraction {
    /* 페이징 영역 내부 패딩 값입니다. */
    padding-top: 1rem;
    padding-bottom: 1rem;
    /* 페이징 영역을 표시하기 위한 배경 색상입니다. */
    background-color: rgba(0, 0, 0, 0.3);
    /* 최하단 중앙에 위치시킵니다. */
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
}

.swiper-wrap .swiper-button-next,
.swiper-wrap .swiper-button-prev {
    /* 3rem 크기의 원을 만듭니다. */
    width: 3rem;
    height: 3rem;
    border-radius: 1.5rem;
    /* 네비게이션 버튼을 만들기 위한 속성입니다. */
    color: #ffffff;
    background-color: #53c5be;
    opacity: 1;
}

.swiper-wrap .swiper-button-prev,
.swiper-wrap .swiper-rtl .swiper-button-next {
    /* prev 화살표 위치를 조정합니다. */
    z-index: 15;
    left: -1.5rem;
    right: auto;
}

.swiper-wrap .swiper-button-next,
.swiper-wrap .swiper-rtl .swiper-button-prev {
    /* next 화살표 위치를 조정합니다. */
    z-index: 15;
    left: auto;
    right: -1.5rem;
}
```

### 3.3. JavaScript 코드

```javascript
new Swiper("#my-swiper", {
    pagination: {
        el: ".swiper-pagination",
        clickable: true
    },
    navigation: {
        nextEl: ".swiper-wrap .swiper-button-next",
        prevEl: ".swiper-wrap .swiper-button-prev"
    }
});
```

### 3.4. 결과

{% include codepen.html hash="oNEQVER" tab="result" title="Customizing Navigation" %}

#### REFERENCE
- <https://swiperjs.com/>

[swiper-js-demos-link]: https://swiperjs.com/demos