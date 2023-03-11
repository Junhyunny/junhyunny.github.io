---
title: "Slack Chatbot"
search: false
category:
  - side-project
last_modified_at: 2021-08-25T00:00:00
---

<br/>

## 0. 들어가면서

토이 프로젝트로 간단한 어플리케이션을 만들고 싶었습니다. 
백엔드(backend) 관련된 기술만 다룰 줄 아는 탓에 간단한 어플리케이션을 기능을 만들어 보는 것도 쉽지 않았습니다. 
그러던 중 [일일커밋 알림봇 개발기][mingrammer-blog-link]에 대한 글을 보게 되었습니다. 
해당 글이나 대부분의 레퍼런스들이 파이썬(python)으로 개발되어 있기 때문에 저는 Java로 만들어보았습니다. 

## 1. Make Slack Bot 

우선 슬랙 봇(bot)이 하나 필요합니다. 
슬랙 API 요청을 수행할 땐 토큰(token) 정보가 필요합니다.  
자세한 설명은 아래 링크를 참조하시고 따라해보면서 토큰을 하나 발급 받습니다.

* [Python으로 Slack Bot 만들기][python-slack-chatbot-blog-link] 

## 2. Test Slack API

슬랙 봇이 등록되었다면 간단한 API 요청 기능을 테스트합니다. 
`RestTemplate` 클래스를 사용하여 API 요청을 수행합니다. 
요청 자체는 매우 단순하기 때문에 해당 기능을 구현하면서 만난 문제들에 대해 정리하였습니다. 

### 2.1. Search Channel 

Slack 워크스페이스(workspace)에서 사용하는 

* Slack API 관련된 문서를 살펴보면 다음과 같은 내용이 있습니다. 
* 헤더 인가(Authorization) 항목에 `Bearer`를 추가하고, 토큰을 함께 전달합니다.
* `WRITE` 기능을 수행하는 메소드에 `application/json` 타입을 사용합니다.
* 토큰을 쿼리 파라미터로 바디(body)에 담아 던지고 싶으면 `application/x-www-form-urlencoded`을 사용합니다.

```java
    @SuppressWarnings({ "rawtypes", "unchecked" })
    @Test
    void getChannel() {

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", "Bearer " + slackToken);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<Map<String, Object>>(headers);

        RestTemplate restTemplate = new RestTemplate();
        List<Map<String, Object>> channels = (List) restTemplate.exchange("https://slack.com/api/conversations.list", HttpMethod.GET, entity, Map.class).getBody().get("channels");
        if(channels == null) {
            return;
        }

        for (Map<String, Object> channel : channels) {
            log.info(channel);
        }
    }
```

##### Slack API Document

<p align="center">
    <img src="/images/side-project-slack-chatbot-1.JPG" width="80%" class="image__border">
</p>

### 2.2. Write Message on Slack Channel

채널에 글 작성을 위한 API 요청 코드를 작성합니다.

```java
    @SuppressWarnings({ "unchecked", "rawtypes" })
    @Test
    void postSomeMessage() {

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", "Bearer " + slackToken);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<Map<String, Object>>(headers);

        RestTemplate restTemplate = new RestTemplate();

        Map<String, Object> response = restTemplate.exchange("https://slack.com/api/conversations.history?channel=C01TD73AZEF", HttpMethod.GET, entity, Map.class).getBody();
        List<Map<String, Object>> messages = (List) response.get("messages");
        if (messages == null || messages.isEmpty()) {
            return;
        }

        Map<String, Object> body = new HashMap<>();
        body.put("text", "Hello slack-chatbot");
        body.put("reply_broadcast", true);
        // body.put("thread_ts", messages.get(0).get("ts"));
        body.put("channel", "C01TD73AZEF");

        headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        headers.set("Authorization", "Bearer " + slackToken);

        entity = new HttpEntity<Map<String, Object>>(body, headers);

        log.info("result: " + restTemplate.exchange("https://slack.com/api/chat.postMessage", HttpMethod.POST, entity, Map.class).getBody());
    }
```

##### Result of Write Message on Slack Channel

<p align="left">
    <img src="/images/side-project-slack-chatbot-2.JPG" width="45%" class="image__border">
</p>

## 3. Test GitHub API

슬랙에 필요한 API 요청은 모두 확인하였습니다. 
이번엔 깃허브(github) API 요청을 테스트합니다.

### 3.1. Github API Document

Java를 사용한 어플리케이션은 주로 **`github-api`** 라이브러리를 사용하는 것으로 보입니다. 
찾아보니 해당 라이브러리에서 필요한 기능을 따로 제공하지 않는 것으로 보여 직접 구현하기로 결정했습니다. 
다음과 같은 기능이 필요했습니다. 

> 특정 사용자의 저장소(repository) 정보들과 해당 저장소에 오늘 푸시(push)한 이력을 확인한다. 

API 문서를 찾아보니 원하는 기능을 제공하는 엔드포인트가 이미 있었습니다. 
그래서 해당 API 요청을 사용하기로 결정했습니다. 

<p align="center">
    <img src="/images/side-project-slack-chatbot-4.JPG" width="80%" class="image__border">
</p>

### 3.2. Check Push History for Github Repository

* API 요청을 통해 다음과 같은 데이터를 추출합니다.
* 저장소 이름과 푸시 시간을 확인합니다.

```java
    @SuppressWarnings({ "unchecked" })
    @Test
    void test() throws IOException {

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<Map<String, Object>>(headers);

        RestTemplate restTemplate = new RestTemplate();
        List<Map<String, Object>> repoList = restTemplate.exchange("https://api.github.com/users/junhyunny/repos", HttpMethod.GET, entity, List.class).getBody();
        for (Map<String, Object> repo : repoList) {
            log.info("repo url: " + repo.get("name"));
            log.info("pushed_at: " + repo.get("pushed_at"));
            String time = (String) repo.get("pushed_at");
            time = time.replace("T", " ");
            time = time.replace("Z", "");
            log.info(Timestamp.valueOf(time));
        }
    }
```

## 4. AWS Lambda 어플리케이션 등록하기

AWS는 사용해본 적이 없어서 이 작업을 하는데 제일 시간이 오래 걸렸습니다. 
[일일커밋 알림봇 개발기][mingrammer-blog-link] 포스트를 보면 특정 시간부터 트리거를 통해 어플리케이션을 동작시키는 기능인 것으로 추정됩니다. 
일단 AWS Lambda 기능이 무엇인지 찾아보고 Java 어플리케이션을 올리는 방법을 알아봤습니다. 

Java Application의 경우 아래와 같은 과정이 필요한데 API 문서를 읽어보면 쉽게 이해할 수 있습니다.
1. [RequestStreamHandler 인터페이스 구현 클래스 작성하기][java-handler-link]
1. [.zip(혹은 .jar) 파일로 배포하기][java-deploy-link]

위 과정을 걸쳐서 배포에 필요한 .jar 파일을 만들었으면 이제 Lamda 어플리케이션을 등록해보겠습니다. 
Lambda 어플리케이션과 주기적으로 어플리케이션을 동작시켜주는 EventBridge(CloudWatch Events) 트리거를 등록합니다. 

##### Slack Chatbot AWS Lambda 구성

<p align="center"><img src="/images/side-project-slack-chatbot-5.JPG"></p>

### 4.1. Lambda 어플리케이션 등록

빌드 .jar를 올려주고 RequestStreamHandler 인터페이스를 구현한 클래스를 등록합니다. 

##### .jar 파일 업로드 및 RequestStreamHandler 인터페이스 구현 클래스 등록

<p align="center"><img src="/images/side-project-slack-chatbot-6.JPG"></p>

### 4.2. Event Trigger 주기 설정 및 요청 parameter 등록

프로그램에 repository 사용자 정보, Slack token 정보, Slack Channel 정보가 코드에 하드 코딩되어 있으면 
불필요한 정보가 노출되기 때문에 아래와 같은 요청 parameter로 전달하기로 했습니다. 
EventBridge(CloudWatch Events) 설정에 들어가면 주기 설정과 parameter를 등록할 수 있는 Console 화면이 존재합니다. 
해당 화면에서 주기와 요청 parameter를 등록합니다. 

##### AWS Lambda 요청 parameter

```json
{
  "owner": "your github repository user name",
  "slackToken": "your slack token",
  "channelName": "your slack channel"
}
```

##### EventBridge 설정 편집 화면 이동
<p align="center"><img src="/images/side-project-slack-chatbot-7.JPG"></p>

##### Event Trigger 주기 설정
<p align="center"><img src="/images/side-project-slack-chatbot-8.JPG" width="75%"></p>

##### Event Trigger 요청 parameter 등록
<p align="center"><img src="/images/side-project-slack-chatbot-9.JPG" width="75%"></p>

## 5. Slack Chatbot 배포 후 확인
내 Slack Chatbot은 오후 6시 59분부터 1시간 간격으로 11시 59분까지 GitHub repository에 push 이력이 없으면 commit 하라는 메세지를 전달합니다. 
일부러 push 하지 않고 commit 독촉 메세지가 오기를 기다려봤습니다. 
과연... 결과는?

##### Message from Slack Chatbot
<div align="center">
  <img src="/images/side-project-slack-chatbot-10.JPG" width="30%">
  <img src="/images/side-project-slack-chatbot-11.JPG" width="30%">
</div>

정상적으로 동작합니다. 앞으로 공부하라는 메세지를 받을 일만 남았습니다.
간단한 chatbot 개발기를 작성해봤는데 개발하는 시간보다 개발한 내용들을 정리하는게 더 시간이 오래 걸렸습니다. 
정리하는 일이 귀찮기는 하지만 정리해놓으면 나중에 필요한 날이 올 것이라 믿습니다. 
공부나 일을 하다가 필요한 기능이 생기면 자동화 할 방법이 있는지 궁리해보면서 이런 프로그램 개발기들을 하나씩 늘려가야겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/slack-chatbot>

#### REFERENCE
- <https://mingrammer.com/dev-commit-alarm-bot/>
- <https://wooiljeong.github.io/python/slack-bot/>
- <https://api.slack.com/legacy/oauth#authenticating-users-with-oauth__using-access-tokens>
- <https://stackoverflow.com/questions/63550032/slackbot-openmodal-error-missing-charset>
- <https://docs.github.com/en/rest/reference/repos#list-repositories-for-a-user>
- <https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html>
- <https://docs.aws.amazon.com/lambda/latest/dg/java-package.html>

[mingrammer-blog-link]: https://mingrammer.com/dev-commit-alarm-bot/
[python-slack-chatbot-blog-link]: https://wooiljeong.github.io/python/slack-bot/
[java-handler-link]: https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html
[java-deploy-link]: https://docs.aws.amazon.com/lambda/latest/dg/java-package.html