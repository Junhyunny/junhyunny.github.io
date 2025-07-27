---
title: "AWS Bedrock 멀티 에이전트(multi-agent) 예제"
search: false
category:
  - ai
  - llms
  - large-language-model
  - aws
  - bedrock
  - ai-agent
  - multi-agent
  - architecture
last_modified_at: 2025-07-25T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [AWS Bedrock 에이전트(agent) 예제][aws-bedrock-agent-api-link]

## 1. What is multi agent?

LLM 시스템의 성능을 향상시키는 방법은 크게 두 가지로 나눌 수 있다. 

- LLM 자체를 강화
  - 모델 크기나 사전 학습 데이터를 확장
  - 특정 도메인에 대해 모델을 미세 조정하는 파인 튜닝(fine tuning)
  - RLHF(Reinforcement Learning with Human Feedback), SFT(Supervised Fine-Tuning) 등의 파라미터 튜닝
- 그 외에 방법
  - 프롬프트 엔지니어링
  - 에이전트

[이전 글][aws-bedrock-agent-api-link]에서도 이야기했지만, 일반 LLM(혹은 파운데이션 모델)은 학습된 지식을 기반으로만 동작하므로 한계가 있다. 에이전트(agent)는 이런 LLM의 한계를 극복하고 성능을 향상시키기 위해 주변 도구(API, 데이터베이스, 세션 등)들을 사용하고 실질적인 작업을 수행하는 소프트웨어를 의미한다. LLM의 부족함을 채우기 위해 에이전트는 다음과 같은 기능들을 지원한다. 

- RAG(Retrieval-Augmented Generation) 
  - 외부 지식 기반(DB, 벡터 스토어)을 질의 시점에 결합한다.
  - 최신 정보나 문맥을 반영하여 환각(hallucination) 현상을 줄인다.
- 도구 사용(Tool Usage)
  - 계산기, 코드 실행기, 데이터 API 등 외부 도구를 LLM과 연동한다.
  - Toolformer, Function Calling 등의 기술이 있다.
- Memory / Scratchpad / State 관리
  - 기본적으로 LLM은 무상태(stateless)로 이전 대화나 정보를 저장하지 않으므로 랭체인(langchain) 같은 프레임워크를 통해 상태를 저장한다.
  - 중요한 정보만 선별하여 LLM에게 재전달하고, 장기 기억/단기 기억으로 분리하는 것도 가능하다.

에이전트 자체를 강화하는 것도 방법이지만, 여러 에이전트가 상호 작용하여 공동의 목표를 달성하도록 하는 것도 하나의 방법이다. 이를 `멀티 에이전트 시스템(MAS, Multi Agent System)`이라고 한다. AI 에이전트마다 전문성을 강화하고, 각자 역할을 분담하고 맡은 업무를 처리한다. 에이전트들은 서로 상호 작용한다. 사람들처럼 에이전트들도 큰 작업을 분업을 하는 것이다. 시스템에 참여하는 에이전트들은 공유 리소스를 변경하여 직접 또는 간접적으로 다른 에이전트들에게 영향을 줄 수 있다. 여러 에이전트가 동일한 정책을 학습하지만, 학습한 경험을 공유하여 시간 복잡도와 효율성을 최적화한다.

멀티 에이전트 아키텍처는 에이전트 네트워크 그래프(agent network graph)를 어떻게 구성하느냐에 따라 달라진다.

- `중앙 집중형`은 네트워크에서 단일 서버가 AI 에이전트의 상호 작용과 정보를 제어한다. 이 오케스트레이터(ochestrator)는 전체 프로세스와 시스템을 추론하여 커뮤니케이션을 간소화하고 정보를 표준화한다.
- `분산형`은 네트워크에서 AI 에이전트가 서로 직접 상호 작용을 제어한다. 특화된 AI 에이전트들은 각자 달성하고자 하는 목표에 대해 공통의 이해와 공동의 책임을 갖는다.

에이전트 그래프를 어떻게 구성하는지에 따라 다음과 같은 구조들을 만들 수 있다.

<div align="center">
  <img src="/images/posts/2025/multi-agent-with-aws-bedrock-01.png" width="100%" class="image__border">
</div>
<center>https://medium.com/@learning_37638/agentic-patterns-architectures-for-coordinated-ai-systems-34d9d8d8e1e2</center>

## 2. Multi agent example in AWS BedRock

AWS 베드락(bedrock)은 중앙 집중형 아키텍처를 지원한다. 하나의 관리자(supervisor)가 다른 에이전트들과의 협업을 주도하는 방식이다. 관리자의 협력 설정(collaboration configuration)은 두 가지 있다. 

- Supervisor
  - 관리자 에이전트는 다른 에이전트들로부터 응답을 받아 조율하고 최종 결과를 반환한다.
- Supervisor with routing
  - 관리자 에이전트는 특정 태스크를 적합한 에이전트에게 전달하고, 그 응답을 반환한다.

<div align="center">
  <img src="/images/posts/2025/multi-agent-with-aws-bedrock-02.png" width="100%" class="image__border">
</div>

<br/>

이번 글에선 AWS 베드록을 통해 다음과 같은 멀티 에이전트 시스템을 구성한다.

1. 관리자 에이전트가 프롬프트를 받는다. 
2. 관리자 에이전트는 리서치 에이전트에게 자료 조사를 맡긴다. 리서치 에이전트는 자료 조사 후 결과를 응답한다.
3. 관리자 에이전트는 리서치 에이전트의 응답을 기반으로 차트 에이전트에게 차트 생성을 요청한다. 차트 에이전트는 차트를 생성하는 코드를 반환한다.
4. 관리자 에이전트는 리서치 에이전트와 차트 에이전트의 응답을 기반으로 사용자에게 적절한 응답을 한다.

<div align="center">
  <img src="/images/posts/2025/multi-agent-with-aws-bedrock-03.png" width="100%" class="image__border">
</div>

<br/>

AWS CLI 커맨드를 사용해서 에이전트를 생성한다. CLI 커맨드를 실행하기 전에 AWS 크레덴셜(credential)을 터미널 세션에 준비한다.

```
$ export AWS_ACCESS_KEY_ID=ABCDEFGHIJKLEMNOPQRSTUVWXYZ
$ export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLEMNOPQRSTUVWXYZ/1234567890
$ export AWS_SESSION_TOKEN=ABCDEFG ... 1234567890
``` 

먼저 리서치 에이전트와 차트 에이전트를 생성한다. 실행 스크립트 중 일부분만 살펴보자. 단일 에이전트를 만들고, 준비, 버전까지 만들어 배포하는 과정이 알고 싶다면 [이전 글][aws-bedrock-agent-api-link]을 참고하길 바란다.

- 에이전트 리소스를 실행할 수 있는 역할(role)의 ARN이 필요하다.
  - 해당 역할은 편의를 위해 `AmazonBedrockFullAccess` 권한 정책을 사용했다.
- 에이전트 이름에 따라 다른 프롬프트를 사용한다.
- 파운데이션 모델은 클로드3(claude3) Haiku를 사용한다.

```sh
#!/bin/bash

AGENT_RESOURCE_ROLE_ARN=$1
AGENT_NAME=$2
AGENT_ALIAS_NAME=$3

if [ "$AGENT_NAME" = "research-agent" ]; then
  INSTRUCTION=$(cat ./prompts/instruction-research.txt)
else
  INSTRUCTION=$(cat ./prompts/instruction-chart.txt)
fi

...

AGENT_ID=$(aws bedrock-agent create-agent \
  --region ap-northeast-1 \
  --agent-name "$AGENT_NAME" \
  --foundation-model "anthropic.claude-3-haiku-20240307-v1:0" \
  --instruction "$INSTRUCTION" \
  --agent-resource-role-arn "$AGENT_RESOURCE_ROLE_ARN" | jq -r '.agent.agentId')

...
```

각 지시문(instruction)을 살펴보자. 리서치 에이전트의 지시문은 다음과 같다. 차트를 그리기 위한 예제와 응답에 포함되는 각 필드의 의미를 정리했다. 실행하면 안 되는 작업들, 예외가 발생했을 때 재시도하는 횟수 등을 명시한다.

```
After the search, return the result with a list which has x, y data to draw chart.

ALWAYS, when you get the user prompt, search data from somewhere you can reach(e.g. web, memory, database, etc).
ALWAYS, after the search, return the result.
DO NOT write a code.
If you have an error, maximum retrial MUST be 10 times.
If you cannot make the result format, then throw error with an error message what is wrong.

ALWAYS, there are "xLabel", "yLabel", "links", "data" properties in the result. This is a result example.

- xLabel - x-axis label of chart
- yLabel - y-axis label of chart
- links - reference links where data comes from
- data - data for drawing the chart

{
  "xLabel": "year",
  "yLabel": "dollar(million)",
  "links": ["https://google.com", "https://reference.com" ...],
  "data": [{"x": 10, "y": 100}, {"x": 11, "y":101} ... ]
}
```

차트 에이전트의 지시문은 다음과 같다. 자신이 어떤 입력을 받을 것인지 미리 알려준다. 받은 요청을 바탕으로 어떤 차트를 그려야하는지 명시한다. 리서치 에이전트와 마찬가지로 예외 처리 방법을 명시한다.

```
When you get the prompt, make code to draw chart or graph.
ALWAYS, return code to draw chart. Default programming language is python, but user wants other language then use it.
If you have an error, maximum retrial MUST be 10 times.
In the prompt, there are "xLabel", "yLabel", "links", "data" properties.

- use "xLabel", "yLabel" as a label of chart
- use "data" to draw the chart
- attach the "links" as a text below the chart

One of "xLabel", "yLabel", "links", "data" is missing, then it is wrong format.
If there are other properties, use it properly to draw chart.

An input format what you need is in the below json block. This is an example.

- xLabel - x-axis label of chart
- yLabel - y-axis label of chart
- links - reference links where data comes from
- data - data for drawing the chart

{
  "xLabel": "year",
  "yLabel": "dollar(million)",
  "links": ["https://google.com", "https://reference.com" ...],
  "data": [{"x": 10, "y": 100}, {"x": 11, "y":101} ... ]
}
```

이제부터 에이전트를 만들어보자. 위 스크립트는 다음과 같이 실행한다. 스크립트를 실행했을 때 출력되는 결과는 관리자 에이전트에 협력자를 등록할 때 필요하기 때문에 메모해두길 바란다. 먼저 리서치 에이전트를 생성한다. 에이전트 이름은 `research-agent`다.

```
$ sh scripts/create-agent.sh \
 arn:aws:iam::123412341234:role/service-role/AmazonBedrockExecutionRoleForAgents_123412341234 \
 research-agent \
 V20250725-01

CREATED AGENT_ID = KNA7TQTVEY
CREATED AGENT_ALIAS_ARN = arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/KNA7TQTVEY/1JW8LP6P7N
```

동일한 스크립트로 차트 에이전트를 생성한다. 에이전트 이름은 `chart-agent`다.

```
$ sh scripts/create-agent.sh \
 arn:aws:iam::123412341234:role/service-role/AmazonBedrockExecutionRoleForAgents_123412341234 \
 chart-agent \
 V20250725-01

CREATED AGENT_ID = NX3D2AM8YD
CREATED AGENT_ALIAS_ARN = arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/NX3D2AM8YD/IIECMJTPXE
```

위 스크립트를 싱행하면 에이전트가 준비된 상태로 생성된다.

<div align="center">
  <img src="/images/posts/2025/multi-agent-with-aws-bedrock-04.png" width="100%" class="image__border">
</div>

<br/>

해당 에이전트 정보를 보면 위에서 지정한 지시문이 추가된 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/multi-agent-with-aws-bedrock-05.png" width="100%" class="image__border">
</div>

<br/>

다음 관리자 에이전트를 생성한다. 다음과 같은 스크립트를 사용한다. 

- 에이전트 리소스를 실행할 수 있는 역할의 ARN이 필요하다.
  - 위에서 사용한 역할 ARN과 동일하다.
- 다른 에이전트들과 어떤 식으로 협력해야 하는지 정리한 지시문을 제공한다.
  - 리서치 에이전트를 먼저 호출하고, 그 다음 차트 에이전트를 호출하는 등의 협력 순서를 정의한다.
  - 주의 사항을 함께 정리한다. 필자의 경우 관리자 에이전트가 코드를 변경하는 등의 작업을 해서 이를 금지시켰다.
- 파운데이션 모델은 클로드3 Haiku를 사용한다. 
- `agent-collaboration` 옵션을 `SUPERVISOR`로 지정한다. 이 옵션을 통해 멀티 에이전트를 활성화한다.

```sh
#!/bin/bash

AGENT_RESOURCE_ROLE_ARN=$1

INSTRUCTION=$(cat <<EOF
You are the main agent responsible for handling user requests by orchestrating other agents.

When the user request involves data retrieval and chart generation, follow this sequence:
1. First, call the research-agent to gather the necessary statistical or numerical data.
2. Second, if user wants to make chart or graph, then use chart-agent.
   If it includes a JSON object with a data array of x and y points,
   pass that response directly to the chart-agent to convert it into codes to drawing visual chart (e.g., bar or line graph).
3. Third, if the result from chart-agent has codes, return the code together.

Important:
- Do **not** summarize or paraphrase the chart-agent response.
- Do **not** remove or modify any parts of the code it returns.
- If the chart-agent responds with code, always **return the full code block exactly as-is** to the user.
- Do **not** inject your own explanation unless explicitly instructed by the user.
- The user expects to receive the full code for reproducibility.
EOF
)

AGENT_ID=$(aws bedrock-agent create-agent \
  --region ap-northeast-1 \
  --agent-name "supervisor-agent" \
  --foundation-model "anthropic.claude-3-haiku-20240307-v1:0" \
  --instruction "$INSTRUCTION" \
  --agent-collaboration SUPERVISOR \
  --agent-resource-role-arn "$AGENT_RESOURCE_ROLE_ARN" | jq -r '.agent.agentId')

echo "CREATED AGENT_ID = $AGENT_ID"
```

다음과 같이 실행한다. 생성한 관리자 에이전트의 ID는 멀티 에이전트 시스템을 구성할 때 필요하다.

```
$ sh scripts/create-supervisor.sh arn:aws:iam::123412341234:role/service-role/AmazonBedrockExecutionRoleForAgents_123412341234

CREATED AGENT_ID = ZLU5WVCBXN
```

이제 사전에 생성한 리서치 에이전트와 차트 에이전트를 멀티 에이전트의 협력자로 추가한다. 다음과 같은 스크립트를 사용한다.

- 관리자 에이전트 ID, 협력 에이전트 이름, 협력 에이전트의 별칭 ARN을 파라미터로 받는다.
  - 협력 에이전트의 별칭 ARN을 사용하는 이유는 별칭을 통해 특정 버전의 협력 에이전트를 사용하기 위함이다.
- 리서치 에이전트, 차트 에이전트인지에 따라 협력 지시문(collaboration instruction)이 다르다.

```sh
#!/bin/bash

SUPERVISOR_ID=$1
COLLABORATOR_NAME=$2
COLLABORATOR_AGENT_ALIAS_ARN=$3

if [[ "$COLLABORATOR_NAME" != research-agent* && "$COLLABORATOR_NAME" != chart-agent* ]]; then
  echo "❌ Usage: <AGENT_NAME> must start with 'research-agent' or 'chart-agent'"
  exit 1
fi

if [ "$COLLABORATOR_NAME" = "research-agent" ]; then
  INSTRUCTION=$(cat ./prompts/collaborator-instruction-research.txt)
else
  INSTRUCTION=$(cat ./prompts/collaborator-instruction-chart.txt)
fi

aws bedrock-agent associate-agent-collaborator \
  --region ap-northeast-1 \
  --agent-id "$SUPERVISOR_ID" \
  --agent-version DRAFT \
  --collaborator-name "$COLLABORATOR_NAME" \
  --agent-descriptor "aliasArn=$COLLABORATOR_AGENT_ALIAS_ARN" \
  --collaboration-instruction "$INSTRUCTION" \
  --relay-conversation-history TO_COLLABORATOR | jq .
```

협력 지시문은 일반 지시문과 다르다. 지시문은 해당 에이전트 자체의 역할과 동작 방식을 정의하는 설명이다. 에이전트는 이 지시문을 바탕으로 사용자 요청에 응답한다. 에이전트가 수행할 업무, 스타일, 톤, 제약 조건 등이 명시되어 이싿. 협력 지시문은 관리자 에이전트가 이 에이전트를 협력자로 호출할 때 참고하는 설명이다. 관리자 에이전트 관점에서 작성한다. 구체적인 협업 시나리오와 함께 스타일이나 톤도 지정 가능하다. 

예를 들어 리서치 에이전트의 협력 지시문은 다음과 같다. 관리자 에이전트는 자료 수집이나 통계적 수치를 수집할 때 리서치 에이전트와 협력하라고 작성되어 있다.

```
Use research-agent when the user requests statistical data, figures, or trends related to specific topics such as demographics, economics, health, technology, or industry insights.
Provide the full user query, including any relevant keywords, geographic scope, time range, or data type (e.g., percentages, totals, growth rates).
The research-agent retrieves up-to-date and credible statistical data from public sources, research papers, or government databases, and responds in a clear, neutral tone with cited references when available.
```

다음 차트 에이전트의 협력 지시문은 다음과 같다. 관리자 에이전트는 차트나 그래프를 그리거나 그리기 위한 코드를 생성할 때 차트 에이전트와 협력하라고 작성되어 있다.

```
Use chart-agent when users want to create chart, graph or write some codes related to chart or graph.
Use chart-agent when you have received statistical data, numerical summaries, or trends from the research-agent, and the user wants to visualize that information.

Provide the chart-agent with the relevant dataset or summary output, along with any available context such as:
- Preferred chart type (e.g., bar chart, line graph, pie chart)
- Comparison groups or variables
- Time range
- Units or labels for axes

The chart-agent generates a clear and informative codes for drawing chart or graph, formatted for easy understanding, and responds with a descriptive caption or explanation.
The tone is neutral and professional.
```

프롬프트를 살펴봤으니 이제 에이전트를 협력자로 추가해보자. 다음과 같이 스크립트를 실행한다. 리서치 에이전트를 협력자로 추가하기 때문에 위에서 생성했던 리서치 에이전트의 별칭 ARN을 사용한다.

```
$ sh scripts/update-collaborators.sh ZLU5WVCBXN research-agent arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/KNA7TQTVEY/1JW8LP6P7N

{
  "agentCollaborator": {
    "agentDescriptor": {
      "aliasArn": "arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/KNA7TQTVEY/1JW8LP6P7N"
    },
    "agentId": "ZLU5WVCBXN",
    "agentVersion": "DRAFT",
    "clientToken": "6d8947ab-3a9f-482d-b411-bb0ac8db5bc5",
    "collaborationInstruction": "Use research-agent when the user requests statistical data, figures, or trends related to specific topics such as demographics, economics, health, technology, or industry insights.\nProvide the full user query, including any relevant keywords, geographic scope, time range, or data type (e.g., percentages, totals, growth rates).\nThe research-agent retrieves up-to-date and credible statistical data from public sources, research papers, or government databases, and responds in a clear, neutral tone with cited references when available.",
    "collaboratorId": "UU3I0EUYO4",
    "collaboratorName": "research-agent",
    "createdAt": "2025-07-25T16:15:05.286165+00:00",
    "lastUpdatedAt": "2025-07-25T16:15:05.286165+00:00",
    "relayConversationHistory": "TO_COLLABORATOR"
  }
}
```

동일한 명령어로 차트 에이전트를 실행한다. 차트 에이전트의 별칭 ARN을 사용한다.

```
$ sh scripts/update-collaborators.sh ZLU5WVCBXN chart-agent arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/NX3D2AM8YD/IIECMJTPXE

{
  "agentCollaborator": {
    "agentDescriptor": {
      "aliasArn": "arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/NX3D2AM8YD/IIECMJTPXE"
    },
    "agentId": "ZLU5WVCBXN",
    "agentVersion": "DRAFT",
    "clientToken": "ce58bc94-4a21-490e-bb71-93603f6fca80",
    "collaborationInstruction": "Use chart-agent when users want to create chart, graph or write some codes related to chart or graph.\nUse chart-agent when you have received statistical data, numerical summaries, or trends from the research-agent, and the user wants to visualize that information.\n\nProvide the chart-agent with the relevant dataset or summary output, along with any available context such as:\n- Preferred chart type (e.g., bar chart, line graph, pie chart)\n- Comparison groups or variables\n- Time range\n- Units or labels for axes\n\nThe chart-agent generates a clear and informative codes for drawing chart or graph, formatted for easy understanding, and responds with a descriptive caption or explanation.\nThe tone is neutral and professional.",
    "collaboratorId": "BKDCMAMWK3",
    "collaboratorName": "chart-agent",
    "createdAt": "2025-07-25T16:17:29.417390+00:00",
    "lastUpdatedAt": "2025-07-25T16:17:29.417390+00:00",
    "relayConversationHistory": "TO_COLLABORATOR"
  }
}
```

협력 에이전트들을 모두 추가한 후. AWS 웹 콘솔에서 관리자 에이전트의 `Multi-agent collaboration` 섹션을 확인해보자. 추가한 협력 에이전트들과 각자의 협력 지시문을 확인할 수 있다. 

<div align="center">
  <img src="/images/posts/2025/multi-agent-with-aws-bedrock-06.png" width="100%" class="image__border">
</div>

<br/>

마지막으로 관리자 에이전트를 배포한다.

```
$ sh scripts/deploy-supervisor.sh ZLU5WVCBXN V20250725-01

{
  "agentId": "ZLU5WVCBXN",
  "agentStatus": "PREPARING",
  "agentVersion": "DRAFT",
  "preparedAt": "2025-07-25T16:18:11.940551+00:00"
}
{
  "agentAlias": {
    "agentAliasArn": "arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/ZLU5WVCBXN/P8JLDCQGDA",
    "agentAliasId": "P8JLDCQGDA",
    "agentAliasName": "V20250725-01",
    "agentAliasStatus": "CREATING",
    "agentId": "ZLU5WVCBXN",
    "createdAt": "2025-07-25T16:18:15.675540+00:00",
    "routingConfiguration": [
      {}
    ],
    "updatedAt": "2025-07-25T16:18:15.675540+00:00"
  }
}
```

## 3. Make prompt

AWS 웹 콘솔에서 간단하게 프롬프트를 테스트할 수 있다. 2000년부터 현재까지 한국의 GDP 상승률을 조사하고, 관련된 코드를 생성해달라고 요청했다. 프롬프트 실행 경로를 실시간으로 추적하여 어떤 에이전트와 어떤 커뮤니케이션을 했는지 확인할 수 있다. 

<div align="center">
  <img src="/images/posts/2025/multi-agent-with-aws-bedrock-07.gif" width="100%" class="image__border">
</div>

## CLOSING

멀티 에이전트를 보니 AI 시스템이 시간이 지날수록 사람과 비슷해지는 것 같다. 생각보다 프롬프트만으로 에이전트 협력을 구성하는 것이 까다로웠다. 단순 질문하는 형태가 아닌 의도하는 대로 동작시키기 위해선 상당히 구체적인 프롬프트가 필요하다는 사실을 깨달았다. 프롬프트 엔지니어링에 관련된 책을 봤을 땐 크게 공감이 안 됬었는데, 지금은 프롬프트를 작성하는 것도 엔지니어링이라고 말하는지 조금 알 것 같다.

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-07-25-multi-agent-with-aws-bedrock>

#### REFERENCE

- <https://www.ibm.com/kr-ko/think/topics/multiagent-system>
- <https://www.sap.com/korea/resources/what-are-multi-agent-systems>
- <https://medium.com/@learning_37638/agentic-patterns-architectures-for-coordinated-ai-systems-34d9d8d8e1e2>
- <https://arxiv.org/pdf/2506.15451>
- <https://openaccess.thecvf.com/content/CVPR2025W/MEIS/papers/Abbasnejad_Deciding_the_Path_Leveraging_Multi-Agent_Systems_for_Solving_Complex_Tasks_CVPRW_2025_paper.pdf>

[aws-bedrock-agent-api-link]: https://junhyunny.github.io/ai/llms/large-language-model/aws/bedrock/ai-agent/aws-bedrock-agent-api/
