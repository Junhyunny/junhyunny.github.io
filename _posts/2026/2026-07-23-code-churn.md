---
title: "코드 변화 빈도 - 코드 천(code churn)"
search: false
category:
  - information
  - software-engineering
  - code-churn
last_modified_at: 2026-07-23T22:33:11+09:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [코드 복잡도(code complexity)][code-complexity-link]

## 0. 들어가면서

지난 글에서 정리한 [코드 복잡도(code complexity)][code-complexity-link]에 이어 코드 천(code churn)에 대해 알아보자.

## 1. 코드 천(Code Churn)

> 일정 기간 동안 하나의 소프트웨어 구성요소에서 발생한 코드 변경의 양

**코드 천(Code Churn)**은 파일이나 모듈이 일정 기간 동안 얼마나 많이 변화했는지를 의미한다. 코드 천은 버전 관리 시스템(Git 등)에서 발생하는 파일 변경 정보를 바탕으로 기계적으로 계산한 정량적 수치다. 절대 코드 천(Absolute/Gross Code Churn)은 단순히 추가된 코드 라인 수와 삭제된 코드 라인 수를 합친 값이다. 아래 계산식으로 구할 수 있다.

```
Gross Code Churn = 추가된(Added) 코드 라인 수 + 삭제된(Deleted) 코드 라인 수
```

전통적으로 코드 천은 단순한 코드의 추가/삭제 라인 수(LOC, Line of Code)의 절댓값으로 측정해 왔다. 그러나 [**마이크로소프트 연구소(Microsoft Research)**의 나치아판 나가판(Nachiappan Nagappan)과 토마스 볼(Thomas Ball)은 2005년 연구를 통해 단순한 절대적 코드 천(Absolute Code Churn) 지표는 결함 예측에 효과적이지 않다는 한계](https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/icse05churn.pdf)를 지적했다.

이들은 전체 코드 크기 및 기타 프로세스 변수와 연계해 표준화한 상대적 코드 천(Relative Code Churn) 메트릭 스위트를 정립했다. 이를 통해 시스템 배포 후 발생할 결함 밀도(Defect Density)를 약 89.0%의 정확도로 예측할 수 있었다고 한다. 상대적 코드 천은 다음 계산식으로 구할 수 있다.

```
Relative Churn(%) = Changed LOC / Component LOC
```

LinearB라는 도구에서는 코드 천을 재작업 비율(rework rate)이라고도 부른다. LinearB에서 % 단위로 표기하는 코드 천은 대체로 재작업 비율이다. 상대적 코드 천과는 계산식이 조금 다르다.

```
Rework Rate = 재작업으로 분류된 LOC / 전체 변경 LOC × 100
```

예를 들어, 이번 기간의 전체 코드 변경이 1,000줄이고, 그중 작성 후 21일 이내에 다시 수정된 코드가 80줄이라면 코드 천은 다음과 같다.

```
80 / 1,000 × 100 = 8%
```

해당 기간의 개발 활동 중 8%가 최근 작성한 코드의 재작업이었다는 의미다.

코드 천은 변화량 또는 재작업을 나타내는 신호이지, 그 자체로 품질 저하를 증명하는 지표는 아니다. 아래와 같은 상황에서 높은 코드 천은 자연스럽다.

- 초기 프로토타이핑과 실험
- 대규모 리팩터링
- 프레임워크 또는 언어 마이그레이션
- 기술 부채 제거
- 자동 생성 파일 변경
- 코드 포매터 적용
- 파일 이동이나 이름 변경
- 브랜치 통합 또는 대규모 병합
- 요구사항이 의도적으로 빠르게 변하는 탐색 단계

반대로 문제가 될 가능성이 있는 상황은 다음과 같다.

- 안정화 단계인데 최근 작성한 코드가 반복해서 수정된다.
- 같은 파일이 결함 수정 때문에 계속 변경된다.
- 릴리스 직전에도 변경량이 줄지 않는다.
- 복잡한 파일에 변경이 집중된다.
- 비슷한 요구사항이 여러 차례 다시 구현된다.
- 리뷰 후 또는 병합 직후 지속적인 수정이 발생한다.

높은 코드 천은 결함이나 낮은 생산성을 직접 증명하지 않는다. 다만 프로젝트 단계, 코드 복잡도, 결함 이력 및 릴리스 일정과 결합하면 조사 대상을 찾는 조기 신호로 사용할 수 있다. 코드 천이 높은 파일의 복잡도가 높거나 반복되는 결함 수정이 있었다면 우선 조사할 가치가 높은 영역이다.

## 2. 코드 천 측정하기

Git 명령어만으로 코드 천을 확인할 수 있지만, 변경된 코드 라인 수 정도만 확인할 수 있다. 상대적 코드 천이나 21일 이내의 재작업 비율처럼 별도의 계산이 필요한 지표는 구하기 어려울 수 있다.

| 지표 | Git CLI 획득 가능 여부 | 정확도 |
|---|---:|---|
| Added LOC | 가능 | 정확 |
| Deleted LOC | 가능 | 정확 |
| Gross Churn = Added + Deleted | 가능 | 정확 |
| 파일별 변경 횟수 | 가능 | 정확 |
| Relative Churn | 가능 | 분모 정의 필요 |
| 21일 이내 Rework | 스크립트 필요 | 근사 또는 복잡한 추적 필요 |
| Hatica·LinearB 같은 제품과 동일한 수치 | 사실상 어려움 | 제품 내부 알고리즘 필요 |

예를 들어, Git 명령어를 사용하면 두 커밋 사이의 최종 차이를 간단히 확인할 수 있다.

```
$ git diff --numstat <start-commit> <end-commit>
```

위 명령어를 수행하면 다음과 같은 결과를 얻을 수 있다.

```
100    30    src/UserService.java
20     10    src/UserController.java
```

두 커밋 사이의 절대 코드 천은 160 LOC다.

```
Added LOC   = 120
Deleted LOC = 40
Gross Churn = 160 LOC
```

특정 기간에 발생한 모든 변경 활동을 확인하는 방법도 있다. 지난 30일간의 중간 변경까지 모두 포함한다.

```
$ git log \
  --since="30 days ago" \
  --no-merges \
  --numstat \
  --format="" |
awk '
  $1 ~ /^[0-9]+$/ && $2 ~ /^[0-9]+$/ {
    added += $1
    deleted += $2
  }
  END {
    print "Added:", added
    print "Deleted:", deleted
    print "Gross churn:", added + deleted
  }
'
```

위 명령어를 실행하면 다음과 같은 결과를 얻는다.

```
Added: 59275
Deleted: 47301
Gross churn: 106576
```

변경 빈도(커밋 수)와 코드 천을 한 번에 살펴보자.

```
$ {
  printf "%-8s %-8s %-8s %-8s %s\n" \
    "Commits" "Added" "Deleted" "Churn" "File"

  git log \
    --since="6 months ago" \
    --no-merges \
    --numstat \
    --pretty=format:COMMIT |
  awk '
    /^COMMIT$/ {
      delete seen
      next
    }

    $1 ~ /^[0-9]+$/ && $2 ~ /^[0-9]+$/ {
      file = $3

      added[file] += $1
      deleted[file] += $2

      if (!seen[file]++) {
        commits[file]++
      }
    }

    END {
      for (file in commits) {
        printf "%8d %8d %8d %8d %s\n",
          commits[file],
          added[file],
          deleted[file],
          added[file]+deleted[file],
          file
      }
    }
  ' |
  sort -k1,1nr |
  head -30
}
```

내 블로그 리포지터리에서 위 명령어를 실행하면 다음과 같이 출력된다.

```
Commits  Added    Deleted  Churn    File
      10      318       27      345 _posts/2026/2026-03-06-cve-2026-25639.md
       9      340       23      363 _posts/2026/2026-04-25-python-generator-function.md
       8      288       21      309 _posts/2026/2026-05-01-python-with-keyword-and-context-manager.md
       7      214      148      362 _sass/_custom.scss
       7      216       19      235 _posts/2026/2026-01-24-playwright-testing-camera-stream-mocking.md
       7      259       16      275 _posts/2026/2026-01-27-open-api-spec-with-orval.md
       7      279       49      328 _posts/2026/2026-04-13-cve-2025-62718-axios-confused-proxy.md
       7      512        8      520 _posts/2026/2026-02-11-using-mock-service-worker-with-orval.md
...
```

## CLOSING

Git 명령어 외에도 오픈 소스 도구로 코드 천을 확인할 수 있다. 좋은 도구가 있다면 사용해도 좋다. AI를 활용하면 이 글에서 살펴본 것과 같은 스크립트도 쉽게 만들 수 있다. 입맛에 맞게 명령어를 만들어 현재 프로젝트에서 어떤 코드를 주의 깊게 살펴봐야 할지 찾아보는 것도 좋을 것 같다.

#### REFERENCE

- <https://www.microsoft.com/en-us/research/wp-content/uploads/2016/02/icse05churn.pdf>
- <https://www.em-tools.io/engineering-metrics/code-churn>
- <https://www.youtube.com/watch?v=gpz5qPQ_TYQ>
- <https://oobeya.io/glossary/code-churn>
- <https://docs.enterprise.codescene.io/versions/1.7.0/configuration/hotspot-metrics.html>
- <https://docs.enterprise.codescene.io/versions/3.0.12/guides/technical/code-churn.html>
- <https://linearb.io/blog/what-is-code-churn>
- <https://www.repowise.dev/blog/comparisons/best-open-source-codescene-alternatives>

[code-complexity-link]: https://junhyunny.github.io/information/software-engineering/code-complexity/code-complexity/
