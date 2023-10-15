---
title: "How to test image upload in React"
search: false
category:
  - typescript
  - react
last_modified_at: 2023-10-15T23:55:00
---

<br/>

## 1. Test Target Component

HTML `input` 태그의 타입을 `file`로 지정하면 호스트 장치의 지원을 받아 파일을 선택할 수 있습니다. 
파일 선택 후 서버로 업로드하거나 File API와 자바스크립트(JavaScript) 코드로 HTML 문서를 조작할 수도 있습니다. 
리액트(react) 어플리케이션으로 간단한 파일 업로드 기능을 구현하는데 이를 테스트하는 방법을 간단하게 정리하였습니다. 

테스트 대상 컴포넌트는 다음과 같습니다. 

* `file` 타입의 `input` 태그를 사용하여 이미지를 선택합니다.
* FileReader 객체를 사용해 화면 `img` 태그의 소스(src)를 선택한 이미지로 변경합니다.

```tsx
import React, { ChangeEvent, useRef } from "react";
import defaultImage from "./assets/default-image.jpg";
import "./App.css";

function App() {
  const imageRef = useRef<HTMLImageElement>(null);

  const onFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    const file = files?.item(0);
    if (!file) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.onloadend = function () {
      if (imageRef.current && fileReader.result) {
        imageRef.current.src = fileReader.result.toString();
      }
    };
    fileReader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="image">
        <img ref={imageRef} src={defaultImage} alt="profile-image" />
      </div>
      <input
        aria-label="file-selector"
        type="file"
        accept="image/*"
        onChange={onFileSelect}
      />
    </div>
  );
}

export default App;
```

## 2. Test 

RTL(React Testing Library) userEvent 모듈의 upload 함수를 사용하면 이미지 파일 선택 기능을 테스트할 수 있습니다. 
검증 방법은 화면에 보이는 `img` 태그의 소스 값이 변경되었는지 확인합니다. 
파일 선택과 동시에 서버로 업로드한다면 axios 같은 Rest API 요청 모듈을 테스트 더블(test double)로 사용합니다. 

* 테스트를 위한 파일 더미(dummy)를 생성합니다.
* App 컴포넌트를 렌더링(rendering)합니다.
* userEvent 모듈의 upload 함수를 사용해 파일 선택 이벤트를 발생시킵니다. 
* 화면의 이미지 태그의 소스가 변경되었는지 확인합니다.
    * FileReader 객체의 readAsDataURL 메소드를 사용하면 이미지 바이너리(binary) 정보가 Base64 방식으로 인코딩됩니다.

```tsx
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";

import App from "./App";

test("when choose an image file then change image on screen", async () => {
  const file = new File(["some-image"], "profile.jpg", {
    type: "image/jpeg",
  });
  render(<App />);

  userEvent.upload(screen.getByLabelText("file-selector"), file);

  await waitFor(() =>
    expect(screen.getByAltText("profile-image")).toHaveAttribute(
      "src",
      `data:image/jpeg;base64,${btoa("some-image")}`,
    ),
  );
});
```

##### Test Result

<p align="center">
    <img src="/images/how-to-test-image-upload-in-react-1.gif" width="100%" class="image__border">
</p>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/blog-in-action/tree/master/2023-10-15-how-to-test-image-upload-in-react>

#### REFERENCE

* <https://omar-b.hashnode.dev/testing-file-upload-component-with-rtl>
* <https://stackoverflow.com/questions/68452480/test-file-upload-in-react-jest>