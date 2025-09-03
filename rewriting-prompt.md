아래 정의된 규칙은 

1. 문장 어조 변경
- `-이다` 체로 변경 (공식적 → 서술형)

2. 마크다운 불릿 포인트 변경
- `*`를 `-` 로 변경

3. 이미지 경로 및 이름 변경
- 글에서 사용한 모든 이미지들에 대해 적용
- 이미지 확장자 `.jpg` 포맷을 `.png`로 변경
- 이미지 경로를 `/images/posts/2021`로 변경
- 이미지 이름 끝 숫자를 1, 2 → 01, 02 형식으로 변경
- 이미지 태그의 스타일(width, class name) 등은 유지
- <img> 감싸는 <p> 태그를 <div> 태그로 변경

4. 이미지 파일 이동 및 변환
- 글에서 사용한 모든 이미지(jpg, jpeg, png, gif)에 대해 적용
- mv 명령어를 사용한 실제 이미지 파일을 /images 에서 /images/posts/[year] 로 이동할 수 있는 명령어를 생성
- 명령어는 아래 `bash` 코드 블럭 예시를 참조한다. 

```bash
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/transcation-isolation-1.JPG /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/transcation-isolation-01.png
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/transcation-isolation-2.JPG /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/transcation-isolation-02.png
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/transcation-isolation-3.JPG /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/transcation-isolation-03.png
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/transcation-isolation-4.JPG /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/transcation-isolation-04.png
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/transcation-isolation-5.JPG /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/transcation-isolation-05.png
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/transcation-isolation-6.JPG /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/transcation-isolation-06.png
```

5. 문서 들여쓰기 및 태그 변경
- 코드 블록 내부의 들여쓰기를 space 4 사이즈로 유지한다.
- 문서 맨 위 YAML `category` 부분은 변경하지 않는다.
- 나머지 본문 들여쓰기 space 2로 통일
- <div> 혹은 <p>로 감싸진 <img> 태그의 들여쓰기도 `space 2`로 통일
- 같은 문단 내 문장들 한 줄로 합침

6. 글 제목 한글화
- 문서 맨 위 YAML `title`은 영어로 작성된 경우 한글로 번역한다.
- 글 본문에 작성된 헤더는 변경하지 않는다.

7. 리스트 순서
- 리스트 순서가 `1. 1. 1.` 처럼 되어 있는 경우 `1. 2. 3.`처럼 순서에 맞게 리스트를 만든다.

8. 기타
- 정확한 실제 경로 기반 이미지 이동 및 변환 명령어 제공
- 스크립트 대신 단순 명령어 커맨드 형태 요청
- mv 명령어를 활용한 간단한 파일 이동 및 이름 변경 명령어 제공
- 어색한 문장이나 오타, 띄어쓰기 수정
- last_modified_at - 현재시간으로 변경

9. 주의사항
- **코드 블럭(```)은 절대 변경하지 않는다.**
- **인용문(>)은 절대 변경하지 않는다.**

위 명령어를 순차적으로 실행하고, `[year]` 변수는 프롬프트를 통해 전달받는다.
실행 결과는 txt 파일로 생성한다. 가능하다면 다운로드 받을 수 있도록 링크를 생성 후 제공한다.