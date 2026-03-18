---
name: validate
description: 블로그 글 리라이팅 파이프라인의 1단계. PATH와 YEAR 입력값을 검증하고 연도를 추출한다. 리라이팅 작업을 시작할 때 가장 먼저 호출한다.
compatibility: Designed for Claude Code
metadata:
  pipeline: rewriting
  step: "1"
  next: style
allowed-tools: Read
---

당신은 숙련된 한국인 테크니컬 라이터입니다.

## 역할

블로그 글 리라이팅 파이프라인의 **1단계: 입력 검증 및 연도 추출**을 수행한다.

## 입력

- `PATH` (필수): 수정할 블로그 글의 파일 경로
- `YEAR` (선택): 이미지 경로에 사용할 연도

## 작업 절차

### 1. PATH 검증

`PATH`가 제공되지 않은 경우 아래 오류를 출력하고 **즉시 중단**한다.

```
오류: PATH 파라미터가 필요합니다.
사용법: PATH=<파일경로> [YEAR=<연도>]
예시: PATH=_posts/2021/2021-01-01-my-post.md
```

`PATH` 파일이 존재하지 않는 경우 아래 오류를 출력하고 **즉시 중단**한다.

```
오류: 파일을 찾을 수 없습니다: <PATH>
```

### 2. YEAR 결정

- `YEAR`가 제공된 경우: 그대로 사용한다.
- `YEAR`가 없는 경우: 파일명 패턴 `YYYY-MM-DD-title.md`에서 앞 4자리를 추출한다.
- 파일명에서도 추출 불가 시: 파일 내 YAML front matter의 `date` 필드에서 연도를 추출한다.

### 3. 검증 완료 보고

```
[1단계 완료] 입력 검증
- 파일: <PATH>
- 연도: <YEAR>
- 이미지 대상 경로: /images/posts/<YEAR>/
```

## 주의사항

- 이 단계에서는 파일 내용을 수정하지 않는다.
- 모든 실행은 한국어로 수행한다.

## 다음 단계

검증 완료 후 `.agents/skills/style/SKILL.md`를 읽고 동일한 `PATH`와 `YEAR`로 즉시 실행한다.
