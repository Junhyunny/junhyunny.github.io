---
title: "Webcam with Frame Filter"
search: false
category:
  - html
  - css
  - javascript
last_modified_at: 2023-09-14T23:55:00
---

<br/>

## 0. 들어가면서

브라우저 웹캠을 사용해 간단한 프레임을 입힌 이미지를 촬영해보았습니다. 
코드에 대한 설명 후 코드펜(codepen)을 통해 실제로 동작하는 모습을 살펴보겠습니다. 
코드가 긴 경우 가독성을 위해 설명이 필요한 부분에 주석을 작성하였습니다.  

## 1. HTML Code

* 프레임 필터를 변경할 수 있는 버튼들이 있습니다.
* `Take Photo` 버튼을 누르면 이미지를 생성해 저장합니다.
* 비디오 이미지 위에 위치할 프레임(frame) 캔버스가 존재합니다.
* 비디오를 표시하기 위한 사진(photo) 캔버스가 존재합니다.

```html
<div class="photobooth">
  <div class="buttons">
    <button onClick="takePhoto()">Take Photo</button>
    <button class="filter" onClick="changeFrame(1)">Frame-1</button>
    <button class="filter" onClick="changeFrame(2)">Frame-2</button>
    <button class="filter" onClick="removeFrame()">Remove Frame</button>
  </div>
  <div class="wrapper">
    <canvas class="frame"></canvas>
    <canvas class="photo"></canvas>
  </div>
  <div class="strip"></div>
</div>
<video class="player"></video>
```

## 2. CSS Code

```css
html {
  box-sizing: border-box;
}

*,
*:before,
*:after {
  box-sizing: inherit;
}

html {
  font-size: 10px;
  background: #ffc600;
}

.photobooth {
  background: white;
  max-width: 100rem;
  margin: 2rem auto;
  border-radius: 2px;

  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.photobooth:after {
  content: "";
  display: block;
  clear: both;
}

.buttons {
  display: flex;
  gap: 10px;
}

.wrapper {
  position: relative;
  border: 1px solid lightgrey;
  border-radius: 5px;
}

.frame {
  width: 100%;
  position: absolute;
  z-index: 1;
  left: 0;
  top: 0;
  border-radius: 5px;
}

.photo {
  width: 100%;
  float: left;
  border-radius: 5px;
}

/* 실제 비디오 엘리먼트는 화면에서 숨김 */
.player {
  display: none;
}

/* 촬영한 카드가 수집되는 블록 */
.strip {
  margin-top: 0.5rem;
  padding: 2rem;

  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.strip img {
  width: 100px;
  overflow-x: scroll;
  padding: 0.8rem 0.8rem 2.5rem 0.8rem;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
  background: white;
}
.strip a:nth-child(5n + 1) img {
  transform: rotate(10deg);
}
.strip a:nth-child(5n + 2) img {
  transform: rotate(-2deg);
}
.strip a:nth-child(5n + 3) img {
  transform: rotate(8deg);
}
.strip a:nth-child(5n + 4) img {
  transform: rotate(-11deg);
}
.strip a:nth-child(5n + 5) img {
  transform: rotate(12deg);
}

button {
  overflow: hidden;
  position: relative;
  margin: 10px auto;
  padding: 10px;

  outline: none;
  border-width: 0;
  border-radius: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);

  color: #ecf0f1;
  background-color: #2ecc71;
  transition: background-color 0.3s;
}
button:hover,
button:focus {
  background-color: #27ae60;
}
button:before {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;

  display: block;
  width: 0;
  padding-top: 0;
  border-radius: 100%;
  background-color: rgba(236, 240, 241, 0.3);
  -webkit-transform: translate(-50%, -50%);
  -moz-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  -o-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}
button:active:before {
  width: 120%;
  padding-top: 120%;
  transition: width 0.2s ease-out, padding-top 0.2s ease-out;
}
```

## 3. JavaScript Code

```javascript
// 프레임 필터 타입을 설정
let frameTypeState = 0;

const video = document.querySelector(".player");
const frameCanvas = document.querySelector(".frame");
const photoCanvas = document.querySelector(".photo");
const frameCtx = frameCanvas.getContext("2d");
const photoCtx = photoCanvas.getContext("2d");
const strip = document.querySelector(".strip");

// 웹캠 사용에 대한 권한 신청
function getVedio() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((localMediaStream) => {
      // 권한에 대한 승인 후 비디오 실행
      video.srcObject = localMediaStream;
      video.play();
    })
    .catch((err) => console.error(err.message));
}

function paintToCanvas() {
  const width = video.videoWidth;
  const height = video.videoHeight;
  frameCanvas.width = width;
  frameCanvas.height = height;
  photoCanvas.width = width;
  photoCanvas.height = height;
  // 비디오 화면 모습을 캔버스에 그림
  // 60 프레임으로 동작하도록 16ms 마다 캔버스 다시 그림
  setInterval(() => {
    photoCtx.drawImage(
      video,
      0,
      0,
      photoCtx.canvas.width,
      photoCtx.canvas.height
    );
  }, 16);
}

function onloadToTakePhoto() {
  // 사진 캔버스에 필터 프레임 이미지를 오버라이드(override)
  photoCtx.drawImage(this, 0, 0, photoCtx.canvas.width, photoCtx.canvas.height);
  const data = photoCanvas.toDataURL("image/jpeg");
  const link = document.createElement("a");
  link.setAttribute("download", "hello");
  link.innerHTML = `<img src="${data}" alt="Hi" />`;
  // 아래 사진첩에 사진을 추가
  strip.insertBefore(link, strip.firstChild);
}

// 프레임 이미지 로딩
function loadFrame(onloadCallback) {
  const image = new Image();
  // CORS 문제 해결
  image.crossOrigin = "anonymous";
  // 프레임 이미지 로딩 콜백 등록
  image.onload = onloadCallback; 
  // 이미지 객체의 src 변경 시 onload 콜백 함수 실행
  if (frameTypeState === 1) {
    image.src = "https://junhyunny.github.io/images/webcam-filter-1.JPG";
  } else if (frameTypeState === 2) {
    image.src = "https://junhyunny.github.io/images/webcam-filter-2.JPG";
  }
}

// 사진 촬영
function takePhoto() {
  loadFrame(onloadToTakePhoto);
}

// 프레임 변경
function changeFrame(frameType) {
  removeFrame();
  frameTypeState = frameType;
  loadFrame(onload);
}

// 프레임 제거
function removeFrame() {
  frameTypeState = 0;
  photoCtx.clearRect(0, 0, frameCtx.canvas.width, frameCtx.canvas.height);
  frameCtx.clearRect(0, 0, frameCtx.canvas.width, frameCtx.canvas.height);
}

// 프레임 로드
function onload() {
  frameCtx.drawImage(this, 0, 0, frameCtx.canvas.width, frameCtx.canvas.height);
}

// 비디오 권한 신청
getVedio();

// 비디오 촬영 가능한 경우 사진 캔버스에 비디오 이미지를 갱신하는 콜백 함수 등록
video.addEventListener("canplay", paintToCanvas);
```

## 4. Result

* 블로그 화면에선 웹캠이 동작하지 않으므로 웹캠 동작을 위해 코드펜으로 접속합니다.
    * <https://codepen.io/junhyunny/pen/MWZoRmw>

{% include codepen.html hash="MWZoRmw" tab="html,js" title="Webcam Frame Filters" %}

#### REFERENCE

* <https://codepen.io/trobes/pen/bxropm>
* <https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image>
* <https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage>