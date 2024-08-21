---
title: "EC2 SSH Tunnel for RDS connection"
search: false
category:
  - aws
last_modified_at: 2024-08-21T23:55:00
---

<br/>

## 0. 들어가면서

AWS 클라우드 환경에서 데이터베이스(RDS)는 보통 프라이빗 서브넷(private subnet)에 위치한다. 개발이나 운영을 하면 데이터베이스에 직접 접속할 일이 많은데 이때 프라이빗 서브넷에 위치한 데이터베이스에 접근이 제한된다. 어떻게 안전한 방법으로 데이터베이스에 접근할 수 있을까? AWS 클라우드는 비공개 키로만 접근할 수 있는 EC2 인스턴스를 통해 데이터베이스에 접속할 수 있는 방법을 제공한다. 

## 1. Create EC2 Container 

먼저 프록시 역할을 수행할 EC2 컨테이너를 만든다. 

- `Launch Intances` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-01.png" width="100%" class="image__border">
</div>

<br/>

인스턴스 이름과 타입을 지정한다.

- `instance-connection-endpoint-for-rds`을 사용한다.
- 데이터베이스 접속을 위한 프록시 서버이므로 무료 티어 인스턴스를 사용한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-02.png" width="80%" class="image__border">
</div>

<br/>

EC2 인스턴스에 접속하기 위한 키-페어(key-pair)를 만든다. 여기서 생성한 SSH 터널링에서 이 비공개 키를 사용한다. 기존의 것을 사용해도 되지만, 예제에선 새로운 키를 생성한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-03.png" width="80%" class="image__border">
</div>

<br/>

EC2 인스턴스를 위한 네트워크 설정을 수행한다.

- 데이터베이스와 동일한 VPC인 `demo-service-vpc`를 선택한다.
- 클라이언트에서 인터넷을 통해 접근이 가능해야하기 때문에 공개 서브넷(public subnet)을 선택한다.
- 외부에서 접근할 수 있도록 공개 IP 설정을 허용한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-04.png" width="80%" class="image__border">
</div>

<br/>

네트워크 설정에서 방화벽 역할을 수행하는 시큐리티 그룹(security group)을 새로 정의한다. 클라이언트는 SSH 통신을 사용해 EC2에 접속하기 떄문에 22 포트에 대한 접근을 허용한다. 

- 필자의 컴퓨터에서만 접근 가능하도록 IP 대역을 필자의 IP로 제한한다

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-05.png" width="80%" class="image__border">
</div>

<br/>

인스턴스를 실행한다.

- `Launch Instances` 버튼을 누른다.

<div align="left">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-06.png" width="45%" class="image__border">
</div>

## 2. Create Network Connection

생성된 EC2 인스턴스와 데이터베이스를 연결한다. `EC2 대시보드`에서 해당 EC2 인스턴스를 선택하고 데이터베이스 연결을 수행한다.

- `Actions > Networking > Connect RDS database`를 선택한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-07.png" width="80%" class="image__border">
</div>

<br/>

연결할 데이터베이스 클러스터를 선택한다.

- `demo-rds-aurora-postgres` 데이터베이스를 선택한다.
- `Connect` 버튼을 누른다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-08.png" width="80%" class="image__border">
</div>

<br/>

연결이 완료되면 필요한 시큐리티 그룹들이 새로 생성된다. 

## 3. Connect from DataGrip

이제 데이터베이스에 연결해보자. 필자는 DataGrip을 사용했다. SSH 터널링만 지원한다면 TablePlus 같은 무료 도구를 사용해도 된다. DataGrip에서 새로운 연결 정보를 만든다.

- SSH/SSL 탭에서 `Use SSH tunnel` 체크 박스를 선택한다.
- `...` 버튼을 눌러 SSH 연결 정보를 생성한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-09.png" width="80%" class="image__border">
</div>

<br/>

EC2 인스턴스 연결 정보를 정의한다. 

- EC2 인스턴스의 공개 IP 주소를 사용한다.
- 사용자 이름은 `ec2-user`이다.
- 위에서 EC2 인스턴스를 생성할 때 함께 만든 키 페어를 사용한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-10.png" width="80%" class="image__border">
</div>

<br/>

위에서 생성한 EC2 인스턴스 연결 정보를 사용한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-11.png" width="80%" class="image__border">
</div>

<br/>

다음 데이터베이스 접속 정보를 입력한다.

- 호스트는 데이터베이스 클러스터 URL이다.
- 사용자, 비밀번호는 데이터베이스 접속 정보를 사용한다.
- 데이터베이스는 이름을 선택한다.
- `Test Connection` 버튼을 눌러 접속이 정상적으로 가능한지 확인한다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-12.png" width="80%" class="image__border">
</div>

## CLOSING

최종적으로 다음과 같은 모습을 갖는다.

<div align="center">
  <img src="/images/posts/2024/ec2-ssh-tunnel-for-rds-connection-13.png" width="80%" class="image__border">
</div>
