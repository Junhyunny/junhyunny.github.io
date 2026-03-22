---
title: "스프링 DTO(Data Transfer Object) 객체와 파일 업로드"
search: false
category:
  - spring-boot
  - vue.js
last_modified_at: 2021-08-30T23:55:00
---

<br/>

* `{ { someValue } }`으로 표기된 코드는 띄어쓰기를 붙여야지 정상적으로 동작합니다.

👉 해당 포스트를 읽는데 도움을 줍니다.
- [File Upload and MultipartFile Interface][multipart-link]

## 1. 추가 기능 요건 사항
어제 같이 일하는 동료가 특정 기능 구현에 대한 도움을 요청하였는데, 구현하다보니 블로그 포스트 주제로 좋을 것 같아서 정리하였습니다. 
지난 [File Upload and MultipartFile Interface][multipart-link] 포스트의 예제 코드는 단순하게 이미지들을 선택해서 업로드하는 기능이었습니다. 
너무 단순한 기능이어서 필요로하는 기능엔 적용할 수 없었습니다. 

새롭게 추가되야하는 기능의 요건 사항에 대해 간략히 요약하면 다음과 같습니다. 
- N 건의 item 업데이트가 필요하다.
- item 별로 이미지가 M 개 매칭되는데 함께 업로드 되어야 한다.
- item 데이터와 함께 업로드 된 이미지들은 item 데이터 PK에 매칭되어 저장되어야 한다. 

DTO 클래스에 MultipartFile 리스트를 담고 싶어 했는데, 관련된 내용을 찾아보니 `@ModelAttribute` 애너테이션이 눈에 띄었습니다. 
이번 기능을 구현하면서 몇 가지 추가적인 내용들을 확인했는데, 관련된 내용은 아래 예제 코드를 통해 설명하도록 하겠습니다. 
일단 `@ModelAttribute` 애너테이션에 대해 알아보겠습니다. 

## 2. @ModelAttribute 애너테이션

> Spring Framework Doc<br/>
> Annotation that binds a method parameter or method return value to a named model attribute, exposed to a web view. Supported for controller classes with @RequestMapping methods. 

컨트롤러(controller) 클래스의 @RequestMapping 애너테이션이 붙은 메서드를 지원하는 애너테이션이며 요청 파라미터나 반환 값을 명명된 모델 속성(model attribute)에 바인딩한다고 합니다. 
설명만 봐서는 감이 오지 않으니 관련된 예제 코드를 확인해보겠습니다. 

### 2.1. Form Example 

[Spring MVC and the @ModelAttribute Annotation][baeldung-form-link] 글의 세 번째 예시를 보면 폼(Form) 정보를 특정 클래스에 매칭시키는 기능을 제공하는 듯 합니다. 
해당 예제를 활용하여 `Vue.js`, `Spring boot` 환경에서도 동일하게 동작하도록 구현해보겠습니다.

#### 2.1.1. View
```html
<form:form method="POST" action="/spring-mvc-basics/addEmployee" modelAttribute="employee">
    <form:label path="name">Name</form:label>
    <form:input path="name" />
    <form:label path="id">Id</form:label>
    <form:input path="id" />
    <input type="submit" value="Submit" />
</form:form>
```

#### 2.1.2. Controller
```java
@Controller
@ControllerAdvice
public class EmployeeController {

    private Map<Long, Employee> employeeMap = new HashMap<>();

    @RequestMapping(value = "/addEmployee", method = RequestMethod.POST)
    public String submit(@ModelAttribute("employee") Employee employee,
      BindingResult result, ModelMap model) {
        if (result.hasErrors()) {
            return "error";
        }
        model.addAttribute("name", employee.getName());
        model.addAttribute("id", employee.getId());
        employeeMap.put(employee.getId(), employee);
        return "employeeView";
    }
    // ...
}
```

## 3. MultipartFile in DTO 예제 코드
DTO 클래스 안에 MultipartFile 객체를 1개 담아서 전달하는 예제 코드입니다. 
`FileUpload.vue` 파일은 프론트 엔드 프로젝트, 나머지 클래스 파일들은 백 엔드 프로젝트의 예제 코드입니다.

### 3.1. FileUpload.vue
- 파일을 선택할 수 있는 input element를 생성합니다.
- 한 개의 파일만 선택할 수 있도록 multiple 속성을 false 값으로 지정합니다.
- 파일 선택 후 수행되는 `onchange` 이벤트에서 API 요청을 수행합니다. 
- axios 요청 시 전달하는 `FormData` 객체에 `'file'` 이라는 이름으로 선택한 이미지를 담습니다.
- `FormData` 객체를 API 요청에 함께 전달합니다.

```vue
<template>
    <div>
        <h3>파일 업로드 결과: { { this.response === '' ? 'waiting' : this.response } }</h3>
        <div>
            <button @click="uploadFileInDto()">Multipart in DTO Upload</button>
            <button @click="uploadFileListInDto()">Images List in DTO Upload</button>
            <button @click="uploadFileMapInDto()">Images Map in DTO Upload</button>
            <button @click="uploadFileMapListInDto()">Images Map-List in DTO Upload</button>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'FileUpload',
    data() {
        return {
            response: ''
        }
    },
    methods: {
        responseCallback(response) {
            this.response = response.data;
        },
        errorCallback(error) {
            this.response = error.message;
        },
        getImageSelectElement(multiple) {
            let elem = document.createElement('input');
            elem.id = 'image';
            elem.type = 'file';
            elem.accept = 'image/*';
            elem.multiple = multiple;
            return elem;
        },
        uploadFileInDto() {
            var context = this;
            let elem = this.getImageSelectElement(false);
            elem.click();
            elem.onchange = function() {
                const formData = new FormData();
                formData.append('file', this.files[0]);
                axios.post('http://localhost:8081/dto', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(context.responseCallback).catch(context.errorCallback);
            }
        },

        // ...

    }
}
</script>
```

### 3.2. MultipartDto 클래스
- Dto 클래스는 `'file'` 이라는 이름을 가진 MultipartFile 멤버를 가집니다.

```java
package blog.in.action.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
public class MultipartDto {

    private MultipartFile file;
}
```

### 3.3. FileController 클래스
- `/dto` 경로에 대한 요청을 받아주는 메서드의 파라미터로 MultipartDto 객체를 받습니다.

```java
package blog.in.action.controller;

import blog.in.action.dto.MultipartDto;
import blog.in.action.dto.MultipartListDto;
import blog.in.action.dto.MultipartMapDto;
import blog.in.action.dto.MultipartMapListDto;
import java.io.FileOutputStream;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin("*")
@RestController
public class FileController {

    @PostMapping(value = "/dto")
    public @ResponseBody
    String uploadFileInDto(@ModelAttribute MultipartDto dto) {
        MultipartFile multipartFile = dto.getFile();
        try (FileOutputStream writer = new FileOutputStream("./images/" + multipartFile.getOriginalFilename())) {
            writer.write(multipartFile.getBytes());
        } catch (Exception e) {
            return "upload fail";
        }
        return "upload success";
    }

    // ...

}
```

### 3.4. 파일 업로드 테스트

##### 파일 선택 후 업로드
- `Multipart in DTO Upload` 버튼을 누른 후 이미지를 선택합니다.

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-01.png" width="80%"></p>

##### 컨트롤러 디버깅 화면
- 전달받은 dto 객체의 file 멤버 변수에 프론트에서 전달한 파일 정보가 담겨 있습니다. 

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-02.png" width="80%"></p>

## 4. MultipartFile List in DTO 예제 코드
DTO 클래스 안에 N개의 파일을 리스트(List)로 담아서 전달하는 예제 코드입니다. 
`FileUpload.vue` 파일은 프론트 엔드 프로젝트, 나머지 클래스 파일들은 백 엔드 프로젝트의 예제 코드입니다.

### 4.1. FileUpload.vue
- 파일을 선택할 수 있는 input element를 생성합니다.
- 파일을 여러 개 선택할 수 있도록 multiple 속성을 true 값으로 지정합니다.
- 파일 선택 후 수행되는 `onchange` 이벤트에서 API 요청을 수행합니다. 
- axios 요청 시 전달하는 `FormData` 객체에 `'files'` 이라는 이름으로 선택한 이미지들을 추가(append)하여 담습니다.
- `FormData` 객체를 API 요청에 함께 전달합니다.

```vue
<template>
    <div>
        <h3>파일 업로드 결과: { { this.response === '' ? 'waiting' : this.response } }</h3>
        <div>
            <button @click="uploadFileInDto()">Multipart in DTO Upload</button>
            <button @click="uploadFileListInDto()">Images List in DTO Upload</button>
            <button @click="uploadFileMapInDto()">Images Map in DTO Upload</button>
            <button @click="uploadFileMapListInDto()">Images Map-List in DTO Upload</button>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'FileUpload',
    data() {
        return {
            response: ''
        }
    },
    methods: {
        responseCallback(response) {
            this.response = response.data;
        },
        errorCallback(error) {
            this.response = error.message;
        },
        getImageSelectElement(multiple) {
            let elem = document.createElement('input');
            elem.id = 'image';
            elem.type = 'file';
            elem.accept = 'image/*';
            elem.multiple = multiple;
            return elem;
        },
        uploadFileListInDto() {
            var context = this;
            let elem = this.getImageSelectElement(true);
            elem.click();
            elem.onchange = function() {
                const formData = new FormData();
                for (var index = 0; index < this.files.length; index++) {
                    formData.append('files', this.files[index]);
                }
                axios.post('http://localhost:8081/dto/multipart/list', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(context.responseCallback).catch(context.errorCallback);
            }
        },

        // ...
    
    }
}
</script>
```

### 4.2. MultipartListDto 클래스
- Dto 클래스는 `'files'` 이라는 이름을 가진 MultipartFile 리스트(List) 멤버를 가집니다.

```java
package blog.in.action.dto;

import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
public class MultipartListDto {

    private List<MultipartFile> files;
}
```

### 4.3. FileController 클래스
- `/dto/multipart/list` 경로에 대한 요청을 받아주는 메서드의 파라미터로 MultipartListDto 객체를 받습니다.

```java
package blog.in.action.controller;

import blog.in.action.dto.MultipartDto;
import blog.in.action.dto.MultipartListDto;
import blog.in.action.dto.MultipartMapDto;
import blog.in.action.dto.MultipartMapListDto;
import java.io.FileOutputStream;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin("*")
@RestController
public class FileController {

    @PostMapping(value = "/dto/multipart/list")
    public @ResponseBody
    String uploadFileListInDto(@ModelAttribute MultipartListDto dto) {
        for (MultipartFile multipartFile : dto.getFiles()) {
            try (FileOutputStream writer = new FileOutputStream("./images/" + multipartFile.getOriginalFilename())) {
                writer.write(multipartFile.getBytes());
            } catch (Exception e) {
                return "upload fail";
            }
        }
        return "upload success";
    }

    // ...
}
```

### 4.4. 파일 업로드 테스트

##### 파일 선택 후 업로드
- `Images List in DTO Upload` 버튼을 누른 후 이미지를 선택합니다.

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-03.png" width="80%"></p>

##### 컨트롤러 디버깅 화면
- 전달받은 dto 객체의 files 멤버 변수에 프론트에서 전달한 파일들의 정보가 담겨 있습니다. 

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-04.png" width="80%"></p>

### 4.5. FormData append 함수 특징
append 함수는 이름처럼 추가된 항목 뒤에 새로 추가할 항목들을 붙히는 기능을 제공합니다. 
따라서, `'files'`라는 이름으로 파일을 계속 추가(append)하면 `'files'` 라는 이름을 가진 리스트가 생성됩니다. 

##### 예시 코드
```javascript
formData.append('name', true);
formData.append('name', 74);
formData.append('name', 'John');
formData.getAll('name'); // ["true", "74", "John"]
```

##### FormData append 함수 호출

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-05.gif" width="80%"></p>

## 5. MultipartFile Map in DTO 예제 코드
DTO 클래스 안에 파일을 N개 담아서 전달하는 예제 코드입니다. 
이번엔 N개의 파일을 리스트가 아닌 맵(Map)에 담아서 전달합니다. 
`FileUpload.vue` 파일은 프론트 엔드 프로젝트, 나머지 클래스 파일들은 백 엔드 프로젝트의 예제 코드입니다.

### 5.1. FileUpload.vue
- 파일을 선택할 수 있는 input element를 생성합니다.
- 파일을 여러 개 선택할 수 있도록 multiple 속성을 true 값으로 지정합니다.
- 파일 선택 후 수행되는 `onchange` 이벤트에서 API 요청을 수행합니다. 
- axios 요청 시 전달하는 `FormData` 객체에 `'files[' + index + ']'` 이라는 이름으로 선택한 이미지들을 추가(append)하여 담습니다.
- `FormData` 객체를 API 요청에 함께 전달합니다.

```vue
<template>
    <div>
        <h3>파일 업로드 결과: { { this.response === '' ? 'waiting' : this.response } }</h3>
        <div>
            <button @click="uploadFileInDto()">Multipart in DTO Upload</button>
            <button @click="uploadFileListInDto()">Images List in DTO Upload</button>
            <button @click="uploadFileMapInDto()">Images Map in DTO Upload</button>
            <button @click="uploadFileMapListInDto()">Images Map-List in DTO Upload</button>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'FileUpload',
    data() {
        return {
            response: ''
        }
    },
    methods: {
        responseCallback(response) {
            this.response = response.data;
        },
        errorCallback(error) {
            this.response = error.message;
        },
        getImageSelectElement(multiple) {
            let elem = document.createElement('input');
            elem.id = 'image';
            elem.type = 'file';
            elem.accept = 'image/*';
            elem.multiple = multiple;
            return elem;
        },
        uploadFileMapInDto() {
            var context = this;
            let elem = this.getImageSelectElement(true);
            elem.click();
            elem.onchange = function() {
                const formData = new FormData();
                for (var index = 0; index < this.files.length; index++) {
                    formData.append('files[' + index + ']', this.files[index]);
                }
                axios.post('http://localhost:8081/dto/multipart/map', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(context.responseCallback).catch(context.errorCallback);
            }
        },

        // ...

    }
}
</script>
```

### 5.2. MultipartMapDto 클래스
- Dto 클래스는 `'files'` 이라는 이름을 가진 MultipartFile 맵(Map) 멤버를 가집니다.

```java
package blog.in.action.dto;

import java.util.Map;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
public class MultipartMapDto {

    private Map<String, MultipartFile> files;
}
```

### 5.3. FileController 클래스
- `/dto/multipart/map` 경로에 대한 요청을 받아주는 메서드의 파라미터로 MultipartMapDto 객체를 받습니다.

```java
package blog.in.action.controller;

import blog.in.action.dto.MultipartDto;
import blog.in.action.dto.MultipartListDto;
import blog.in.action.dto.MultipartMapDto;
import blog.in.action.dto.MultipartMapListDto;
import java.io.FileOutputStream;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin("*")
@RestController
public class FileController {

    @PostMapping(value = "/dto/multipart/map")
    public @ResponseBody
    String uploadFileMapInDto(@ModelAttribute MultipartMapDto dto) {
        Map<String, MultipartFile> files = dto.getFiles();
        for (String key : files.keySet()) {
            MultipartFile multipartFile = files.get(key);
            try (FileOutputStream writer = new FileOutputStream("./images/" + multipartFile.getOriginalFilename())) {
                writer.write(multipartFile.getBytes());
            } catch (Exception e) {
                return "upload fail";
            }
        }
        return "upload success";
    }

    // ...
}
```

### 5.4. 파일 업로드 테스트

##### 파일 선택 후 업로드
- `Images Map in DTO Upload` 버튼을 누른 후 이미지를 선택합니다.

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-06.png" width="80%"></p>

##### 컨트롤러 디버깅 화면
- 전달받은 dto 객체의 file 멤버 변수에 프론트에서 전달한 파일 정보가 담겨 있습니다. 

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-07.png" width="80%"></p>

### 5.5. FormData append 함수 특징
FormData 객체의 키(key)로 전달되는 값에 대괄호([])가 포함되는 경우 대괄호 안의 값을 Map의 키(key)로 인식합니다. 
`'files[index]'` 값은 files 라는 멤버 변수의 키 값으로 index를 사용한다는 의미입니다.

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-08.gif" width="80%"></p>

## 6. MultipartFile Map-List in DTO 예제 코드
DTO 클래스 안에 파일을 N개 담아서 전달하는 예제 코드입니다. 
이번에도 N개의 파일을 맵(Map)에 담아서 전달합니다. 
동일한 키를 가지는 경우 파일들은 리스트로 뭉쳐집니다. 
`FileUpload.vue` 파일은 프론트 엔드 프로젝트, 나머지 클래스 파일들은 백 엔드 프로젝트의 예제 코드입니다.

### 6.1. FileUpload.vue
- 파일을 선택할 수 있는 input element를 생성합니다.
- 파일을 여러 개 선택할 수 있도록 multiple 속성을 true 값으로 지정합니다.
- 파일 선택 후 수행되는 `onchange` 이벤트에서 API 요청을 수행합니다. 
- axios 요청 시 전달하는 `FormData` 객체에 `'files[' + (index % 3) + ']'` 이라는 이름으로 선택한 이미지들을 추가(append)하여 담습니다.
- `FormData` 객체를 API 요청에 함께 전달합니다.

```vue
<template>
    <div>
        <h3>파일 업로드 결과: { { this.response === '' ? 'waiting' : this.response } }</h3>
        <div>
            <button @click="uploadFileInDto()">Multipart in DTO Upload</button>
            <button @click="uploadFileListInDto()">Images List in DTO Upload</button>
            <button @click="uploadFileMapInDto()">Images Map in DTO Upload</button>
            <button @click="uploadFileMapListInDto()">Images Map-List in DTO Upload</button>
        </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    name: 'FileUpload',
    data() {
        return {
            response: ''
        }
    },
    methods: {
        responseCallback(response) {
            this.response = response.data;
        },
        errorCallback(error) {
            this.response = error.message;
        },
        getImageSelectElement(multiple) {
            let elem = document.createElement('input');
            elem.id = 'image';
            elem.type = 'file';
            elem.accept = 'image/*';
            elem.multiple = multiple;
            return elem;
        },

        // ...

        uploadFileMapListInDto() {
            var context = this;
            let elem = this.getImageSelectElement(true);
            elem.click();
            elem.onchange = function() {
                const formData = new FormData();
                for (var index = 0; index < this.files.length; index++) {
                    formData.append('files[' + (index % 3) + ']', this.files[index]);
                }
                axios.post('http://localhost:8081/dto/multipart/map/list', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(context.responseCallback).catch(context.errorCallback);
            }
        }
    }
}
</script>
```

### 6.2. MultipartMapDto 클래스
- Dto 클래스는 `'files'` 이라는 이름을 가진 MultipartFile 맵(Map) 멤버를 가집니다. 
- 동일 키를 가지는 경우 리스트(List)에 파일이 담기도록 맵의 Value는 리스트 자료형을 가집니다. 

```java
package blog.in.action.dto;

import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
@NoArgsConstructor
public class MultipartMapListDto {

    private Map<String, List<MultipartFile>> files;
}
```

### 6.3. FileController 클래스
- `/dto/multipart/map/list` 경로에 대한 요청을 받아주는 메서드의 파라미터로 MultipartMapListDto 객체를 받습니다.

```java
package blog.in.action.controller;

import blog.in.action.dto.MultipartDto;
import blog.in.action.dto.MultipartListDto;
import blog.in.action.dto.MultipartMapDto;
import blog.in.action.dto.MultipartMapListDto;
import java.io.FileOutputStream;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin("*")
@RestController
public class FileController {

    // ...

    @PostMapping(value = "/dto/multipart/map/list")
    public @ResponseBody
    String uploadFileMapListInDto(@ModelAttribute MultipartMapListDto dto) {
        Map<String, List<MultipartFile>> files = dto.getFiles();
        for (String key : files.keySet()) {
            List<MultipartFile> multipartFiles = files.get(key);
            for (MultipartFile multipartFile : multipartFiles) {
                try (FileOutputStream writer = new FileOutputStream("./images/" + multipartFile.getOriginalFilename())) {
                    writer.write(multipartFile.getBytes());
                } catch (Exception e) {
                    return "upload fail";
                }
            }
        }
        return "upload success";
    }
}
```

### 6.4. 파일 업로드 테스트

##### 파일 선택 후 업로드
- `Images Map-List in DTO Upload` 버튼을 누른 후 이미지를 선택합니다.

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-09.png" width="80%"></p>

##### 컨트롤러 디버깅 화면
- 전달받은 dto 객체의 file 멤버 변수에 프론트에서 전달한 파일 정보가 담겨 있습니다. 

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-10.png" width="80%"></p>

### 5.5. FormData append 함수 특징
FormData 객체의 키(key)로 전달되는 값에 대괄호([])가 포함되는 경우 대괄호 안의 값을 Map의 키(key)로 인식합니다. 
`'files[' + (index % 3) + ']'` 값은 files 라는 멤버 변수의 키 값으로 `(index % 3)` 값을 사용한다는 의미입니다. 
중첩되는 키가 존재하는 경우 맵의 Value 위치에는 리스트로 데이터가 담깁니다. 

<p align="center"><img src="{{ site.image_url_2021 }}/multipartfile-in-dto-11.gif" width="80%"></p>

#### TEST CODE REPOSITORY
- <https://github.com/Junhyunny/blog-in-action/tree/master/2021-08-30-multipartfile-in-dto>

#### REFERENCE
- <https://www.baeldung.com/spring-mvc-and-the-modelattribute-annotation>
- <https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/bind/annotation/ModelAttribute.html>
- <https://developer.mozilla.org/en-US/docs/Web/API/FormData/append>

[multipart-link]: https://junhyunny.github.io/spring-boot/vue.js/multipartfile/
[baeldung-form-link]: https://www.baeldung.com/spring-mvc-and-the-modelattribute-annotation#form