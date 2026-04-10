---
title: "리액트(React) 스켈레톤 이미지(Skeleton Image)"
search: false
category:
  - react
  - javascript
  - typescript
  - usability
last_modified_at: 2026-04-09T09:00:00+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

## 0. 들어가면서

이미지나 동영상을 AWS S3 스토리지에 직접 업로드한 이후에 AWS 람다(lambda)에서 비동기 처리를 통해 썸네일(thumbnail) 이미지를 생성 중이다. 썸네일 이미지가 생성 완료까지 시간이 제법 걸리기 때문에 화면에서 몇 번의 재시도가 필요했다. 이번 글은 프론트엔드에서 이미지 로딩을 몇 차례 재시도한 기능과 이미지 로딩이 완료되기 전에 영역을 미리 잡아두는 스켈레톤(skeleton) 이미지에 대해 정리했다.

## 1. Skeleton Image

스켈레톤 이미지는 이름처럼 실제 컨텐츠가 없는 상태에서 뼈대만 있는 상태를 표현하는 방법이다. 실제 내용은 없지만 레이아웃의 형태(뼈대)는 그대로 유지하고 있기 때문에 스켈레톤이라고 부른다. 스켈레톤 UI를 사용하는 이유는 크게 세 가지로 볼 수 있다.

- **사용자 경험(UX) 개선:** 빈 화면을 보며 기다리는 것보다, 앞으로 보여질 컨텐츠의 구조를 미리 보여줌으로써 체감 로딩 시간을 단축시킨다. 사용자는 "뭔가 로드되고 있다"는 맥락을 인지한 채로 기다릴 수 있다.
- **CLS(Cumulative Layout Shift) 방지:** 이미지나 컨텐츠가 갑자기 나타나며 레이아웃이 밀리는 현상을 막는다. 미리 공간을 확보해두기 때문에 컨텐츠가 로드돼도 레이아웃이 흔들리지 않는다.
- **Web Vitals / SEO 점수 향상:** CLS 개선은 구글의 Core Web Vitals 지표에 직접 영향을 준다. 우수한 사용자 경험으로 인정받으려면 CLS 수치를 0.1 이하로 유지해야 하며, 스켈레톤 UI가 이를 돕는다.

리소스 크기에 따라 약간의 차이가 있었지만, 대체로 썸네일 이미지가 생성 완료까지 약 2~3 초 정도가 소요된다. 사용자가 봤을 때 이미지 업로드가 끝난 것 같지만, 화면에 아무런 반응이 없어서 혼란스러울 수 있었다. 현재 상태는 사용자의 경험을 나쁘게 만들기 때문에 이미지 업로드가 끝난 이후 즉시 스켈레톤 영역을 만들고 로딩이 완료되면 이미지를 표시하기로 했다.

## 2. Image class

우선 스켈레톤 이미지를 만들기 위해선 재시도 로직이 필요했다. 무제한으로 기다릴 수도 없고, 그렇다고 1~2회 정도만 기다리는 작업은 부족할 수 있었다. 재시도를 수행할 때 `<img>` 요소(element)의 onLoad, onError 이벤트 핸들러를 사용하는 경우 코드가 복잡해지는 경향이 있어서 `Image` 객체를 사용했다. 브라우저가 기본으로 제공하는 DOM 클래스다. HTML의 `<img>` 태그와 동일한 객체이며, 자바스크립트(JavaScript)에서 `new Image()` 생성자를 호출해서 생성할 수 있다. `<img>` 태그와 Image 객체는 동일한 네트워크 스택을 사용하기 때문에 이미지 로딩 과정과 브라우저 CORS 정책이 동일하다. 

- 둘 다 동일한 HTTP 요청 발생
- 동일한 CORS 정책 적용

약간의 차이점이 있다면 `<img>` 태크는 HTML 파싱 중 발견되면 로딩을 시작하고, Image 객체는 자바스크립트 코드가 실행되는 시점에 로딩이 시작된다. 아래 코드처럼 Image 객체의 src 속성에 이미지 URL을 지정하면 로딩이 시작된다. 

```ts
const image = new Image()
image.onload = () => {
  ...
}
image.onerror = () => {
  ...
}
image.src = "https://exmample.com/images/temp.png"
```

`<img>` 태그와 Image 객체는 **URL이 동일한 경우 캐시가 공유**된다. 즉, Image 객체로 preload 한 이후 나중에 `<img>` 태그로 표시해도 네트워크 요청은 1회만 발생한다.

## 3. Retry with Image object

지금부터 Image 객체를 사용해서 이미지 로딩이 실패하는 경우 1초마다 최대 5회 재시도하는 코드를 작성해보자. 재귀적인 방법을 통해 재시도를 수행한다.

```ts
export const loadImageWithRety = async (url: string, timeout: number = 1000, retry: number = 4): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      resolve(image)
    }
    image.onerror = () => {
      setTimeout(() => {
        if(retry > 0) {
          loadImageWithRety(url, timeout, retry - 1)
            .then(resolve)
            .catch(reject)
        } else {
          reject(new Error("over maximum retry"))   
        }
      }, timeout)      
    }
    image.src = url
  })
}
```

재시도 로직이 정상적으로 동작하는지 확인하기 위해 다음과 같은 단위 테스트를 작성한다. 먼저 Image 클래스에 대한 목킹(mocking)을 준비한다.

```ts
const mockImage = {
  onload: null,
  onerror: null,
  src: "",
} as unknown as HTMLImageElement;

beforeEach(() => {
  vi.stubGlobal(
    "Image",
    vi.fn(function (this: HTMLImageElement) {
      return mockImage;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});
...
```

아래 테스트를 통해 Image 객체 src 프로퍼티에 정상적으로 이미지 URL이 설정되었는지 확인한다.

```ts
  test("image src is set correctly", async () => {
    const resultPromise = loadImageWithRety("https://example.com/temp.png");

    mockImage?.onload?.(new Event("load"));

    const result = await resultPromise;
    expect(result.src).toEqual("https://example.com/temp.png");
  });
```

아래 테스트를 통해 에러가 발생해도 최대 재시도 횟수 이내로 로드가 성공하면 정상적으로 이미지 객체를 반환하는지 확인한다.

```ts
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("retries on error and eventually resolves", async () => {
    const resultPromise = loadImageWithRety(
      "https://example.com/temp.png",
      100,
      2,
    );

    mockImage?.onerror?.(new Event("error"));
    vi.advanceTimersByTime(100);
    mockImage?.onerror?.(new Event("error"));
    vi.advanceTimersByTime(100);
    mockImage?.onload?.(new Event("load"));

    const result = await resultPromise;
    expect(result.src).toEqual("https://example.com/temp.png");
  });
```

아래 테스트를 통해 최대 재시도 횟수를 초과한 로딩 에러가 발생하는 경우 예외가 던져졌는지 확인할 수 있다.

```ts
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("over max retries then rejects", async () => {
    const resultPromise = loadImageWithRety(
      "https://example.com/temp.png",
      100,
      2,
    );

    mockImage?.onerror?.(new Event("error"));
    vi.advanceTimersByTime(100);
    mockImage?.onerror?.(new Event("error"));
    vi.advanceTimersByTime(100);
    mockImage?.onerror?.(new Event("error"));
    vi.advanceTimersByTime(100);

    await expect(resultPromise).rejects.toThrow("over maximum retry");
  });
```

## 4. SkeletonImage component

이미지 로딩을 재시도하는 로직은 준비됐다. 지금부터는 이미지 로딩이 되기 전까진 스켈레톤 이미지, 완료되면 정상적으로 이미지를 보여주는 SkeletonImage 컴포넌트를 만들어보자. 로딩이 실패하는 경우에는 기본 이미지를 보여준다. 다음과 같이 구현한다. 가독성을 위해 코드 위에 주석으로 설명한다.

```tsx
import { type CSSProperties, useEffect, useState } from "react";
import { loadImageWithRety } from "../utils/utils";
import "./SkeletonImage.css";

type Props = {
  src: string;
};

const imageStyle = {
  padding: "15px",
  borderRadius: "10px",
  width: "150px",
  height: "100px",
  backgroundPosition: "center",
  backgroundSize: "cover",
} as CSSProperties;

export const SkeletonImage = ({ src }: Props) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setError] = useState(false);

  useEffect(() => {
    // 이미지를 로딩한다.
    loadImageWithRety(src)
      // 모든 재시도가 완료된 후 이미지 로딩이 실패하면 에러 상태로 본다.
      .catch(() => setError(true))
      // 로딩이 성공하거나 모든 재시도가 실패하면 이미지 로딩이 완료된 상태로 본다.
      .finally(() => setIsLoaded(true));
  }, [src]);

  if (!isLoaded) {
    // 로딩이 완료되지 않은 동안 스켈레톤 영역을 잡아준다.
    return (
      <div
        role="status"
        aria-label="skeleton"
        className="skeleton"
        style={imageStyle}
      />
    );
  }

  // 에러인 경우 에러 이미지, 정상인 경우 정상 이미지를 반환한다.
  return (
    <>
      {isError ? (
        <div
          role="img"
          aria-label="alternate-image"
          style={ { ...imageStyle, backgroundColor: "darkblue" } }
        />
      ) : (
        <img src={src} alt="thumbnail-image" style={imageStyle} />
      )}
    </>
  );
};
```

다음과 같은 단위 테스트를 통해 기능이 정상적으로 동작하는지 확인할 수 있다. 아래 테스트를 통해 이미지 로딩이 완료되지 않은 경우 스켈레톤 이미지가 보이는 것을 확인할 수 있다. 

```tsx
  test("given loading is not finished when render SkeletonImage then see skelecto area", async () => {
    render(<SkeletonImage src="test-url" />);

    await waitFor(() => {
      expect(screen.getByLabelText("skeleton")).toBeInTheDocument();
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });
  });
```

아래 테스트를 통해 로딩이 완료되면 정상적으로 이미지가 보이는 것을 확인할 수 있다.

```tsx
  test("given when loading is done when render SkeletonImage then see image element", async () => {
    vi.spyOn(utils, "loadImageWithRety").mockResolvedValue(new Image());

    render(<SkeletonImage src="test-url" />);

    expect(await screen.findByAltText("thumbnail-image")).toBeInTheDocument();
    expect(screen.queryByLabelText("alternate-image")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("skeleton")).not.toBeInTheDocument();
  });
```

아래 테스트를 통해 로딩이 실패하면 대체 이미지가 보이는 것을 확인할 수 있다.

```tsx
  test("given when loading has failed when render SkeletonImage then see alternate image element", async () => {
    vi.spyOn(utils, "loadImageWithRety").mockRejectedValue(
      new Error("Failed to load image"),
    );

    render(<SkeletonImage src="test-url" />);

    expect(await screen.findByLabelText("alternate-image")).toBeInTheDocument();
    expect(screen.queryByLabelText("thumbnail-image")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("skeleton")).not.toBeInTheDocument();
  });
```

## 5. Run application

모든 코드는 [이 레포지토리](https://github.com/Junhyunny/blog-in-action/tree/master/2026-04-08-react-skeleton-image)에서 확인할 수 있다. 이미지 엔드포인트에서 고의적으로 에러를 발생시키는 백엔드 애플리케이션을 준비한다.

```python
@app.get("/images")
def get_image():
  if random.random() >= 0.5:
    return JSONResponse(status_code=404, content={"detail": "Not Found"})
  return FileResponse(DUMMY_IMAGE_PATH, media_type="image/png")
```

리액트 애플리케이션의 `App.tsx`에서 스켈레톤 이미지를 몇 개 렌더링한다.

```tsx
import { SkeletonImage } from "./components/SkeletonImage";

function App() {
  return (
    <div
      style={ {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: "50px",
      } }
    >
      {Array.from({ length: 3 }, (_, i) => i).map((i) => (
        <div key={`index-${i}`} style={ { marginBottom: "15px" } }>
          <SkeletonImage
            src={`http://localhost:8000/images?data=${Math.random()}`}
          />
        </div>
      ))}
    </div>
  );
}

export default App;
```

이제 리액트 애플리케이션을 실행하면 다음과 같이 동작하는 것을 볼 수 있다. 

<div align="center">
  <img src="{{ site.image_url_2026 }}/react-skeleton-image-01.gif" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-04-08-react-skeleton-image>

#### RECOMMEND NEXT POSTS

- [사파리(safari) 브라우저 캐시 정책과 이미지 재로딩 문제][safari-caching-issue-link]

#### REFERENCE

- <https://velog.io/@heelieben/React-%EC%9D%B4%EB%AF%B8%EC%A7%80-%EC%8A%A4%EC%BC%88%EB%A0%88%ED%86%A4-UI-%EC%A0%81%EC%9A%A9%ED%95%98%EA%B8%B0>
- <https://medium.com/prnd/%EC%8A%A4%EC%BC%88%EB%A0%88%ED%86%A4-%EB%A1%9C%EB%94%A9-%EC%96%B8%EC%A0%9C-%EC%82%AC%EC%9A%A9%ED%95%B4%EC%95%BC-%ED%95%A0%EA%B9%8C-%ED%97%A4%EC%9D%B4%EB%94%9C%EB%9F%AC-ux-%EC%8A%A4%ED%84%B0%EB%94%94-00d2cc323b17>

[safari-caching-issue-link]: https://junhyunny.github.io/browser/safari/javascript/typescript/safari-caching-issue/