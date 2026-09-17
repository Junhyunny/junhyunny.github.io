---
title: "스위프트 원시 타입(Swift Primitive Types)"
search: false
category:
  - swift
  - swift-ui
  - ios
last_modified_at: 2026-09-17T13:56:20+09:00
---

<br/>

## 0. 들어가면서

다음 프로젝트에서 iOS, 안드로이드 애플리케이션 개발을 맡게 될지도 모른다. 네이티브 애플리케이션 개발에 문외한인 나로선 부담이 되는 상황이다. 다행히 회사의 배려로 공부할 시간을 낼 수 있어서 학습한 내용을 하나씩 정리해보려 한다. 첫 번째 글은 스위프트(Swift)의 타입에 관련된 내용이다.

## 1. Swift Primitive Types

스위프트는 다른 언어에서 기본형 또는 원시 타입(primitive type)이라고 부르는 숫자, 불리언, 문자열 등도 표준 라이브러리가 정의한 이름 있는 구조체로 표현한다.

> int 타입은 없지만, Int 타입은 있다.

자주 사용되는 단일 값 타입은 다음과 같다.

- Int - 부호 있는 정수
- UInt - 0 이상의 정수
- Double - 64비트 부동소수점
- Float - 32비트 부동소수점
- Bool - `true` 혹은 `false`
- String - 문자열
- Character - 한 개의 확장 유니코드 문자소

각 타입의 특성은 다음과 같다.

| 타입 | 표현하는 값 | 주요 특성 | 비교 |
| --- | --- | --- | --- |
| `Int` | 부호 있는 정수 | 일반적인 정수 기본값, 현재 iOS의 64비트 환경에서는 64비트 크기 | `==`, `!=`, `<`, `<=`, `>`, `>=` |
| `UInt` | 0 이상의 정수 | 음수를 표현하지 못함. 특별한 이유가 없으면 개수에도 보통 `Int`가 편함 | `Int`와 같은 순서 비교 |
| `Int8`…`Int64` | 크기가 고정된 부호 정수 | 파일 형식·네트워크·C API처럼 비트 폭이 중요할 때 사용 | 같은 타입끼리 순서 비교 |
| `UInt8`…`UInt64` | 크기가 고정된 무부호 정수 | 바이트 데이터에는 `UInt8`이 자주 쓰임 | 같은 타입끼리 순서 비교 |
| `Double` | 64비트 부동소수점 | 소수 리터럴을 추론할 때의 기본 타입. 일반 계산에 우선 사용 | 순서 비교 가능하나 근삿값 주의 |
| `Float` | 32비트 부동소수점 | 정밀도보다 메모리·GPU API 호환이 중요한 경우 사용 | 순서 비교 가능하나 근삿값 주의 |
| `Bool` | `true` 또는 `false` | 조건식은 반드시 `Bool`이어야 하며 `0`을 거짓처럼 쓰지 못함 | `==`, `!=`; 크기 순서는 없음 |
| `String` | 문자열 | 확장 유니코드 문자소의 모음인 값 타입 | `==`, `!=` 및 사전식 순서 비교 |
| `Character` | 한 개의 확장 유니코드 문자소 | 사용자에게 보이는 문자 한 단위를 표현 | `==`, `!=` 및 순서 비교 |

스위프트는 초기값을 보고 타입을 추론한다. 물론 명시적으로 타입을 지정할 수도 있다.

```swift
let count = 10  
let ratio = 0.5  
let title = "Snow"
let visible = true 

print(type(of: count))  // Int
print(type(of: ratio))  // Double
print(type(of: title))  // String
print(type(of: visible)) // Bool
```

부동소수점 리터럴은 별도 문맥이 없으면 Double로 추론한다. Float 타입이 필요하면 이를 명시한다.

```swift
let gpuValue: Float = 0.5

print(type(of: gpuValue))  // Float
```

## 2. Integer types overflow

각 타입을 조금 더 자세히 들여다보자. 먼저 정수형 타입에서 오버플로우를 다루는 방법을 살펴보자. `Int8`, `UInt8`, `Int`, `UInt` 같은 고정 폭 정수는 사용할 수 있는 비트(bit) 수가 정해져 있어 표현 범위에도 한계가 있다.

```swift
print(Int8.min)  //-128
print(Int8.max)  // 127
print(UInt8.min)  // 0
print(UInt8.max)  //255
```

최댓값보다 큰 결과가 생기면 오버플로우(overflow) 에러, 최솟값보다 작은 결과가 생기면 언더플로우(underflow) 에러가 발생한다. 두 경우 모두 결과를 해당 정수 타입의 비트로 표현할 수 없어서 발생하는 에러다. 예를 들어, 아래 코드는 컴파일(compile) 시점에는 에러가 발생하지 않지만, 런타임 시점에 에러가 발생한다.

```swift
var runtimeValue = UInt8.max  // 255
runtimeValue += 1  // 런타임 오류: arithmetic overflow
```

위 코드를 실행하면 다음과 같은 트랩(trap)을 만나게 된다.

```
* thread #1, queue = 'com.apple.main-thread', stop reason = Swift runtime failure: arithmetic overflow
    frame #0: 0x0000000104af8d74 $__lldb_expr100`Swift runtime failure: arithmetic overflow at action-in-blog.playground:0 [inlined]
    frame #1: 0x0000000104af8d74 $__lldb_expr100`main at action-in-blog.playground:27:14
    frame #2: 0x0000000104881cf8 action-in-blog`linkResources + 264
    frame #3: 0x0000000180422d28 CoreFoundation`__CFRUNLOOP_IS_CALLING_OUT_TO_A_BLOCK__ + 20
    frame #4: 0x00000001804224b4 CoreFoundation`__CFRunLoopDoBlocks + 340
    frame #5: 0x0000000180421824 CoreFoundation`__CFRunLoopRun + 788
    frame #6: 0x000000018041c904 CoreFoundation`_CFRunLoopRunSpecificWithOptions + 496
    frame #7: 0x00000001933599c0 GraphicsServices`GSEventRunModal + 116
    frame #8: 0x00000001864a54cc UIKitCore`-[UIApplication _run] + 776
    frame #9: 0x0000000186b9f910 UIKitCore`UIApplicationMain + 120
  * frame #10: 0x0000000104881e68 action-in-blog`main + 368
    frame #11: 0x00000001049430e4 dyld_sim`start_sim + 20
    frame #12: 0x0000000104b1c4e4 dyld`start + 6992
...
```

프로그램이 강제로 종료되는 치명적인 에러인 트랩은 throw 키워드로 전달되는 에러(Error)가 아니기 때문에 do-catch 구문으로 복구할 수 없다. 코드가 실행되기 전에 미리 방지해야 한다.

- 스위프트 에러(Error): throw 키워드를 통해 던지는 에러다. 네트워크 실패나 파일 없음 같은 에러는 프로그래머가 예상할 수 있으므로 do-catch 구문으로 잡아내어 안전하게 처리할 수 있다.
- 트랩(복구 불가능/런타임 에러): 0으로 나누기, 배열 인덱스 범위를 벗어난 접근, 정수 오버플로우 같은 상황이다. 스위프트 언어 차원에서 프로그램을 즉시 강제 종료시키는 치명적인 오류이며, do-catch 구문으로는 프로그램이 크래시 나는 것을 막을 수 없다.

위에서 살펴본 정수 오버플로우의 경우 크래시 없이 오버플로우를 감지하려면 addingReportingOverflow 같은 스위프트 내장 API 메서드를 사용할 수 있다.

```swift
let maxInt = Int8.max  // 127 (Int8이 가질 수 있는 최댓값)
let result = maxInt.addingReportingOverflow(1)

print(result.partialValue)  // -128 (오버플로우된 결과값)
print(result.overflow)  // true (오버플로우가 발생했음을 알려줌)

if result.overflow {
    print("오버플로우가 발생했으니 안전한 다른 처리를 합니다.")
}
```

사용할 수 있는 주요 메서드는 다음과 같다.

- `addingReportingOverflow(_:)`
- `subtractingReportingOverflow(_:)`
- `multipliedReportingOverflow(by:)`
- `dividedReportingOverflow(by:)`
- `remainderReportingOverflow(dividingBy:)`

의도적으로 고정된 비트 폭의 순환을 처리해야 하는 경우 `&+`, `&-`, `&*`를 사용할 수 있다. `&`는 bitwise AND가 아니라 이 문맥에서 **overflow 허용 연산자**의 일부다. 범위를 넘어간 상위 비트는 버리므로 최댓값 다음은 최솟값으로, 최솟값 이전은 최댓값으로 이어진다.

```swift
let wrappedUp = UInt8.max &+ 1
let wrappedDown = UInt8.min &- 1
let signedUp = Int8.max &+ 1
let signedDown = Int8.min &- 1
let wrappedProduct: UInt8 = 20 &* 20

print(wrappedUp)  // 255 &+ 1 == 0
print(wrappedDown)  // 0 &- 1 == 255
print(signedUp)  // 127 &+ 1 == -128
print(signedDown)  // -128 &- 1 == 127
print(wrappedProduct)  // 400에서 하위 8bit만 남아 144
```

앞서 말한 것처럼 스위프트의 원시 타입들은 구조체이기 때문에 프로퍼티와 메서드가 있고 해당 타입을 확장(extension)할 수도 있다.

## 3. String, Character and Substring

String 타입은 유니코드(Unicode) 문자열을 나타내는 값 타입이다. 컬렉션을 순회하면 원소 타입인 `String.Element`가 `Character`다.

```swift
let greeting = "Hi 👋"

for character in greeting {
    print(character)
}
// H
// i
//  
// 👋
```

문자열 리터럴은 문맥이 없으면 String 타입으로 추론한다. 하나의 문자만 적었더라도 Character 타입으로 명시하지 않으면 String 타입으로 추론한다.

```swift
let inferred = "A"
let explicit: Character = "A"

print(type(of: inferred))  // String
print(type(of: explicit))  // Character
```

`Character`는 하나의 바이트나 유니코드 스칼라(unicode scalar)가 아니다. 유니코드 경계 규칙에 따라 **사용자에게 한 글자로 보이는 하나 이상의 유니코드 스칼라의 묶음**이다. 유니코드 스칼라는 문자를 구성하는 기본 숫자 값이다. `U+`로 시작하는 고유 번호를 갖는다.

어떤 문자는 유니코드 스칼라 두 개가 합쳐져 표현되기도 한다. 예를 들면 🇰🇷 같은 이모지(emoji)가 있다. 대한민국 국기 문자는 두 개의 스칼라로 이뤄진다.

```
U+1F1F0  REGIONAL INDICATOR SYMBOL LETTER K
U+1F1F7  REGIONAL INDICATOR SYMBOL LETTER R
```

그렇기 때문에 어떤 관점에서 봤는지에 따라 글자 수가 달라진다. 유니코드 스칼라로 보면 2개, UTF8 바이트로 보면 8개, UTF16 규격으로 보면 4개이지만, 스위프트에선 1개의 글자로 취급한다.

```swift
let koreaIcon = "🇰🇷"

print(koreaIcon.count) // 1
print(koreaIcon.unicodeScalars.count) // 2
print(koreaIcon.utf8.count) // 8
print(koreaIcon.utf16.count) // 4
```

각 Character가 차지하는 스칼라나 바이트 수가 다르기 때문에 다른 언어처럼 `string[0]`과 같이 정수로 즉시 접근하기 어렵다. 스위프트는 각 문자의 경계를 가리키는 `String.Index` 값을 사용해서 각 문자에 접근해야 한다.

```swift
let language = "Swift 🇰🇷"

let firstIndex: String.Index = language.startIndex
print(language[firstIndex]) // "S"

let secondIndex: String.Index = language.index(after: firstIndex)
print(language[secondIndex]) // "w"

let offset: String.Index = language.index(language.startIndex, offsetBy: 6)
print(language[offset]) // "🇰🇷"

for index: String.Index in language.indices {
    print(language[index])
}
// S
// w
// i
// f
// t
//  
// 🇰🇷
```

String 타입을 자르면 String 타입이 아니라 `Substring` 타입이 된다. Substring 타입도 `StringProtocol`을 통해 문자열과 비슷하게 사용할 수 있다.

짧게 계산하고 버릴 때는 `Substring` 그대로 사용하고, 프로퍼티에 오래 저장하거나 API가 `String`을 요구하면 `String(substring)`으로 변환한다. 이렇게 하면 아주 작은 substring 하나 때문에 큰 원본 문자열의 저장 공간이 오래 유지되는 상황도 피할 수 있다.

```swift
let fullName = "Marie Curie"
let space = fullName.firstIndex(of: " ") ?? fullName.endIndex
let firstNameSlice = fullName[..<space]
let firstName = String(firstNameSlice)

print(type(of: firstNameSlice))  // Substring
print(type(of: firstName))  // String
```

Substring 타입은 원본 문자열의 저장 공간을 공유할 수 있다. `"저장 공간을 공유한다"`는 말은 Substring 객체가 자신의 문자 버퍼 전체를 새로 복사하는 대신 원본 버퍼의 일부를 바라본다는 뜻이다.

버퍼를 공유한다고 해서 Substring 객체를 통해 원본의 값을 변경할 수 있는 것은 아니다. Substring 객체는 읽기 전용 뷰(view)일 뿐 원본을 변경할 수 없다. Substring 객체를 변경하면 copy-on-write 방식으로 버퍼를 복사해 필요한 저장 공간을 분리하고 원본은 그대로 유지한다.

```swift
var original = "HEADER:" + String(repeating: "A", count: 5) + ":TAIL"
var slice = original.dropFirst(7).prefix(5)

slice.replaceSubrange(slice.startIndex...slice.startIndex, with: "Z")

print(slice)  // ZAAAA
print(original)  // HEADER:AAAAAAAAHEADER:AAAAA:TAIL
```

원본 String 객체와 Substring 객체는 String.Index 값도 공유한다. 원본에서 잘라낸 Substring 객체의 startIndex 값은 0이 아니라 원본 문자열에서 해당 Substring 객체가 시작하는 위치와 같다.

```swift

let originalString = "HEADER:Junhyunny, Develeoper!:FOOTER"
let start = originalString.index(original.startIndex, offsetBy: 7)
let end = originalString.index(start, offsetBy: 22)
let substring = originalString[start..<end]

print(substring)  // Substring "Junhyunny, Develeoper!"
print(substring.startIndex)  // 7[utf8]
print(substring.startIndex == start)  // true
print(substring.endIndex == end)  // true
print(originalString[slice.startIndex])  // "J"
```

#### TEST CODE REPOSITORY

- <https://github.com/Junhyunny/blog-in-action/tree/master/2026-09-17-swift-primitive-types/action-in-blog.playground>

#### REFERENCE

- [The Swift Programming Language: The Basics](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/thebasics/)
- [The Swift Programming Language: Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/types/)
- [The Swift Programming Language: Basic Operators](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/basicoperators/)
- [The Swift Programming Language: Strings and Characters](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/stringsandcharacters/)
- [The Swift Programming Language: Collection Types](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/collectiontypes/)
- [The Swift Programming Language: Structures and Classes](https://docs.swift.org/swift-book/documentation/the-swift-programming-language/classesandstructures/)
- [Swift Standard Library: Equatable](https://developer.apple.com/documentation/swift/equatable)
- [Swift Standard Library: Comparable](https://developer.apple.com/documentation/swift/comparable)
- [Swift 표준 라이브러리 — String의 Substring 설명](https://developer.apple.com/documentation/swift/string)
- [Swift 표준 라이브러리 — StringProtocol](https://developer.apple.com/documentation/swift/stringprotocol)