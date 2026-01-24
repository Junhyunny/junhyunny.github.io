---
title: "Playwright 페이크 미디어 스트림(fake media stream)으로 브라우저 웹캠(web camera) 기능 테스트하기"
search: false
category:
  - playwright
  - e2e-test
  - fake
  - webcam
  - media-stream
last_modified_at: 2026-01-24T08:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [리액트 브라우저 웹캠(web camera) 촬영/녹화 구현하기][record-video-web-camera-link]

## 0. 들어가면서

브라우저에서 웹캠으로 촬영하는 기능은 웹 API를 사용하기 때문에 단위 테스트로 검증하는 것에 한계가 있다. Playwright 같은 프레임워크를 통해 E2E 테스트로 검증해야 한다.

- 웹캠 기능은 단순히 API 호출로 끝나지 않고, 하드웨어의 미디어 스트림이 video 태그에 실제 데이터로 전달되어야 한다.
- 웹캠 영상 처리는 고도로 비동기적인 작업이다. 카메라를 켜는 속도, 해상도 설정에 따른 로딩 시간 등 하드웨어 가용 상태에 따라 실행 환경이 매번 달라질 수 있다.
- WebRTC 및 MediaStream API는 브라우저 엔진(chromium, webkit, firefox)마다 구현 방식이나 지원하는 코덱에 미세한 차이가 있다. 멀티 브라우저 테스트를 통해 이를 검증할 수 있다.

이 글은 브라우저 웹캠을 통해 촬영하는 기능을 Playwright 프레임워크를 통해 E2E 테스트하는 방법에 대해 정리했다.

## 1. Fake media stream in Playwright

영상 녹화나 사진 촬영 기능을 테스트할 때 다음과 같은 문제들이 발생한다.

- CI/CD 파이프라인에는 실제 연결된 카메라가 없으므로 촬영이 불가능하다.
- 테스트마다 촬영 모습이 매번 다르다면 결과를 검증하는 것이 어렵고, 테스트는 매번 실패할 것이다.

위 두가지 문제점을 해결하기 위한 방법으로 Playwright의 페이크 미디어 스트림(fake media stream)을 사용할 수 있다. 미리 녹화한 영상을 video 태그에 스트림으로 연결하는 방법이다. 쉽게 이야기하면 실제 카메라로부터 전달받는 영상 스트림이 아닌 목킹(mocking) 영상 스트림을 사용하는 것이다. 실제 카메라가 없어도 영상을 촬영할 수 있고, 매번 같은 영상을 출력하는 것이 가능하다. 

<div align="center">
  <img src="/images/posts/2026/playwright-testing-camera-stream-mocking-01.png" width="100%" class="image__border">
</div>

## 2. Use fake media stream

지금부터 Playwright 프레임워크를 통해 테스트 코드를 작성해본다. 이 글은 테스트 코드에 대한 내용만 다루고, 영상 녹화/사진 촬영 기능은 [이전 글][record-video-web-camera-link]을 참고하길 바란다. 전체 코드는 [이 레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-24-playwright-testing-camera-stream-mocking)를 통해 확인할 수 있다. E2E 테스트 프로젝트 생성 방법은 [공식 홈페이지](https://playwright.dev/docs/intro)를 참고하길 바란다.

E2E 테스트 프로젝트를 생성하면 playwright.config.ts 파일이 생성된다. 해당 설정 파일에 아래와 같이 권한과 크롬 실행 옵션을 추가한다.

- 루트 use 객체에 permissions 배열에 카메라 권한을 추가한다.
- 프로젝트 배열에 크롬 객체에 실행 옵션을 추가한다. 크롬 실행 옵션은 [실제 코드](https://chromium.googlesource.com/chromium/src/media/+/master/base/media_switches.cc)를 통해 확인할 수 있다.
  - --use-fake-device-for-media-stream: 실제 카메라와 마이크를 페이크 디바이스 미디어 스트림으로 대체한다.
  - --use-file-for-fake-video-capture: 페이크 미디어 스트림으로 사용할 파일을 지정한다. y4m(YUV4MPEG2) 포맷 파일만 사용 가능하다.

```ts
import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    // 권한 허용
    permissions: ["camera"],
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    headless: !!process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // 크롬 실행 옵션
        launchOptions: {
          args: [
            "--use-fake-device-for-media-stream",
            "--use-file-for-fake-video-capture=media/output.y4m",
          ],
        },
      },
    },
  ],
});
```

y4m 포맷의 파일만 페이크 미디어 스트림으로 사용할 수 있다. mov, mp4 같은 비디오를 [FFmpeg 프레임워크](https://ffmpeg.org/)를 통해 y4m 형식으로 변경할 수 있다. FFmpeg는 디지털 음성 및 영상 데이터를 기록, 변환, 스트리밍하는 데 사용되는 오픈 소스 멀티미디어 프레임워크다. 거의 모든 종류의 오디오/비디오 코덱과 컨테이너 형식을 읽고 쓸 수 있다. 터미널에서 홈브루(brew)를 통해 설치할 수 있다.

```
$ brew install ffmpeg
```

FFmpeg 설치가 완료되었으면 다음 명령어를 통해 비디오 포맷을 변경한다. 입력 비디오는 맥북에서 유튜브 영상을 짧게 녹화한 것을 사용했다. y4m 포맷의 영상은 압축 과정 없이 각 프레임의 모든 픽셀 데이터를 그대로 기록하기 때문에 데이터의 양이 압축 파일보다 훨씬 많다. 해상도와 프레임을 낮춰 파일 사이즈를 제한한다. 변환된 output.y4m 파일은 E2E 프로젝트의 media 경로에 위치시킨다.

- "-i sample.mov"
  - 작업의 대상이 되는 파일이다.
- "-vf scale=1280:-1"
  - 비디오에 필터를 적용하여 영상의 크기(해상도)를 조절한다.
- "-r 3"
  - 출력 파일의 초당 프레임 레이트(FPS)를 3으로 설정한다.
- "-f yuv4mpegpipe"
  - 강제로 YUV4MPEG2 출력 포맷으로 지정한다. 

```
$ ffmpeg -i sample.mov -vf scale=1280:-1 -r 3 -f yuv4mpegpipe output.y4m
```

## 3. Tests

[이전 글][record-video-web-camera-link]에서 다룬 비디오 녹화, 사진 촬영 기능을 대상으로 테스트를 수행한다. 먼저 비디오 녹화 기능에 대한 테스트 코드는 다음과 같다.

1. 화면에 접속한다. 즉시 녹화를 시작하지 않고, 미디어 스트림이 연결되는 것을 500ms 기다린다. 
2. "녹화 시작" 버튼을 클릭 후 1초 대기한다.
3. "녹화 종료" 버튼을 클릭한다.
4. 다운로드 경로에 해당 이름으로 파일이 다운로드되었는지 확인한다.

```ts
import {randomUUID} from "node:crypto";
import * as fs from "node:fs";
import {expect, test} from "@playwright/test";

test("download video file", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500); // wait for media stream to be ready

  await page.getByRole("button", { name: "녹화 시작" }).click();
  await page.waitForTimeout(1000); // wait for recording

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "녹화 종료" }).click();

  const download = await downloadPromise;
  const filePath = `downloads/${randomUUID()}.webm`;
  await download.saveAs(filePath);
  expect(fs.existsSync(filePath)).toBeTruthy();
});
```

위 테스트를 실행하면 다음과 같이 사전에 준비한 영상이 실제 카메라 영상 대신 보이는 것을 확인할 수 있다. 녹화한 비디오도 페이크 미디어 스트림 영상임을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2026/playwright-testing-camera-stream-mocking-02.gif" width="100%" class="image__border">
</div>

<br />

다음은 사진 촬영 기능에 대한 테스트다.

1. 화면에 접속 후 사진 촬영 기능으로 이동한다. 즉시 촬영을 시작하지 않고, 미디어 스트림이 연결되는 것을 500ms 기다린다. 
2. "촬영" 버튼을 클릭한다.
3. 다운로드 경로에 해당 이름으로 파일이 다운로드되었는지 확인한다.

```ts
import {randomUUID} from "node:crypto";
import * as fs from "node:fs";
import {expect, test} from "@playwright/test";


test("download image file", async ({ page }) => {
  await page.goto("/");
  await page.getByText("사진").click();
  await page.waitForTimeout(500); // wait for media stream to be ready

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "촬영" }).click();

  const download = await downloadPromise;
  const filePath = `downloads/${randomUUID()}.png`;
  await download.saveAs(filePath);
  expect(fs.existsSync(filePath)).toBeTruthy();
});
```

위 테스트를 실행하면 비디오 촬영 테스트와 마찬가지로 사전에 준비한 영상이 실제 카메라 영상 대신 보인다. 촬영된 사진도 페이크 미디어 스트림의 프레임인 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2026/playwright-testing-camera-stream-mocking-03.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-01-24-playwright-testing-camera-stream-mocking>

#### REFERENCE

- <https://playwright.dev/docs/intro>
- <https://playwright.dev/docs/api/class-browsercontext#browser-context-grant-permissions>
- <https://playwright.dev/docs/api/class-testoptions#test-options-launch-options>
- <https://playwright.dev/docs/emulation#permissions>
- <https://chromium.googlesource.com/chromium/src/media/+/master/base/media_switches.cc>
- <https://stackoverflow.com/a/52188760>
- <https://stackoverflow.com/a/77118808>
- <https://medium.com/@sap7deb/simulating-webcam-access-in-playwright-testing-web-apps-with-mocked-media-stream-and-device-f403dbbcb166>
- <https://ffmpeg.org/>

[record-video-web-camera-link]: https://junhyunny.github.io/react/browser/web-api/media-stream/webcam/record-video-web-camera/