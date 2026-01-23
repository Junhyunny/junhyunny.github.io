---
title: "Linux Maria DB 설치하기"
search: false
category:
  - information
  - linux
last_modified_at: 2021-09-04T12:59:00
---

<br/>

## 0. 들어가면서

고객으로부터 시스템 운영을 위한 데이터베이스를 회사 내부 서버에 설치해달라는 요청을 받았습니다. 
데이터베이스 설치 같은 인프라 구성 작업은 처음이라 겁부터 났지만 역시 구글과 함께라면 못할 일이 없습니다. 
저도 작업한 내용을 정리하여 다른 분들에게 힘이 되어보겠습니다. 

## 1. 데이터베이스 설치 작업 환경
- Ubuntu-20.04.2.0

## 2. 설치된 패키지 최신화 작업

```
$ sudo apt-get update
```

```
$ sudo apt-get upgrade
```

## 3. Maria DB 설치
고객 요청사항에 따라 Maria DB를 설치하였습니다. 
설치가 완료되면 정상적으로 설치가 되었는지 확인합니다.

```
$ sudo apt-get install mariadb-server
```

```
$ mariadb --version
mariadb  Ver 15.1 Distrib 10.3.29-MariaDB, for debian-linux-gnu (x86_64) using readline 5.2
```

```
$ netstat -anp | grep 3306
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN      -    
```

## 4. Maria DB 로그인
설치가 완료된 후 로그인을 시도하면 정상적으로 수행되지 않습니다. 
로그인부터 문제가 시작되었습니다. 
역시나 한번에 끝나는 일은 없습니다.

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

### 4.1 로그인 문제 해결
Maria DB는 10.0 버전부터 unix_socket 인증 방식을 사용한다고 합니다. 
간략하게 unix_socket 인증을 설명하면, 유닉스 계열 운영체제 사용자 계정과 Maria DB의 사용자 계정을 일치시키는 인증 방식을 일컫습니다. 
즉, 운영체제의 사용자임을 증명하면 Maria DB 로그인이 가능하다는 의미입니다. 
`sudo` 키워드를 통해 root 계정임을 증명하면 로그인에 성공합니다.  

```
$ sudo mysql
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 73
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
MariaDB [(none)]>
```

## 5. 기초 정보 설정
다음과 같은 정보들을 확인 후 변경합니다.
- 애플리케이션이 접근할 수 있는 비밀번호
- CHARACTER SET
- 기본 시간대

### 5.1 비밀번호 변경
사용자 정보를 확인해보면 다음과 같습니다. 

```
MariaDB [(none)]> select host, user, password, plugin from mysql.user;
+-----------+------+----------+-------------+
| host      | user | password | plugin      |
+-----------+------+----------+-------------+
| localhost | root |          | unix_socket |
+-----------+------+----------+-------------+
1 row in set (0.000 sec)
```

해당 사용자 정보를 unix_socket 방식이 아닌 mysql_native_password 방식으로 변경하였습니다. 
`set password=password("비밀번호")` 명령어를 통해 비밀번호를 변경하면 자동으로 변경됩니다. 
변경 후 `flush privileges` 명령어를 통해 GRANT 테이블을 재로딩(reloading) 합니다.

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

MariaDB [(none)]> Ctrl-C -- exit!
Aborted
$ mysql -u root -p
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 57
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

MariaDB [(none)]> 
```

### 5.2. CHARACTER SET 확인
MariaDB는 기본적으로 `utf8mb4` CHARACTER SET을 사용합니다. 

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

### 5.3. 시간대 확인 및 변경
MariaDB 의 global, session time_zone은 SYSTEM을 따라가도록 맞춰져있습니다. 

```
MariaDB [(none)]> select @@global.time_zone, @@session.time_zone;
+--------------------+---------------------+
| @@global.time_zone | @@session.time_zone |
+--------------------+---------------------+
| SYSTEM             | SYSTEM              |
+--------------------+---------------------+
1 row in set (0.000 sec)
```

현재 포스트를 작성하는 시각은 2021-07-13 11:53 입니다. 
데이터베이스가 알고 있는 시간을 확인해보았습니다. 

```
MariaDB [(none)]> select now();
+---------------------+
| now()               |
+---------------------+
| 2021-07-12 19:51:50 |
+---------------------+
1 row in set (0.000 sec)
```

`timedatectl set-timezone` 명령어를 이용해 시스템 시간대를 변경하고, `systemctl restart` 명령어를 통해 데이터베이스 서비스를 재시작합니다.

```
$ sudo timedatectl set-timezone 'Asia/Seoul'
$ date
Tue 13 Jul 2021 11:54:52 AM KST
$ sudo systemctl restart mysqld
```

데이터베이스의 시간대가 잘 맞춰졌는지 확인합니다.

```
$ mysql -u root -p
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 11
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

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