---
title: "Linux Maria DB 설치하기"
search: false
category:
  - information
  - linux
last_modified_at: 2021-07-13T00:00:00
---

<br>

고객으로부터 시스템 운영을 위한 데이터베이스를 회사 내부 서버에 설치해달라는 요청을 받았습니다. 
데이터베이스 설치 같은 인프라 구성 작업은 처음이라 겁부터 났지만 역시 구글과 함께라면 못할 일이 없습니다. 
저도 작업한 내용을 정리하여 다른 분들에게 힘이 되어보겠습니다. 

## 데이터베이스 설치 작업 환경
- Ubuntu-20.04.2.0

## 설치된 패키지 최신화 작업

```
$ sudo apt-get update
```

```
$ sudo apt-get upgrade
```

## Maria DB 설치
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

## Maria DB 로그인
설치가 완료된 후 로그인을 시도하면 정상적으로 수행되지 않습니다. 
로그인부터 문제가 시작되었습니다. 
역시나 한번에 끝나는 일은 없습니다.

```
jun@ubuntu:~$ mysql
ERROR 1698 (28000): Access denied for user 'jun'@'localhost'
jun@ubuntu:~$ mysql -u jun -p
Enter password: 
ERROR 1698 (28000): Access denied for user 'jun'@'localhost'
jun@ubuntu:~$ mysql -u root -p
Enter password: 
ERROR 1698 (28000): Access denied for user 'root'@'localhost'
```

### 로그인 문제 해결
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

### 기초 정보 설정

## OPINION

#### REFERENCE
- <https://m.blog.naver.com/6116949/221992559683>
- <https://wnw1005.tistory.com/443>
- <https://www.nemonein.xyz/2019/07/2254/>
- <https://mariadb.com/kb/en/authentication-plugin-unix-socket/>