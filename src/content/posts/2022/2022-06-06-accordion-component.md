---
title: "아코디언 뷰"
publishedAt: "2022-06-06"
updatedAt: "2026-11-12T16:18:19+09:00"
canonicalPath: "/html/css/javascript/accordion-component/"
categories:
  - "html"
  - "css"
  - "javascript"
summary: "많은 내용을 접거나 펴서 볼 수 있는 아코디언 뷰를 HTML, CSS, JavaScript로 구현했다."
---

## 1. Accordion View

내용이 많을 때 내부 콘텐츠를 접거나 펴서 볼 수 있는 아코디언(accordion) 뷰를 구현했다. 먼저 HTML 코드를 살펴보자. `.contract__header` 클래스를 가진 블록은 헤더 부분이며, 이를 눌러 내용이 담긴 블록을 열고 닫을 수 있다. `.contract__content` 클래스를 가진 블록은 콘텐츠 부분이며, 이 블록이 열리고 닫힌다.

```html
<div class="contract__header">
    <p class="contract__header--title">이용 약관</p>
    <div class="contract__header--icon"></div>
</div>
<div class="contract__content">
    <p class="contract__content--title">Lorem ipsum dolor sit</p>
    <p class="contract__content--detail">
        amet consectetur adipisicing elit.
        Magnam facilis maxime minima expedita, error perferendis amet facere veritatis?
        Quibusdam architecto laudantium incidunt, perspiciatis quaerat consequatur provident similique unde aut quisquam!
    </p>
    <br/>
    <p class="contract__content--title">Lorem ipsum dolor sit</p>
    <p class="contract__content--detail">
        amet consectetur adipisicing elit.
        Rerum id atque nesciunt vero, debitis culpa dolor.
        Perspiciatis illo recusandae, facilis reiciendis exercitationem, incidunt ipsam officiis, aut non maiores quis ullam.
    </p>
</div>

<div class="contract__header">
    <p class="contract__header--title">주의 사항</p>
    <div class="contract__header--icon"></div>
</div>
<div class="contract__content">
    <p class="contract__content--title">Lorem ipsum dolor sit</p>
    <p class="contract__content--detail">
        amet consectetur adipisicing elit.
        Magnam facilis maxime minima expedita, error perferendis amet facere veritatis?
        Quibusdam architecto laudantium incidunt, perspiciatis quaerat consequatur provident similique unde aut quisquam!
    </p>
    <br/>
    <p class="contract__content--title">Lorem ipsum dolor sit</p>
    <p class="contract__content--detail">
        amet consectetur adipisicing elit.
        Rerum id atque nesciunt vero, debitis culpa dolor.
        Perspiciatis illo recusandae, facilis reiciendis exercitationem, incidunt ipsam officiis, aut non maiores quis ullam.
    </p>
</div>
```

CSS 코드는 다음과 같다. 영역 표시나 크기를 설정한 속성의 설명은 제외했고, 가독성을 높이기 위해 설명은 주석으로 작성했다.

```css
body {
    border: 1px solid #555555;
    width: 75%;
    padding: 5px;
}

p {
    padding: 0;
    margin: 0;
}

.contract__header {
    position: relative;
    border: 1px solid #555555;
    width: 100%;
    height: 3rem;
}

.contract__header--title {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.contract__header--icon {
    position: absolute;
    top: 50%;
    right: 3rem;
    transform: translateY(-50%);
}

.contract__header--icon:before {
    /* 헤더 부분 오른쪽에 표시되는 화살표 */
    content: ">";
    display: inline-block;
    font-size: 1.5rem;
    font-weight: 700;
    transform: rotate(-90deg);
    /* 회전 애니메이션 처리 */
    transition: transform 0.5s;
}

.contract__header.on .contract__header--icon:before {
    /* 헤더 부분이 선택된 경우 오른쪽 아이콘이 회전됩니다. */
    transform: rotate(90deg);
}

.contract__content {
    /* 최대 높이를 0으로 지정합니다. */
    max-height: 0;
    /* 영역을 벗어나는 내용은 보이지 않도록 hidden 처리합니다. */
    overflow: hidden;
    /* max-height 변경을 애니메이션 처리합니다. */
    transition: max-height 0.5s ease-out;
}

.contract__content--title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #3e7ec7;
}

.contract__content--detail {
    font-size: 1rem;
    font-weight: 400;
    color: #000000;
}
```

JavaScript 코드는 `.contract__header` 클래스를 가진 DOM 객체를 찾아 클릭 이벤트를 지정한다. `openAccordion(event)` 함수는 현재 선택된 DOM 객체가 `.on` 클래스를 가졌는지에 따라 `.on` 클래스를 제거하거나 추가한다. 또 바로 옆 형제 DOM 객체에 `maxHeight` 값이 있으면 제거하고, 없으면 `scrollHeight` 값으로 지정한다.

```javascript
const accordionHeaders = document.querySelectorAll(".contract__header");
accordionHeaders.forEach((accordionHeader) => {
    accordionHeader.addEventListener("click", (e) => openAccordion(e));
});

function openAccordion(event) {
    const target = event.currentTarget;
    if (target.classList.contains("on")) {
        target.classList.remove("on");
    } else {
        target.classList.add("on");
    }
    const sibling = target.nextElementSibling;
    if (sibling.style.maxHeight) {
        sibling.style.maxHeight = null;
    } else {
        sibling.style.maxHeight = sibling.scrollHeight + "px";
    }
}
```

## 2. 결과

<iframe class="codepen" src="https://codepen.io/Junhyunny/embed/XWZBPRN?default-tab=result" title="Accordion View" loading="lazy" allowfullscreen></iframe>
<p><a href="https://codepen.io/Junhyunny/pen/XWZBPRN/">CodePen에서 예제 열기</a></p>

#### REFERENCE

- <https://www.w3schools.com/howto/howto_js_accordion.asp>
