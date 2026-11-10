# 코드 글꼴

코드 블록과 인라인 코드에 쓰는 [D2Coding](https://github.com/naver/d2codingfont) 1.3.2(Build 20180524)의 일부 글자만 담은 파일이다.

- Copyright (c) 2015-2016 NHN Corporation. Font designed by FONTRIX Inc.
- 라이선스: [SIL Open Font License 1.1](https://github.com/naver/d2codingfont/blob/master/LICENSE)

| 파일 | 담은 글자 |
| --- | --- |
| `d2coding-latin.woff2` | ASCII, Latin-1, 일반 문장 부호, 화살표·수학·기술 기호, 원 숫자, 선 그리기·블록·도형·기타 기호 |
| `d2coding-hangul.woff2` | 한글 호환 자모, KS X 1001 완성형 한글 2,350자 |

D2Coding을 쓰는 이유: 한글이 영문 두 칸, 선·화살표 기호가 영문 한 칸 폭이어서 텍스트 다이어그램의 줄이 맞는다.
Consolas·SF Mono에는 한글과 일부 기호(▶, △ 등)가 없어 브라우저가 다른 글꼴로 대신 그리면서 폭이 달라진다.

`site.css`의 `@font-face` `unicode-range`는 위 표의 범위와 같아야 한다.
다시 만들 때는 npm `d2coding@1.3.2`의 `d2coding-full.ttf`에서 위 범위의 글자를 `subset-font`로 woff2로 추린다.
`d2coding-latin.woff2`는 추리기 전에 `|`(U+007C) 글리프 모양을 같은 폭의 `│`(U+2502) 모양으로 바꿨다(opentype.js).
원본의 `|`는 가운데가 끊긴 모양(¦)이라 다이어그램의 세로선이 점선처럼 보이기 때문이다.
