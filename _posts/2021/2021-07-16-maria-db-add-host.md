---
title: "Linux Maria DB Host 추가하기"
search: false
category:
  - information
  - linux
last_modified_at: 2021-09-04T12:59:00
---

<br/>

👉 해당 포스트를 읽는데 도움을 줍니다.
- [Linux Maria DB 설치하기][maria-db-install]

## 0. 들어가면서

이번 포스트에서는 Maria DB 서버에 새로운 사용자 정보를 등록하는 방법과 외부에서 접속하는데 발생했던 문제를 해결한 방법을 공유해보겠습니다. 

## 1. 테스트 환경
- VMWare
- Ubuntu-20.04.2.0

## 2. 사용자 등록하기
간단한 명령어를 통해 사용자 정보를 등록할 수 있습니다. 
- user_id - 사용자 ID
- host_name - 허용하는 호스트 정보
- password - 사용자 비밀번호

```
MariaDB [(none)]> create user 'user_id'@'host_name' identified by 'password';
```

사용자 정보를 등록하고, 등록한 정보를 확인해보았습니다. 

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

변경된 내용이 잘 반영되었는지 추가된 사용자로 접속을 해봅니다. 

```
$ mysql -u jun -p
Enter password: 
Welcome to the MariaDB monitor.  Commands end with ; or \g.
Your MariaDB connection id is 41
Server version: 10.3.29-MariaDB-0ubuntu0.20.04.1 Ubuntu 20.04

Copyright (c) 2000, 2018, Oracle, MariaDB Corporation Ab and others.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.
```

## 3. 데이터베이스 접근 제어
설치한 데이터베이스에 접근을 시도하면 다음과 같은 에러가 발생합니다. 
host 정보를 `'%'` 로 지정하여 모든 IP 에서 접근을 허용하였는데 이상합니다.😕 

> Can't connect to MySQL server on 'IP Address'(10061)

<p align="center"><img src="/images/maria-db-add-host-1.JPG" width="50%"></p>

`netstat -lntp` 명령어를 통해 문제의 원인을 확인할 수 있습니다. 
3306 포트(port) 번호를 가지는 프로세스 정보를 보면 Local Address가 `127.0.0.1` IP 주소를 가집니다. 
Local Address IP 주소가 `0.0.0.0` 이라면 모든 인터페이스를 허용하겠다는 의미이며, `127.0.0.1` 이라면 자기 자신만 호출이 가능한 상태입니다. 
현재는 IP 주소가 `127.0.0.1`이므로 로컬 호스트만 접근이 가능한 상태입니다.  

### 3.1. 127.0.0.1 IP LISTEN(대기, PORT OPEN) 상태 확인 
```
$ netstat -lntp | grep 3306
(Not all processes could be identified, non-owned process info
 will not be shown, you would have to be root to see it all.)
tcp        0      0 127.0.0.1:3306          0.0.0.0:*               LISTEN      - 
```

모든 IP에 대해 접근을 허가하려면 설정 파일을 변경해줘야합니다. 

```
$ sudo vi /etc/mysql/mariadb.conf.d/50-server.cnf
```

50-server.cnf 설정에서 `bind-address` 항목 값을 `0.0.0.0` 으로 변경합니다. 

```
#
# These groups are read by MariaDB server.
# Use it for options that only the server (but not clients) should see
#
# See the examples of server my.cnf files in /usr/share/mysql

# this is read by the standalone daemon and embedded servers
[server]

# this is only for the mysqld standalone daemon
[mysqld]

#
# * Basic Settings
#
user                    = mysql
pid-file                = /run/mysqld/mysqld.pid
socket                  = /run/mysqld/mysqld.sock
#port                   = 3306
basedir                 = /usr
datadir                 = /var/lib/mysql
tmpdir                  = /tmp
lc-messages-dir         = /usr/share/mysql
#skip-external-locking

# Instead of skip-networking the default is now to listen only on
# localhost which is more compatible and is not less secure.
bind-address            = 127.0.0.1
```

서비스를 재시작 후 `netstat -lntp` 명령어를 통해 IP 정보를 다시 확인합니다. 

```
$ sudo systemctl restart mysqld
$ sudo netstat -lntp | grep 3306
tcp        0      0 0.0.0.0:3306            0.0.0.0:*               LISTEN      4758/mysqld  
```

##### 접속 Connection 정보

<p align="center"><img src="/images/maria-db-add-host-2.JPG" width="40%"></p>

#### REFERENCE
- <https://en.wikipedia.org/wiki/Netstat>
- <https://yhmane.tistory.com/73>
- <https://blog.dalso.org/it/4260>
- <https://blog.naver.com/6116949/221991858055>

[maria-db-install]: https://junhyunny.github.io/information/linux/maria-db-install/