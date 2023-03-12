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
    <img src="/images/side-project-slack-chatbot-2.JPG" width="35%" class="image__border">
</p>

## 3. Test GitHub API

슬랙에 필요한 API 요청은 모두 확인하였습니다. 
이번엔 깃허브(github) API 요청을 테스트합니다.

### 3.1. Github API Document

Java를 사용한 어플리케이션은 주로 **`github-api`** 라이브러리를 사용하는 것으로 보입니다. 
찾아보니 해당 라이브러리에서 필요한 기능을 따로 제공하지 않는 것으로 보여 직접 구현하기로 결정했습니다. 
다음과 같은 기능이 필요했습니다. 

> 특정 사용자의 저장소(repository) 정보들과 해당 저장소에 오늘 푸시(push)한 이력을 확인한다. 

API 문서를 찾아보니 원하는 기능을 제공하는 엔드포인트(endpoint)가 있었습니다. 
해당 API를 사용하기로 결정했습니다. 

* GET 요청을 보냅니다.
* /users/{username}/repos 경로를 호출합니다.
* 다음과 같은 파라미터가 필요합니다.
    * accept
    * username
    * type
    * sort
    * direction
    * per_page

<p align="center">
    <img src="/images/side-project-slack-chatbot-3.JPG" width="80%" class="image__border">
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

## 4. AWS Lambda

AWS(amazone web service)는 많이 사용해보지 않아서 어려웠습니다. 
이번에 사용한 AWS 람다(lambda)는 특정 시간마다 트리거를 통해 필요한 로직이 수행됩니다. 
`Java`로 개발하는 방법은 다음과 같습니다. 

1. [RequestStreamHandler 인터페이스 구현][java-handler-link]
1. [zip(혹은 jar) 파일 빌드 및 배포][java-deploy-link]
    * 주기적으로 어플리케이션을 동작시키는 EventBridge(CloudWatch Events) 트리거를 연결합니다.

### 4.1. Implementation RequestStreamHandler Interface

전체 코드는 아래 깃허브 저장소에서 확인바랍니다.

* 미리 AWS 람다에 등록한 토큰이나 사용자 정보를 추출합니다. 
* 추출한 정보에 해당하는 깃허브 레포지토리 정보를 가져옵니다.
* 커밋 이력이 없다면 슬랙으로 메세지를 전송합니다.

```java
package io.junhyunny.chatbot;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.Map;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestStreamHandler;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import io.junhyunny.chatbot.github.Github;
import io.junhyunny.chatbot.slack.Slack;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class LambdaSlackChatBot implements RequestStreamHandler {

	public LambdaSlackChatBot() {}

	@SuppressWarnings("unchecked")
	@Override
	public void handleRequest(InputStream inputStream, OutputStream outputStream, Context context) throws IOException {
		Gson gson = new GsonBuilder().setPrettyPrinting().create();
		try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, Charset.forName("US-ASCII")))) {
			Map<String, Object> event = gson.fromJson(reader, HashMap.class);
			log.info("event: " + event);
			String owner = (String) event.get("owner");
			String slackToken = (String) event.get("slackToken");
			String channelName = (String) event.get("channelName");
			Github github = new Github(owner);
			if (!github.doCommitToday()) {
				Slack slack = new Slack(slackToken);
				slack.sendPushMessage(channelName);
			}
		} catch (Exception exception) {
			log.info(exception.toString(), exception);
		}
	}
}
```

### 4.2. Deploy

메이븐(maven) 프로젝트이므로 `mvn package` 등의 명령어를 통해 jar 파일을 만들 수 있습니다. 
빌드한 jar 파일을 배포하는 과정을 위주로 정리하였습니다. 

##### AWS Lambda Structure for Slack Bot

<p align="center">
    <img src="/images/side-project-slack-chatbot-4.JPG" width="100%" class="image__border">
</p>

##### Register Slack Chat Bot at AWS Lambda

* 빌드된 jar 파일을 업로드합니다.
* RequestStreamHandler 인터페이스를 구현한 클래스를 등록합니다. 

<p align="center">
    <img src="/images/side-project-slack-chatbot-5.JPG" width="100%" class="image__border">
</p>

##### Move to EventBridge Setup Page

* 어플리케이션이 동작할 때 필요한 특정 파라미터와 트리거 주기를 설정하기 위한 화면으로 이동합니다. 

<p align="center">
    <img src="/images/side-project-slack-chatbot-6.JPG" width="100%" class="image__border">
</p>

##### Setup Cron Job 

* 이벤트 트리거 주기를 설정합니다. 

<p align="center">
    <img src="/images/side-project-slack-chatbot-7.JPG" width="80%" class="image__border">
</p>

##### Setup Parameters for Slack Bot

* 코드에 공개하고 싶지 않은 값들은 람다의 파라미터로 등록합니다. 

```json
{
  "owner": "your github repository user name",
  "slackToken": "your slack token",
  "channelName": "your slack channel"
}
```

<p align="center">
    <img src="/images/side-project-slack-chatbot-8.JPG" width="80%" class="image__border">
</p>

## 5. Check Application

이번에 개발한 슬랙 챗 봇은 18시 59분부터 23시 59분까지 푸시 이력이 없다면 1시간 간격으로 메세지를 전달합니다. 

<div align="left">
    <img src="/images/side-project-slack-chatbot-9.JPG" width="30%" class="image__border">
    <img src="/images/side-project-slack-chatbot-10.JPG" width="30%" class="image__border">
</div>

#### TEST CODE REPOSITORY

* <https://github.com/Junhyunny/slack-chatbot>

#### REFERENCE

* <https://mingrammer.com/dev-commit-alarm-bot/>
* <https://wooiljeong.github.io/python/slack-bot/>
* <https://api.slack.com/legacy/oauth#authenticating-users-with-oauth__using-access-tokens>
* <https://stackoverflow.com/questions/63550032/slackbot-openmodal-error-missing-charset>
* <https://docs.github.com/en/rest/reference/repos#list-repositories-for-a-user>
* <https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html>
* <https://docs.aws.amazon.com/lambda/latest/dg/java-package.html>

[mingrammer-blog-link]: https://mingrammer.com/dev-commit-alarm-bot/
[python-slack-chatbot-blog-link]: https://wooiljeong.github.io/python/slack-bot/
[java-handler-link]: https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html
[java-deploy-link]: https://docs.aws.amazon.com/lambda/latest/dg/java-package.html