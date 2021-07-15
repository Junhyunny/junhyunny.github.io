---
title: "Linux Maria DB Host 추가하기"
search: false
category:
  - information
  - linux
last_modified_at: 2021-07-16T00:00:00
---

<br>

[Linux Maria DB 설치하기][maria-db-install] 포스트를 통해 Maria DB 설치하는 방법을 정리하였습니다. 
이번 포스트에서는 사용자 정보를 등록하고, IP 접근 제어, 사용자 별 권한 부여를 하는 방법을 알아보겠습니다. 

## 테스트 환경
- VMWare
- Ubuntu-20.04.2.0

## 사용자 등록하기
간단한 명령어를 통해 사용자 정보를 등록할 수 있습니다. 
- user_id - 사용자 ID
- host_name - 허용하는 호스트 정보
- password - 사용자 비밀번호

```
MariaDB [(none)]> create user 'user_id'@'host_name' identified by 'password';
```

다음과 같이 사용자 정보를 등록하고 등록된 정보를 확인해보겠습니다. 

```
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 40
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]> create user jun@'%' identified by '1234';
Query OK, 0 rows affected (0.000 sec)

MariaDB [(none)]> select user, password, host, plugin from mysql.user;
+------+-------------------------------------------+-----------+-----------------------+
| user | password                                  | host      | plugin                |
+------+-------------------------------------------+-----------+-----------------------+
| root | *A4B6157319038724E3560894F7F932C8886EBFCF | localhost | mysql_native_password |
| jun  | *A4B6157319038724E3560894F7F932C8886EBFCF | %         |                       |
+------+-------------------------------------------+-----------+-----------------------+
2 rows in set (0.000 sec)
```

`flush privileges` 명령어를 통해 변경된 사용자 정보를 반영합니다. 

```
MariaDB [(none)]> flush privileges;
Query OK, 0 rows affected (0.000 sec)
```

변경된 내용이 잘 반영되었는지 추가된 사용자로 접속합니다.

```
$ mysql -u jun -p
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 41
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
```

## 데이터베이스 접근 제어
설치한 데이터베이스에 접근을 시도하면 다음과 같은 에러가 발생합니다. 

> Can't connect to MySQL server on 'IP Address'(10061)

<p align="center"><img src="/images/maria-db-add-host-1.JPG" width="50%"></p>

host 정보를 `'%'` 로 지정하여 모든 IP 에서 접근을 허용하였는데 이상합니다. 
원인은 `netstat -lntp` 명령어를 통해 확인이 가능합니다. 
해당 명령어를 통해 3306 포트로 열려있는 주소를 보면 `127.0.0.1:3306` 을 가집니다. 

```
$ netstat -lntp | grep 3306
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN      - 
```


## IP 접근 제어


## OPINION


#### REFERENCE
- <https://en.wikipedia.org/wiki/Netstat>
- <https://yhmane.tistory.com/73>
- <https://blog.dalso.org/it/4260>
- <https://blog.naver.com/6116949/221991858055>

[maria-db-install]: https://junhyunny.github.io/information/linux/maria-db-install/