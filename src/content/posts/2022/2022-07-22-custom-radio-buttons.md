---
title: "커스텀 라디오 버튼(Custom Radio Button)"
publishedAt: "2022-07-22"
updatedAt: "2026-11-12T16:18:19+09:00"
canonicalPath: "/html/css/javascript/custom-radio-buttons/"
categories:
  - "html"
  - "css"
  - "javascript"
summary: "브라우저 기본 라디오 버튼 대신 HTML과 CSS로 커스텀 라디오 버튼을 만드는 방법을 정리했다."
---

## 1. Custom Radio Button

브라우저가 기본으로 제공하는 라디오 버튼을 사용하지 않고, 커스터마이징(customizing)하는 방법을 정리했다.

먼저 HTML 코드를 살펴보자. 같은 그룹으로 묶을 라디오 버튼에는 같은 이름을 부여한다. 1번 라디오 버튼 그룹의 이름은 `grades`, 2번 라디오 버튼 그룹의 이름은 `terms`다. 라벨의 `for` 속성 값은 라벨을 눌렀을 때 선택될 라디오 버튼의 `id` 속성 값과 맞춘다. 예를 들어 1학년 선택 버튼은 라벨의 `for` 속성과 라디오 버튼의 `id` 속성이 모두 `grade-1`이다.

```html
<div class="radio-buttons-1">
    <label for="grade-1" class="radio-button">1학년
        <input type="radio" id="grade-1" name="grades">
        <span class="custom-radio"></span>
    </label>
    <label for="grade-2" class="radio-button">2학년
        <input type="radio" id="grade-2" name="grades">
        <span class="custom-radio"></span>
    </label>
    <label for="grade-3" class="radio-button">3학년
        <input type="radio" id="grade-3" name="grades">
        <span class="custom-radio"></span>
    </label>
    <label for="grade-4" class="radio-button">4학년
        <input type="radio" id="grade-4" name="grades">
        <span class="custom-radio"></span>
    </label>
</div>
<br/>
<div class="radio-buttons-2">
    <label for="term-1" class="radio-button">1학기
        <input type="radio" id="term-1" name="terms">
        <span class="custom-radio"></span>
    </label>
    <label for="term-2" class="radio-button">2학기
        <input type="radio" id="term-2" name="terms">
        <span class="custom-radio"></span>
    </label>
    <label for="term-3" class="radio-button">추가학기
        <input type="radio" id="term-3" name="terms">
        <span class="custom-radio"></span>
    </label>
</div>
```

CSS 코드는 다음과 같다. 영역 표시나 크기를 설정한 속성의 설명은 제외했고, 가독성을 높이기 위해 설명은 주석으로 작성했다.

```css
.radio-buttons-1,
.radio-buttons-2 {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.radio-buttons-1 .radio-button,
.radio-buttons-2 .radio-button {
    cursor: pointer;
    position: relative;
    padding-left: 30px;
}

/* 기존 라디오 버튼 삭제 */
.radio-button input[type="radio"] {
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;
}

/* 1번 그룹 라디오 버튼, 외부 원 */
.radio-buttons-1 .radio-button .custom-radio {
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background-color: #eee;
}

/* 1번 그룹 라디오 버튼 선택 시 배경 색상 변경, 외부 원 */
.radio-buttons-1 .radio-button input[type="radio"]:checked ~ .custom-radio {
    background-color: #2196f3;
}

/* 1번 그룹 라디오 버튼, 내부 원 */
.radio-buttons-1 .custom-radio:after {
    content: "";
    position: absolute;
    /* 최초 display none */
    display: none;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: white;
}

/* 1번 그룹 라디오 버튼 선택 시 화면 표출, 내부 원 */
.radio-buttons-1 .radio-button input[type="radio"]:checked ~ .custom-radio:after {
    display: block;
}

/* 2번 그룹 커스텀 라디오 버튼, 외부 원 (border) */
.radio-buttons-2 .radio-button .custom-radio {
    position: absolute;
    top: 0;
    left: 0;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background-color: #fff;
    border: 1px solid #eee;
}

/* 2번 그룹 라디오 버튼 선택 시 배경 색상 변경, 외부 원 (border) */
.radio-buttons-2 .radio-button input[type="radio"]:checked ~ .custom-radio {
    border: 1px solid #ffd338;
}

/* 2번 그룹 라디오 버튼, 내부 원 */
.radio-buttons-2 .custom-radio:after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #eee;
}

/* 2번 그룹 라디오 버튼 선택 시 색상 변경, 내부 원 */
.radio-buttons-2 .radio-button input[type="radio"]:checked ~ .custom-radio:after {
    background-color: #ffd338;
}
```

## 2. 결과

<iframe class="codepen" src="https://codepen.io/Junhyunny/embed/eYMRNqZ?default-tab=result" title="Custom Radio Button" loading="lazy" allowfullscreen></iframe>
<p><a href="https://codepen.io/Junhyunny/pen/eYMRNqZ/">CodePen에서 예제 열기</a></p>
