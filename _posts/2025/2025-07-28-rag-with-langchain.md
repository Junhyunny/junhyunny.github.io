---
title: "검색 증강 생성(RAG, Retrieval-Augmented Generation) LangChain 예제"
search: false
category:
  - ai
  - llms
  - large-language-model
  - langchain
  - rag
  - retrieval-argumented-generation
last_modified_at: 2025-07-28T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [LLM 랭체인(LangChain) 예제][lang-chain-link]

## 1. RAG, Retrieval-Augmented Generation

검색 증강 생성(RAG, Retrieval-Augmented Generation)을 알아보기 전에 등장 배경을 알아보자. 

- 지식의 한계
  - 기존 LLM은 학습 시점의 데이터에 기반하여 대답한다. 
  - 모델은 최신 정보나 학습 이후에 발생한 사건들에 대해 알지 못한다.
  - 예를 들어, 2023년까지의 데이터로 학습된 모델은 2024년 이후의 사건들에 대해 답변할 수 없다.
- 환각 문제(hallucination)
  - LLM은 때때로 실제로 존재하지 않는 정보를 생성하는 환각 현상을 보인다.
  - 모델이 학습 데이터에서 패턴을 추출하여 그럴듯한 답변을 하지만, 사실과 다를 수 있다.
  - 예를 들어, 챗GPT는 초기에 세종대왕의 맥북 프로를 던진 사건에 대해 대답했다.
- 출처 추적의 어려움
  - 기존 모델들은 생성한 정보의 출처를 명확히 제시하기 어렵다. 
  - 이는 모델의 답변을 검증하거나 더 자세한 정보를 찾고자 할 때 문제가 된다.
- 도메인 특화 지식의 한계
  - 범용 LLM은 광범위한 주제에 대해 일반적인 지식을 가지고 있지만, 특정 도메인의 심도 있는 전문 지식을 모두 포함하기 어렵다.

검색 증강 생성은 위 문제들을 해결하기 위해 등장했다. 외부에서 실시간으로 검색(retrieval)하고, 이를 바탕으로 답변을 생성(generation)하는 과정을 의미한다. 다음과 같은 과정을 통해 이뤄진다.

1. 검색 단계(retrieval phase)
  - 사용자의 질문이나 컨텍스트를 입력 받아서, 이와 관련된 외부 데이터를 검색한다.
  - 검색 엔진이나 데이터베이스 등 다양한 소스에서 필요한 정보를 찾는다.
2. 문맥 강화 단계(argumentation phase)
  - 검색된 데이터를 기반으로 LLM 프롬프트(prompt)에 사용할 문맥을 구성한다.
  - 필요 시 중복 제거, 요약, 재랭킹(reranking) 등을 수행해 품질을 높인다.
3. 생성 단계(generation phase)
  - LLM이 사용자 질문과 함께 받은 데이터를 참고해서 최종 응답을 생성한다.

## 2. Embedding and indexing

RAG를 제대로 활용하라면 필요한 데이터를 미리 준비해놓는 것이 좋다. 매번 필요한 데이터를 조회하는 것은 비용이 크다. 특히, API 요청을 통해 외부 데이터를 호출한다면 비용이 크다. 미리 필요한 데이터들을 데이터베이스에 저장해놓으면 좋지만, 일반 데이터베이스를 사용하는 것은 다소 무리가 있다. 사용자 프롬프트와 같은 자연어의 의미를 판단 후 이 의미를 기반으로 검색하는 것이 일반 SQL 기반 데이터베이스에선 매우 어렵기 때문이다. 

MySQL이나 PostgreSQL 같은 SQL 기반 데이터베이스는 키워드 기반으로 동작한다. 예를 들면 다음과 같은 쿼리가 있다.

```sql
WHERE title LIKE '%고양이%'
```

쿼리에 사용한 키워드의 동의어나 유사 의미를 인식하는 것은 매우 어렵다. 사용자 프롬프트에 `냥이`라는 키워드가 있다면 일반 SQL은 이를 위한 동의어 처리가 별도로 필요할 것이다. 모든 케이스에 대해 커버하는 것은 불가능에 가까울 것이다. 이런 문제를 해결하기 위해 `벡터 데이터베이스(vetor database)`를 사용한다. 벡터 데이터베이스를 사용하면 단어가 같지 않더라도 의미가 비슷한 데이터를 찾을 수 있다.

먼저 문서나 질문을 벡터(숫자 배열)로 바꾼 후 벡터 데이터베이스를 저장하한다. 벡터 데이터베이스에 저장된 데이터는 수학적으로 유사한 벡터를 탐색을 통해 찾을 수 있다. 수학적 기법은 코사인 유사도, 유클리디안 거리, 내적 등을 사용한다.자연어를 벡터로 어떻게 만드는지에 달려있겠지만, 수학적으로 유사한 벡터는 의미가 유사하다고 본다. 문서나 질문을 벡터로 변경하는 작업을 `임베딩(embedding)`, 벡터를 벡터 데이터베이스에 저장하는 작업을 `인덱싱(indexing)`이라고 한다. 

이해를 돕기 위해 간단한 예시를 들어보자. 다음과 같은 4개의 문장이 있다. 

- "고양이는 야행성 동물로서 밤에 활동을 많이 합니다."
- "강아지는 사람과 잘 어울리며 충성심이 강합니다."
- "냥이는 혼자 있기를 좋아하는 성격이에요."
- "자동차 정비는 주기적인 점검이 중요합니다."

각 문장을 임베딩하면 다음과 같은 결과가 나온다고 생각해보자. OpenAI의 벡터는 사이즈는 일반적으로 1536 정도로 매우 크지만, 이해를 돕기 위해 3D 공간으로 벡터 데이터를 단순화했다.

- 고양이 - [0.90, 0.10, 0.15]
- 냥이 - [0.88, 0.12, 0.17]
- 강아지 - [0.15, 0.80, 0.10]
- 자동차 - [0.01, 0.01, 0.99]

고양이와 냥이는 매우 근접한 거리에 위치한다. 둘의 유사도는 높다고 볼 수 있다. 이제 벡터들을 벡터 데이터베이스에 저장한다. 모든 문서나 단어의 벡터들을 모아 하나의 공간에 배치한다. 빠르게 근처 이웃(유사 벡터)을 찾을 수 있게 인덱스를 생성한다. 

이후 사용자가 "냥이에 대해 알려줘"라는 프롬프트를 던진다고 가정해보자. 이 문장도 동일한 임베딩 모델로 벡터화한다. 벡터화 된 프롬프트로 벡터 데이터베이스에서 유사한 데이터들을 조회한다. 벡터화 된 프롬프트의 "냥이"와 유사한 데이터들이 조회된다.

위에서 살펴본 임베딩과 인덱싱 작업은 비용(시간)이 많이 소요되기 때문에 사전에 오프라인 파이프라인에서 실행하는 것이 좋다. 런타임에 이 두 작업을 모두 수행한다면 일관된 검색 성능을 얻지 못한다. 다만, 질문에 대한 임베딩은 필수다. 프롬프트 임베딩에 대한 최적화는 경량 임베딩 모델을 사용하거나 로컬 임베딩 서버를 사용하는 등의 개선 방법이 필요한 것 같다. 자세한 내용은 다른 글에서 다루겠다.

## 3. Example RAG with LangChain

간단히 RAG 예제 코드를 작성해보자.

```
$ python3 -m venv .venv
```

```
$ source .venv/bin/activate
```

```
$ pip install langchain langchain_community chromadb sentence-transformers beautifulsoup4 langchain_ollama langchain_chroma
```

## CLOSING

#### TEST CODE REPOSITORY

#### RECOMMEND NEXT POSTS

#### REFERENCE

- <https://brunch.co.kr/@acc9b16b9f0f430/73>
- <https://wikidocs.net/231364>
- <https://www.couchbase.com/blog/what-are-vector-embeddings/>
- <https://www.youtube.com/watch?v=Faa6dnG88hM>
- <https://rudaks.tistory.com/entry/langchain-Langchain%EC%97%90%EC%84%9C-createretrievalchain-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0>

[lang-chain-link]: https://junhyunny.github.io/ai/large-language-model/langchain/lang-chain/