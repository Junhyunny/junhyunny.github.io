---
title: "Custom Radio Button"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2022-07-22T23:55:00
---

<br/>

## 1. Custom Radio Button

브라우저에서 기본 제공하는 라디오 버튼은 사용하지 않고, 커스터마이징(customizing)하는 방법을 정리하였습니다.

### 1.1. HTML 코드

* 같은 그룹으로 묶일 라디오 버튼들은 같은 이름을 부여합니다.
    * 1번 라디오 버튼 그룹 이름 - `grades`
    * 2번 라디오 버튼 그룹 이름 - `terms`
* 라벨의 `for` 속성 값과 라벨이 눌리면 선택되는 라디오 버튼의 `id` 속성 값을 맞춥니다.
    * 예를 들어 1학년 선택 버튼을 보면 다음과 같습니다.
    * 라벨 for 속성 - `grade-1`
    * 라디오 버튼 id 속성 - `grade-1`

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

### 1.2. CSS 코드

* 영역 표시나 크기를 설정한 속성들에 대한 설명은 제외하였습니다.
* 설명에 대한 내용은 가독성을 높이기 위해 주석에 작성하였습니다.

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

{% include codepen.html hash="eYMRNqZ" tab="result" title="Custom Radio Button" %}