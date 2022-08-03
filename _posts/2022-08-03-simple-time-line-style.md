---
title: "Simple Timeline Style"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-08-03T23:55:00
---

<br>

## 1. Simple Timeline Style

개인이나 회사 이력을 간단하게 표현할 수 있는 타임라인(timeline) 스타일을 구현하였습니다. 

### 1.1. HTML 코드

```html
<ul class="history-items">
    <li>
        <div class="history-item">
            <p class="history-item__year">2022</p>
            <div class="history-item__detail">
                <p class="history-item__date">08.03</p>
                <p class="history-item__content">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Voluptatem, earum! Eum, cupiditate iste quo saepe odio magnam praesentium quis qui possimus laborum, totam dolor hic consequuntur facere magni natus eius?</p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2021</p>
            <div class="history-item__detail">
                <p class="history-item__date">06.11</p>
                <p class="history-item__content">Lorem ipsum dolor sit amet consectetur adipisicing elit. Incidunt maxime dignissimos quidem sapiente nostrum mollitia voluptatem adipisci consequuntur perferendis nam libero, aspernatur asperiores inventore. Vitae non mollitia inventore atque doloremque.</p>
            </div>
            <div class="history-item__detail">
                <p class="history-item__date">03.05</p>
                <p class="history-item__content">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quasi quidem totam dolor recusandae amet. Dicta labore deleniti nihil, non inventore, quod reprehenderit esse accusantium, eius tempore qui voluptate corrupti blanditiis?</p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2017</p>
            <div class="history-item__detail">
                <p class="history-item__date">01.20</p>
                <p class="history-item__content">Lorem ipsum dolor sit amet consectetur adipisicing elit. Quidem harum eos id facilis labore non voluptatem rerum explicabo iusto, nisi et quaerat quos officiis, sit possimus porro, distinctio tenetur consectetur.</p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2015</p>
            <div class="history-item__detail">
                <p class="history-item__date">03.01</p>
                <p class="history-item__content">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Suscipit fugit corrupti cum hic delectus! Repellat enim, beatae veritatis quisquam sapiente minus perspiciatis, voluptatum illum, ratione modi dignissimos labore quos ea.</p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2010</p>
            <div class="history-item__detail">
                <p class="history-item__date">07.12</p>
                <p class="history-item__content">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Eveniet voluptatibus vero repudiandae quasi, expedita sit quidem assumenda, cum corrupti distinctio harum culpa optio commodi amet nostrum voluptates, ipsa placeat maxime.</p>
            </div>
        </div>
    </li>
</ul>
```

### 1.2. CSS 코드

* 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
* 설명에 대한 내용은 가독성을 높이기 위해 주석에 작성하였습니다.

```css
@import url("https://hangeul.pstatic.net/hangeul_static/css/nanum-square.css");

* {
    font-family: "NanumSquare";
    letter-spacing: 0;
    margin: 0;
    padding: 0;
}

.history-items {
    margin-top: 20px;
}

.history-items > li {
    position: relative;

    width: 5px;
    background: #8a50af;

    list-style-type: none;
    padding: 0;
    margin: 0 auto;
}

.history-items > li:last-child {
    background: #ffffff;
}

.history-items > li::before {
    content: "";
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #8a50af;

    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
}

.history-items > li::after {
    content: "";
    width: 7.5px;
    height: 7.5px;
    border-radius: 50%;
    background: #ffffff;

    position: absolute;
    top: 0;
    left: 50%;
    transform: translate(-50%, 50%);
}

.history-items > li:nth-child(odd) .history-item {
    top: -5px;
    left: 35px;
}

.history-items > li:nth-child(even) .history-item {
    top: -5px;
    left: -455px;
}

.history-items > li:nth-child(even) {
    text-align: right;
}

.history-item {
    position: relative;
    width: 400px;
    border: 1px solid #a1a1a1;
    border-radius: 10px;
    padding: 10px;
}

.history-item__year {
    font-family: "NanumSquareExtraBold";
    font-size: 20px;
}

.history-item__detail {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.history-item__date {
    font-family: "NanumSquareBold";
    font-size: 16px;
}
```

## 2. 결과

{% include codepen.html hash="yLKKYvj" tab="result" title="Simple Timeline Style" %}