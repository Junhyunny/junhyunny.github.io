---
title: "리액트 브라우저 웹캠(web camera) 촬영/녹화 구현하기"
search: false
category:
  - react
  - browser
  - web-api
  - media-stream
  - webcam
last_modified_at: 2026-01-23T09:55:00
---

<br/>

## 0. 들어가면서

최근 참여한 프로젝트에는 브라우저에서 비디오 녹화와 사진 촬영 기능이 구현되어 있었다. 코드가 복잡해 보여서 리팩토링이 필요해 보였다. API 기능을 정확히 이해해야 문제 없이 리팩토링 할 수 있을 것 같아서 어떻게 구현하는지, 어떤 API가 사용되는지 간단하게 공부해 볼 생각으로 블로그에 정리했다.

## 1. MediaStream API

브라우저에서 카메라, 마이크 같은 채널로부터 입력을 받으려면 MediaStream API를 사용해야 한다. [getUserMedia() 메소드](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia)를 통해 요청한 미디어(media) 트랙들이 포함된 MediaStream 인스턴스를 얻을 수 있다.

```ts
const stream = navigator.mediaDevices.getUserMedia(constraints)
```

스트림(stream)엔 다음과 같은 트랙들이 포함될 수 있다. 각 트랙들은 MediaStreamTrack 인터페이스로 추상화되어 있다.

- 카메라, 비디오 녹화 디바이스, 화면 공유 기능 같은 하드웨어, 가상 비디오 소스에 의해 생성되는 비디오 트랙
- 마이크, A/D 컨버터에 의해 생성되는 오디오 트랙
- 기타 가능한 다른 타입의 트랙

MediaStream 인스턴스의 getTracks() 메소드를 사용하면 종류에 상관없이 모든 MediaStreamTrack 인스턴스들을 반환한다.

해당 메소드를 호출하면 사용자 허가(permssion) 여부를 확인하고, 허가하지 않는 경우 `NotAllowedError` 에러를 던진다. 위에서 사용된 constraints 객체에는 `video`와 `audio` 요소가 모두 포함되며 요청하는 미디어 타입의 관련된 제약 조건을 명시한다.

getUserMedia() 메소드 API는 심각한 개인정보 보호 우려가 포함되어 있기 때문에 브라우저가 의무적으로 만족해야 하는 보안 요구사항들이 명시되어 있다. 안전하지 않은 컨텍스트에서 navigator.mediaDevices 객체는 undefined이므로 getUserMedia() 메소드는 호출할 수 없다. 안전한 컨텍스트인 HTTPS, 'file:///' URL 스키마, localhost인 경우에만 사용할 수 있다.

## 2. Video recording

우선 비디오 녹화를 하는 기능을 구현해보자. 전체 코드는 [레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-23-record-video-web-camera)를 통해 확인할 수 있다. 레코딩 여부에 따라 녹화 시작/종료 버튼이 렌더링 된다. 카메라 스트림을 연결하기 위한 video 요소(element)를 useRef를 통해 참조한다.

```tsx
const VideoRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder>(null);

  const startRecording = () => { ... };

  const stopRecording = () => { ... };

  useEffect(() => { ... }, []);

  return (
    <div>
      <video
        ref={videoRef}
        muted
        style={ { width: "1024px", backgroundColor: "#333", height: "576px" } }
      />
      <div>
        {!isRecording ? (
          <button type="button" onClick={startRecording}>
            녹화 시작
          </button>
        ) : (
          <button type="button" onClick={stopRecording}>
            녹화 종료
          </button>
        )}
      </div>
    </div>
  );
};
```

useEffect 훅(hook)에서 웹 캠을 연결한다. 컴포넌트가 마운트(mount) 될 때 getUserMedia 메소드를 통해 MediaStream 인스턴스를 획득한다. 획득한 MediaStream 인스턴스를 videoRef가 참조하는 video 요소의 소스(srcObject)로 설정 후 video 요소를 플레이(play)한다. 언마운트(unmount)될 때 MediaStream 인스턴스로 관리하는 트랙(MediaStreamTrack)들을 모두 종료한다.

getUserMedia 메소드가 호출되면 브라우저에서 카메라 권한 허용 여부를 물어본다. 사용자가 허용하면 카메라가 연결되고, 허용하지 않으면 DOMException 에러가 발생한다.

```tsx
const loadStream = async () => {
  return await navigator.mediaDevices.getUserMedia({
    video: {
      width: 1024,
      height: 576,
    },
    audio: false,
  });
};

const stopStreamTracks = (stream: MediaStream) => {
  for (const track of stream.getTracks()) {
    track.stop();
  }
};

const VideoRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder>(null);

  const startRecording = () => { ... };

  const stopRecording = () => { ... };

  useEffect(() => {
    let mounted = true;
    let localStream: MediaStream | undefined;
    loadStream()
      .then(async (stream) => {
        if (mounted && videoRef.current) {
          localStream = stream;
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        } else {
          stopStreamTracks(stream);
        }
      })
      .catch(console.error);
    return () => {
      mounted = false;
      if (localStream) {
        stopStreamTracks(localStream);
      }
    };
  }, []);

  return (
    <div> ... </div>
  );
};
```

Promise 객체의 then 콜백에서 mounted 여부를 확인하는 로직은 리액트(React) strict 모드에 의해 발생하는 에러를 방지하기 위함이다. 개발 환경에서 리액트는 useEffect 훅을 `마운트 -> 언마운트 -> 마운트` 순서로 강제 실행한다. 이때 첫 번째 비동기 처리(getUserMedia, run)들이 끝나기 전에 두 번째 마운트에 의해 새로운 요청을 보내면서 브라우저가 이전 요청을 취소(Abort)하게 된다. 이로 인해 발생하는 에러를 방지하기 위함이다.

다음으로 녹화 시작/종료 기능을 살펴보자. 녹화 시작 버튼을 클릭하면 startRecording 함수가 호출된다. video 요소의 MediaStream 기반으로 MediaRecorder 객체를 생성한다. MediaRecorder 객체의 ondataavailable, onstop 이벤트 리스너를 재정의한다. 

- ondataavailable 이벤트 리스너
  - 스트림을 통해 들어오는 데이터를 Blob 배열에 담는다. 
- onstop 이벤트 리스너
  - 촬영 중 수집한 데이터 조각들을 하나의 Blob 객체로 합쳐 다운로드 가능한 URL로 변환 후 앵커(anchor) 태그를 통해 해당 비디오를 다운로드한다.

녹화 종료 버튼을 클릭하면 stopRecording 함수가 호출된다. 녹화를 중단하고, MediaRecorder 객체 참조를 제거한다.

```tsx
const createRecorder = (mediaStream: MediaStream) => {
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(mediaStream, {
    mimeType: "video/webm",
  });
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "video.webm";
    a.click();
    URL.revokeObjectURL(url);
  };
  return recorder;
};

const VideoRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder>(null);

  const startRecording = () => {
    setIsRecording(true);
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }
    const mediaStream = videoElement.srcObject as MediaStream;
    const recorder = createRecorder(mediaStream);
    recorder.start();
    recorderRef.current = recorder;
  };

  const stopRecording = () => {
    setIsRecording(false);
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.stop();
      recorderRef.current = null;
    }
  };

  useEffect(() => { ... }, []);

  return (
    <div> ... </div>
  );
};
```

다음과 같이 실행된다.

<div align="center">
  <img src="/images/posts/2026/record-video-web-camera-01.gif" width="100%" class="image__border">
</div>

## 3. Photo capture

사진을 촬영하는 코드를 살펴보자. 비디오 레코딩과 유사하지만, 이미지를 촬영하기 위해서는 캔버스(canvas) 객체를 사용한다. 비디오 녹화 코드와 대부분 동일하므로 다른 부분만 살펴본다. 영상 촬영과 마찬가지로 video 요소를 연결한다. 

```tsx
const PhotoCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { ... }, []);

  const capture = () => { ... };

  return (
    <div>
      <video
        ref={videoRef}
        muted
        style={ { width: "1024px", backgroundColor: "#333", height: "576px" } }
      />
      <div>
        <button type="button" onClick={capture}>
          촬영
        </button>
      </div>
    </div>
  );
};
```

useEffect 훅에 작성된 코드는 비디오 녹화와 동일하다. 현재 비디오 스트림을 기준으로 사진을 캡처하는 코드만 살펴본다. 

캔버스 요소 객체를 만들고 현재 video 요소에서 재생되는 스트림 기준으로 png 이미지를 생성한다. 이미지 사이즈는 video 요소와 동일하게 설정한다. 생성한 이미지를 Base64 인코딩 한 데이터 URL 형식으로 변경 후 앵커 태그를 통해 다운로드 받는다.

```tsx
const PhotoCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { ... }, []);

  const capture = () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (video && context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "photo.png";
      a.click();
    }
  };

  return (
    <div> ... </div>
  );
};
```

다음과 같이 실행된다.

<div align="center">
  <img src="/images/posts/2026/record-video-web-camera-02.gif" width="100%" class="image__border">
</div>

## CLOSING

중복 코드들이 보인다. 해당 코드들은 커스텀 훅이나 유틸성 함수로 빼낼 수 있을 것 같다는 생각이 든다. 컴포넌트에서 전부 처리 중인 로직을 커스텀 훅이나 함수로 빼내면 이에 대한 단위 테스트를 작성할 수 있어서 테스트 커버리지까지 높일 수 있을 것 같다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-23-record-video-web-camera>

#### REFERENCE

- <https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia>
- <https://developer.mozilla.org/en-US/docs/Web/API/MediaStream>
- <https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack>
- <https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API>
- <https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder>
- <https://9ummy.tistory.com/24>
- <https://rubenchoi.tistory.com/20>