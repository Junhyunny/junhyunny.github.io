---
title: "온톨로지 파일 neo4j 임포트(import)하기"
search: false
category:
  - ai
  - ai-agent
  - ontology
  - context
  - context-engineering
last_modified_at: 2025-12-20T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [인공지능(AI)과 온톨로지(ontology)][ai-ontology-link]

## 0. 들어가면서

[이전 글][ai-ontology-link]에서 다룬 것처럼 온톨로지(ontology)는 RDF(Resource Description Framework)와 OWL(Web Ontology Language)을 통해 표현된다. 

- RDF - 데이터를 “주어-술어-목적어(Triple) 형태로 표현하자”는 추상적인 데이터 모델(개념)이다.
- OWL - 사물, 사물들의 집합(그룹), 그리고 사물 간의 관계에 대한 풍부하고 복잡한 지식을 표현하기 위해 설계된 시맨틱 웹(semantic web) 언어다. OWL은 계산 논리(computational logic) 기반의 언어로 컴퓨터 프로그램이 활용할 수 있는 지식, 제약 사항, 규칙 등을 표현한다.

위 두 가지 방식을 통해 표현된 온톨로지는 XML, 터틀(.ttl), JSON-LD(.jsonld) 같은 파일로 저장할 수 있다. 이번엔 터틀 형식으로 작성된 온톨로지를 AI 에이전트가 활용할 수 있도록 neo4j 그래프 데이터베이스에 임포트하는 방법을 글로 정리했다.

## 1. Download neosemantics (n10s)

neo4j는 그래프 데이터베이스이지만, 온톨로지를 위해 만들어진 것은 아니다. neo4j가 RDF 모델 데이터를 사용하기 위해선 [neosemantics](https://github.com/neo4j-labs/neosemantics)라는 플러그인이 필요하다. n10s 플러그인의 주요 기능은 다음과 같다.

- 무손실 RDF 데이터 저장 - RDF 데이터를 neo4j에 저장하고, 이후 다시 내보낼 때 단일 트리플도 손실 없이 완전하게 복원할 수 있다.
- 온디맨드 RDF 내보내기 - neo4j의 속성 그래프 데이터를 필요에 따라 RDF로 내보낼 수 있다.
- W3C SHACL 언어 기반 모델 검증 - SHACL(Shapes Constraint Language)을 사용해 데이터 모델의 유효성을 검증할 수 있다.
- 온톨로지 및 택소노미(taxonomies) 임포트 - OWL, RDFS, SKOS 등의 형식으로 작성된 온톨로지와 택소노미를 임포트할 수 있다.

설치는 neo4j 데이터베이스를 실행 후 화면을 통해 설치하는 방법도 있는 것 같지만, 이 글에선 자바 패키지 파일(.jar)를 다운로드 받은 후 사용했다. [이 링크](https://github.com/neo4j-labs/neosemantics/releases)를 통해 다운로드 받을 수 있다. 다운로드 받은 파일은 프로젝트의 `plugins` 디렉토리에 위치시킨다.

## 2. Run neo4j container

다음 명령어를 통해 컨테이너를 실행한다. 

```
docker run \
    --name neo4j \
    -p7474:7474 -p7687:7687 \
    -v ./data:/data \
    -v ./logs:/logs \
    -v ./import:/var/lib/neo4j/import \
    -v ./plugins:/plugins \
    --env NEO4J_PLUGINS='["apoc"]' \
    --env NEO4J_SERVER_DIRECTORIES_IMPORT=import \
    --env NEO4J_DBMS_SECURITY_ALLOW__CSV__IMPORT__FROM__FILE__URLS=true \
    --env NEO4J_AUTH=neo4j/cool-culture-vodka-beach-eric-9620 \
    --env NEO4J_DBMS_SECURITY_PROCEDURES_UNRESTRICTED="apoc.*,n10s.*" \
    --env NEO4J_DBMS_SECURITY_PROCEDURES_ALLOWLIST="apoc.*,n10s.*" \
    neo4j:latest
```

컨테이너 실행 옵션에 대해 몇 가지 정리해보자. 먼저 볼륨은 어떤 것들이 필요한지 살펴보자. 다른 볼륨들에 대한 설명은 [이 링크](https://neo4j.com/docs/operations-manual/current/docker/mounting-volumes/#docker-volumes-mount-points)를 참고하길 바란다.

- data - 영속성을 위해 데이터가 보관되는 볼륨
- logs - 실행 로그가 보관되는 볼륨
- import - 임포트하기 위한 파일(.csv, .ttl)이 보관된 볼륨
- plugins - 플러그인 볼륨.

이번엔 환경 변수를 살펴보자.

- NEO4J_PLUGINS 
  - 플러그인을 설정한다.
  - [공식 문서](https://neo4j.com/docs/operations-manual/current/docker/plugins/#docker-plugins-neo4jplugins)에서는 n10s 플러그인을 지원하는 것처럼 보이지만, `n10s`를 포함시키면 에러가 발생한다.
- NEO4J_SERVER_DIRECTORIES_IMPORT
  - 임포트 파일의 디렉토리 경로를 지정한다.
- NEO4J_DBMS_SECURITY_ALLOW__CSV__IMPORT__FROM__FILE__URLS 
  - 파일 URL에서 CSV 임포트를 허용한다.
- NEO4J_AUTH 
  - neo4j 데이터베이스 접속을 위한 사용자명과 비밀번호를 설정한다.
- NEO4J_DBMS_SECURITY_PROCEDURES_UNRESTRICTED 
  - `apoc`와 `n10s` 네임스페이스의 모든 프로시저에 대해 제한 없이 실행 권한을 부여한다. 
  - neosemantics 플러그인이 정상 동작하려면 필수적인 설정이다.
- NEO4J_DBMS_SECURITY_PROCEDURES_ALLOWLIST 
  - `apoc`와 `n10s` 네임스페이스의 프로시저를 허용 목록(allowlist)에 추가한다.
  - 명시적으로 허용된 프로시저만 사용할 수 있다.

이전 스텝에서 다운로드 받은 neosemantic.jar 파일은 plugin 디렉토리에 위치시킨다. 아래와 같은 터틀 파일은 import 디렉토리에 위치시킨다. [이전 글][ai-ontology-link]에서 만든 파일을 사용한다.

```
prefix : <http://www.example.org/netflix#> .
@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

<http://www.example.org/netflix> rdf:type owl:Ontology .

# --- Classes ---
:Content rdf:type owl:Class .
:Movie   rdf:type owl:Class ; rdfs:subClassOf :Content .
:Series  rdf:type owl:Class ; rdfs:subClassOf :Content .
:Person  rdf:type owl:Class .

# --- Properties ---
:directedBy rdf:type owl:ObjectProperty ;
            rdfs:domain :Content ;
            rdfs:range :Person .

:hasTitle   rdf:type owl:DatatypeProperty ;
            rdfs:domain :Content ;
            rdfs:range xsd:string .

# --- Instances ---
:HwangDongHyuk rdf:type :Person ;
               :hasTitle "황동혁" .

:SquidGame     rdf:type :Series ;
               :hasTitle "오징어 게임" ;
               :directedBy :HwangDongHyuk .

:IronMan       rdf:type :Movie ;
               :hasTitle "아이언맨" .
```

이후 도커 컨테이너를 실행하면 다음과 같은 로그를 볼 수 있다.

```
$ sh neoj4.sh   

Warning: Folder mounted to "/data/databases" is not writable from inside container. Changing folder owner to neo4j.
Warning: Folder mounted to "/data/transactions" is not writable from inside container. Changing folder owner to neo4j.
Installing Plugin 'apoc' from /var/lib/neo4j/labs/apoc-*-core.jar to /plugins/apoc.jar
Applying default values for plugin apoc to neo4j.conf
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
Changed password for user 'neo4j'. IMPORTANT: this change will only take effect if performed before the database is started for the first time.
2025-12-20 00:59:14.672+0000 INFO  Logging config in use: File '/var/lib/neo4j/conf/user-logs.xml'
2025-12-20 00:59:14.678+0000 INFO  Starting...
2025-12-20 00:59:15.007+0000 INFO  This instance is ServerId{332a7c61} (332a7c61-e53d-4e65-a2bd-b34f3db933b4)
2025-12-20 00:59:15.430+0000 INFO  ======== Neo4j 2025.10.1 ========
SLF4J: Failed to load class "org.slf4j.impl.StaticLoggerBinder".
SLF4J: Defaulting to no-operation (NOP) logger implementation
SLF4J: See http://www.slf4j.org/codes.html#StaticLoggerBinder for further details.
2025-12-20 00:59:16.485+0000 INFO  Anonymous Usage Data is being sent to Neo4j, see https://neo4j.com/docs/usage-data/
2025-12-20 00:59:16.588+0000 INFO  Bolt enabled on 0.0.0.0:7687.
2025-12-20 00:59:16.876+0000 INFO  HTTP enabled on 0.0.0.0:7474.
2025-12-20 00:59:16.876+0000 INFO  Remote interface available at http://localhost:7474/
2025-12-20 00:59:16.878+0000 INFO  id: B76C22FEAC53999AE5FAAFE9F0FB24D88670CBE6A3155E7D05636926D644B35E
2025-12-20 00:59:16.878+0000 INFO  name: system
2025-12-20 00:59:16.878+0000 INFO  creationDate: 2025-12-20T00:53:27.055Z
2025-12-20 00:59:16.879+0000 INFO  Started.
```

## 3. Import RDF ontology

지금부터 온톨로지 파일을 임포트해보자. 컨테이너가 정상적으로 실행되었다면 [http://localhost:7474/browser/](http://localhost:7474/browser/) 경로에 접속할 수 있다. 다음과 같은 화면을 볼 수 있다. 컨테이너를 실행할 때 지정한 아이디와 비밀번호를 사용한다.

- ID - neo4j
- PASSWORD - cool-culture-vodka-beach-eric-9620

<div align="center">
  <img src="/images/posts/2025/import-tutle-file-into-neo4j-browser-01.png" width="100%" class="image__border">
</div>

<br />

로그인에 성공하면 다음과 같은 왼쪽 사이드 바에 데이터베이스 정보가 비어있는 것을 볼 수 있다. 화면 상단에는 사이퍼(cypher) 언어를 실행할 수 있는 입력란이 있다. 이후로 살펴보는 사이퍼 쿼리는 화면 상단 입력란에서 실행한다.

<div align="center">
  <img src="/images/posts/2025/import-tutle-file-into-neo4j-browser-02.png" width="100%" class="image__border">
</div>

<br />

RDF 데이터를 임포트하기 전에 먼저 제약 조건을 생성한다. 이 제약 조건은 데이터 무결성과 성능 두 가지 측면에서 필요하다.

- 고유한 식별자 보장 (Identity)
  - RDF 데이터의 핵심은 **URI(Uniform Resource Identifier)**이다.
  - 이 제약 조건이 없으면, 데이터를 임포트할 때마다 같은 URI를 가진 노드가 중복 생성될 수 있다.
  - n10s는 이 제약 조건을 통해 **"이미 이 URI를 가진 노드가 있으면 그 노드를 쓰고, 없으면 새로 만든다(MERGE)"**는 로직을 수행한다.
  - 예를 들어, http://example.org/apple이라는 URI는 전 세계에서 유일한 '사과'라는 개념을 나타내야 한다.
- 임포트 성능 향상 (Performance)
  - 제약 조건은 내부적으로 **인덱스(Index)**를 생성한다.
  - 수천, 수만 개의 RDF 트리플(Triple)을 임포트할 때, 인덱스가 없다면 Neo4j는 중복 여부를 확인하기 위해 매번 전체 데이터를 풀 스캔(full scan)한다.
  - 인덱스가 있으면 검색 속도가 비약적으로 빨라져 임포트 속도가 크게 향상된다.

```
CREATE CONSTRAINT n10s_unique_uri FOR (r:Resource) REQUIRE r.uri IS UNIQUE
```

화면 상단 입력란에서 사이퍼를 실행하면 다음과 같은 결과를 볼 수 있다.

<div align="center">
  <img src="/images/posts/2025/import-tutle-file-into-neo4j-browser-03.png" width="100%" class="image__border">
</div>

<br />

다음으로 `GraphConfig`를 생성한다. 이는 RDF 데이터가 neo4j에 저장되는 방식을 정의한다. 기본 설정 값을 통해 어떤 동작을 하는지 예시를 살펴보자. handleVocabUris 값은 'SHORTEN'으로 설정된다.

- 긴 URI를 짧은 접두어(Prefix)로 줄여서 저장한다. neo4j의 속성(property) 이름이나 레이블(label)에 http://... 같은 긴 문자열이 들어가면 쿼리 작성이 불편하고 가독성이 떨어지기 때문이다.
- 예를 들어 RDF의 `http://xmlns.com/foaf/0.1/Person` URI 데이터를 `foaf__Person`으로 표현한다.

handleRDFTypes 값은 'LABELS'으로 설정된다.

- RDF의 rdf:type 속성을 neo4j의 라벨로 변환한다. neo4j에서는 노드의 종류를 구분할 때 레이블을 사용하는 것이 정석이다. 그래프 모델링의 자연스러운 매핑 방식이다.
- 예를 들어 `<http://example.org/me> <rdf:type> <http://example.org/Person>`라는 트리플을 `:Person { uri: "http://example.org/me" }`라는 노드로 변경한다.

handleMultival 값은 'OVERWRITE'으로 설정된다.

- 하나의 속성에 여러 값이 들어올 경우, 마지막 값으로 덮어쓴다. neo4j의 속성은 기본적으로 단일 값을 가진다. 모든 속성을 배열(Array)로 만들면 데이터 관리가 복잡해지기 때문에, 기본값은 덮어쓰기로 설정되어 있다. 만약 배열로 받고 싶다면 ARRAY 옵션을 써야 한다.
- 예를 들어, RDF에 `A hasName "Kim", A hasName "K."` 두 개의 트리플이 존재하는 경우 A 노드의 name 속성은 마지막에 들어온 "K."가 된다. 배열로 저장되지 않는다.

다양한 설정 값들이 존재하므로 자세한 내용은 [이 링크](https://neo4j.com/labs/neosemantics/4.0/reference/#_graph_config_params_global_settings)를 참고하길 바란다. 아래 사이퍼를 통해 기본 설정으로 초기화한다.

```
CALL n10s.graphconfig.init()
```

화면 상단 입력란에서 사이퍼를 실행하면 다음과 같은 결과를 볼 수 있다.

<div align="center">
  <img src="/images/posts/2025/import-tutle-file-into-neo4j-browser-04.png" width="100%" class="image__border">
</div>

<br />

그래프 설정이 생성되면 RDF 데이터를 URL, 인라인(inline), 파일을 통해 임포트 할 수 있다. 이 글은 `import` 디렉토리에 위치한 터틀 파일을 사용한다.

```
CALL n10s.rdf.import.fetch(
  "file:///var/lib/neo4j/import/netflix.ttl", 
  "Turtle"
);
```

위 명령어를 실행하면 노드 라벨들이 생성된다.

<div align="center">
  <img src="/images/posts/2025/import-tutle-file-into-neo4j-browser-05.png" width="100%" class="image__border">
</div>

<br />

해당 데이터들의 연결을 그래프로 확인할 수 있다.

<div align="center">
  <img src="/images/posts/2025/import-tutle-file-into-neo4j-browser-06.png" width="100%" class="image__border">
</div>

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2025-12-20-import-tutle-file-into-neo4j-browser>

#### REFERENCE

- <https://neo4j.com/labs/neosemantics/installation/>
- <https://neo4j.com/developer/docker-run-neo4j/>
- <https://github.com/neo4j-labs/neosemantics>
- <https://github.com/neo4j-labs/neosemantics/releases>
- <https://neo4j.com/labs/neosemantics/4.0/reference/#_graph_config_params_global_settings>

[ai-ontology-link]: https://junhyunny.github.io/ai/ai-agent/ontology/context/context-engineering/ai-ontology/