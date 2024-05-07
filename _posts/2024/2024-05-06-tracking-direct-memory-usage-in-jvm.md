---
title: "Tracking Direct Memory Usage in JVM"
search: false
category:
  - java
  - jvm
last_modified_at: 2024-05-06T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [getBytes method of MultipartFile cause out of memory in Java 21][multipart-file-in-java21-cause-oome-link]

## 0. 들어가면서

JVM 힙 메모리는 사용량을 추적할 수 있는 GUI 도구는 여러 가지가 있지만, 힙 메모리가 아닌 네이티브 메모리 영역에 대한 사용량을 추적할 때는 jcmd(Java diagnostic command) 도구를 사용해야 하는 것 같다. 이번 글은 jcmd 도구를 사용해 네이티브 메모리 중에서도 다이렉트 메모리(direct memory) 사용량을 측정하는 방법에 대해 정리했다.

## 1. jcmd

오라클 공식 문서를 보면 다음과 같은 설명을 볼 수 있다. 

> The jcmd utility is used to send diagnostic command requests to the JVM, where these requests are useful for controlling Java Flight Recordings, troubleshoot, and diagnose JVM and Java Applications. It must be used on the same machine where the JVM is running, and have the same effective user and group identifiers that were used to launch the JVM.

jcmd 도구는 JVM 애플리케이션의 문제 해결하거나 상태를 진단하기 위해 요청을 보내는 도구다. JVM 애플리케이션이 실행되는 머신에서만 실행할 수 있다. 필자가 오늘 소개하는 다이렉트 메모리 측정에만 사용하지 않고 다양한 정보를 수집할 때 사용할 수 있다. JDK(java development kit)을 설치하면 실행 파일이 모여있는 `bin` 폴더에서 찾을 수 있다. 

```
$ ls -al

total 10044
drwxr-xr-x 1 AzureAD+KANGJUNHYUN 4096       0 Jan 18  2023 ./
drwxr-xr-x 1 AzureAD+KANGJUNHYUN 4096       0 Jan 18  2023 ../
...
-rwxr-xr-x 1 AzureAD+KANGJUNHYUN 4096   21192 Jan 18  2023 jcmd.exe*
...
```

## 2. How to track DirectMemory usage?

지금부터 다이렉트 메모리 사용량을 측정해보자.

### 2.1. Demo Application

다음과 같은 데모 애플리케이션을 만든다.

1. 10초 뒤 메모리를 할당을 시작한다는 로그를 출력한다.
  - 네이티브 메모리 측정을 위한 기준선(baseline)을 만든다.
2. 15초 동안 1초마다 다이렉트 메모리를 사용하는 DirectByteBuffer 객체를 1KB 사이즈로 생성한다.
3. 10초 뒤 애플리케이션이 종료된다는 로그를 출력한다.

```java
package action.in.blog;

import java.nio.ByteBuffer;
import java.util.ArrayList;

public class ActionInBlogApplication {

    public static void main(String[] args) throws InterruptedException {

        System.out.println("10 seconds later this application will start. make baseline."); // 1
        Thread.sleep(10000);

        var bufferList = new ArrayList<ByteBuffer>();

        for (int index = 0; index < 15; index++) { // 2
            Thread.sleep(1000);
            var byteBuffer = ByteBuffer.allocateDirect(1024);
            bufferList.add(byteBuffer);
            System.out.printf("%s seconds. expected size = %sKB\n", index + 1, bufferList.size());
        }

        System.out.println("10 seconds later this application will stop."); // 3
        Thread.sleep(10000);
    }
}
```

### 2.2. How to use jcmd for native memory tracking?

네이티브 메모리를 측정하기 위해선 애플리케이션을 실행할 때 다음과 같은 JVM 옵션을 추가해야 한다.

```
-XX:NativeMemoryTracking=summary 
```

예를 들면 다음과 같이 애플리케이션을 실행해야 한다.

```
$ java -XX:NativeMemoryTracking=summary -jar .\action-in-blog-0.0.1-SNAPSHOT-plain.jar
```

애플리케이션을 실행 후 jcmd 도구로 확인하면 실행 중인 JVM 애플리케이션의 PID를 확인할 수 있다.

```
$ jcmd

17424 org.gradle.launcher.daemon.bootstrap.GradleDaemon 8.7
11656 jdk.jcmd/sun.tools.jcmd.JCmd
18908 .\action-in-blog-0.0.1-SNAPSHOT-plain.jar
```

네이티브 메모리를 측정하기 위해선 기준선을 정해야 한다. 기준선이 만들어진 시점부터 메모리에 어떤 변화가 있는지 알려준다. 

- 대상 JVM 애플리케이션의 PID(process id)를 사용한다.

```
$ jcmd {PID} VM.native_memory baseline
```

다음 명령어로 메모리 변경을 확인한다. 

- 대상 JVM 애플리케이션의 PID를 사용한다.

```
$ jcmd {PID} VM.native_memory summary.diff
```

### 2.3. Tracking DirectMemory Usage

이제 실제로 애플리케이션 메모리 사용량을 확인해보자. 먼저 애플리케이션을 실행한다. 

```
$ java -XX:NativeMemoryTracking=summary -jar .\action-in-blog-0.0.1-SNAPSHOT-plain.jar
```

실행 중인 애플리케이션 PID를 확인한다.

- 24300 프로세스의 메모리 사용량을 추적한다.

```
$ jcmd

17424 org.gradle.launcher.daemon.bootstrap.GradleDaemon 8.7
10276 jdk.jcmd/sun.tools.jcmd.JCmd
24300 .\action-in-blog-0.0.1-SNAPSHOT-plain.jar
```

필자는 기준선을 만들기 위해 10초동안 스레드를 멈췄다. 이 시점에 기준선을 만든다.

- `10 seconds later this application will start. make baseline.` 로그가 보이면 아래 명령어를 실행한다.
- 24300 프로세스의 기준선을 만들었다는 메세지 확인한다.

```
$ jcmd 24300 VM.native_memory baseline

24300:
Baseline succeeded
```

특정 시간마다 메모리 차이를 확인한다. 필자는 7초와 메모리 할당 반복문이 모두 끝난 시점에 메모리를 확인했다.

- `7 seconds. expected size = 7KB` 로그를 봤을 때 jcmd 명령어를 실행한 결과이다.

```
$ jcmd 24300 VM.native_memory summary.diff

24300:

Native Memory Tracking:

(Omitting categories weighting less than 1KB)

Total: reserved=10059343KB +47KB, committed=621907KB +115KB

-                 Java Heap (reserved=8355840KB, committed=524288KB)
                            (mmap: reserved=8355840KB, committed=524288KB)

-                     Class (reserved=1048668KB +9KB, committed=220KB +9KB)
                            (classes #801 +139)
                            (  instance classes #686 +119, array classes #115 +20)
                            (malloc=92KB +9KB #921 +207)
                            (mmap: reserved=1048576KB, committed=128KB)
                           : (  Metadata)
                            (    reserved=8192KB, committed=320KB +64KB)
                            (    used=259KB +71KB)
                            (    waste=61KB =19.20% -7KB)
                           : (  Class space)
                            (    reserved=1048576KB, committed=128KB)
                            (    used=16KB +4KB)
                            (    waste=112KB =87.15% -4KB)

-                    Thread (reserved=19501KB, committed=757KB +4KB)
                            (thread #0)
                            (stack: reserved=19456KB, committed=712KB +4KB)
                            (malloc=25KB #120)
                            (arena=20KB #36)

-                      Code (reserved=247790KB +5KB, committed=7594KB +5KB)
                            (malloc=46KB +5KB #842 +123)
                            (mmap: reserved=247744KB, committed=7548KB)

-                        GC (reserved=365133KB, committed=74509KB)
                            (malloc=21709KB #601 +2)
                            (mmap: reserved=343424KB, committed=52800KB)

-                  Compiler (reserved=169KB, committed=169KB)
                            (malloc=5KB #43 +1)
                            (arena=165KB #5)

-                  Internal (reserved=219KB +1KB, committed=219KB +1KB)
                            (malloc=155KB +1KB #1252 +29)
                            (mmap: reserved=64KB, committed=64KB)

-                     Other (reserved=11KB +7KB, committed=11KB +7KB)
                            (malloc=11KB +7KB #9 +7)

-                    Symbol (reserved=1235KB +11KB, committed=1235KB +11KB)
                            (malloc=875KB +11KB #4289 +428)
                            (arena=360KB #1)

-    Native Memory Tracking (reserved=165KB +14KB, committed=165KB +14KB)
                            (malloc=6KB +1KB #91 +19)
                            (tracking overhead=159KB +13KB)

-        Shared class space (reserved=12032KB, committed=12032KB)
                            (mmap: reserved=12032KB, committed=12032KB)

-               Arena Chunk (reserved=175KB, committed=175KB)
                            (malloc=175KB)

-                   Logging (reserved=5KB, committed=5KB)
                            (malloc=5KB #216)

-                 Arguments (reserved=2KB, committed=2KB)
                            (malloc=2KB #53)

-                    Module (reserved=157KB, committed=157KB)
                            (malloc=157KB #1215)

-                 Safepoint (reserved=8KB, committed=8KB)
                            (mmap: reserved=8KB, committed=8KB)

-           Synchronization (reserved=28KB, committed=28KB)
                            (malloc=28KB #421 +1)

-            Serviceability (reserved=1KB, committed=1KB)
                            (malloc=1KB #14)

-                 Metaspace (reserved=8202KB, committed=330KB +64KB)
                            (malloc=10KB #6)
                            (mmap: reserved=8192KB, committed=320KB +64KB)

-      String Deduplication (reserved=1KB, committed=1KB)
                            (malloc=1KB #8)
```

- `10 seconds later this application will stop.` 로그를 봤을 때 jcmd 명령어를 실행한 결과이다.

```
$ jcmd 24300 VM.native_memory summary.diff

24300:

Native Memory Tracking:

(Omitting categories weighting less than 1KB)

Total: reserved=10059352KB +56KB, committed=621984KB +192KB

-                 Java Heap (reserved=8355840KB, committed=524288KB)
                            (mmap: reserved=8355840KB, committed=524288KB)

-                     Class (reserved=1048668KB +9KB, committed=220KB +9KB)
                            (classes #801 +139)
                            (  instance classes #686 +119, array classes #115 +20)
                            (malloc=92KB +9KB #921 +207)
                            (mmap: reserved=1048576KB, committed=128KB)
                           : (  Metadata)
                            (    reserved=8192KB, committed=384KB +128KB)
                            (    used=261KB +74KB)
                            (    waste=123KB =32.06% +54KB)
                           : (  Class space)
                            (    reserved=1048576KB, committed=128KB)
                            (    used=16KB +4KB)
                            (    waste=112KB =87.15% -4KB)

-                    Thread (reserved=19501KB, committed=761KB +8KB)
                            (thread #0)
                            (stack: reserved=19456KB, committed=716KB +8KB)
                            (malloc=25KB #120)
                            (arena=20KB #36)

-                      Code (reserved=247790KB +6KB, committed=7594KB +6KB)
                            (malloc=46KB +6KB #847 +128)
                            (mmap: reserved=247744KB, committed=7548KB)

-                        GC (reserved=365133KB, committed=74509KB)
                            (malloc=21709KB #601 +2)
                            (mmap: reserved=343424KB, committed=52800KB)

-                  Compiler (reserved=169KB, committed=169KB)
                            (malloc=5KB #43 +1)
                            (arena=165KB #5)

-                  Internal (reserved=220KB +1KB, committed=220KB +1KB)
                            (malloc=156KB +1KB #1256 +33)
                            (mmap: reserved=64KB, committed=64KB)

-                     Other (reserved=19KB +15KB, committed=19KB +15KB)
                            (malloc=19KB +15KB #17 +15)

-                    Symbol (reserved=1235KB +11KB, committed=1235KB +11KB)
                            (malloc=875KB +11KB #4290 +429)
                            (arena=360KB #1)

-    Native Memory Tracking (reserved=165KB +14KB, committed=165KB +14KB)
                            (malloc=6KB +1KB #91 +19)
                            (tracking overhead=159KB +13KB)

-        Shared class space (reserved=12032KB, committed=12032KB)
                            (mmap: reserved=12032KB, committed=12032KB)

-               Arena Chunk (reserved=175KB, committed=175KB)
                            (malloc=175KB)

-                   Logging (reserved=5KB, committed=5KB)
                            (malloc=5KB #216)

-                 Arguments (reserved=2KB, committed=2KB)
                            (malloc=2KB #53)

-                    Module (reserved=157KB, committed=157KB)
                            (malloc=157KB #1215)

-                 Safepoint (reserved=8KB, committed=8KB)
                            (mmap: reserved=8KB, committed=8KB)

-           Synchronization (reserved=28KB, committed=28KB)
                            (malloc=28KB #421 +1)

-            Serviceability (reserved=1KB, committed=1KB)
                            (malloc=1KB #14)

-                 Metaspace (reserved=8202KB, committed=394KB +128KB)
                            (malloc=10KB #6)
                            (mmap: reserved=8192KB, committed=384KB +128KB)

-      String Deduplication (reserved=1KB, committed=1KB)
                            (malloc=1KB #8)
```

### 2.4. Result Summary

필자가 참고한 글을 보면 다이렉트 메모리가 증가함에 따라 `Internal` 영역이 변한다고 했지만, 직접 확인해본 결과 `Other` 영역의 변화가 다이렉트 메모리 증가량과 일치했다. 확실하지 않지만, 이는 Java 버전에 따라 다이렉트 메모리의 분류가 다른 것일 수 있다. 필자는 Java 21 환경에서 테스트했다. 

jcmd 도구가 제공하는 정보가 너무 많으니 다이렉트 메모리 증가 부분만 확인해보자. 

- 메모리 할당 시작 후 7초 시점
  - Internal 영역은 1KB 증가했다.
  - Other 영역은 7KB 증가했다.

```
- Internal (reserved=219KB +1KB, committed=219KB +1KB)
           (malloc=155KB +1KB #1252 +29)
           (mmap: reserved=64KB, committed=64KB)

-    Other (reserved=11KB +7KB, committed=11KB +7KB)
           (malloc=11KB +7KB #9 +7)
```

- 모든 메모리 할당 이후 시점
  - Internal 영역은 1KB 증가했다.
  - Other 영역은 15KB 증가했다.

```
- Internal (reserved=220KB +1KB, committed=220KB +1KB)
           (malloc=156KB +1KB #1256 +33)
           (mmap: reserved=64KB, committed=64KB)

-    Other (reserved=19KB +15KB, committed=19KB +15KB)
           (malloc=19KB +15KB #17 +15)
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2024-05-06-tracking-direct-memory-usage-in-jvm>

#### REFERENCE

- <https://homoefficio.github.io/2020/04/09/Java-Native-Memory-Tracking/>

[multipart-file-in-java21-cause-oome-link]: https://junhyunny.github.io/java/jvm/spring-boot/get-bytes-method-of-multipart-file-in-java21-cause-oome/