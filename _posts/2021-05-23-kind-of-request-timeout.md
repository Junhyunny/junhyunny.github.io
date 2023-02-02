---
title: "Request Timeout 종류"
search: false
category:
  - information
last_modified_at: 2021-09-02T03:00:00
---

<br/>

## 0. 들어가면서

서버 어플리케이션을 개발하다보면 Timeout과 관련된 Exception들을 볼 수 있습니다. 
개발자가 자주 겪게 되는 몇 가지 Timeout에 대해 정리해보겠습니다. 

## 1. Connection Timeout
클라이언트가 서버와 연결을 맺지 못하는 경우 발생하는 Timeout 입니다. 
3-Way Handshake을 정상적으로 수행해야지 클라이언트와 서버가 정상적으로 연결을 맺었다고 말할 수 있습니다. 
3-Way Handshake을 수행하는데 소요되는 시간을 연결(Connection)에 소요된 시간이라 말할 수 있습니다. 
다시 말해 Connection Timeout은 연결을 하는데 소요되는 시간의 임계치를 의미합니다. 

<p align="center"><img src="/images/kind-of-request-timeout-1.jpg" width="70%"></p>

## 2. Socket Timeout
클라이언트와 서버가 정상적으로 연결된 이후에 발생합니다. 
서버는 클라이언트에게 응답 메세지를 전달할 때 하나의 메세지를 여러 개의 패킷(packet)으로 나누어 전달합니다. 
클라이언트가 응답에 대한 패킷을 전달받을 때 시간 차이가 발생할 수 있습니다. 
이 때 발생하는 시간 차이의 임계치가 Socket Timeout 입니다. 

<p align="center"><img src="/images/kind-of-request-timeout-2.jpg" width="70%"></p>

## 3. Read Timeout
Read Timeout도 Socket Timeout과 마찬가지로 서버와 정상적인 연결은 된 이후에 발생합니다. 
서버가 클라이언트의 요청을 받아 처리하는 시간이 길어지게 되는 경우 Read Timeout이 발생합니다. 
클라이언트가 특정 시간 동안 서버로부터 요청에 대한 응답을 받지 못하게 되는 경우입니다. 

<p align="center"><img src="/images/kind-of-request-timeout-3.jpg" width="70%"></p>

## CLOSING
Read Timeout과 달리 Connection Timeout, Socket Timeout 두 가지는 상황 재현이 쉽지 않았습니다. 
상황 재현을 할 수 있는 테스트 코드를 작성하지 못하여 아쉽습니다. 
프로젝트 수행 중 관련된 에러를 만나면 재현 테스트 코드를 정리하여 올려야겠습니다. 

#### REFERENCE
- <https://cornswrold.tistory.com/401>
- <https://tomining.tistory.com/164>