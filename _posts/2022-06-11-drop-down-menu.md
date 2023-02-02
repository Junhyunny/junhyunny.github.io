---
title: "Drop Down Menu"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-06-11T23:55:00
---

<br/>

## 1. Drop Down Menu

화면 상단 네비게이션으로 자주 사용되는 방법입니다. 
상단 메뉴 영역에 마우스가 호버(hover)되면 아래로 하위 메뉴들이 나타납니다.

### 1.1. HTML 코드

- `.menus` 클래스를 지닌 블럭은 메뉴 영역입니다.
- `.sub-menus` 클래스를 지닌 블럭은 하위 메뉴 영역입니다.

```html
<div class="wrap">
    <div class="menus">
        <li class="menus__item"><a href="#">menu1</a></li>
        <li class="menus__item"><a href="#">menu2</a></li>
        <li class="menus__item"><a href="#">menu3</a></li>
        <li class="menus__item"><a href="#">menu4</a></li>
    </div>
    <div class="sub-menus">
        <ul class="sub-menus__items">
            <li class="sub-menus__item"><a href="#">sub menu 1-1</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 1-2</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 1-3</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 1-4</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 1-5</a></li>
        </ul>
        <ul class="sub-menus__items">
            <li class="sub-menus__item"><a href="#">sub menu 2-1</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 2-2</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 2-3</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 2-4</a></li>
        </ul>
        <ul class="sub-menus__items">
            <li class="sub-menus__item"><a href="#">sub menu 3-1</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 3-2</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 3-3</a></li>
        </ul>
        <ul class="sub-menus__items">
            <li class="sub-menus__item"><a href="#">sub menu 4-1</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 4-2</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 4-3</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 4-4</a></li>
            <li class="sub-menus__item"><a href="#">sub menu 4-4</a></li>
        </ul>
    </div>
    <div class="content">
        <p>content</p>
    </div>
</div>
```

### 1.2. CSS 코드

- 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
- 설명에 대한 내용은 가독성을 높이기 위해 주석에 작성하였습니다.

```css
a {
    color: #000000;
    text-decoration: none;
}

ul,
li {
    margin: 0;
    padding: 0;
    list-style: none;
}

.wrap {
    position: relative;
    width: 100%;
    border: 1px solid;
}

.menus {
    padding-right: 3rem;
    height: 2rem;
    background-color: rgba(0, 0, 0, 0.5);

    /* 메뉴를 오른쪽으로 정렬합니다. */
    display: flex;
    justify-content: right;
    align-items: center;
    gap: 3rem;
}

.menus .menus__item {
    /* 각 메뉴 별 width를 지정합니다. */
    width: 3rem;
}

.menus a {
    color: white;
    font-size: 1rem;
}

.menus a:hover {
    color: aqua;
}

.sub-menus {
    width: 100%;

    /* 컨텐츠 위에 하위 메뉴가 오버레이 될 수 있도록 absolute 값을 지정합니다. */
    position: absolute;
    /* 메뉴의 높이만큼 하위 메뉴 위치를 조정합니다. */
    top: 2rem;
    z-index: 1;
    background-color: rgba(0, 0, 0, 0.3);

    /* 최초 화면에는 보이지 않도록 none 처리합니다. */
    display: none;
    justify-content: right;
    /* 메뉴와 동일한 정렬 방법과 갭(gap)을 지정합니다. */
    gap: 3rem;
}

.sub-menus .sub-menus__items {
    /* 메뉴와 동일한 width 값을 갖도록 지정합니다. */
    width: 3rem;
    /* 하위 메뉴 길이가 긴 경우에도 하단으로 내려가지 않도록 nowrap 값을 지정합니다. */
    white-space: nowrap;
}

.sub-menus .sub-menus__items:last-child {
    padding-right: 3rem;
}

.sub-menus .sub-menus__items .sub-menus__item {
    margin-top: 0.5rem;
}

/* sub-menus 클래스에 on 클래스가 추가되거나, hover 상태인 경우에 flex 블럭을 유지합니다. */
.sub-menus.on,
.sub-menus:hover {
    display: flex;
}

.sub-menus a {
    color: white;
    font-size: 0.8rem;
}

.sub-menus a:hover {
    color: blue;
}

.content {
    width: 100%;
    height: 20rem;
    background-color: #ccaacc;
}

.content > p {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    color: white;
    font-size: 1.5rem;
    text-align: center;
}
```

### 1.3. JavaScript 코드

- `.menus__item` 클래스를 지닌 DOM 객체들을 찾아서 `mouseover`, `mouseout` 이벤트를 지정합니다.
- `mouseover` 이벤트
    - `.sub-menus` 클래스를 지닌 블럭에 `.on` 클래스를 추가합니다. 
- `mouseout` 이벤트
    - `.sub-menus` 클래스를 지닌 블럭에 `.on` 클래스를 제거합니다.

```javascript
const menusItems = document.querySelectorAll(".menus__item");
menusItems.forEach((menu) => {
    menu.addEventListener("mouseover", () => {
        const subMenus = document.querySelector(".sub-menus");
        subMenus.classList.add("on");
    });
    menu.addEventListener("mouseout", () => {
        const subMenus = document.querySelector(".sub-menus");
        subMenus.classList.remove("on");
    });
});
```

## 2. 결과

{% include codepen.html hash="ZErmmgq" tab="result" title="Drop Down Menu" %}