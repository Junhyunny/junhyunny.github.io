---
title: "Simple Timeline Style"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-08-03T23:55:00
---

<br/>

## 1. Simple Timeline Style

개인이나 회사 이력을 간단하게 표현할 수 있는 타임라인(timeline) 스타일을 구현하였습니다. 

### 1.1. HTML 코드

* `history-items` 클래스 하위에 `li` 요소를 이용하여 타임라인 선을 표현합니다.
* `history-items` 클래스 하위에 `history-item` 클래스들을 좌, 우에 위치시켜 간단한 타임라인 카드를 구성합니다.

```html
<ul class="history-items">
    <li>
        <div class="history-item">
            <p class="history-item__year">2022</p>
            <div class="history-item__detail">
                <p class="history-item__date">08.03</p>
                <p class="history-item__content">
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit. 
                    Voluptatem, earum!
                    Eum, cupiditate iste quo saepe odio magnam praesentium quis qui possimus laborum, totam dolor hic consequuntur facere magni natus eius?
                </p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2021</p>
            <div class="history-item__detail">
                <p class="history-item__date">06.11</p>
                <p class="history-item__content">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Incidunt maxime dignissimos quidem sapiente nostrum mollitia voluptatem adipisci consequuntur perferendis nam libero, aspernatur asperiores inventore.
                    Vitae non mollitia inventore atque doloremque.
                </p>
            </div>
            <div class="history-item__detail">
                <p class="history-item__date">03.05</p>
                <p class="history-item__content">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Quasi quidem totam dolor recusandae amet. Dicta labore deleniti nihil, non inventore, quod reprehenderit esse accusantium, eius tempore qui voluptate corrupti blanditiis?
                </p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2017</p>
            <div class="history-item__detail">
                <p class="history-item__date">01.20</p>
                <p class="history-item__content">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Quidem harum eos id facilis labore non voluptatem rerum explicabo iusto, nisi et quaerat quos officiis, sit possimus porro, distinctio tenetur consectetur.
                </p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2015</p>
            <div class="history-item__detail">
                <p class="history-item__date">03.01</p>
                <p class="history-item__content">
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit.
                    Suscipit fugit corrupti cum hic delectus! Repellat enim, beatae veritatis quisquam sapiente minus perspiciatis, voluptatum illum, ratione modi dignissimos labore quos ea.
                </p>
            </div>
        </div>
    </li>
    <li>
        <div class="history-item">
            <p class="history-item__year">2010</p>
            <div class="history-item__detail">
                <p class="history-item__date">07.12</p>
                <p class="history-item__content">
                    Lorem ipsum, dolor sit amet consectetur adipisicing elit.
                    Eveniet voluptatibus vero repudiandae quasi, expedita sit quidem assumenda, cum corrupti distinctio harum culpa optio commodi amet nostrum voluptates, ipsa placeat maxime.
                </p>
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

/* history-items 클래스 하위 아이템들을 위치 */
.history-items > li {
    /* 포인트 위치의 기준을 잡기 위한 relative 속성 */
    position: relative;

    /* 폭을 좁게 만들어 타임라인의 선을 표현 */
    width: 5px;
    background: #8a50af;

    /* 리스트 스타일 제거  */
    list-style-type: none;
    padding: 0;
    /* 화면 중앙에 위치하도록 가로 방향 margin auto */
    margin: 0 auto;
}

.history-items > li:last-child {
    /* 리스트의 마지막 아이템은 흰색으로 표시하여 화면에서 제거 */
    background: #ffffff;
}

/* 타임라인 위에 동그라미 포인트 표현, 외부 원 */
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

/* 타임라인 위에 동그라미 포인트 표현, 내부 원 */
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

/* 홀수 아이템들의 이력 카드 위치를 왼쪽으로 25px 이동 */
.history-items > li:nth-child(odd) .history-item {
    top: -5px;
    left: 25px;
}

/* 홀수 아이템들의 이력 카드 위치를 오른쪽으로 445px(카드 width + 카드 내부 padding + 오른쪽 margin) 이동 */
.history-items > li:nth-child(even) .history-item {
    top: -5px;
    left: -445px;
}

/* 홀수 아이템들의 텍스트는 오른쪽 정렬  */
.history-items > li:nth-child(even) {
    text-align: right;
}

.history-item {
    /* 요소가 자신의 현재 위치를 기준으로 top, left 속성을 통해 이동할 수 있도록 relative 속성 부여 */
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