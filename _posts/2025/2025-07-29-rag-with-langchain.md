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
last_modified_at: 2025-07-29T23:55:00
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

RAG 예제 코드를 작성해보기 전에 예제에서 사용할 `llama3.2` 모델의 답변을 확인해보자. 간단하게 현재 미국 대통령에 대해서 물어보자. 25년 현재 미국 대통령은 도널드 트럼프다.

```
$ docker exec -it ollama ollama run llama3.2

>>> Who is the president of USA now?
I'm not aware of my knowledge cutoff date, but as of my last update in December 2023, Joe Biden was the President of the United States. However, please note that this information may have changed since then. For the most up-to-date information, I recommend checking a reliable news source or the official website of the White House.
```

llama3.2 모델은 23년 12월 기준으로 학습이 완료됐고, 그 당시 대통령은 조 바이든이라는 답변을 얻는다. 이제부터 벡터 데이터베이스를 구성하고 llama3.2 모델의 답변을 별다른 학습 없이 최신화해보자. 먼저 파이썬 가상 환경을 구축한다.

```
$ python3 -m venv .venv
```

가상 환경을 활성화한다.

```
$ source .venv/bin/activate
```

필요한 의존성을 설치한다. 다음과 같은 의존성들이 필요하다.

- langchain 
  - LangChain의 코어 라이브러리
- langchain_community 
  - 커뮤니티 지원 기능 및 통합 모듈. 
  - WebBaseLoader 사용
- langchain_ollama
  - Ollama 기반의 LLM 실행을 지원하는 LangChain 통합 모듈
- langchain_chroma 
  - Chroma 벡터 데이터베이스를 LangChain 애플리케이션과 연결
- langchain-huggingface
  - HuggingFace 모델들을 LangChain에서 사용할 수 있게 해주는 패키지
  - HuggingFaceEmbeddings 사용
- sentence-transformers
  - 텍스트를 의미 기반의 벡터로 변환해주는 임베딩 모델 라이브러리
- beautifulsoup4
  - HTML/XML 문서 파싱 라이브러리

```
$ pip install langchain \
 langchain_community \
 langchain_ollama \
 langchain_chroma \
 langchain-huggingface \ 
 sentence-transformers \
 beautifulsoup4 
```

지금부터 살펴보는 코드는 `index.py`다. 다음과 같은 프로세스를 진행한다. 

1. 위키피디아 사이트의 특정 페이지를 읽어온다.
2. 페이지 정보를 청크(chunk)로 분리한다.
3. 청크로 분리한 데이터를 `intfloat/multilingual-e5-base` 임베딩 모델로 임베딩 후 벡터 데이터베이스 저장한다.

다음과 같은 패키지들을 임포트(import)한다.

```python
import bs4
from langchain.text_splitter import CharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import WebBaseLoader
from langchain_huggingface import HuggingFaceEmbeddings
```

[위키피디아 사이트](https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States)에서 데이터를 읽는다. beautifulsoup4를 사용해서 HTML 문서를 스크래핑(scraping)한다.

```python
wiki_url = "https://en.wikipedia.org/wiki/List_of_presidents_of_the_United_States"

loader = WebBaseLoader(
	web_paths = [wiki_url],
	bs_kwargs = dict(parse_only = bs4.SoupStrainer(class_ = ("mw-body-content", "mw-parser-output")))
)
documents = loader.load()
```

읽어 드린 문서를 임베딩 하기 전에 청크 단위로 분리한다.

```python
text_splitter = CharacterTextSplitter(chunk_size = 100, chunk_overlap = 0)
split_documents = text_splitter.split_documents(documents)
```

임베딩 모델을 준비한다. 이 예제에서 사용할 `intfloat/multilingual-e5-base` 모델은 한국어를 지원한다.

```python
embedding_model = HuggingFaceEmbeddings(
	model_name = "intfloat/multilingual-e5-base",
	model_kwargs = {
		"device": "cpu"
	}
)
```

벡터 데이터베이스를 준비한다. 벡터 데이터베이스를 생성할 때 임베딩 모델과 청크 단위로 분리한 문서를 함께 설정하면 자동으로 벡터 데이터베이스에 저장(persist)된다. 임베딩 된 벡터들은 프로젝트 경로의 `chroma_llama` 디렉토리에 저장된다. 

```python
Chroma.from_documents(
	documents = split_documents,
	embedding = embedding_model,
	persist_directory = "./chroma_llama"
)
```

다음 명령어를 통해 벡터 데이터베이스를 구성한다.

```
$ python indexing.py 

USER_AGENT environment variable not set, consider setting it to identify your requests.
Created a chunk of size 118, which is longer than the specified 100
...
Created a chunk of size 1043, which is longer than the specified 100
```

다음과 같이 로컬에 벡터 데이터가 저장된 것을 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/rag-with-langchain-01.png" width="75%" class="image__border">
</div>

<br/>

지금부터 살펴볼 코드는 `main.py`다. 벡터 데이터베이스로부터 질문에 관련된 데이터를 조회 후 이를 질문의 컨텍스트로 전달하는 RAG 프로세스다. RAG 프로세스에 대한 설명은 위애서 다뤘기 때문에 여기선 별도로 하지 않는다. 다음과 같은 패키지들을 임포트한다.

```python
from langchain.chains import LLMChain, RetrievalQA, create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.prompts import PromptTemplate
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
```

LLM 모델과 프롬프트를 준비한다. llama3.2 모델을 사용한다. `context` 키에는 벡터 스토어에서 조회한 데이터가 설정된다. `input` 키에는 사용자 질문이 들어간다.

```python
llm = ChatOllama(model = "llama3.2")

prompt = PromptTemplate(
	input_variables = ["context", "input"],
	template = """
			Answer refer contexts:
			context: {context}
			question: {input}
			
			Answer with specific information and details.
			Answer with reference links if you know the source.
			Answer in a way that other users don't feel like you're referencing external sources such as RAG.
			Do not answer with unnecessary words such as reference numbers or inline citation.
	"""
)
```

임베딩 모델을 생성한다. 

```python
embedding_model = HuggingFaceEmbeddings(
	model_name = "intfloat/multilingual-e5-base",
	model_kwargs = {
		"device": "cpu"
	}
)
```

벡터 스토어를 생성한다. 벡터 스토어를 생성할 때 데이터가 저장된 디렉토리를 설정하면 이전에 인덱싱한 데이터를 사용한다. 임베딩 모델도 함께 설정한다.

```python
vectorstore = Chroma(
	persist_directory = "./chroma_llama",
	embedding_function = embedding_model
)
```

벡터 스토어를 사용해 검색기(retiever) 생성한다. 유사도가 가장 높은 3개의 문장을 찾는다. 

```python
retriever = vectorstore.as_retriever(search_kwargs = {
	"k": 3
})
```

이제 랭체인의 체이닝을 통해 LLM 파이프라인을 구성한다. 

```python
# 여러 문서(Context)를 하나의 큰 문자열로 합쳐서 LLM에 전달하는 체인을 생성(stuff 방식)
combine_docs_chain = create_stuff_documents_chain(llm, prompt)

# 검색기와 LLM 체인을 받아 RAG 체인을 생성.
rag_chain = create_retrieval_chain(retriever, combine_docs_chain)

# RAG 체인에서 answer 키에 해당하는 값만 사용하는 체인 생성
chain = rag_chain.pick("answer")
```

해당 체인에 위에서 사용한 동일한 프롬프트를 전달한다.

```python
stream = chain.stream({
	"input": "Who is the president of USA now?"
})
for chunk in stream:
	print(f"{chunk}", end = "")
```

다음 명령어를 통해 위 스크립트를 실행한다. 동일한 모델을 사용했지만, RAG 프로세스를 통해 개선된 응답을 받는다.

```
$ python main.py

The current president of the United States is Donald Trump, who assumed office on January 20, 2025.
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-07-29-rag-with-langchain>

#### REFERENCE

- <https://brunch.co.kr/@acc9b16b9f0f430/73>
- <https://wikidocs.net/231364>
- <https://www.couchbase.com/blog/what-are-vector-embeddings/>
- <https://www.youtube.com/watch?v=Faa6dnG88hM>
- <https://rudaks.tistory.com/entry/langchain-Langchain%EC%97%90%EC%84%9C-createretrievalchain-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0>
- <https://python.langchain.com/v0.2/docs/how_to/qa_streaming/>

[lang-chain-link]: https://junhyunny.github.io/ai/large-language-model/langchain/lang-chain/