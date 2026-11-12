---
title: "캐러셀(Carousel) 효과 구현"
publishedAt: "2022-04-23"
updatedAt: "2026-11-12T16:19:45+09:00"
canonicalPath: "/html/css/javascript/carousel-effect/"
categories:
  - "html"
  - "css"
  - "javascript"
summary: "프로젝트에서 구현한 캐러셀 효과 중 텍스트 페이드 인 효과와 이미지 슬라이드 효과를 HTML, CSS, JavaScript 코드로 정리했다."
---

## 0. 들어가면서

회사에서 풀스택 개발자를 지향하다 보니 최근 프론트엔드 공부 비중을 많이 늘리고 있다. 외국에는 퍼블리셔(publisher)라는 직업이 없고, 프론트엔드 개발자가 모든 개발을 한다고 한다. 재직 중인 회사도 외국계 회사이다 보니 자연스레 `HTML`, `CSS`까지 모두 다루게(cover) 되었다.

앞으로는 기록도 할 겸 프로젝트를 진행하면서 구현한 효과를 블로그에 하나씩 정리하려 한다. 이번 글에선 캐러셀(carousel) 효과를 정리했다.

## 1. 텍스트 Fade In 효과

아래에서 위로 텍스트가 올라오는 효과다. HTML 코드는 다음과 같다.

```html
<div class="items">
    <div class="item active">1</div>
    <div class="item">2</div>
    <div class="item">3</div>
    <div class="item">4</div>
    <div class="item">5</div>
</div>
```

CSS 코드는 다음과 같다. 영역 표시나 크기를 설정한 속성의 설명은 제외했고, 가독성을 높이기 위해 설명은 주석으로 작성했다.

```css
.items {
    width: 100px;
    height: 50px;
    border: 1px solid grey;
    /* 자신의 영역 밖에 위치한 엘리먼트(element)가 보이지 않도록 감춘다. */
    overflow: hidden;
}

.item {
    /* 기본적으로 아이템 블록들을 보이지 않고, 영역을 차지하지 않도록 합니다. */
    display: none;
    width: 100%;
    height: 100%;
    font-size: 30px;
}

.active {
    display: flex;
    justify-content: center;
    align-items: center;
    /* `appear` 애니메이션을 1.2초에 걸쳐 실행합니다. */
    animation: appear 1.2s;
}

@keyframes appear {
    /* 시작 */
    from {
        /* 투명한 상태에서 시작합니다. */
        opacity: 0;
        /* 현재 위치보다 20px 아래에서 시작합니다. */
        transform: translateY(20px);
    }
    /* 종료 */
    to {
        /* 투명하지 않은 정상적인 상태로 종료됩니다. */
        opacity: 1;
        /* 현재 위치까지 이동 후 종료합니다. */
        transform: translateY(0px);
    }
}
```

JavaScript 코드와 결과는 아래 CodePen에서 볼 수 있다. JavaScript 코드는 다음 순서로 동작한다.

1. `item` 클래스를 가진 모든 엘리먼트를 조회한다.
2. `setInterval` 함수를 이용해 1.2초마다 내부 콜백 함수를 호출한다.
3. 현재 인덱스 엘리먼트에서 `active` 클래스를 제거한다.
4. 인덱스를 증가시키되, 모듈러 연산으로 인덱스가 배열 범위를 넘어가지 않도록 한다.
5. 다음 인덱스 엘리먼트에 `active` 클래스를 추가한다.

<iframe class="codepen" src="https://codepen.io/Junhyunny/embed/JjMVgmN?default-tab=js,result" title="Carousel text fade in" loading="lazy" allowfullscreen></iframe>
<p><a href="https://codepen.io/Junhyunny/pen/JjMVgmN/">CodePen에서 예제 열기</a></p>

## 2. 이미지 슬라이드 효과

메인 페이지 배너 형태로 가장 많이 사용되는 효과다. HTML 코드는 다음과 같다.

```html
<div class="items">
    <div class="item red active">1</div>
    <div class="item green">2</div>
    <div class="item yellow">3</div>
    <div class="item blue">4</div>
    <div class="item orange">5</div>
</div>
```

CSS 코드는 다음과 같다. 마찬가지로 영역 표시나 크기를 설정한 속성의 설명은 제외했고, 설명은 주석으로 작성했다.

```css
.items {
    /* 자식 엘리먼트가 절대 위치를 가질 수 있도록 기준을 잡아줍니다. */
    position: relative;
    width: 100px;
    height: 100px;
    border: 1px solid grey;
    /* 자신의 영역 밖은 보이지 않도록 가립니다. */
    overflow: hidden;
}

.item {
    /* 블록의 위치가 절대 값을 가지도록 설정합니다. */
    position: absolute;
    /* 기본적으로 아이템 블록들은 보이지 않고, 영역을 차지하지 않도록 합니다. */
    display: none;

    width: 100px;
    height: 100px;
    font-size: 20px;
}

.active {
    display: flex;
    justify-content: center;
    align-items: center;
    /* 1.2초 동안 `appear` 애니메이션을 수행합니다. */
    animation: appear 1.2s;
}

.inactive {
    display: flex;
    justify-content: center;
    align-items: center;
    /* 1.2초 동안 `disappear` 애니메이션을 수행합니다. */
    animation: disappear 1.2s;
}

.red {
    background-color: red;
}

.green {
    background-color: green;
}

.yellow {
    background-color: yellow;
}

.blue {
    background-color: blue;
}

.orange {
    background-color: orange;
}

@keyframes appear {
    /* 시작 */
    from {
        /* 현재 위치보다 100px 오른쪽에서 시작합니다. */
        transform: translateX(100px);
    }
    /* 종료 */
    to {
        /* 현재 위치까지 이동 후 종료합니다. */
        transform: translateX(0);
    }
}

@keyframes disappear {
    /* 시작 */
    from {
        /* 현재 위치에서 시작합니다. */
        transform: translateX(0);
    }
    /* 종료 */
    to {
        /* 현재 위치보다 100px 왼쪽으로 이동 후 종료합니다. */
        transform: translateX(-100px);
    }
}
```

JavaScript 코드와 결과는 아래 CodePen에서 볼 수 있다. JavaScript 코드는 다음과 같이 동작한다.

- 현재 활성화된 엘리먼트인 `currentElement`를 얻는다.
- 이전 형제 엘리먼트인 `dispearedElement`를 찾는다.
  - HTML 문서를 기준으로 현재 엘리먼트와 같은 레벨에서 위에 있는 엘리먼트다.
  - 효과를 기준으로 현재 엘리먼트가 등장하기 전에 사라진 엘리먼트다.
- 다음 형제 엘리먼트인 `appearedElement`를 찾는다.
  - HTML 문서를 기준으로 현재 엘리먼트와 같은 레벨에서 아래에 있는 엘리먼트다.
  - 효과를 기준으로 현재 엘리먼트 다음에 등장할 엘리먼트다.
- 현재 활성화된 엘리먼트에서 `active` 클래스를 제거하고, `inactive` 클래스를 추가한다.
- 이전 형제 엘리먼트가 없는 경우 마지막 엘리먼트에서 `inactive` 클래스를 제거한다.
  - 이전 형제 엘리먼트가 없다는 것은 같은 레벨 엘리먼트 중 첫 엘리먼트라는 의미다.
  - 첫 엘리먼트 이전에 등장한 엘리먼트는 같은 레벨 엘리먼트 중 마지막 엘리먼트다.
- 다음 형제 엘리먼트가 없는 경우 처음 엘리먼트에 `active` 클래스를 추가한다.
  - 다음 형제 엘리먼트가 없다는 것은 같은 레벨 엘리먼트 중 마지막 엘리먼트라는 의미다.
  - 마지막 엘리먼트 다음에 등장할 엘리먼트는 같은 레벨 엘리먼트 중 첫 엘리먼트다.

<iframe class="codepen" src="https://codepen.io/Junhyunny/embed/WNdBeEr?default-tab=js,result" title="Image Carousel Slide" loading="lazy" allowfullscreen></iframe>
<p><a href="https://codepen.io/Junhyunny/pen/WNdBeEr/">CodePen에서 예제 열기</a></p>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/API/Element/nextElementSibling>
- <https://developer.mozilla.org/en-US/docs/Web/API/Element/previousElementSibling>
