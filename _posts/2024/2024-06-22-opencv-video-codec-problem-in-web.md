---
title: "OpenCV Video Codec Problem in Web"
search: false
category:
  - web
  - python
  - opencv
last_modified_at: 2024-06-22T23:55:00
---

<br/>

## 0. 들어가면서

지난 프로젝트에서 파이썬(python)과 OpenCV 라이브러리를 사용한 비디오 프로세싱 기능을 개발했다. 당시 OpenCV를 통해 생성된 비디오가 브라우저에서 재생되지 않는 문제가 있었다. 문제의 원인과 해결 방법을 글로 정리했다. 
예제에선 [샘플 비디오](https://www.pexels.com/video/blood-samples-placed-in-specimen-tubes-4074364/)를 사용했다.

## 1. Problem Context

문제 상황은 다음과 같이 요약할 수 있다.

1. 사용자가 비디오를 업로드한다.
2. 업로드 된 비디오가 프로세싱 이후 새로운 비디오 파일로 저장된다.
3. 생성된 비디오 파일이 웹 브라우저에서 재생되지 않는다. 

<div align="center">
  <img src="/images/posts/2024/opencv-video-codec-problem-in-opencv-01.png" width="80%" class="image__border">
</div>

<br/>

- 다음과 같은 에러를 볼 수 있다.
  - 지원되는 형식 및 MIME 유형의 동영상를 찾을 수 없습니다.

<div align="center">
  <img src="/images/posts/2024/opencv-video-codec-problem-in-opencv-02.png" width="80%" class="image__border">
</div>

## 2. Problem Cause

파일 시스템에 새롭게 저장된 비디오는 플레이어로 재생되지만, 웹 브라우저에선 재생 되지 않는다. 원본 비디오는 플레이어, 웹 브라우저에서 모두 정상적으로 저장된다. 두 포맷은 어떤 차이점이 있을까? 확장자는 mp4 동일하지만, 코덱(codec) 정보가 다르다.

- 원본 비디오
  - H.264 코덱
- 변경 비디오
  - MPEG-4 Video 코덱

<div align="center">
  <img src="/images/posts/2024/opencv-video-codec-problem-in-opencv-03.png" width="80%" class="image__border">
</div>

코덱이라는 용어를 많이 들어봤지만, 정확한 개념은 모르기 때문에 찾아 정리해봤다. 코덱이란 `coder-decoder(혹은 compressor-decompressor)`의 약자로 디지털 비디오를 인코딩, 디코딩 할 때 사용하는 소프트웨어(혹은 하드웨어) 도구이다. 주요 기능은 비디오 파일을 압축하여 저장이나 전송하기 위해 크기를 줄인 다음 재생을 위해 압축을 푸는 것이다. 이 과정은 압축되지 않은 비디오 데이터 품질을 크게 손상시키지 않으면서 공간을 덜 차지하는 효율적인 타입으로 변환하는 작업을 포함한다. 

이제 웹 브라우저에서 사용할 수 있는 코덱들을 찾아보자. [mdn web docs](https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs) 문서를 보면 웹 비디오 코덱 가이드에 대한 설명이 있다. 영상 길이와 비디오 사이즈, 네트워크 통신에 대한 예시를 들어 코덱이 왜 필요한지 이야기하고 있으니 읽어봐도 좋다. 이 링크에는 웹에서 보통 사용하는 코덱과 확장자에 대한 설명도 함께 되어 있다. 문제가 발생하는 `MPEG-4 Video` 코덱은 웹 환경에서 사용되지 않으며 브라우저에서도 역시 재생되지 않는다. 

<div align="center">
  <img src="/images/posts/2024/opencv-video-codec-problem-in-opencv-04.png" width="80%" class="image__border">
</div>
<center>https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs</center>

## 3. Codec Issue

필자의 각 코덱 별로 연결된 링크를 확인하면 해당 코덱에 대한 자세한 사양(specification)을 확인할 수 있다. 각 코덱들에 대한 내용들 중 브라우저 호환성과 어떤 확장자를 지원하는지 간략하게 요약해봤다.

- AV1
  - Chrome(70), Edge(75), Firefox(67), Firefox Android(113), Opera(57), Safari(17)
  - ISOBMFF, MPEG-TS, MP4, WebM
- AVC(H.264)
  - All versions of Chrome, Edge, Firefox, Opera, and Safari
  - 3GP, MP4
- H.263
  - No browser compatibility
  - 3GP, MP4, QuickTime
- HEVC(H.265)
  - Chrome(107), Edge(18), Firefox(No), Opera(94), Safari(11)
  - ISOBMFF, MPEG-TS, MP4 QuickTime
- MP4V-ES
  - Firefox only
  - 3GP, MP4
- MPEG-1
  - Safari only
  - MPEG
- MPEG-2
  - Safari only
  - MPEG, MPEG-TS (MPEG Transport Stream), MP4, QuickTime
- Theora
  - Chrome(3), Edge(Yes), Firefox(3.5), Opera(10.5), Safari(No)
  - Ogg
- VP8
  - All versions of Chrome, Edge, Firefox, Opera, and Safari
  - 3GP, Ogg, WebM
- VP9
  - All versions of Chrome, Edge, Firefox, Opera, and Safari
  - MP4, Ogg, WebM

이제 브라우저에서 사용할 수 있는 코덱을 확인했다. 모든 브라우저에서 사용할 수 있는 코덱은 AV1, AVC(H.264), VP8, VP9 이다. 코덱의 브라우저 호환성 문제만 해결하면 될 줄 알았지만, 문제가 하나 더 있었다. 필자는 비디오 프로세싱 애플리케이션을 컨테이너 환경에서 실행했는데, AV1, AVC(H.264) 코덱을 사용하면 다음과 같은 에러를 만난다. 

- AV1 코덱 사용

```
[ERROR:0@5.301] global cap_ffmpeg_impl.hpp:3133 open Could not find encoder for codec_id=226, error: Encoder not found
[ERROR:0@5.302] global cap_ffmpeg_impl.hpp:3211 open VIDEOIO/FFMPEG: Failed to initialize VideoWriter
```

- AVC(H.264) 코덱 사용

```
[ERROR:0@4.306] global cap_ffmpeg_impl.hpp:3133 open Could not find encoder for codec_id=27, error: Encoder not found
[ERROR:0@4.306] global cap_ffmpeg_impl.hpp:3211 open VIDEOIO/FFMPEG: Failed to initialize VideoWriter
```

필자의 맥북(호스트 머신)에서 애플리케이션을 직접 실행하면 AV1, AVC(H.264) 코덱을 사용하더라도 위와 같은 에러가 발생하지 않는다. 컨테이너 환경에서 에러가 발생하는 이유를 OpenCV 이슈를 통해 유추할 수 있었다. 

- OpenCV는 별도로 비디오 코덱을 구현하지 않고 FFmpeg, GStreamer 같은 서드 파티(third party) 코덱을 사용한다. 

<div align="center">
  <img src="/images/posts/2024/opencv-video-codec-problem-in-opencv-05.png" width="80%" class="image__border">
</div>
<center>https://github.com/opencv/opencv-python/issues/912</center>

호스트 머신에는 코덱이 설치되어 있어서 문제가 없지만, 컨테이너 이미지에는 필요한 코덱이 설치되어 있지 않기 때문에 문제가 발생한다. 필요한 코덱을 베이스 이미지애 위에 설치하면 해결될 것으로 생각했다. 스택 오버플로우(stack overflow), 깃허브(github)나 ChatGPT에서 언급되는 패키지들은 모두 설치해 봤지만, 모두 실패했다. 위 코덱 문제는 해결할 수 없었다. 필자는 `python:3.12-slim` 베이스(base) 컨테이너 이미지를 사용했다. 설치해 본 패키지들은 다음과 같다.

```dockerfile
FROM python:3.12-slim

# ...

RUN apt-get update
RUN apt-get install -y \
    python3-opencv \
    libavcodec-dev libavformat-dev libswscale-dev \
    libgstreamer-plugins-base1.0-dev \
    libgstreamer1.0-dev libgtk-3-dev \
    libpng-dev libjpeg-dev libopenexr-dev libtiff-dev libwebp-dev \
    libgl1-mesa-glx libleptonica-dev zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libreadline-dev libffi-dev \
    libsm6 libxext6 libxrender-dev libavcodec-extra \
    libopencv-dev x264 libx264-dev libssl-dev ffmpeg
```

## 4. Solve the problem

별도 설치 없이 사용할 수 있는 VP8 코덱을 사용했다. VP8, VP9 코덱은 매우 느리지만, 코덱 이슈는 해결하지 못했기 때문에 어쩔 수 없이 사용했다. 예제 애플리케이션에서 실제로 잘 동작하는지 확인해보자. 

### 4.1. Create requirements.txt file

파이썬과 OpenCV은 패키지 버전에 민감하다. 동일한 환경에서 동일한 패키지를 사용할 수 있도록 도커 빌드를 통해 requirements.txt 파일을 만든다. requirements.txt는 파이썬 애플리케이션이 필요한 패키지 정보를 관리하는 파일이다.

```dockerfile
FROM python:3.12-slim AS extract_requirements
WORKDIR /app
RUN pip3 install fastapi opencv-python-headless
RUN pip3 list --format=freeze > requirements.txt

FROM scratch
COPY --from=extract_requirements /app/requirements.txt .
```

다음 명령어를 사용하면 requirements.txt 파일이 호스트 머신에 생성된다.

```
$ docker build -f ./Dockerfile-requirements -o . .
```

### 4.2. Build Image

컨테이너 이미지를 생성한다. 다음 도커 파일을 사용하다.

```dockerfile
FROM python:3.12-slim

WORKDIR /app
RUN mkdir -p input
RUN mkdir -p output

COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

다음 명령어를 사용해 이미지를 생성한다.

```
$ docker build -t processor .
```

### 4.3. Main page

이제 예제 코드를 살펴보자. 메인 페이지에 관련된 코드는 다음과 같다.

- 루트 경로(/)로 요청시 메인 화면을 반환한다.
- 메인 화면은 다음과 같이 구성되어 있다.
  - 비디오를 보여준다.
  - 비디오 파일을 선택해 업로드 할 수 있는 버튼이 존재한다.
- /videos/{name} 경로로 요청시 파일 시스템에 위치한 비디오를 반환한다.

```python
from fastapi import FastAPI, UploadFile
from fastapi.responses import HTMLResponse
from starlette.responses import FileResponse
import cv2


app = FastAPI()


def main_page():
    html_content = """
    <html>
        <head>
            <title>blog in action</title>
        </head>
        <body>
            <h3>Upload File</h1>
            <div>
                <video controls width="300">
                    <source src="/videos/result.webm" />
                </video>
            </div>
            <br/>
            <div>
                <input type="file" onchange="selectFile(this)" accept="video/*" />
            </div>
        </body>
    </html>
    <script>
        function selectFile(event) {
            const file = event.files[0]
            const formData = new FormData()
            formData.append("video", file)
            fetch("/videos", {
                method: "POST",
                body: formData
            }).then(() => {
                location.reload()
            })
        }
    </script>
    """
    return HTMLResponse(content=html_content, status_code=200)


@app.get("/", response_class=HTMLResponse)
async def index():
    return main_page()


@app.get("/videos/{name}")
async def video(name):
    return FileResponse("output/" + name, media_type='application/octet-stream', filename=name)
```

### 4.4. Upload video

비디오를 업로드하면 파일 시스템에 저장 후 비디오 프로세싱을 진행한다. 예제 코드에선 별도 비디오 프로세싱은 없이 OpenCV를 통해 새로운 비디오 파일을 다시 만든다.

- /videos 경로로 POST 요청시 파일 시스템에 해당 비디오를 저장 후 비디오 프로세싱을 진행한다.
- 비디오 프로세싱에서 다음과 같은 작업을 수행한다.
  1. 비디오 파일을 읽은 후 폭, 높이, 프레임 정보를 추출한다.
  2. VP8 코덱을 사용하기 위해 VP80 fourcc(four character code)를 사용한다.
  3. 기존 비디오으로부터 프레임을 읽어 새로운 비디오를 생성한다.

```python
def processing(file_name: str):
    cap = cv2.VideoCapture("input/" + file_name)  # 1
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    fourcc = cv2.VideoWriter_fourcc(*'VP80')  # 2

    out = cv2.VideoWriter("output/result.webm", fourcc, fps, (frame_width, frame_height))  # 3
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)


@app.post("/videos")
async def upload(video: UploadFile):
    file_path = f"input/{video.filename}"
    with open(file_path, "wb") as f:
        f.write(video.file.read())
    processing(video.filename)
```

fourcc(four character code)는 비디오 및 오디오 파일 같은 멀티미디어 컨테이너에서 데이터 형식을 고유하게 식별하는 데 사용되는 4바이트 시퀀스(sequence)이다. 파일에 사용되는 코덱 또는 데이터 형식을 지정하기 위해 사용한다. 각 코덱 별로 사용되는 fourcc는 다음과 같다.

- AV1 코덱 - AV01
- H.264 코덱 - AVC1, H264
- VP8 코덱 - VP80
- VP9 코덱 - VP09

VP8 코덱은 mp4 확장자를 지원하지 않기 때문에 webm 확장자로 저장한다.

### 4.5. Run application

애플리케이션을 실행 후 새로 생성한 비디오가 잘 재생되는지 확인해보자. 다음 명령어로 컨테이너를 실행한다.

```
$ docker run --name processor -p 8000:8000 processor
```

브라우저를 통해 해당 애플리케이션에 접근 후 비디오를 업로드한다. 필자의 맥북에선 다소 시간이 소요된다.

<div align="center">
  <img src="/images/posts/2024/opencv-video-codec-problem-in-opencv-06.gif" width="100%" class="image__border">
</div>

## CLOSING

AVC(H.264) 코덱은 GPL 라이센스 문제로 OpenCV에서 지원되지 않는 것으로 보이니 주의하길 바란다. 

<div align="center">
  <img src="/images/posts/2024/opencv-video-codec-problem-in-opencv-07.png" width="80%" class="image__border">
</div>
<center>https://github.com/opencv/opencv-python/issues/207</center>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-06-22-opencv-video-codec-problem-in-web>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs>
- <https://github.com/opencv/opencv-python/issues/912>
- <https://github.com/opencv/opencv-python/issues/207>
- <https://stackoverflow.com/questions/70247344/save-video-in-opencv-with-h264-codec>
- <https://stackoverflow.com/questions/41670584/opencv-linux-how-to-install-ffmpeg>
- <https://wiki.debian.org/MultimediaCodecs#Codec_Installations>