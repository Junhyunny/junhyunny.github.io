---
title: "Carousel Effect"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-04-23T23:55:00
---

<br/>

## 0. 들어가면서

회사에서 풀스택 개발자를 지향하다보니 최근에 프론트 엔드와 관련된 공부 비중을 많이 늘리고 있습니다. 
외국은 퍼블리셔(publisher)라는 직업이 없고, 프론트 엔드 개발자가 모든 개발을 한다고 합니다. 
재직 중인 회사 또한 외국계 회사이다보니 자연스레 `HTML`, `CSS`까지 모두 커버(cover)하게 되었는데, 
앞으론 기록도 할 겸 프로젝트를 진행하면서 구현한 효과들을 블로그에 하나씩 정리해보려 합니다. 
이번 포스트에선 캐러셀(carousel) 효과를 정리하였습니다.

## 1. 텍스트 Fade In 효과

아래에서 위로 텍스트가 올라오는 효과입니다. 

### 1.1. HTML 코드

```html
<div class="items">
    <div class="item active">1</div>
    <div class="item">2</div>
    <div class="item">3</div>
    <div class="item">4</div>
    <div class="item">5</div>
</div>
```

### 1.2. CSS 코드

- 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
- 설명에 대한  내용은 가독성을 높이기 위해 주석에 작성하였습니다.

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

### 1.3. JavaScript 코드와 결과

- `item` 클래스를 가진 모든 엘리먼트들을 조회합니다.
- `setInterval` 함수를 이용해 1.2초 주기 별로 내부 콜백 함수를 호출합니다.
- 현재 인덱스 엘리먼트에서 `active` 클래스를 제거합니다.
- 인덱스를 증가시키지만, 모듈라 연산을 통해 인덱스가 배열을 넘어가지 않도록 합니다.
- 다음 인덱스 엘리먼트에 `active` 클래스를 추가합니다.

{% include codepen.html hash="JjMVgmN" tab="js,result" title="Carousel text fade in" %}

## 2. 이미지 슬라이드 효과

메인 페이지 배너 형태로 가장 많이 사용되는 효과입니다.

### 2.1. HTML 코드

```html
<div class="items">
    <div class="item red active">1</div>
    <div class="item green">2</div>
    <div class="item yellow">3</div>
    <div class="item blue">4</div>
    <div class="item orange">5</div>
</div>
```

### 2.2. CSS 코드

- 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
- 설명에 대한  내용은 가독성을 높이기 위해 주석에 작성하였습니다.

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

### 2.3. JavaScript 코드와 결과

- 현재 활성화 된 엘리먼트인 `currentElement`를 획득합니다.
- 이전 형제 엘리먼트인 `dispearedElement` 찾습니다. 
    - HTML 문서를 기준으로 현재 엘리먼트와 동일한 레벨에서 상단에 위치한 엘리먼트입니다.  
    - 효과를 기준으로 현재 엘리먼트가 등장하기 전에 사라진 엘리먼트입니다.
- 다음 형제 엘리먼트인 `appearedElemnt` 찾으며, 현재 엘리먼트를 기준으로 이번에 등장할 엘리먼트입니다.
    - HTML 문서를 기준으로 현재 엘리먼트와 동일한 레벨에서 하단에 위치한 엘리먼트입니다.  
    - 효과를 기준으로 현재 엘리먼트 다음에 등장할 엘리먼트입니다.
- 현재 활성화 된 엘리먼트에서 `active` 클래스를 제거하고, `inactive` 클래스를 추가합니다.
- 이전 형제 엘리먼트가 없는 경우 마지막 엘리먼트에서 `inactive` 클래스를 제거합니다. 
    - 이전 형제 엘리먼트가 없는 경우는 동일 레벨 엘리먼트 중에 처음 엘리먼트라는 의미입니다.
    - 처음 엘리먼트 이전에 등장한 엘리먼트는 동일 레벨 엘리먼트 중에 마지막 엘리먼트입니다.
- 다음 형제 엘리먼트가 없는 경우 처음 엘리먼트에 `active` 클래스를 추가합니다. 
    - 다음 형제 엘리먼트가 없는 경우는 동일 레벨 엘리먼트 중에 마지막 엘리먼트라는 의미입니다.
    - 마지막 엘리먼트 다음에 등장할 엘리먼트는 동일 레벨 엘리먼트 중에 첫 엘리먼트입니다.

{% include codepen.html hash="WNdBeEr" tab="js,result" title="Image Carousel Slide" %}

#### REFERENCE
- <https://developer.mozilla.org/en-US/docs/Web/API/Element/nextElementSibling>
- <https://developer.mozilla.org/en-US/docs/Web/API/Element/previousElementSibling>