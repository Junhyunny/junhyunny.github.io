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
설명이 필요한 부분은 가독성을 위해 주석으로 작성하였습니다.  

## 1. HTML Code

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
  width: 640px;
  height: 480px;
  border: 1px solid lightgrey;
  border-radius: 5px;
}

.frame {
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

.player {
  display: none;
}

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

  width: 150px;
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
let frameTypeState = 0;
const video = document.querySelector(".player");
const frameCanvas = document.querySelector(".frame");
const photoCanvas = document.querySelector(".photo");
const frameCtx = frameCanvas.getContext("2d");
const photoCtx = photoCanvas.getContext("2d");
const strip = document.querySelector(".strip");

function getVedio() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: false })
    .then((localMediaStream) => {
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
  photoCtx.drawImage(this, 0, 0, photoCtx.canvas.width, photoCtx.canvas.height);
  const data = photoCanvas.toDataURL("image/jpeg");
  const link = document.createElement("a");
  link.setAttribute("download", "hello");
  link.innerHTML = `<img src="${data}" alt="Hi" />`;
  strip.insertBefore(link, strip.firstChild);
}

function loadFrame(onloadCallback) {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = onloadCallback;
  if (frameTypeState === 1) {
    image.src = "https://junhyunny.github.io/images/webcam-filter-1.JPG";
  } else if (frameTypeState === 2) {
    image.src = "https://junhyunny.github.io/images/webcam-filter-2.JPG";
  }
}

function takePhoto() {
  loadFrame(onloadToTakePhoto);
}

function changeFrame(frameType) {
  removeFrame();
  frameTypeState = frameType;
  loadFrame(onload);
}

function removeFrame() {
  frameTypeState = 0;
  frameCtx.clearRect(0, 0, frameCtx.canvas.width, frameCtx.canvas.height);
}

function onload() {
  frameCtx.drawImage(this, 0, 0, frameCtx.canvas.width, frameCtx.canvas.height);
}

getVedio();
video.addEventListener("canplay", paintToCanvas);
```

## 4. Result

{% include codepen.html hash="MWZoRmw" tab="js,result" title="Webcam Frame Filters" %}

#### REFERENCE

* <https://codepen.io/trobes/pen/bxropm>
* <https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image>
* <https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage>