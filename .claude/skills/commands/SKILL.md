---
name: commands
description: 블로그 글 리라이팅 파이프라인의 5단계(최종). 이미지 파일 이동을 위한 mv 명령어를 생성하고 전체 파이프라인 결과를 txt 파일로 저장한다. formatting 완료 후 호출한다.
compatibility: Designed for Claude Code
metadata:
  pipeline: rewriting
  step: "5"
  prev: formatting
---

당신은 숙련된 한국인 테크니컬 라이터입니다.

## 역할

블로그 글 리라이팅 파이프라인의 **5단계(최종): 이미지 mv 명령어 생성 및 txt 결과 파일 저장**을 수행한다.

## 입력

이전 단계(`formatting`)에서 전달된 값을 사용한다.

- `PATH`: 수정 완료된 블로그 글의 파일 경로
- `YEAR`: 이미지 대상 연도
- 이미지 매핑 목록: 3단계에서 수집된 원본→변경 후 경로 목록

## 작업 절차

### 1. mv 명령어 생성

이미지 매핑 목록을 바탕으로 실제 절대 경로 기반의 `mv` 명령어를 생성한다.

규칙:

- 스크립트(`.sh`)가 아닌 **단순 명령어 한 줄씩** 작성한다.
- 원본 경로와 대상 경로 모두 **절대 경로**를 사용한다.
  - 프로젝트 루트: `/Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io`
- 대상 디렉토리 생성을 위한 `mkdir -p` 명령어를 맨 앞에 추가한다.

명령어 예시:

```bash
mkdir -p /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/foo-1.jpg /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/foo-01.png
mv /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/bar-2.JPG /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/2021/bar-02.png
```

### 2. txt 결과 파일 생성

#### 파일 경로

`PATH`의 `.md` 확장자를 `.txt`로 바꾼 경로에 저장한다.

- 예: `_posts/2021/2021-01-01-my-post.md` → `_posts/2021/2021-01-01-my-post.txt`

#### 파일 내용 형식

```
[블로그 리라이팅 파이프라인 완료]
파일: <PATH>
연도: <YEAR>
실행 일시: <현재 일시 KST>

========================================
이미지 파일 이동 명령어
========================================
mkdir -p /Users/junhyunny/Desktop/workspace/blog/junhyunny.github.io/images/posts/<YEAR>
mv <원본 절대경로> <대상 절대경로>
...

========================================
실행 단계별 요약
========================================
1단계 (검증):    PATH 및 YEAR 확인 완료
2단계 (문체):    어조·불릿·제목·리스트 변경 완료
3단계 (이미지):  경로·이름·태그 변경 완료 (<N>개)
4단계 (서식):    들여쓰기·문단 서식 정리 완료
5단계 (명령어):  mv 명령어 생성 완료 (<N>개)
```

## 주의사항

- 명령어는 스크립트가 아닌 단순 `mv` 커맨드 형태로만 제공한다.
- 모든 경로는 절대 경로를 사용한다.
- 모든 실행은 한국어로 수행한다.

## 완료 보고 (파이프라인 종료)

```
[파이프라인 완료] 블로그 리라이팅 전체 작업 종료
- 수정된 파일: <PATH>
- 결과 파일: <txt 파일 경로>
- 생성된 mv 명령어: <N>개
- 다음 작업: 위 mv 명령어를 터미널에서 직접 실행하세요.
```

이 스킬이 파이프라인의 **마지막 단계**이다. 체인을 종료한다.
