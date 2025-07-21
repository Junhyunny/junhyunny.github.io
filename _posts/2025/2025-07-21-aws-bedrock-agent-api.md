---
title: "AWS Bedrock 에이전트(agent) 호출 예제"
search: false
category:
  - ai
  - llms
  - large-language-model
  - aws
  - bedrock
  - ai-agent
last_modified_at: 2025-07-21T23:55:00
---

<br/>

## 1. AWS Bedrock Agent

AWS 베드록(Bedrock)은 앤트로픽(anthropic), Cohere, DeepSeek, Llama 같은 주요 AI 회사의 다양한 고성능 파운데이션 모델(FM)을 단일 API로 제공하는 완전관리형 서비스다. 생성형 AI 애플리케이션 구축에 필요한 광범위한 기능 세트를 제공한다.

AWS Bedrock의 에이전트(agent)는 사용자의 자연어 요청을 이해하고, 해당 요청을 처리하기 위해 필요한 도구 호출, 지식 기반 조회, 멀티턴 대화 관리 등을 자동으로 실행하는 LLM 기반의 실행 체계다. 다음과 같은 구성 요소로 이뤄진다.

- Foundation Model(FM)
  - Claude, Titan, Mistral 등 LLM 자체
- Instruction / Prompt
  - 해당 에이전트가 어떤 역할을 하는지 설명하는 시스템 지침
- Action Group (API 연동)
  - 외부 시스템을 호출하기 위한 Lambda 함수 또는 API Endpoint 매핑
- Knowledge Base (선택)
  - 벡터 DB 기반 문서 검색(RAG) 기능
- Session 관리
  - 멀티턴 대화를 위한 context 보존
- Invocation layer
  - 사용자의 입력을 받고, 필요 시 도구를 호출하고, 다시 LLM에 통합 응답 생성

## 2. Create AWS Bedrock Agent 

간단하게 베드록 에이전트를 만들어보자. 먼저 커맨드를 실행하기 전에 AWS 크레덴셜(credential)을 터미널 세션에 준비한다.

```
$ export AWS_ACCESS_KEY_ID=ABCDEFGHIJKLEMNOPQRSTUVWXYZ
$ export AWS_SECRET_ACCESS_KEY=ABCDEFGHIJKLEMNOPQRSTUVWXYZ/1234567890/BCDE
$ export AWS_SESSION_TOKEN=ABCDEFG ... 1234567890
```

AWS CLI를 사용한다. 아래 쉘 스크립트는 에이전트를 생성하는 AWS CLI 명령어다. 영어를 가르치는 AI 에이전트로 잘못된 문장을 수정한다. 에이전트 연결을 위한 예시이기 때문에 성능에 상관 없이 LLM 파운데이션 모델은 가장 저렴한 `nova-micro` 모델을 사용한다. 명령어를 실행하기 위해선 베드록 에이전트 리소스를 실행하기 위한 롤(role)의 ARN이 필요하다.

```sh
#!/bin/bash

AGENT_RESOURCE_ROLE_ARN=$1

aws bedrock-agent create-agent \
  --region ap-northeast-1 \
  --agent-name "first-agent" \
  --foundation-model "apac.amazon.nova-micro-v1:0" \
  --instruction "You are an agent for teaching English. You can fix wrong grammar and suggest more nicer sentences." \
  --agent-resource-role-arn "$AGENT_RESOURCE_ROLE_ARN" | jq .
```

위 스크립트를 실행하면 아래와 같은 응답을 통해 에이전트 ID를 획득한다. 에이전트 ID는 이 후에 에이전트를 배포할 때 사용한다.

```
$ sh create-agent-cli.sh arn:aws:iam::123412341234:role/service-role/AmazonBedrockExecutionRoleForAgents_BH7NZART9Q

{
  "agent": {
    "agentArn": "arn:aws:bedrock:ap-northeast-1:123412341234:agent/SR95VYU66L",
    "agentCollaboration": "DISABLED",
    "agentId": "SR95VYU66L",
    "agentName": "first-agent",
    "agentResourceRoleArn": "arn:aws:iam::123412341234:role/service-role/AmazonBedrockExecutionRoleForAgents_BH7NZART9Q",
    "agentStatus": "CREATING",
    "createdAt": "2025-07-21T05:43:52.363215+00:00",
    "foundationModel": "apac.amazon.nova-micro-v1:0",
    "idleSessionTTLInSeconds": 600,
    "instruction": "You are an agent for teaching English. You can fix wrong grammar and suggest more nicer sentences.",
    "orchestrationType": "DEFAULT",
    "updatedAt": "2025-07-21T05:43:52.363215+00:00"
  }
}
```

베드록 에이전트 화면에서 위에서 생성한 에이전트를 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/aws-bedrock-agent-api-01.png" width="100%" class="image__border">
</div>

<br/>

아래 CLI는 위에서 생성한 에이전트를 준비 상태로 만들기 위한 명령어다. 에이전트가 준비 상태가 아니라면 프롬프트가 실행되지 않는다. 위에서 획득한 에이전트 ID를 사용한다.

```sh
#!/bin/bash

AGENT_ID=$1

aws bedrock-agent prepare-agent \
  --region ap-northeast-1 \
  --agent-id "$AGENT_ID" | jq .
```

아래 명령어를 실행한다. 

```
$ sh prepare-agent-cli.sh SR95VYU66L

{
  "agentId": "SR95VYU66L",
  "agentStatus": "PREPARING",
  "agentVersion": "DRAFT",
  "preparedAt": "2025-07-21T05:48:55.864899+00:00"
}
```

준비 명령어가 실행되면 다음과 같이 생성한 에이전트가 준비 상태가 된다.

<div align="center">
  <img src="/images/posts/2025/aws-bedrock-agent-api-02.png" width="100%" class="image__border">
</div>

<br/>

마지막으로 별칭(alias)을 만들어줘야 한다. 에이전트를 생성하면 기본적으로 버전으로 관리된다. 파운데이션 모델이 사용하는 지식 기반이 변경되거나 에이전트를 위한 지침(instruction)이 변경되는 등 에이전트 설정이 바뀌는 것을 버전으로 관리하고 이를 사용하기 위해 별칭을 부여한다. 에이전트 ID와 별칭 이름을 파라미터로 전달한다.

```sh
#!/bin/bash

AGENT_ID=$1
NAME=$2

aws bedrock-agent create-agent-alias \
  --region ap-northeast-1 \
  --agent-id "$AGENT_ID" \
  --agent-alias-name "$NAME" | jq .
```

아래 명령어를 실행하면 새로 배포된 에이전트 별칭 ID를 획득한다. 이는 파이썬 애플리케이션에서 에이전트의 특정 버전을 호출하기 위해 사용한다. 

```
$ sh create-agent-alias-cli.sh SR95VYU66L V20250721
{
  "agentAlias": {
    "agentAliasArn": "arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/SR95VYU66L/GM8K2CLYPM",
    "agentAliasId": "GM8K2CLYPM",
    "agentAliasName": "V20250721",
    "agentAliasStatus": "CREATING",
    "agentId": "SR95VYU66L",
    "createdAt": "2025-07-21T05:56:52.579481+00:00",
    "routingConfiguration": [
      {}
    ],
    "updatedAt": "2025-07-21T05:56:52.579481+00:00"
  }
}
```

## 3. Implement python application

파이썬 애플리케이션을 구현해보자. 먼저 `.env` 파일을 만들고 필요한 에이전트 ID, 에이전트 별칭 ID를 설정한다.

```
AGENT_ID=SR95VYU66L
AGENT_ALIAS_ID=GM8K2CLYPM
```

파이썬 가상 환경을 구축하고 boto3, dotenv 패키지를 추가로 설치한다.

```
$ python -m venv .venv

$ source .venv/bin/activate

$ pip install boto3 python-dotenv
```

이제 파이썬 코드를 살펴보자. `.env` 파일 정의된 환경변수를 사용해 에이전트를 호출한다. 다음과 같은 패키지를 임포트(import)한다.

```python
import os
import sys
import uuid

import boto3
from dotenv import load_dotenv
```

환경변수를 로딩한다.

```python
load_dotenv()
```

커맨드라인으로부터 문장을 입력 받고, 이 문장을 첨삭받는다.

```python
def main(sentence):
  client = boto3.client("bedrock-agent-runtime", region_name = "ap-northeast-1")

  agent_id = os.getenv("AGENT_ID")
  agent_alias_id = os.getenv("AGENT_ALIAS_ID")

  response = client.invoke_agent(
    agentId = agent_id,
    agentAliasId = agent_alias_id,
    sessionId = f"{uuid.uuid4()}",
    inputText = f"Please check this sentence and explain why. Suggest nice expression with correct grammar. '{sentence}'"
  )

  for event in response['completion']:
    if "chunk" in event:
      print(event["chunk"]["bytes"].decode("utf-8"), end = "")


if __name__ == '__main__':
  if len(sys.argv) < 2:
    raise Exception("Please specify a sentence")
  main(sys.argv[1])
```

아래처럼 잘못된 문장을 전달하면 잘못된 문장을 첨삭해준다.

```
$ python main.py "Hello, I are Junhyun Kang"

The sentence 'Hello, I are Junhyun Kang' contains a grammatical error. The correct form should be 'Hello, I am Junhyun Kang' because 'I' is a first person singular pronoun that requires the verb 'am' instead of 'are'. A nicer expression could be 'Hello, my name is Junhyun Kang' which is more formal and polite.
```

## 4. Update agent

에이전트는 업데이트 가능하다. 아래 쉘 스크립트를 통해 에이전트의 지침을 변경한다. 설명 톤을 변경한다.

```sh
#!/bin/bash

AGENT_ID=$1
AGENT_RESOURCE_ROLE_ARN=$2

aws bedrock-agent update-agent \
  --region ap-northeast-1 \
  --agent-name "first-agent" \
  --agent-id "$AGENT_ID" \
  --foundation-model "apac.amazon.nova-micro-v1:0" \
  --instruction "You are an agent for teaching English. But you have a bad personality. Fix it unfriendly tone." \
  --agent-resource-role-arn "$AGENT_RESOURCE_ROLE_ARN" | jq .
```

위 쉘 스크립트를 실행한다.

```
$ sh update-agent-cli.sh 'SR95VYU66L' 'arn:aws:iam::123412341234:role/service-role/AmazonBedrockExecutionRoleForAgents_BH7NZART9Q' 

{
  "agent": {
    "agentArn": "arn:aws:bedrock:ap-northeast-1:123412341234:agent/SR95VYU66L",
    "agentCollaboration": "DISABLED",
    "agentId": "SR95VYU66L",
    "agentName": "first-agent",
    "agentResourceRoleArn": "arn:aws:iam::123412341234:role/service-role/AmazonBedrockExecutionRoleForAgents_BH7NZART9Q",
    "agentStatus": "UPDATING",
    "clientToken": "90d11ead-9b55-412b-b339-75da5723e780",
    "createdAt": "2025-07-21T05:46:05.041117+00:00",
    "foundationModel": "apac.amazon.nova-micro-v1:0",
    "idleSessionTTLInSeconds": 600,
    "instruction": "You are an agent for teaching English. But you have a bad personality. Fix it unfriendly tone.",
    "orchestrationType": "DEFAULT",
    "updatedAt": "2025-07-21T06:42:08.098451+00:00"
  }
}
```

변경한 내용으로 새로운 별칭을 만든다.

```
$ sh create-agent-alias-cli.sh SR95VYU66L V2025072102

{
  "agentAlias": {
    "agentAliasArn": "arn:aws:bedrock:ap-northeast-1:123412341234:agent-alias/SR95VYU66L/PTQLJFSOQT",
    "agentAliasId": "PTQLJFSOQT",
    "agentAliasName": "V2025072102",
    "agentAliasStatus": "CREATING",
    "agentId": "SR95VYU66L",
    "createdAt": "2025-07-21T06:42:32.068074+00:00",
    "routingConfiguration": [
      {}
    ],
    "updatedAt": "2025-07-21T06:42:32.068074+00:00"
  }
}
```

새로운 별칭은 새로운 에이전트 버전과 매칭된다. 

<div align="center">
  <img src="/images/posts/2025/aws-bedrock-agent-api-03.png" width="100%" class="image__border">
</div>

<br/>

새로 발급 받은 에이전트 별칭 ID로 `.env` 파일 내용을 변경한다. 파이썬 애플리케이션을 실행하면 불친절한 톤의 응답을 받게 된다.

```
$ python main.py "I are Junhyun Kang"

The sentence 'I are Junhyun Kang' is grammatically incorrect because 'are' is not the correct form of the verb 'to be' to use with the pronoun 'I'. The correct form is 'am'. A nice expression with correct grammar would be 'I am Junhyun Kang'.
```

## 5. Trouble Shooting

에이전트를 생성할 때 잘못된 파운데이션 모델 ID를 사용하면 다음과 같은 에러가 발생한다.

```
botocore.exceptions.EventStreamError: An error occurred (validationException) when calling the InvokeAgent operation: Invocation of model ID amazon.nova-micro-v1:0 with on-demand throughput isn’t supported. Retry your request with the ID or ARN of an inference profile that contains this model. 
```

`amazon.nova-micro-v1:0` 모델은 온-디맨드 모드를 서포트하지 않는다는 의미이다. 카탈로그에 표시된 모델 ID를 사용하면 위와 같은 에러가 발생한다. 

<div align="center">
  <img src="/images/posts/2025/aws-bedrock-agent-api-04.png" width="100%" class="image__border">
</div>

<br/>

크로스 리전 추론(cross-region inference)의 추론 프로파일 ID를 사용하면 이 문제를 해결할 수 있다. AWS 베드록의 크로스 리전 추론은 추론 프로파일(inference profiles)을 사용하여 처리량(throughput)을 증가시키고, 피크 시간대(트래픽 폭주 시)에도 복원력(resiliency)을 향상시키기 위해 여러 AWS 리전에 요청을 분산 라우팅하는 기능이다.

<div align="center">
  <img src="/images/posts/2025/aws-bedrock-agent-api-05.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-07-21-aws-bedrock-agent-api>

#### REFERENCE

- <https://zenn.dev/waaani/articles/aws-bedrock-memo>