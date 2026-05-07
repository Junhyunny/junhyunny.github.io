---
title: "리눅스(Linux) MariaDB 설치하기"
search: false
category:
  - information
  - linux
last_modified_at: 2026-05-07T16:00:09+09:00
---

<br/>

## 1. 설치 환경 준비

고객으로부터 시스템 운영을 위한 데이터베이스를 회사 내부 서버에 설치해 달라는 요청을 받았다. 데이터베이스 설치와 같은 인프라 구성 작업은 처음이라 겁부터 났지만, 역시 구글과 함께라면 못할 일이 없다. 데이터베이스 설치 환경은 다음과 같다.

- Ubuntu-20.04.2.0

패키지 목록을 갱신한다.

```
$ sudo apt-get update
```

설치된 패키지를 업그레이드한다.

```
$ sudo apt-get upgrade
```

## 2. MariaDB 설치

요청에 따라 MariaDB를 설치하였다. 설치가 완료되면 정상적으로 설치되었는지 확인한다.

```
$ sudo apt-get install mariadb-server
```

설치된 버전을 확인한다.

```
$ mariadb --version
mariadb  Ver 15.1 Distrib 10.3.29-MariaDB, for debian-linux-gnu (x86_64) using readline 5.2
```

MariaDB의 3306 포트가 리스닝 중인지 확인한다.

```
$ netstat -anp | grep 3306

(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN      -
```

## 3. MariaDB 로그인

설치가 완료된 후 로그인을 시도하면 정상적으로 진행되지 않는다.

```
$ mysql

ERROR 1698 (28000): Access denied for user 'jun'@'localhost'

$ mysql -u jun -p

Enter password:
ERROR 1698 (28000): Access denied for user 'jun'@'localhost'

$ mysql -u root -p

Enter password:
ERROR 1698 (28000): Access denied for user 'root'@'localhost'
```

MariaDB는 10.0 버전부터 unix_socket 인증 방식을 사용한다. unix_socket 인증은 간단히 말해 유닉스 계열 운영체제의 사용자 계정과 MariaDB의 사용자 계정을 일치시키는 인증 방식이다. 즉, 운영체제의 사용자임을 증명하면 MariaDB에 로그인할 수 있다는 의미이다. `sudo` 명령어로 root 계정임을 증명하면 로그인에 성공한다.

```
$ sudo mysql

Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 73
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]>
```

## 4. 기초 정보 설정

다음과 같은 정보를 확인하고, 필요한 경우 변경한다.

- 애플리케이션이 접근할 수 있는 비밀번호
- CHARACTER SET
- 기본 시간대

먼저 비밀번호를 변경해 보자. 사용자 정보를 확인하면 다음과 같다.

```
MariaDB [(none)]> select host, user, password, plugin from mysql.user;
+-----------+------+----------+-------------+
| host      | user | password | plugin      |
+-----------+------+----------+-------------+
| localhost | root |          | unix_socket |
+-----------+------+----------+-------------+
1 row in set (0.000 sec)
```

해당 사용자의 인증 방식을 unix_socket 방식이 아닌 mysql_native_password 방식으로 변경하였다. `set password=password("비밀번호")` 명령어로 비밀번호를 변경하면 인증 방식도 자동으로 변경된다. 변경 후 `flush privileges` 명령어로 GRANT 테이블을 재로딩(reloading)한다.

```
MariaDB [(none)]> set password=password("1234");
Query OK, 0 rows affected, 1 warning (0.000 sec)

MariaDB [(none)]> select host, user, password, plugin from mysql.user;
+-----------+------+-------------------------------------------+-----------------------+
| host      | user | password                                  | plugin                |
+-----------+------+-------------------------------------------+-----------------------+
| localhost | root | *A4B6157319038724E3560894F7F932C8886EBFCF | mysql_native_password |
+-----------+------+-------------------------------------------+-----------------------+
1 row in set (0.000 sec)

MariaDB [(none)]> flush privileges;
Query OK, 0 rows affected (0.001 sec)
```

새로운 비밀번호로 로그인한다.

```
$ mysql -u root -p

Enter password:
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 57
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]>
```

다음으로 `CHARACTER SET`을 확인한다. MariaDB는 기본적으로 `utf8mb4`를 사용한다. 필요하다면 이를 변경한다.

```
MariaDB [(none)]> show variables like 'char%';

+--------------------------+----------------------------+
| Variable_name            | Value                      |
+--------------------------+----------------------------+
| character_set_client     | utf8mb4                    |
| character_set_connection | utf8mb4                    |
| character_set_database   | utf8mb4                    |
| character_set_filesystem | binary                     |
| character_set_results    | utf8mb4                    |
| character_set_server     | utf8mb4                    |
| character_set_system     | utf8                       |
| character_sets_dir       | /usr/share/mysql/charsets/ |
+--------------------------+----------------------------+
8 rows in set (0.001 sec)
```

마지막으로 시간대를 확인하고 변경한다. MariaDB의 `global`, `session` 타임존(time_zone)은 시스템(SYSTEM)을 따르도록 설정되어 있다.

```
MariaDB [(none)]> select @@global.time_zone, @@session.time_zone;
+--------------------+---------------------+
| @@global.time_zone | @@session.time_zone |
+--------------------+---------------------+
| SYSTEM             | SYSTEM              |
+--------------------+---------------------+
1 row in set (0.000 sec)
```

현재 글을 작성하는 시각은 2021-07-13 11:53이다. 데이터베이스가 인식하는 시간을 확인해 보았다.

```
MariaDB [(none)]> select now();
+---------------------+
| now()               |
+---------------------+
| 2021-07-12 19:51:50 |
+---------------------+
1 row in set (0.000 sec)
```

`timedatectl set-timezone` 명령어를 이용하여 시스템 시간대를 변경한다.

```
$ sudo timedatectl set-timezone 'Asia/Seoul'

$ date
Tue 13 Jul 2021 11:54:52 AM KST
```

`systemctl restart` 명령어로 데이터베이스 서비스를 재시작한다.

```
$ sudo systemctl restart mysqld
```

데이터베이스의 시간대가 제대로 맞춰졌는지 확인한다.

```
MariaDB [(none)]> select now();
+---------------------+
| now()               |
+---------------------+
| 2021-07-13 11:55:21 |
+---------------------+
1 row in set (0.000 sec)
```

#### REFERENCE

- <https://m.blog.naver.com/6116949/221992559683>
- <https://wnw1005.tistory.com/443>
- <https://www.nemonein.xyz/2019/07/2254/>
- <https://mariadb.com/kb/en/authentication-plugin-unix-socket/>
