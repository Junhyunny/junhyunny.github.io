---
title: "IntelliJ Google CodeStyle 적용하기"
search: false
category:
  - information
last_modified_at: 2021-08-28T03:00:00
---

<br/>

👉 이어서 읽기를 추천합니다.
- [Maven CheckStyle 적용][maven-checkstyle-link]

## 1. intellij-java-google-style.xml 다운로드
팀원들이 IntelliJ를 이용하여 코드 자동 줄 맞춤을 쉽게 할 수 있도록 이번 포스트를 작성하였습니다. 
- 아래 링크로 접속하여 intellij-java-google-style.xml 파일을 다운받습니다. 
- 해당 파일은 구글에서 사용하는 코드 스타일 규칙입니다.
- <https://github.com/google/styleguide/blob/gh-pages/intellij-java-google-style.xml>

## 2. 코드 스타일 커스터마이징(customizing)

해당 스타일을 받아서 그냥 사용하면 들여쓰기(indent) 칸이 2로 설정되어 있습니다. 
저희 팀은 보기에 불편하여 들여쓰기와 관련된 설정을 4로 변경하였습니다. 
JAVA 이 외에 다른 언어도 모두 4로 변경하였습니다.

```xml
    <codeStyleSettings language="JAVA">
        <indentOptions>
            <option name="INDENT_SIZE" value="4"/>
            <option name="CONTINUATION_INDENT_SIZE" value="4"/>
            <option name="TAB_SIZE" value="4"/>
        </indentOptions>
        ...
    </codeStyleSettings>
```

## 3. intellij-java-google-style.xml IntelliJ Import 하기
- File > Settings > Code Style
- 이후 과정은 아래 이미지를 참고하시길 바랍니다.
- 해당 설정을 IMPORT 한 이후에 자동 줄 맞춤 단축키를 누르면 구글의 코드 스타일로 코드 정렬이 수행됩니다.

<p align="center"><img src="/images/intellij-google-codestyle-1.JPG" width="80%"></p>
<p align="center"><img src="/images/intellij-google-codestyle-2.JPG" width="80%"></p>

<div align="center">
    <img src="/images/intellij-google-codestyle-3.JPG" width="60%">
    <img src="/images/intellij-google-codestyle-4.JPG" width="30%">
</div>

#### REFERENCE
- <https://toma0912.tistory.com/93>
- <https://jiyeonseo.github.io/2016/11/15/setting-java-google-style-to-intellij/>

[maven-checkstyle-link]: https://junhyunny.github.io/information/maven/maven-checkstyle/