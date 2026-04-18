---
title: "IntelliJ Google CodeStyle 적용하기"
search: false
category:
  - information
last_modified_at: 2026-03-24T08:03:14+09:00
---

<br/>

## 1. Google CodeStyle for IntelliJ

구글에서 공통된 코드 컨벤션(convention)을 적용할 수 있는 XML 파일을 제공한다. `intellij-java-google-style.xml` 파일을 [이 링크](https://github.com/google/styleguide/blob/gh-pages/intellij-java-google-style.xml)에서 다운로드 받는다.

다운로드 받은 `intellij-java-google-style.xml` 파일은 프로젝트 루트(root) 경로에 위치시킨다. 파일 경로는 상관 없고, 프로젝트 코드들과 함께 관리되도록 위치시킨다.

<div align="left">
  <img src="{{ site.image_url_2021 }}/intellij-google-codestyle-01.png" width="30%" class="image__border">
</div>

## 2. Customize Code Style

들여쓰기가 공백 2칸으로 지정되어 있다. 이를 4칸으로 변경하였다.

```xml
    ...
    <codeStyleSettings language="JAVA">
        <option name="KEEP_CONTROL_STATEMENT_IN_ONE_LINE" value="false" />
        <option name="KEEP_BLANK_LINES_IN_CODE" value="1" />
        <option name="BLANK_LINES_AFTER_CLASS_HEADER" value="1" />
        <option name="ALIGN_MULTILINE_PARAMETERS" value="false" />
        <option name="ALIGN_MULTILINE_RESOURCES" value="false" />
        <option name="ALIGN_MULTILINE_FOR" value="false" />
        <option name="CALL_PARAMETERS_WRAP" value="1" />
        <option name="METHOD_PARAMETERS_WRAP" value="1" />
        <option name="EXTENDS_LIST_WRAP" value="1" />
        <option name="THROWS_KEYWORD_WRAP" value="1" />
        <option name="METHOD_CALL_CHAIN_WRAP" value="1" />
        <option name="BINARY_OPERATION_WRAP" value="1" />
        <option name="BINARY_OPERATION_SIGN_ON_NEXT_LINE" value="true" />
        <option name="TERNARY_OPERATION_WRAP" value="1" />
        <option name="TERNARY_OPERATION_SIGNS_ON_NEXT_LINE" value="true" />
        <option name="FOR_STATEMENT_WRAP" value="1" />
        <option name="ARRAY_INITIALIZER_WRAP" value="1" />
        <option name="WRAP_COMMENTS" value="true" />
        <option name="IF_BRACE_FORCE" value="3" />
        <option name="DOWHILE_BRACE_FORCE" value="3" />
        <option name="WHILE_BRACE_FORCE" value="3" />
        <option name="FOR_BRACE_FORCE" value="3" />
        <option name="PARENT_SETTINGS_INSTALLED" value="true" />
        <indentOptions>
            <option name="INDENT_SIZE" value="4" />
            <option name="CONTINUATION_INDENT_SIZE" value="4" />
            <option name="TAB_SIZE" value="2" />
        </indentOptions>
    </codeStyleSettings>
```

## 3. Import Code Style for IntelliJ

위 코드 스타일 파일을 인텔리제이(IntelliJ)에 적용해보자. 

- `Command + ,` 단축키로 IDE Settings로 진입한다.
- `Code Style` 창으로 진입한다.
- 구글 코드 스타일 XML 파일을 지정해 스키마를 추가한다.

<div align="center">
  <img src="{{ site.image_url_2021 }}/intellij-google-codestyle-02.png" width="80%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-05-01-intellij-google-codestyle>

#### RECOMMEND NEXT POSTS

- [Maven 라이프사이클에서 Google CheckStyle 사용하기][maven-checkstyle-link]

#### REFERENCE

- <https://toma0912.tistory.com/93>
- <https://jiyeonseo.github.io/2016/11/15/setting-java-google-style-to-intellij/>

[maven-checkstyle-link]: https://junhyunny.github.io/information/maven/maven-checkstyle/
