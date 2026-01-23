---
title: "Direct Memory in Java"
search: false
category:
  - java
  - jvm
last_modified_at: 2024-04-28T23:55:00
---

<br/>

#### RECOMMEND POSTS BEFORE THIS

- [JVM(Java Virtual Machine)][what-is-jvm-link]

## 0. 들어가면서

현재 프로젝트에서 OOME(Out of Memory Error)를 만났다. 대용량 트래픽을 처리했던 필자의 첫 프로젝트 이후 정말 오랜만에 마주쳤다. JVM 메모리 사이즈를 늘려 문제를 해결했지만, 문제가 발생한 메모리 영역에 대한 근본적인 이해가 부족하다고 느꼈다. 문제가 발생한 메모리가 무슨 용도인지 사용자의 어떤 행동(behaviour)이 이 문제를 일으킬 가능성이 있는지 합리적인 유추를 할 수 있도록 관련된 내용을 정리했다. 

## 1. Native Memory

필자는 처음 네이티브 메모리(native memory)라는 개념 때문에 계속 혼란을 겪었다. JVM 프로세스 내부에 네이티브 메모리라는 영역이 별도로 존재하는 줄 알았다. 여러 글 내용들을 바탕으로 정리하면 네이티브 메모리는 JVM 프로세스가 운영체제(operating system)로부터 할당 받은 메모리 중 힙 메모리(heap memory) 영역을 제외한 영역들을 통칭하는 것으로 보인다. 글마다 차이가 있지만, 이를 오프-힙(off-heap) 메모리라고 부르기도 한다.

네이티브 메모리는 힙 메모리 외부에 존재하기 때문에 가비지 컬렉터(garbage collector) 관리 대상에서 제외된다고 한다. 글 주제에서 잠시 벗어나지만 추가적으로 Java 1.8 버전부터 힙 메모리 영역에서 제외된 메타스페이스(metaspace) 영역도 네이티브 메모리에서 할당된다. Java 1.8 이전엔 Perm Gen(Permanent Generation)이라고 불렸으며 힙 메모리 영역에 포함되어 있었다.

어떤 운영체제에서 JVM 프로세스가 실행되었을 때 메모리 모습을 넓은 시야에서 바라보자. 

- 운영체제는 메인 메모리와 하드 디스크 일부 영역을 사용하는 스왑 영역까지 포함해 메모리로 관리한다.
- 운영체제는 자신이 관리하는 메모리 중 일부를 JVM 프로세스를 위해 할당한다.
- JVM 프로세스에게 할당된 메모리 중 JVM 가비지 컬렉터에 의해 관리되는 힙 메모리를 제외한 영역이 네이티브 메모리이다. 

<p align="center">
  <img src="/images/posts/2024/direct-memory-in-java-01.png" width="80%" class="image__border">
</p>
<center>https://veribilimleri.wordpress.com/2017/03/15/java-jvm-memory-model-memory-management-in-java/</center>

## 2. Direct Memory and ByteBuffer in Java NIO

JVM 프로세스가 사용하는 네이티브 메모리 영역도 용도에 따라 구체적으로 분류가 된다. 예를 들어 JVM 프로세스가 효율적인 I/O 작업을 위해 네이티브 영역에 위치한 바이트 배열을 사용한다. 이 바이트 배열이 만들 때 필요한 공간을 다이렉트 메모리(direct memory)라고 부른다. 다이렉트 메모리를 사용할 때 왜 효율적인 I/O 작업이 가능한지에 대한 내용도 상당히 많기 때문에 다른 글로 정리할 예정이다.

<p align="center">
  <img src="/images/posts/2024/direct-memory-in-java-02.png" width="100%" class="image__border image__padding">
</p>
<center>https://learn.microsoft.com/en-us/azure/spring-apps/enterprise/concepts-for-java-memory-management</center>

<br/>

내가 겪은 OOM 에러는 다이렉트 메모리 공간이 부족해서 발생했다. 문제가 발생한 에러 로그를 살펴보면 `java.nio` 패키지에 위치한 DirectByteBuffer 클래스를 초기화할 때 에러가 발생한다. DirectByteBuffer 객체를 초기화 할 때 필요한 메모리 공간이 다이렉트 메모리이다. 

- Cannot reserve 4854065 bytes of direct buffer memory (allocated: 8787367, limit: 10475760)
- `-XX:MaxDirectMemorySize={N}` JVM 옵션으로 다이렉트 메모리를 더 크게 할당하면 문제를 해결할 수 있다.

<p align="center">
  <img src="/images/posts/2024/direct-memory-in-java-03.png" width="100%" class="image__border">
</p>

### 2.1. ByteBuffer Class

OOM 에러가 발생한 DirectByteBuffer 클래스는 무엇일까? 예전으로 거슬러 올라가면 I/O 작업이 느린 자바의 한계를 극복하기 위해 Java 1.4 버전부터 Java NIO(New I/O) 기능이 추가됬다. 이 `java.nio` 패키지에 포함된 ByteBuffer 추상 클래스의 구현체가 DirectByteBuffer 클래스다. Java NIO가 어떻게 I/O 속도를 개선했는지 관련된 설명은 이 [링크](http://eincs.com/2009/08/java-nio-bytebuffer-channel-file/) 글에 잘 되어 있다.

Java NIO는 파일을 읽을 때 다음과 같은 추상화 된 구조를 갖는다. 

- Channel 컴포넌트
  - 채널은 파일, 소켓 같은 I/O 기능들과 통신하기 위한 링크이다. 
  - 채널은 스트림과 다르게 양방향 통신이 가능하며 읽기와 쓰기가 동시에 가능하다.
- ByteBuffer 컴포넌트
  - 힙 메모리 혹은 네이티브 메모리 영역에 위치한 바이트 배열이다.
  - 읽기와 쓰기 연산이 합쳐져 캡슐화 된 컴포넌트다.
- 예를 들어 FileChannel 인스턴스에 의해 파일과 연결되고 ByteBuffer 인스턴스에 의해 읽기, 쓰기가 수행된다.

<p align="center">
  <img src="/images/posts/2024/direct-memory-in-java-04.png" width="80%" class="image__border">
</p>
<center>https://www.happycoders.eu/java/filechannel-memory-mapped-io-locks/</center>

### 2.2. Direct and Non-Direct Buffer

데이터를 읽고, 쓰는 연산이 캡슐화 된 ByteBuffer 인스턴스는 두 가지 종류가 있다. 

- 다이렉트 버퍼(direct buffer)
- 비-다이렉트 버퍼(non-direct buffer)

ByteBuffer 클래스 오라클 공식 문서를 살펴보면 다음과 같은 설명을 볼 수 있다.

> Direct vs. non-direct buffers<br/>
> A byte buffer is either direct or non-direct. Given a direct byte buffer, the Java virtual machine will make a best effort to perform native I/O operations directly upon it.<br/>
> ...<br/>
> A direct byte buffer may be created by invoking the allocateDirect factory method of this class. The buffers returned by this method typically have somewhat higher allocation and deallocation costs than non-direct buffers. The contents of direct buffers may reside outside of the normal garbage-collected heap, and so their impact upon the memory footprint of an application might not be obvious. It is therefore recommended that direct buffers be allocated primarily for large, long-lived buffers that are subject to the underlying system's native I/O operations. In general it is best to allocate direct buffers only when they yield a measureable gain in program performance. 

다음과 같이 요약할 수 있다.

- 다이렉트 버퍼를 사용하면 네이티브 I/O 작업을 최대한 수행한다.
- allocateDirect 팩토리 메서드에 의해 생성할 수 있다.
- 비-다이렉트 버퍼에 비해 메모리 할당, 해제 비용이 크다.
- 가비지 컬렉터가 관리하는 일반 힙 메모리 영역 밖에 위치하기 때문에 메모리 추적이 명확하지 않을 수 있다.
- 측정 가능한 퍼포먼스 이득이 있을 때만 사용하는 것이 최선이다. 

ByteBuffer 추상 클래스의 allocateDirect 팩토리 메서드를 사용하면 네이티브 영역의 메모리를 사용하는 ByteBuffer 인스턴스가 반환된다. ByteBuffer 인스턴스를 생성하는 allocateDirect 메서드와 allocate 메서드의 차이점을 살펴보자.

- allocateDirect 메서드
  - DirectByteBuffer 객체를 반환한다.
  - DirectByteBuffer 객체는 네이티브 메모리 영역을 사용한다.
- allocate 메서드
  - HeapByteBuffer 객체를 반환한다.
  - HeapByteBuffer 객체는 JVM 힙 메모리 영역을 사용한다.

```java
public abstract sealed class ByteBuffer
    extends Buffer
    implements Comparable<ByteBuffer>
    permits HeapByteBuffer, MappedByteBuffer {

    // direct buffer
    public static ByteBuffer allocateDirect(int capacity) {
        return new DirectByteBuffer(capacity);
    }

    // non-direct buffer
    public static ByteBuffer allocate(int capacity) {
        if (capacity < 0)
            throw createCapacityException(capacity);
        return new HeapByteBuffer(capacity, capacity, null);
    }

}
```

공식 문서와 코드로부터 어떤 ByteBuffer 인스턴스를 사용하느지에 따라서 JVM 힙 메모리를 사용할지 네이티브 메모리를 사용할지 결정된다는 사실을 유추할 수 있다. DirectByteBuffer, HeapByteBuffer 클래스의 추상 레이어 구조는 다음과 같다.

<p align="center">
  <img src="/images/posts/2024/direct-memory-in-java-05.png" width="60%" class="image__border">
</p>

## CLOSING

이번 글은 내가 혼란을 겪은 메모리 영역에 대한 개념과 실제 OOM 에러가 발생한 클래스는 어떤 클래스인지 정리했다. 다음 글 주제는 OOM 에러가 발생한 원인과 이를 해결한 방법에 대해 정리할 예정이다.

#### RECOMMEND NEXT POSTS

- [Out of memory error when Direct Buffer Memory allocation][out-of-memory-error-case-study-in-jvm-link]

#### REFERENCE

- <https://www.baeldung.com/java-jvm-memory-types>
- <https://dzone.com/articles/understanding-the-java-memory-model-and-the-garbag>
- <https://veribilimleri.wordpress.com/2017/03/15/java-jvm-memory-model-memory-management-in-java/>
- <https://www.betsol.com/blog/java-memory-management-for-java-virtual-machine-jvm/>
- <https://stackoverflow.com/questions/30622818/what-is-the-difference-between-off-heap-native-heap-direct-memory-and-native-m>
- <https://stackoverflow.com/questions/39675406/difference-between-metaspace-and-native-memory-in-java>
- <https://stackoverflow.com/questions/53451103/java-using-much-more-memory-than-heap-size-or-size-correctly-docker-memory-limi/53624438>
- <https://docs.oracle.com/javase/8/docs/api/java/nio/ByteBuffer.html>
- <https://learn.microsoft.com/en-us/azure/spring-apps/enterprise/concepts-for-java-memory-management>
- <https://www.happycoders.eu/java/bytebuffer-flip-compact/>
- <https://www.happycoders.eu/java/filechannel-memory-mapped-io-locks/>
- <http://eincs.com/2009/08/java-nio-bytebuffer-channel-file/>
- <https://homoefficio.github.io/2020/08/10/Java-NIO-FileChannel-%EA%B3%BC-DirectByteBuffer/>

[what-is-jvm-link]: https://junhyunny.github.io/information/java/what-is-jvm/
[out-of-memory-error-case-study-in-jvm-link]: https://junhyunny.github.io/java/jvm/spring-boot/out-of-memory-error-case-study-in-jvm/