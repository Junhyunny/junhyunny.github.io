---
title: "Slack Chatbot"
search: false
category:
  - side-project
last_modified_at: 2021-08-25T00:00:00
---

<br/>

## 0. 들어가면서

공부하다 흘러들어간 블로그에 GitHub 일일 commit 여부를 알려주는 Slack 채팅 봇 개발기를 보았습니다.([일일커밋 알림봇 개발기][mingrammer-blog-link]) 
**`'기능도 간단해 보이는데 Java 언어로 개발한 사람이 없다면 내가 만들어볼까?'`** 
하던 공부는 접고 바로 개발에 착수했습니다. 
Slack 어플리케이션을 안 사용하고 있었기 때문에 일단 다운받고 채팅 봇 만드는 방법을 찾아봤습니다. 

## 1. Slack 봇 등록
Slack 어플리케이션이랑 안 친해서 많이 헤맸습니다. 
[Python으로 Slack Bot 만들기][python-slack-chatbot-blog-link] 포스트를 참고해서 간신히 채널 생성과 채팅 봇 등록을 했습니다. 

## 2. Slack API 테스트
이제 봇도 등록했으니 본격적으로 코드를 작성했습니다. 
Slack API 기능과 GitHub API 기능을 이어 붙히면 되기 때문에 먼저 필요한 Slack API 기능들을 찾아봤습니다. 
기능 테스트 시 겪은 간단한 이슈들만 정리해보겠습니다. 

### 2.1. Slack 채널 정보 조회 기능
[Python으로 Slack Bot 만들기][python-slack-chatbot-blog-link] 포스트를 보면 이상한 느낌을 받았습니다. 
보통 Content-Type 같은 정보는 HTTP Header를 통해 전달하는데 참고한 코드를 보면 쿼리 parameter로 전달하는 느낌? 
일단 해당 포스트를 작성한 분은 성공한 것으로 보이나 내 방식대로 Content-Type 정보는 HTTP Header로 전달하기로 했습니다.

#### 2.1.1. [Python으로 Slack Bot 만들기] 참조한 코드
```python
# 채널 조회 API 메소드: conversations.list
URL = 'https://slack.com/api/conversations.list'

# 파라미터
params = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'token': slack_token
          }

# API 호출
res = requests.get(URL, params = params)
```

##### 채널 조회 요청 실패 로그, Slack 인증 에러
```
2021-04-09 19:26:50.695  INFO 10572 --- [           main] io.junhyunny.SlackChatBotTest            : {ok=false, error=invalid_auth}
```

역시나 실패. 
**`음~, 그래도 역시 URL에 노출하고 싶지 않은데? 다른 방법 없을까?`** 
Slack API 문서를 뒤지다보니 다른 방법이 있었습니다. 
확인해보니 HTTP Header로 전달하려면 Content-Type을 **`application/json`**, 
Request Parameter 혹은 Request Body로 전달하려면 **`application/x-www-form-urlencoded`** 사용합니다. 
또, HTTP Header에서 토큰 정보는 Authorization 키워드를 키로 전달하고, 토큰 앞에 Bearer 키워드를 추가합니다. 

##### Slack API 문서
<p align="center"><img src="/images/side-project-slack-chatbot-1.JPG" width="75%"></p>

### 2.1.2. Slack 채널 정보 조회 테스트 코드
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

### 2.2. Slack 채널에 글 작성 기능
이제 채널에 글 작성을 위한 요청을 하는 코드를 작성합니다. 

#### 2.2.1. [Python으로 Slack Bot 만들기] 참조한 코드
```python
# 파라미터
data = {'Content-Type': 'application/x-www-form-urlencoded',
        'token': slack_token,
        'channel': channel_id, 
        'text': message,
        'reply_broadcast': 'True', 
        'thread_ts': ts
        } 

# 메세지 등록 API 메소드: chat.postMessage
URL = "https://slack.com/api/chat.postMessage"
res = requests.post(URL, data=data)
```

##### Warning 발견, warning=missing_charset
```
2021-04-09 19:54:17.638  INFO 8476 --- [           main] io.junhyunny.SlackChatBotTest            : result: {ok=true, ... warning=missing_charset, response_metadata={warnings=[missing_charset]}}
```

뭔지 모르겠지만 해결해야지 속이 시원할 것 같습니다. 
StackOverflow 답변을 보니 HTTP Header에 인코딩 타입을 안 넣어서 발생한 것으로 보입니다. 

##### StackOverflow 답변
<p align="center"><img src="/images/side-project-slack-chatbot-2.JPG" width="75%"></p>

#### 2.2.2. Slack 채널에 글 작성하기 테스트 코드
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

##### Slack 채널에 글 작성하기 테스트 결과
<p align="center"><img src="/images/side-project-slack-chatbot-3.JPG" width="30%"></p>

## 3. GitHub API 테스트

### 3.1. pom.xml - 의존성 추가
Java 언어를 사용하는 개발자들은 주로 **`github-api`** 라이브러리를 이용하는 것으로 보입니다. 

```xml
<dependency>
    <groupId>org.kohsuke</groupId>
    <artifactId>github-api</artifactId>
</dependency>
```

해당 라이브러리에서 필요한 기능을 제공하지 않는 것 같아서 사용하지 않기로 했습니다. 
제가 필요한 기능은 간단합니다. 
특정 사용자의 repository 정보들과 해당 repository에 오늘 push 한 이력이 있는지만 확인하면 되기 때문에 GitHub API 문서를 찾아봤습니다. 
딱 원하는 기능을 발견했습니다. 
각 repository 별로 마지막 push 시간까지 알려주기 때문에 해당 API를 사용하기로 결정했습니다.

##### GitHub API
<p align="center"><img src="/images/side-project-slack-chatbot-4.JPG" width="75%"></p>

### 3.2. 사용자 GitHub repository push 이력 확인
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