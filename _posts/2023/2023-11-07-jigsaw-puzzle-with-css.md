---
title: "Jigsaw Puzzle with CSS"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2023-11-07T23:55:00
---

<br/>

## 0. 들어가면서

개발 중인 애플리케이션에 퍼즐 조각을 수집하는 기능을 추가했습니다. 퍼즐 조각을 만드는 스타일 작업을 어렵게 생각했지만, `.svg` 파일과 CSS `clip-path` 속성을 함께 사용했더니 생각보다 쉽게 구현했습니다. `clip-path`를 사용한 클피링(clipping)은 다른 파트에서 정의한 요소의 일부분을 제거하는 작업입니다. `.svg` 파일과 함께 사용하면 파일 영역을 제외한 부분을 제거합니다. 이번 포스트에선 `clip-path` 속성과 `.svg` 파일을 사용한 퍼즐 조각 스타일과 애니메이션 코드에 관련된 내용을 정리하였습니다.

## 1. HTML 

가독성을 위해 주석으로 설명을 추가하였습니다.

```html
<!-- 애니메이션 모달 화면 -->
<div id="modal">
  <!-- 각 퍼즐 조각 -->
  <div class="collected-piece">
    <div class="puzzle"></div>
  </div>
  <div class="collected-piece">
    <div class="puzzle"></div>
  </div>
  <div class="collected-piece">
    <div class="puzzle"></div>
  </div>
  <div class="collected-piece">
    <div class="puzzle"></div>
  </div>
</div>

<div class="container">
  <!-- 퍼즐 보드 -->
  <div class="item-box">
    <!-- 각 퍼즐 조각을 누르면 이벤트 동작 -->
    <div class="piece" onClick="scan(1)">
      <div class="puzzle"></div>
    </div>
    <div class="piece" onClick="scan(2)">
      <div class="puzzle"></div>
    </div>
    <div class="piece" onClick="scan(3)">
      <div class="puzzle"></div>
    </div>
    <div class="piece" onClick="scan(4)">
      <div class="puzzle"></div>
    </div>
  </div>
</div>

<!-- clip-path 속성으로 사용하는 퍼즐 모양 -->
<svg viewBox="0 0 1 1">
  <clipPath id="puzzle" clipPathUnits="objectBoundingBox">
    <path d="M0 0.7763157894736841H0.23684210526315788C0.3289473684210526 0.7763157894736841 0.35526315789473684 0.7236842105263157 0.2894736842105263 0.6578947368421053 0.22368421052631576 0.5921052631578947 0.3157894736842105 0.5526315789473684 0.39473684210526316 0.5526315789473684 0.47368421052631576 0.5526315789473684 0.5657894736842105 0.5921052631578947 0.5 0.6578947368421053 0.43421052631578944 0.7236842105263157 0.4605263157894737 0.7763157894736841 0.5526315789473684 0.7763157894736841H0.7763157894736842V0.5526315789473684C0.7763157894736842 0.4605263157894737 0.8289473684210525 0.4342105263157894 0.894736842105263 0.5 0.9605263157894737 0.5657894736842106 1 0.4736842105263157 1 0.39473684210526305 1 0.3157894736842106 0.9605263157894737 0.2236842105263157 0.894736842105263 0.2894736842105263 0.8289473684210525 0.3552631578947367 0.7763157894736842 0.32894736842105265 0.7763157894736842 0.23684210526315796V0H0V0.7763157894736841Z"></path>
  </clipPath>
</svg>
```

## 2. CSS

가독성을 위해 주석으로 설명을 추가하였습니다.

```scss
$ease-out-qubic: cubic-bezier(0.33, 1, 0.68, 1);

*,
*:before,
*:after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.container {
  margin: 20px;
  display: flex;
  justify-content: center;
}

// 각 퍼즐 조각의 위치 지정시 기준이 되기 위해 relative 포지션 
.item-box {
  border: 1px solid lightgrey;
  position: relative;
  width: 50vmin;
  height: 50vmin;
  cursor: pointer;
}

// absolute 포지션으로 절대 좌표 사용
.piece {
  position: absolute;
  width: 25vmin;
  height: 25vmin;

  &:nth-child(1) {
    // on 클래스가 추가되면 백그라운드 이미지 추가
    & .on.puzzle::before {
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }

  &:nth-child(2) {
    // 절대 좌표로 오른쪽 상단 위치
    // 같은 모양의 퍼즐 조각이므로 90도 회전 
    transform: translateX(100%) translateY(0) rotate(90deg);
    & .puzzle::before {
      // 퍼즐 조각을 90도 회전시켰으므로 내부 이미지는 -90도 회전
      // 백그라운드 이미지를 우측 상단부터 표시
      background-position: 100% 0%;
      transform: rotate(-90deg);
    }
    // on 클래스가 추가되면 백그라운드 이미지 추가
    & .on.puzzle::before {
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }

  &:nth-child(3) {
    // 절대 좌표로 오른쪽 하단 위치
    // 같은 모양의 퍼즐 조각이므로 180도 회전 
    transform: translateX(100%) translateY(100%) rotate(180deg);
    & .puzzle::before {
      // 퍼즐 조각을 180도 회전시켰으므로 내부 이미지는 -180도 회전
      // 백그라운드 이미지를 우측 하단부터 표시
      background-position: 100% 100%;
      transform: rotate(-180deg);
    }
    // on 클래스가 추가되면 백그라운드 이미지 추가
    & .on.puzzle::before {
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }

  &:nth-child(4) {
    // 절대 좌표로 오른쪽 하단 위치
    // 같은 모양의 퍼즐 조각이므로 270도 회전 
    transform: translateX(0) translateY(100%) rotate(270deg);
    & .puzzle::before {
      // 퍼즐 조각을 270도 회전시켰으므로 내부 이미지는 -270도 회전
      // 백그라운드 이미지를 좌측 하단부터 표시
      background-position: 0% 100%;
      transform: rotate(-270deg);
    }
    // on 클래스가 추가되면 백그라운드 이미지 추가
    & .on.puzzle::before {
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }
}

// 퍼즐 공통 속성
.puzzle {
  position: absolute;
  width: 25vmin;
  height: 25vmin;
  // clip-path 영역으로 사용하는 svg 파일 지정
  // html 파일에 정의한 clipPath 엘리먼트의 아이디를 사용
  // 리소스에 위치한 svg 파일을 사용하는 경우 /path/file.svg#id 같은 방식으로 사용
  clip-path: url(#puzzle);
  transform: translateX(22.368%) translateY(22.368%);

  &:before {
    content: "";
    position: absolute;
    width: 25vmin;
    height: 25vmin;
    background-size: 155.264%;
    background-color: black;
  }
}

// 애니메이션이 동작하는 화면 영역
#modal {
  z-index: -1;
  background-color: lightgrey;
  position: fixed;
  visibility: hidden;
  opacity: 0.8;

  top: 0;
  left: 0;

  width: 100vw;
  height: 100vh;

  &.on {
    z-index: 10;
    visibility: visible;
  }
}

// 각 조각 별 애니메이션 효과 정의
.collected-piece {
  position: absolute;

  left: 50%;
  transform: translateX(-50%);

  width: 25vmin;
  height: 25vmin;

  &:nth-child(1) {
    display: none;
    &.on {
      display: block;
      animation: firstRotate 1.5s $ease-out-qubic forwards,
        moveUp 1.5s $ease-out-qubic forwards;
    }
    & .puzzle::before {
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }

  &:nth-child(2) {
    display: none;
    &.on {
      display: block;
      animation: secondRotate 1.5s $ease-out-qubic forwards,
        moveUp 1.5s $ease-out-qubic forwards;
    }
    & .puzzle::before {
      background-position: 100% 0%;
      transform: rotate(-90deg);
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }
  &:nth-child(3) {
    display: none;
    &.on {
      display: block;
      animation: thirdRotate 1.5s $ease-out-qubic forwards,
        moveUp 1.5s $ease-out-qubic forwards;
    }
    & .puzzle::before {
      background-position: 100% 100%;
      transform: rotate(-180deg);
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }

  &:nth-child(4) {
    display: none;
    &.on {
      display: block;
      animation: fourthRotate 1.5s $ease-out-qubic forwards,
        moveUp 1.5s $ease-out-qubic forwards;
    }
    & .puzzle::before {
      background-position: 0% 100%;
      transform: rotate(-270deg);
      background-image: url("https://junhyunny.github.io/images/jigsaw-puzzle-with-css-01.png");
    }
  }
}

// 각 조각별 회전 애니메이션
@keyframes firstRotate {
  from {
    transform: translateX(-100%) rotate(180deg);
  }
  to {
    transform: translateX(-100%);
  }
}

@keyframes secondRotate {
  from {
    transform: rotate(270deg);
  }
  to {
    transform: rotate(90deg);
  }
}

@keyframes thirdRotate {
  from {
    transform: translateY(100%) rotate(0);
  }
  to {
    transform: translateY(100%) rotate(180deg);
  }
}

@keyframes fourthRotate {
  from {
    transform: translateX(-100%) translateY(100%) rotate(90deg);
  }
  to {
    transform: translateX(-100%) translateY(100%) rotate(270deg);
  }
}

// 등장 애니메이션
@keyframes moveUp {
  from {
    top: 100%;
  }
  to {
    top: 20px;
  }
}
```

## 3. JavaScript

가독성을 위해 주석으로 설명을 추가하였습니다.

```js
// 특정 조각 스캔 이벤트
function scan(number) {
  const modal = document.getElementById("modal");
  const collectedPiece = document.querySelector(
    `.collected-piece:nth-child(${number})`
  );
  // 스캔 대상 엘리먼트 조회
  const targetElement = document.querySelector(
    `.piece:nth-child(${number}) .puzzle`
  );

  // 애니메이션 동작 클래스 추가
  modal.classList.add("on");
  collectedPiece.classList.add("on");

  // 애니메이션 동작 2초 후 작업
  setTimeout(() => {
    // 애니메이션 클래스 제거 
    modal.classList.remove("on");
    collectedPiece.classList.remove("on");
    // 스캔 완료 클래스 추가
    targetElement.classList.add("on");
  }, 2000);
}
```

## 4. Result

코드펜(code)을 통해 테스트 가능합니다.

{% include codepen.html hash="bGzwbyW" tab="result" title="Puzzle" %}

#### TEST CODE REPOSITORY

- <https://codepen.io/junhyunny/pen/bGzwbyW>

#### REFERENCE

- <https://www.bypeople.com/puzzle-grid-gallery-css/>
- <https://a11y.gitbook.io/graphics-aria/svg-graphics/svg-clippath>
- <https://stackoverflow.com/questions/43741825/wordpress-css-and-inline-svg>