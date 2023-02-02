---
title: "Slack Chatbot 1차 기능 확장"
search: false
category:
  - side-project
last_modified_at: 2021-09-02T00:00:00
---

<br/>

## 0. 들어가면서

예전 만들어봤던 단순 commit 확인 채팅 봇의 기능을 확장해보려고 합니다.([Slack Chatbot 개발][side-project-slack-chatbot-link]) 
딱히 요구사항은 없었지만 계속 늘어나는 법인 카드 영수증 관리가 힘들어지기 시작했습니다. 
편한 영수증 관리를 위해 특정 키워드와 함께 이미지들을 올리면 이미지들을 팀 공식 이메일로 전달하는 기능을 만들기로 했습니다. 
기존에 제공하던 1 일 1 commit 여부를 확인해주는 기능은 그대로 사용하되, 특정 채널에 있는 멤버들을 대상으로 삼기로 하였습니다. 
사람 손이 부족하니 틈틈히 취미로 기능을 구현할 예정입니다. 

일단 추가적으로 필요한 기능들을 명세해보았습니다.
- 기존 commit 여부 확인 기능 확장, 특정 채널 내 사용자들의 개인 public repo push 여부 확인
- webhook 연동
- 특정 키워드 감지
- 업로드한 이미지 수집 및 Team Geneuin 공식 이메일로 사진 전송

우선 기존 commit 여부 확인 기능을 확장하였습니다. 

## 1. 채널 내 사용자 정보 가져오기
우선 1일 1 commit 여부를 확인하는 채널에 초대된 사용자 정보를 가져오는 기능이 필요했습니다. 
관련된 Slack API 기능을 살펴보니 아래와 같은 기능을 사용할 수 있을 것 같았습니다.

### 1.1. Slack API
- 채널 내 사용자 ID 가져오기, <https://api.slack.com/methods/conversations.members>
- 사용자 정보 가져오기, <https://api.slack.com/methods/users.info>

### 1.2. '사용자 정보 가져오기' 기능 구현
Slack의 사용자 정보를 가져오는 기능 테스트 중 다음과 같은 에러가 발생하였습니다. 
**`users:read`** 권한이 없다는 의미이므로 이를 추가합니다. 

##### missing_scope, users:read 에러

```json
{
    "ok": false,
    "error": "missing_scope",
    "needed": "users:read",
    "provided": "incoming-webhook,channels:read,groups:read,im:read,mpim:read,channels:history,groups:history,im:history,mpim:history,chat:write"
}
```

##### 'users:read' 권한 추가
- OAuth & Permissions > Scopes > Add an OAuth Scope 클릭

<div align="center">
    <img src="/images/side-project-slack-chatbot-first-expansion-1.JPG" width="25%">
    <img src="/images/side-project-slack-chatbot-first-expansion-2.JPG" width="70%">
</div>

##### 권한 추가 후 정상 응답

```json
{
    "ok": true,
    "user": {
        "name": "kang3966",
        "deleted": false,
        "real_name": "강준현",
        "tz": "Asia/Seoul",
        "tz_label": "Korea Standard Time",
        "tz_offset": 32400,
        "profile": {
            "real_name": "강준현",
            "real_name_normalized": "강준현",
            "display_name": "Junhyunny",
            "display_name_normalized": "Junhyunny",
            // ...
        },
        // ...
    }
}
```

## 2. 프로젝트 기능 변경하기

### 2.1. Profile 클래스
- Slack 사용자 정보를 담을 수 있는 클래스를 생성합니다.

```java
package io.junhyunny.entity;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class Profile {

    private String realName;
    private String realNameNormalized;
    private String displayName;
    private String displayNameNormalized;
}
```

### 2.2. GeneuinMember 클래스
- Slack 특정 채널에 참여하고 있는 인원들의 정보를 담는 클래스입니다. 
- Profile 클래스에 해당하는 멤버를 지니고 있습니다. 
- Slack 서버로부터 전달받은 Json 타입의 사용자 정보를 객체화하기 위한 클래스입니다.

```java
package io.junhyunny.entity;

import io.junhyunny.utils.JsonUtils;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeneuinMember {

    private String name;
    private String realName;
    private Profile profile;

    public GeneuinMember() {
        profile = new Profile();
    }

    @Override
    public String toString() {
        return JsonUtils.toJson(this);
    }
}
```

### 2.3. Slack 클래스 getMembersInChannel 메소드
- 채널 내 멤버 정보를 가져오는 기능이 추가되었습니다. 
- `https://slack.com/api/conversations.members` 경로로 채널 내 멤버들의 Key 정보를 요청합니다.
- 받은 응답을 기준으로 `https://slack.com/api/users.info` 경로로 사용자 상세 정보를 요청합니다.
- 전달받은 사용자 상세 정보를 GeneuinMember 객체로 변환합니다.

```java

@Log4j2
public class Slack {
    
    // 기타 다른 코드

    public Map<String, GeneuinMember> getMembersInChannel(String channelId) {

        Map<String, GeneuinMember> result = new HashMap<>();

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(headers);

        StringBuffer url = new StringBuffer("https://slack.com/api/conversations.members");
        url.append("?channel=").append(channelId);

        Map<String, List<Map<String, Object>>> response = restTemplate.exchange(url.toString(), HttpMethod.GET, entity, Map.class).getBody();
        if (response == null) {
            return null;
        }

        url.delete(0, url.length());
        url.append("https://slack.com/api/users.info");
        url.append("?user=");

        List<String> memberKeys = (ArrayList) response.get("members");
        for (String memberKey : memberKeys) {
            Map<String, Object> mapMember = restTemplate.exchange(url + memberKey, HttpMethod.GET, entity, Map.class).getBody();
            result.put(memberKey, JsonUtils.fromJson(JsonUtils.toJson(mapMember.get("user")), GeneuinMember.class));
        }

        return result;
    }
}
```

##### 테스트 결과
- `'display_name'` 사용자의 GitHub 원격 저장소가 존재하지 않는 경우 관련된 에러 메세지를 전달합니다.
- 해당 이름으로 관리되는 원격 저장소가 존재하는 경우 commit 후 push 수행된 이력이 존재하는지 여부를 확인합니다. 

<p align="center"><img src="/images/side-project-slack-chatbot-first-expansion-3.JPG" width="100%"></p>

## CLOSING
이 외에 리팩토링과 메소드 변경이 있었으나 신규로 추가된 기능에 대해서만 포스트로 작성하였습니다. 
리팩토링 된 부분들은 크게 기능에 대한 변경이 없었기 때문에 별도로 추가하지는 않았습니다. 
이후에 Webhook 연동, 이미지 파일 획득, 메일 전달 기능 등을 차근차근 구현하고 포스트로 공유하도록 하겠습니다. 

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/slack-chatbot>

#### REFERENCE
- <https://api.slack.com/methods/conversations.members>
- <https://api.slack.com/methods/users.info>

[side-project-slack-chatbot-link]: https://junhyunny.github.io/side-project/side-project-slack-chatbot/