---
title: "Slide In/Out Effect"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-04-27T23:55:00
---

<br/>

## 1. Slide In/Out 효과
 
컴포넌트가 아래에서 위 방향 슬라이드(slide)로 등장하고, 사라질 때 위에서 아래로 내려가는 효과입니다.

### 1.1. HTML 코드

```html
<div class="wrapper">
    <div class="container">
        <div class="container__content">
            <p>Container</p>
        </div>
        <button>slide</button>
    </div>
    <div class="slide">
        <div class="slide__close">
            <button>X</button>
        </div>
        <div class="slide__content">
            <p>slide</p>
        </div>
    </div>
</div>
```

### 1.2. CSS 코드

- 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
- 설명에 대한  내용은 가독성을 높이기 위해 주석에 작성하였습니다.


```css
.wrapper {
    /* 자신의 영역 바깥 쪽을 가려, 아래에서 등장하는 컴포넌트를 감춥니다. */
    overflow: hidden;
    /* 등장하는 컴포넌트의 위치를 잡을 수 있도록 기준 역할을 합니다. */
    position: relative;
}

.container {
    background: yellow;

    width: 120px;
    height: 200px;
    border: 1px solid black;

    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
}

.container__content {
    position: relative;
    height: 100%;
}

.container__content p {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.container button {
    width: 100%;
}

.slide {
    /* 부모 엘리먼트를 기준으로 절대 좌표를 결정합니다. */
    position: absolute;
    /* 화면 앞으로 컴포넌트를 위치시킵니다. */
    z-index: 1;
    /* 좌표는 맨 아래 위치시킵니다. */
    bottom: 0;

    width: 120px;
    height: 120px;
    border: 1px solid black;
    background: orange;

    /* 처음에 보이지 않으며, 영역을 차지하지 않습니다. */
    display: none;
}

.slide.on {
    /* 화면에 표시되면서 영역을 차지합니다. */
    display: block;
    /* slideUp 효과 애니메이션이 적용됩니다. */
    animation: slideUp 1s;
}

.slide.off {
    /* slideDown 효과 애니메이션이 적용됩니다. */
    animation: slideDown 1s;
}

.slide__close {
    z-index: 2;
    position: absolute;
    right: 10px;
    top: 10px;
}

.slide__content {
    position: relative;
    height: 100%;
}

.slide__content p {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

@keyframes slideUp {
    from {
        /* 하위 120px 에서 시작합니다. */
        transform: translateY(120px);
    }
    to {
        /* 원 위치로 이동합니다. */
        transform: translateY(0);
    }
}

@keyframes slideDown {
    from {
        /* 원 위치에서 시작합니다. */
        transform: translateY(0);
    }
    to {
        /* 화면에 보이지 않으면서 영역을 차지하지 않습니다. */
        display: none;
        /* 하위 120px로 이동합니다. */
        transform: translateY(120px);
    }
}
```

### 1.3. JavaScript 코드

- `openButton` 클릭 이벤트
    - `slide` 컴포넌트의 `on` 클래스를 추가합니다.
- `closeButton` 클릭 이벤트
    - `slide` 컴포넌트의 `off` 클래스를 추가합니다.
    - 타이머를 이용해 애니메이션이 끝나는 시점에 `slide` 컴포넌트의 `on`, `off` 클래스를 제거합니다.

```javascript
const slide = document.querySelector(".slide");
const openButton = document.querySelector(".container button");
const closeButton = document.querySelector(".slide__close");

openButton.addEventListener("click", () => {
    slide.classList.add("on");
});

closeButton.addEventListener("click", () => {
    slide.classList.add("off");
    setTimeout(() => {
        slide.classList.remove("on");
        slide.classList.remove("off");
    }, 950);
});
```

## 2. 결과

{% include codepen.html hash="bGaXeWE" tab="js,result" title="Slide In/Out Effect" %}
