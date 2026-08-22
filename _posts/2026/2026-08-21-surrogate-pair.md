---
title: "서로게이트 페어(Surrogate Pair)"
search: false
category:
  - react
  - javascript
  - typescript
  - surrogate-pair
last_modified_at: 2026-08-22T17:51:34+09:00
---

<br/>

## 0. 들어가면서

일본 고객과 소프트웨어를 만들다 보니 자연스럽게 한자와 관련된 예상치 못한 오류 사례를 접하게 된다. [react-pdf](https://react-pdf.org/) 라이브러리를 사용해 PDF를 만들 때 일부 한자와 이모지(emoji)가 제대로 표시되지 않는 문제가 있었다. 이번 글에서는 이 문제와 관련된 서로게이트 페어(Surrogate Pair)라는 개념을 정리했다.

## 1. UTF(Unicode Transformation Format)

서로게이트 페어와 관련된 개념을 살펴보기 전에 UTF(Unicode Transformation Format)를 이해할 필요가 있다. UTF는 모든 유니코드(Unicode) 코드 포인트를 고유한 바이트 시퀀스로 변환하는 알고리즘적 매핑 방식이다. [ISO/IEC 10646 표준](https://cdn.standards.iteh.ai/samples/76835/46bd0c6c19d04aca81ea546ece3c6417/ISO-IEC-10646-2020.pdf)에서는 UTF를 `UCS Transformation Format`이라고 부르는데, 두 용어는 사실상 같은 개념을 뜻한다. 다소 추상적인 표현이지만, 간단히 말해 UTF는 유니코드 코드 포인트를 컴퓨터가 저장할 수 있는 바이트로 바꾸는 규칙이다.

브라우저, Word, VS Code 같은 프로그램은 내부적으로 유니코드를 해석해 어떤 문자인지 판단한다. 화면에 어떻게 그려질지는 폰트가 담당한다. 유니코드 코드 포인트 `U+0041`은 문자 `A`를 의미한다. 폰트에서 이 유니코드에 해당하는 글리프(Glyph)를 검색한 후 화면에 표시하는 것이다.

이 코드 포인트를 컴퓨터 파일에 저장하거나 네트워크로 전송하려면 바이트로 변환해야 한다. 코드 포인트를 바이트로 바꾸는 규칙이 `UTF`이며, 다음과 같은 세 가지 방식이 있다.

| 구분 | UTF-8 | UTF-16 | UTF-32 |
|---|---|---|---|
| 기본 단위 | 8비트 | 16비트 | 32비트 |
| 문자당 길이 | 1~4바이트 | 2 또는 4바이트 | 항상 4바이트 |
| 가변 길이 여부 | O | O | X |
| ASCII 호환 | O | X | X |
| 서로게이트 페어 | 사용 안 함 | 사용함 | 사용 안 함 |
| 저장 효율 | 영문에 매우 좋음 | 일부 문자에 효율적 | 대체로 비효율적 |
| 대표 사용 | 웹, 파일, 네트워크 | Java, JavaScript 내부 문자열 등 | 일부 내부 처리 |

<br/>

`A`라는 문자의 유니코드 코드 포인트 `U+0041`을 각 UTF 변환 규칙에 따라 바이트 시퀀스로 변환하면 다음과 같다. 빅 엔디언(big endian) 기준의 바이트 시퀀스를 16진수로 표현한 것이다.

- UTF-8 방식: `41` (8비트 × 1)
- UTF-16 방식: `00 41` (16비트 × 1)
- UTF-32 방식: `00 00 00 41` (32비트 × 1)

같은 문자라도 UTF-8, UTF-16, UTF-32에서는 바이트 표현 방식이 다르다. 😀 이모지의 유니코드 코드 포인트는 `U+1F600`이다. 이를 각 UTF 변환 규칙에 따라 바이트 시퀀스로 변환하면 다음과 같다.

- UTF-8 방식: `F0 9F 98 80` (8비트 × 4)
- UTF-16 방식: `D8 3D DE 00` (16비트 × 2)
- UTF-32 방식: `00 01 F6 00` (32비트 × 1)

`A` 문자를 변환할 때와 달리 UTF-8과 UTF-16의 바이트 시퀀스가 길어졌다. 앞선 표에서 살펴봤듯이 두 UTF 방식은 가변 길이 인코딩이기 때문에 문자에 따라 필요한 바이트 수가 달라진다. 두 UTF 방식은 기본 단위의 표현 범위를 넘어가는 유니코드 코드 포인트를 변환할 때 각 단위만큼 바이트를 추가한다.

**UTF는 역변환이 가능하다.** 모든 UTF는 손실 없는 왕복 변환이 가능하다. 어떤 유니코드 코드 포인트를 각 UTF 방식에 따라 바이트 시퀀스로 변환한 뒤 다시 같은 방식으로 코드 포인트로 되돌리면 원래 값이 복원된다. **UTF는 손실이 없을 뿐만 아니라 결과도 유일하다.** 특정 UTF 방식을 사용할 경우 같은 코드 포인트는 언제나 같은 바이트 시퀀스로 변환된다.

## 2. 서로게이트 페어(Surrogate Pair)

서로게이트 페어는 UTF-16에서 코드 포인트 하나를 16비트 두 개로 표현하는 방식이다. UTF-16은 기본적으로 16비트 단위로 문자를 다루는데, U+FFFF를 넘는 문자는 16비트 하나에 들어가지 않는다. 유니코드에는 16비트 하나로 표현할 수 없는 보충 문자가 총 1,048,576개 있다. 그래서 이 문자들을 표현하기 위해 다음과 같이 두 개의 16비트 값으로 나누어 표현한다.

- 서로게이트 페어에서는 반드시 High 서로게이트가 먼저 오고, Low 서로게이트가 그다음으로 온다.

```
High 서로게이트 + Low 서로게이트
```

서로게이트 영역은 일반 문자와 겹치지 않는다. 유니코드는 서로게이트를 위한 범위를 따로 예약해 두었다. 이 값들은 일반 유니코드 문자를 직접 나타내는 데 사용되지 않는다. 따라서 UTF-16의 16비트 값은 크게 세 종류로 나뉜다.

- 일반 코드 유닛
- High 서로게이트 (U+D800 ~ U+DBFF)
- Low 서로게이트 (U+DC00 ~ U+DFFF)

[자바스크립트(JavaScript) 문자열(String)은 명세상 UTF-16 코드 유닛을 기준으로 동작한다.](https://262.ecma-international.org/16.0/#sec-ecmascript-language-types-string-type) 즉, 문자열의 각 요소를 UTF-16 코드 유닛으로 취급하므로 길이, 인덱싱, `charAt()`, `charCodeAt()` 같은 API도 기본적으로 16비트 단위로 동작한다. 자바스크립트 API를 사용하면 서로게이트 페어와 관련된 동작을 간단히 확인할 수 있다.

- `charCodeAt()` 메서드: UTF-16 코드 유닛 단위의 값
- `codePointAt()` 메서드: 유니코드 코드 포인트 단위의 값

```js
const s = "😀";

console.log(
  "high surrogate:",
  s.charCodeAt(0).toString(16)
); // high surrogate: d83d
console.log(
  "low surrogate:",
  s.charCodeAt(1).toString(16)
); // low surrogate: de00
console.log(
  "code point:",
  s.codePointAt(0).toString(16)
); // code point: 1f600
```

서로게이트 페어를 합치거나 유니코드 코드 포인트를 사용해 문자를 만들 수도 있다.

- `fromCharCode()` 메서드: 16비트 코드 유닛을 받아 문자 생성
- `fromCodePoint()` 메서드: 유니코드 코드 포인트를 받아 문자 생성

```js
const highSurrogate = 0xd83d;
const lowSurrogate = 0xde00;
const codePoint = 0x1f600;

console.log(String.fromCharCode(highSurrogate, lowSurrogate)); // 😀
console.log(String.fromCodePoint(codePoint)); // 😀
```

**서로게이트 페어로 표현된 문자열은 자바스크립트에서 UTF-16 코드 유닛 기준 길이가 2라는 점에 주의해야 한다.** 문자열을 잘못 잘라서 사용하면 서로게이트 페어의 절반만 남아 문제가 될 수 있다. 문자열 자르기, 커서 이동, 삭제, 길이 제한 등을 구현할 때는 문자 경계를 고려해야 한다.

```js
const s = "😀";

console.log(s.length); // 2
s.slice(0, 1); // D83D DE00 중 D83D 만 잘라서 사용하는 케이스
```

흔히 사용하는 한자 대부분은 U+FFFF 이하이므로 서로게이트 페어가 아니다. 하지만 이번 프로젝트에서 [react-pdf](https://react-pdf.org/) 라이브러리를 사용할 때 서로게이트 페어가 제대로 처리되지 않아 일부 한자와 특수 문자가 깨지는 현상이 있었다.

위 예시처럼 서로게이트 페어로 표현된 문자열의 UTF-16 코드 유닛 기준 길이가 2라는 점을 고려하지 않은 코드가 원인이었다. 한국어와 영어를 주로 사용하는 내게는 미처 고려하지 못했던 오류였다. react-pdf 라이브러리에서 서로게이트 페어가 제대로 처리되지 않으면 아래 이미지의 왼쪽 영역처럼 문자가 비정상적으로 깨져 보인다.

<div align="center">
  <img src="{{ site.image_url_2026 }}/surrogate-pair-01.png" width="100%" class="image__border">
</div>
<center>https://github.com/diegomura/react-pdf/pull/3423</center>

<br/>

이 문제는 [PR #3423](https://github.com/diegomura/react-pdf/pull/3423)에서 해결됐다. 이전 코드와 개선된 코드를 비교해 보자. 먼저 문제가 있었던 기존 코드는 `for` 루프의 인덱스를 통해 문자를 하나씩 탐색하면서 유니코드를 처리했다. 문제가 발생하는 지점은 주석으로 표시했다.

```js
const fontSubstitution =
  () =>
  ({ string, runs }: AttributedString) => {
    let index = 0;
    ...
      // 서로게이트 페어로 표현된 문자의 경우 길이가 2이지만, 이를 고려하지 않고 무조건 j 인덱스가 1씩 증가한다.
      for (let j = 0; j < chars.length; j += 1) {
        // 문자열의 특정 인덱스에 위치한 문자를 1개만 가져온다. 이 시점에 서로게이트 페어가 끊어진다.
        const char = chars[j];
        // 해당 문자의 유니코드를 가져온다. High 서로게이트의 유니코드, Low 서로게이트의 유니코드를 각각 획득한다.
        const codePoint = char.codePointAt(0);
        ...
        index += char.length; // index 변수를 무조건 1만큼 증가시킨다.
      }
    ...
  };
```

수정된 코드는 `j` 인덱스를 무조건 1씩 증가시키지 않는다. 먼저 해당 문자의 유니코드 코드 포인트가 16비트를 초과하는지 확인한다. 16비트를 초과하면 서로게이트 페어로 표현된 문자로 판단하고 문자열 길이를 2로 처리한다. 주요 변경 사항은 주석으로 표시했다.

```js
const fontSubstitution =
  () =>
  ({ string, runs }: AttributedString) => {
      let index = 0;
      ...
      let j = 0;
      while (j < chars.length) {
        // 문자열의 특정 인덱스에 위치한 유니코드 코드 포인트를 획득
        const codePoint = chars.codePointAt(j)!;
        // 유니코드 코드 포인트가 16비트보다 큰 경우 문자 길이를 2로 취급한다.
        const charLength = codePoint > 0xffff ? 2 : 1;
        ...
        j += charLength; // j 변수를 2만큼 증가시킨다.
        index += charLength; // index 변수를 2만큼 증가시킨다.
      }
    }
    ...
  };
```

#### REFERENCE

- <https://262.ecma-international.org/16.0/#sec-ecmascript-language-types-string-type>
- <https://developer.mozilla.org/en-US/docs/Glossary/UTF-16#utf-16_in_javascript>
- <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#utf-16_characters_unicode_code_points_and_grapheme_clusters>
- <https://cdn.standards.iteh.ai/samples/76835/46bd0c6c19d04aca81ea546ece3c6417/ISO-IEC-10646-2020.pdf>
- <https://www.unicode.org/faq/utf_bom.html>
- <https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-5/#G11318>
- <https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G22582>
- <https://www.unicode.org/versions/Unicode16.0.0/core-spec/chapter-3/#G2630>
- <https://react-pdf.org/>
- <https://github.com/diegomura/react-pdf/pull/3423>
- <https://github.com/diegomura/react-pdf/pull/3423/changes/d730be5092bd9602f001dcaf8b64c0e07948885e>
