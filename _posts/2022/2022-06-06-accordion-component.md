---
title: "Accordion View"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-06-06T23:55:00
---

<br/>

## 1. Accordion View

내용이 많을 경우 내부 컨텐츠를 접거나 펴서 볼 수 있는 아코디언(accordion) 뷰를 구현하였습니다.

### 1.1. HTML 코드

- `.contract__header` 클래스를 지닌 블럭은 헤더 부분이며 이를 눌러 내용이 담긴 블럭을 열었다 닫을 수 있습니다.
- `.contract__content` 클래스를 지닌 블럭은 컨텐츠 부분이며 해당 블럭이 열리고, 닫힙니다.

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

### 1.2. CSS 코드

- 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
- 설명에 대한 내용은 가독성을 높이기 위해 주석에 작성하였습니다.

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

### 1.3. JavaScript 코드

- `.contract__header` 클래스를 지닌 DOM 객체들을 찾아서 클릭 이벤트를 지정합니다.
- `openAccordion(event)` 함수
    - 현재 선택된 DOM 객체가 `.on` 클래스를 지녔는지 여부에 따라 `.on` 클래스를 제거하거나 추가합니다.
    - 바로 옆 형제 DOM 객체의 `maxHeight` 값이 존재하지는 여부에 따라 제거하거나 `scrollHeight` 값으로 대체합니다.

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

{% include codepen.html hash="XWZBPRN" tab="result" title="Accordion View" %}

#### REFERENCE
- <https://www.w3schools.com/howto/howto_js_accordion.asp>