---
title: "Custom Action in Github Actions"
search: false
category:
  - github
last_modified_at: 2024-08-30T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [Github Actions Basic][github-actions-link]
- [Github Actions Example][github-actions-example-link]
- [Optimize Github Actions][optimize-github-actions-link]

## 0. 들어가면서

액션(action)은 깃허브 액션스 워크플로우(workflow)에서 재사용 가능한 함수 같은 기능이다. 만들어진 액션을 사용할 수도 있지만, 직접 만들어서 사용할 수 있다. 액션은 별도 레포지토리에 만들 수도 있고, 파이프라인이 동작하는 프로젝트 내부에 만들 수도 있다. 이 글은 커스텀 액션을 만드는 두 가지 방법을 모두 다룬다. 

- 별도 레포지토리
- 내부 레포지토리

이번 글은 커스텀 액션을 만들어 사용하는 방법에 대해 정리했다. 깃허브 액션스에 대한 용어가 친숙하지 않은 경우 이전 글들을 참고하길 바란다. **컬리 브레이스({})로 변수를 표시할 때 필자의 블로그 프레임워크 지킬(jekyll)의 문법 문제로 사이에 공백을 추가했다. 만약 해당 예제를 사용하다면 공백을 제거 후 사용하길 바란다.**

## 1. Workflow with custom actions

커스텀 액션을 사용하는 워크플로우의 작업(job)들을 먼저 살펴보자. 

1. sum
    - junhyunny/sum 레포지토리에 위치한 액션을 실행한다. 
        - `@main`은 브랜치 정보이다. 
    - 파라미터는 `with`라는 키워드를 통해 전달할 수 있으며 다음과 같은 값을 전달한다.
        - x 변수의 값은 10 이다.
        - y 변수의 값은 5 이다.
    - junhyunny/sum 액션의 실행 결과는 출력한다.
        - 작업에 포함된 스텝(step)들 중 `id-sum` 식별자를 갖는 액션의 결과를 로그로 출력한다.
        - `sum-result`는 해당 커스텀 액션의 `outputs` 객체에 지정되어 있다.
2. minus
    - 워크플로우가 동작하는 레포지토리에 위치한 액션을 실행한다.
    - 위와 동일하게 파라미터는 `with`라는 키워드를 통해 전달할 수 있으며 다음과 같은 값을 전달한다.
        - x 변수의 값은 10 이다.
        - y 변수의 값은 5 이다.
    - minus 액션의 실행 결과는 출력한다.
        - 작업에 포함된 스텝들 중 `id-minus` 식별자를 갖는 액션의 결과를 로그로 출력한다. 
        - `minus-result`는 해당 커스텀 액션의 `outputs` 객체에 지정되어 있다.

```yml
name: Demo workflow
on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  sum: # 1
    runs-on: ubuntu-latest
    steps:
      - id: id-sum
        uses: junhyunny/sum@main
        with:
          x: 10
          y: 5
      - name: result
        run: |
          echo "sum result is ${ { steps.id-sum.outputs.sum-result } }"
  minus: # 2
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - id: id-minus
        uses: ./.github/actions/minus
        with:
          x: 10
          y: 5
      - name: result
        run: |
          echo "minus result is ${ { steps.id-minus.outputs.minus-result } }"
```

## 2. In the seperate repository

먼저 별도 레포지토리에 커스텀 액션을 만들어보자. 예제를 위해 `sum`이라는 새로운 레포지토리를 만든다. 해당 레포지토리 루트에 `action.yml` 파일을 만든다.

<div align="center">
  <img src="/images/posts/2024/custom-action-in-github-actions-01.png" width="100%" class="image__border">
</div>

<br/>

action YAML 파일에는 다음과 같은 내용이 포함된다. 

1. 커스텀 액션의 이름을 정의한다.
    - 액션의 이름은 `Sum`이다.
2. inputs
    - 이 커스텀 액션을 사용하는 워크플로우에서 `with` 키워드로 전달한 파라미터가 여기로 매핑된다. 
3. outputs
    - 이 커스텀 액션 실행 결과를 `sum-result` 변수에 저장한다.
    - 이 커스텀 액션을 사용하는 워크플로우에선 `steps.{custom-action-step-id}.outputs.sum-result`을 통해 이 값에 접근할 수 있다.
  - sum-result 변수에 저장되는 값은 `steps.{step-id}.outputs.{key}`이다.
4. 커스텀 액션은 반드시 `"composite"`을 사용한다.
5. 연산 결과는 깃허브 액션스에서 제공하는 저장 공간인 `$GITHUB_OUTPUT`에 저장한다.
    - `echo "{key}={value}" >> $GITHUB_OUTPUT` 스크립트를 실행하면 $GITHUB_OUTPUT 저장 공간에 해당 키, 값이 저장된다.

```yml
name: Sum # 1
description: Sum

inputs: # 2
  x:
    default: 0
  y:
    default: 0

outputs: # 3
  sum-result:
    value: ${ { steps.sum.outputs.result } }
    description: sum result

runs:
  using: "composite" # 4
  steps:
    - id: sum
      shell: bash
      run: echo "result=$((${ { inputs.x  } } + ${ { inputs.y  } }))" >> $GITHUB_OUTPUT # 5
```

커스텀 액션의 실행 결과 값을 전달할 때 주의할 점은 $GITHUB_OUTPUT 저장 공간에 저장할 때 사용한 키 이름과 커스텀 액션의 결과 값을 전달할 때 사용하는 키 이름이 동일해야 한다는 것이다. 아래 두 이름은 동일해야 한다.

- 커스텀 액션의 실행 결과 값인 `steps.{step-id}.outputs.{key}`의 `{key}`
- $GITHUB_OUTPUT 저장 공간에 저장하는 명령어 `echo "{key}={value}" >> $GITHUB_OUTPUT`의 `{key}`

## 3. In the project repository

워크플로우가 동작하는 레포지토리에 커스텀 액션을 만들어보자. 동일한 레포지토리에 커스텀을 액션을 만드는 경우 다음과 같은 규칙을 지켜야 한다.

1. 워크플로우 파일이 위치한 `.github` 폴더에 `actions/{action-name}` 폴더를 만든다.
2. `actions/{action-name}` 폴더에 `action.yml` 파일을 만든다. 

```
.
├── workflows
│   └── demo-workflow.yml
└── actions
    └── minus
        └── action.yml
```

위처럼 action YAML 파일을 만들었다면 커스텀 액션을 정의해보자. 위와 동일하지만, 결과 값을 매칭할 때 이름이 다르다. 

1. 커스텀 액션의 이름을 정의한다.
    - 액션의 이름은 `Minus`이다.
2. inputs
    - 이 커스텀 액션을 사용하는 워크플로우에서 `with` 키워드로 전달한 파라미터가 여기로 매핑된다. 
3. outputs
    - 이 커스텀 액션 실행 결과를 `minus-result` 변수에 저장한다.
    - 이 커스텀 액션을 사용하는 워크플로우에선 `steps.{custom-action-step-id}.outputs.minus-result`을 통해 이 값에 접근할 수 있다.
  - minus-result 변수에 저장되는 값은 `steps.{step-id}.outputs.{key}`이다.
4. 커스텀 액션은 반드시 `"composite"`을 사용한다.
5. 연산 결과는 깃허브 액션스에서 제공하는 저장 공간인 `$GITHUB_OUTPUT`에 저장한다.
    - `echo "{key}={value}" >> $GITHUB_OUTPUT` 스크립트를 실행하면 $GITHUB_OUTPUT 저장 공간에 해당 키, 값이 저장된다.

```yml
name: Minus
description: Minus

inputs:
  x:
    default: 0
  y:
    default: 0

outputs:
  minus-result:
    value: ${ { steps.minus.outputs.aaa} } 
    description: minus result

runs:
  using: "composite"
  steps:
    - id: minus
      shell: bash
      run: echo "aaa=$((${ { inputs.x } }  - ${ { inputs.y } } ))" >> $GITHUB_OUTPUT
```

이번 예제에서 결과 값을 저장할 때 키 값을 `aaa`로 지정했다. 이 커스텀 액션의 결과 값인 outputs 객체에서 참조할 때도 동일하게 `aaa`를 사용했다.

## 4. Run Workflow

외부 레포지토리에 만든 커스텀 액션을 실행하면 다음과 같은 로그를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/custom-action-in-github-actions-02.png" width="100%" class="image__border">
</div>

<br/>

동일 레포지토리에 만든 커스텀 액션을 실행하면 다음과 같은 로그를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2024/custom-action-in-github-actions-03.png" width="100%" class="image__border">
</div>


#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/custom-github-actions>
- <https://github.com/Junhyunny/sum>

#### REFERENCE

- <https://www.daleseo.com/github-actions-composite/>
- <https://docs.github.com/en/actions/sharing-automations/creating-actions/metadata-syntax-for-github-actions#runs-for-composite-actions>
- <https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/workflow-commands-for-github-actions#setting-an-output-parameter>

[github-actions-link]: https://junhyunny.github.io/information/github/dev-ops/github-actions/
[github-actions-example-link]: https://junhyunny.github.io/information/github/dev-ops/github-actions-example/
[optimize-github-actions-link]: https://junhyunny.github.io/information/github/dev-ops/optimize-github-actions/