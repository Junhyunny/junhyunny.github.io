---
title: "슬라이드 인/아웃 효과(Slide In/Out Effect)"
publishedAt: "2022-04-27"
updatedAt: "2026-11-12T16:19:45+09:00"
canonicalPath: "/html/css/javascript/slide-in-out-effect/"
categories:
  - "html"
  - "css"
  - "javascript"
summary: "컴포넌트가 아래에서 위로 등장하고 위에서 아래로 사라지는 슬라이드 인/아웃 효과를 HTML, CSS, JavaScript로 구현했다."
---

## 1. Slide In/Out 효과

컴포넌트가 아래에서 위로 슬라이드(slide)하며 등장하고, 사라질 때는 위에서 아래로 내려가는 효과다. HTML 코드는 다음과 같다.

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

CSS 코드는 다음과 같다. 영역 표시나 크기를 설정한 속성의 설명은 제외했고, 가독성을 높이기 위해 설명은 주석으로 작성했다.

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

JavaScript 코드는 다음과 같다. `openButton`을 클릭하면 `slide` 컴포넌트에 `on` 클래스를 추가한다. `closeButton`을 클릭하면 `slide` 컴포넌트에 `off` 클래스를 추가하고, 타이머를 이용해 애니메이션이 끝나는 시점에 `slide` 컴포넌트의 `on`, `off` 클래스를 제거한다.

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

결과는 다음과 같다.

<iframe class="codepen" src="https://codepen.io/Junhyunny/embed/bGaXeWE?default-tab=js,result" title="Slide In/Out Effect" loading="lazy" allowfullscreen></iframe>
<p><a href="https://codepen.io/Junhyunny/pen/bGaXeWE/">CodePen에서 예제 열기</a></p>
