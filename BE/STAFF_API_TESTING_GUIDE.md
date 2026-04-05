# HƯỚNG DẪN TEST API QUẢN LÝ NHÂN VIÊN TRÊN POSTMAN

## Chuẩn bị

### 1. Khởi động server

```bash
cd Node_NNPTUD/BE
npm start
```

### 2. Đảm bảo MongoDB đang chạy

```bash
mongod --replSet rs0
```

### 3. Tạo role STAFF trong database (nếu chưa có)

Sử dụng MongoDB Compass hoặc mongo shell:

```javascript
db.roles.insertOne({
  name: "STAFF",
  description: "Nhân viên",
  isDeleted: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### 4. Đăng nhập để lấy token

- Sử dụng tài khoản ADMIN để test các API
- Lưu token vào biến môi trường hoặc cookie

---

## API ENDPOINTS

Base URL: `http://localhost:8080/api/staff`

---

## 1. TẠO NHÂN VIÊN MỚI

### Request

- **Method:** `POST`
- **URL:** `http://localhost:8080/api/staff`
- **Headers:**
  ```
  Content-Type: application/json
  Cookie: TOKEN_NNPTUD_C3=<your_admin_token>
  ```
  Hoặc:
  ```
  Authorization: Bearer <your_admin_token>
  ```

### Body (JSON)

```json
{
  "fullName": "Nguyễn Văn A",
  "email": "nguyenvana@petspa.com",
  "phoneNumber": "0901234567",
  "address": "123 Đường ABC, Quận 1, TP.HCM",
  "dateOfBirth": "1995-05-15",
  "hireDate": "2024-01-10",
  "department": "Chăm sóc thú cưng",
  "position": "Nhân viên chăm sóc",
  "specialization": "Chăm sóc chó mèo",
  "profilePictureUrl": "/uploads/avatar.jpg"
}
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Tạo tài khoản nhân viên thành công. Email đăng nhập đã được gửi.",
  "data": {
    "staffId": "65f1234567890abcdef12345",
    "staffCode": "STF2401",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@petspa.com",
    "username": "nguyenvana",
    "temporaryPassword": "aB3$xY9@kL",
    "mustChangePassword": true
  }
}
```

### Response Error (400)

```json
{
  "success": false,
  "message": "Email đã tồn tại trong hệ thống"
}
```

### Test Cases

1. **TC01:** Tạo nhân viên với đầy đủ thông tin hợp lệ → Success
2. **TC02:** Tạo nhân viên với email đã tồn tại → Error "Email đã tồn tại"
3. **TC03:** Tạo nhân viên với số điện thoại đã tồn tại → Error "Số điện thoại đã tồn tại"
4. **TC04:** Tạo nhân viên thiếu fullName → Error validation
5. **TC05:** Tạo nhân viên thiếu email → Error validation
6. **TC06:** Tạo nhân viên với số điện thoại không đúng định dạng (không phải 10 số) → Error validation
7. **TC07:** Tạo nhân viên không có hireDate → Success (tự động lấy ngày hiện tại)

---

## 2. LẤY DANH SÁCH NHÂN VIÊN (PHÂN TRANG)

### Request

- **Method:** `GET`
- **URL:** `http://localhost:8080/api/staff/paginated`
- **Headers:**
  ```
  Cookie: TOKEN_NNPTUD_C3=<your_admin_token>
  ```

### Query Parameters

| Parameter  | Type   | Required | Default     | Description                          |
| ---------- | ------ | -------- | ----------- | ------------------------------------ |
| pageNumber | number | No       | 1           | Số trang                             |
| pageSize   | number | No       | 10          | Số bản ghi mỗi trang                 |
| search     | string | No       | ""          | Tìm kiếm theo tên, mã, email, SĐT    |
| sortBy     | string | No       | "fullName"  | Trường sắp xếp                       |
| sortDir    | string | No       | "Ascending" | Hướng sắp xếp (Ascending/Descending) |

### Example URLs

```
# Lấy trang 1, 10 bản ghi
http://localhost:8080/api/staff/paginated?pageNumber=1&pageSize=10

# Tìm kiếm theo tên
http://localhost:8080/api/staff/paginated?search=Nguyễn

# Sắp xếp theo mã nhân viên giảm dần
http://localhost:8080/api/staff/paginated?sortBy=staffCode&sortDir=Descending

# Kết hợp tất cả
http://localhost:8080/api/staff/paginated?pageNumber=1&pageSize=5&search=Nguyễn&sortBy=fullName&sortDir=Ascending
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Lấy danh sách nhân viên thành công",
  "data": {
    "items": [
      {
        "_id": "65f1234567890abcdef12345",
        "staffCode": "STF2401",
        "fullName": "Nguyễn Văn A",
        "email": "nguyenvana@petspa.com",
        "phoneNumber": "0901234567",
        "department": "Chăm sóc thú cưng",
        "position": "Nhân viên chăm sóc",
        "profilePictureUrl": "/uploads/avatar.jpg",
        "isActive": true,
        "createdAt": "2024-01-10T10:00:00.000Z",
        "updatedAt": "2024-01-10T10:00:00.000Z"
      }
    ],
    "totalCount": 15,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

### Test Cases

1. **TC08:** Lấy danh sách trang 1, 10 bản ghi → Success
2. **TC09:** Lấy danh sách trang 2 → Success
3. **TC10:** Tìm kiếm theo tên "Nguyễn" → Success, trả về các nhân viên có tên chứa "Nguyễn"
4. **TC11:** Tìm kiếm theo email → Success
5. **TC12:** Tìm kiếm theo số điện thoại → Success
6. **TC13:** Sắp xếp theo staffCode tăng dần → Success
7. **TC14:** Sắp xếp theo fullName giảm dần → Success
8. **TC15:** Thay đổi pageSize = 5 → Success, mỗi trang 5 bản ghi

---

## 3. LẤY CHI TIẾT NHÂN VIÊN

### Request

- **Method:** `GET`
- **URL:** `http://localhost:8080/api/staff/:id`
- **Headers:**
  ```
  Cookie: TOKEN_NNPTUD_C3=<your_admin_token>
  ```

### Example URL

```
http://localhost:8080/api/staff/65f1234567890abcdef12345
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Lấy thông tin nhân viên thành công",
  "data": {
    "id": "65f1234567890abcdef12345",
    "staffCode": "STF2401",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@petspa.com",
    "phoneNumber": "0901234567",
    "address": "123 Đường ABC, Quận 1, TP.HCM",
    "dateOfBirth": "1995-05-15T00:00:00.000Z",
    "hireDate": "2024-01-10T00:00:00.000Z",
    "department": "Chăm sóc thú cưng",
    "position": "Nhân viên chăm sóc",
    "specialization": "Chăm sóc chó mèo",
    "profilePictureUrl": "/uploads/avatar.jpg",
    "isActive": true,
    "username": "nguyenvana",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-10T10:00:00.000Z"
  }
}
```

### Response Error (404)

```json
{
  "success": false,
  "message": "Không tìm thấy nhân viên"
}
```

### Test Cases

1. **TC16:** Lấy chi tiết với ID hợp lệ → Success
2. **TC17:** Lấy chi tiết với ID không tồn tại → Error 404
3. **TC18:** Lấy chi tiết với ID không đúng định dạng → Error 404

---

## 4. CẬP NHẬT THÔNG TIN NHÂN VIÊN

### Request

- **Method:** `PUT`
- **URL:** `http://localhost:8080/api/staff/:id`
- **Headers:**
  ```
  Content-Type: application/json
  Cookie: TOKEN_NNPTUD_C3=<your_admin_token>
  ```

### Body (JSON)

```json
{
  "fullName": "Nguyễn Văn A (Updated)",
  "email": "nguyenvana@petspa.com",
  "phoneNumber": "0901234568",
  "address": "456 Đường XYZ, Quận 2, TP.HCM",
  "dateOfBirth": "1995-05-15",
  "hireDate": "2024-01-10",
  "department": "Quản lý",
  "position": "Trưởng phòng",
  "specialization": "Quản lý vận hành",
  "profilePictureUrl": "/uploads/avatar-new.jpg"
}
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Cập nhật thông tin nhân viên thành công",
  "data": {
    "id": "65f1234567890abcdef12345",
    "staffCode": "STF2401",
    "fullName": "Nguyễn Văn A (Updated)",
    "email": "nguyenvana@petspa.com",
    "phoneNumber": "0901234568",
    "address": "456 Đường XYZ, Quận 2, TP.HCM",
    "dateOfBirth": "1995-05-15T00:00:00.000Z",
    "hireDate": "2024-01-10T00:00:00.000Z",
    "department": "Quản lý",
    "position": "Trưởng phòng",
    "specialization": "Quản lý vận hành",
    "profilePictureUrl": "/uploads/avatar-new.jpg",
    "isActive": true,
    "username": "nguyenvana",
    "createdAt": "2024-01-10T10:00:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

### Response Error (400)

```json
{
  "success": false,
  "message": "Số điện thoại đã tồn tại"
}
```

### Test Cases

1. **TC19:** Cập nhật thông tin hợp lệ → Success
2. **TC20:** Cập nhật với số điện thoại đã tồn tại (của nhân viên khác) → Error
3. **TC21:** Cập nhật với ID không tồn tại → Error 404
4. **TC22:** Cập nhật email (không nên cho phép) → Có thể success nhưng cần cẩn thận
5. **TC23:** Cập nhật chỉ một số trường → Success

---

## 5. BẬT/TẮT TRẠNG THÁI HOẠT ĐỘNG

### Request

- **Method:** `PATCH`
- **URL:** `http://localhost:8080/api/staff/toggle-active?id=<staff_id>`
- **Headers:**
  ```
  Cookie: TOKEN_NNPTUD_C3=<your_admin_token>
  ```

### Example URL

```
http://localhost:8080/api/staff/toggle-active?id=65f1234567890abcdef12345
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Cập nhật trạng thái nhân viên thành công"
}
```

### Response Error (400)

```json
{
  "success": false,
  "message": "ID nhân viên là bắt buộc"
}
```

### Test Cases

1. **TC24:** Toggle từ active → inactive → Success
2. **TC25:** Toggle từ inactive → active → Success
3. **TC26:** Toggle với ID không tồn tại → Error 404
4. **TC27:** Toggle không có query parameter id → Error 400

---

## 6. XÓA NHÂN VIÊN (SOFT DELETE)

### Request

- **Method:** `DELETE`
- **URL:** `http://localhost:8080/api/staff/:id`
- **Headers:**
  ```
  Cookie: TOKEN_NNPTUD_C3=<your_admin_token>
  ```

### Example URL

```
http://localhost:8080/api/staff/65f1234567890abcdef12345
```

### Response Success (200)

```json
{
  "success": true,
  "message": "Xóa nhân viên thành công"
}
```

### Response Error (400)

```json
{
  "success": false,
  "message": "Không tìm thấy nhân viên"
}
```

### Test Cases

1. **TC28:** Xóa nhân viên với ID hợp lệ → Success
2. **TC29:** Xóa nhân viên đã bị xóa trước đó → Error 404
3. **TC30:** Xóa nhân viên với ID không tồn tại → Error 404
4. **TC31:** Sau khi xóa, nhân viên không xuất hiện trong danh sách → Success

---

## 7. ĐẾM SỐ LƯỢNG NHÂN VIÊN ĐANG HOẠT ĐỘNG

### Request

- **Method:** `GET`
- **URL:** `http://localhost:8080/api/staff/count-active`
- **Headers:**
  ```
  Cookie: TOKEN_NNPTUD_C3=<your_admin_token>
  ```

### Response Success (200)

```json
{
  "success": true,
  "message": "Lấy số lượng nhân viên đang hoạt động thành công",
  "data": 12
}
```

### Test Cases

1. **TC32:** Đếm số nhân viên active → Success, trả về số lượng
2. **TC33:** Tạo nhân viên mới → Số lượng tăng lên 1
3. **TC34:** Toggle inactive một nhân viên → Số lượng giảm đi 1
4. **TC35:** Xóa nhân viên → Số lượng giảm đi 1

---

## FLOW TEST HOÀN CHỈNH

### Scenario 1: Tạo và quản lý nhân viên mới

1. **Bước 1:** Đăng nhập với tài khoản ADMIN
2. **Bước 2:** Tạo nhân viên mới (TC01)
3. **Bước 3:** Kiểm tra email đã nhận được thông tin đăng nhập
4. **Bước 4:** Lấy danh sách nhân viên, verify nhân viên mới xuất hiện (TC08)
5. **Bước 5:** Lấy chi tiết nhân viên vừa tạo (TC16)
6. **Bước 6:** Cập nhật thông tin nhân viên (TC19)
7. **Bước 7:** Verify thông tin đã được cập nhật (TC16)

### Scenario 2: Tìm kiếm và sắp xếp

1. **Bước 1:** Tạo 5 nhân viên với tên khác nhau
2. **Bước 2:** Tìm kiếm theo tên (TC10)
3. **Bước 3:** Tìm kiếm theo email (TC11)
4. **Bước 4:** Sắp xếp theo staffCode (TC13)
5. **Bước 5:** Sắp xếp theo fullName (TC14)

### Scenario 3: Quản lý trạng thái

1. **Bước 1:** Lấy số lượng nhân viên active ban đầu (TC32)
2. **Bước 2:** Toggle inactive một nhân viên (TC24)
3. **Bước 3:** Verify số lượng giảm đi 1 (TC34)
4. **Bước 4:** Toggle active lại (TC25)
5. **Bước 5:** Verify số lượng tăng lên 1 (TC33)

### Scenario 4: Xóa nhân viên

1. **Bước 1:** Lấy danh sách nhân viên ban đầu
2. **Bước 2:** Xóa một nhân viên (TC28)
3. **Bước 3:** Verify nhân viên không còn trong danh sách (TC31)
4. **Bước 4:** Thử lấy chi tiết nhân viên đã xóa → Error 404 (TC29)

---

## LƯU Ý QUAN TRỌNG

### 1. Authentication

- Tất cả API đều yêu cầu đăng nhập với role ADMIN hoặc MODERATOR
- Token có thể được gửi qua Cookie hoặc Authorization header
- Token hết hạn sau 1 ngày

### 2. Validation

- Email phải unique trong cả bảng User và Staff
- Số điện thoại phải unique và đúng định dạng 10 số
- fullName và email là bắt buộc

### 3. Soft Delete

- Khi xóa nhân viên, chỉ set isDeleted = true
- Nhân viên đã xóa không xuất hiện trong danh sách
- Không thể lấy chi tiết nhân viên đã xóa

### 4. Email Service

- Khi tạo nhân viên mới, email welcome sẽ được gửi tự động
- Email chứa username và temporary password
- Cần cấu hình MAIL_USER và MAIL_PASS trong file .env

### 5. Auto-generated Fields

- staffCode: Tự động generate theo format STFyyXXXX
- username: Tự động generate từ email (phần trước @)
- temporaryPassword: Random 10 ký tự
- hireDate: Mặc định là ngày hiện tại nếu không cung cấp

---

## POSTMAN COLLECTION

Bạn có thể import collection sau vào Postman:

```json
{
  "info": {
    "name": "Staff Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Create Staff",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fullName\": \"Nguyễn Văn A\",\n  \"email\": \"nguyenvana@petspa.com\",\n  \"phoneNumber\": \"0901234567\",\n  \"address\": \"123 Đường ABC, Quận 1, TP.HCM\",\n  \"dateOfBirth\": \"1995-05-15\",\n  \"hireDate\": \"2024-01-10\",\n  \"department\": \"Chăm sóc thú cưng\",\n  \"position\": \"Nhân viên chăm sóc\",\n  \"specialization\": \"Chăm sóc chó mèo\",\n  \"profilePictureUrl\": \"/uploads/avatar.jpg\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/staff",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "staff"]
        }
      }
    },
    {
      "name": "Get All Staff (Paginated)",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/staff/paginated?pageNumber=1&pageSize=10",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "staff", "paginated"],
          "query": [
            {
              "key": "pageNumber",
              "value": "1"
            },
            {
              "key": "pageSize",
              "value": "10"
            }
          ]
        }
      }
    },
    {
      "name": "Get Staff By ID",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/staff/:id",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "staff", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "65f1234567890abcdef12345"
            }
          ]
        }
      }
    },
    {
      "name": "Update Staff",
      "request": {
        "method": "PUT",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fullName\": \"Nguyễn Văn A (Updated)\",\n  \"phoneNumber\": \"0901234568\",\n  \"address\": \"456 Đường XYZ, Quận 2, TP.HCM\",\n  \"department\": \"Quản lý\",\n  \"position\": \"Trưởng phòng\"\n}"
        },
        "url": {
          "raw": "http://localhost:8080/api/staff/:id",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "staff", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "65f1234567890abcdef12345"
            }
          ]
        }
      }
    },
    {
      "name": "Toggle Active Status",
      "request": {
        "method": "PATCH",
        "url": {
          "raw": "http://localhost:8080/api/staff/toggle-active?id=65f1234567890abcdef12345",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "staff", "toggle-active"],
          "query": [
            {
              "key": "id",
              "value": "65f1234567890abcdef12345"
            }
          ]
        }
      }
    },
    {
      "name": "Delete Staff",
      "request": {
        "method": "DELETE",
        "url": {
          "raw": "http://localhost:8080/api/staff/:id",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "staff", ":id"],
          "variable": [
            {
              "key": "id",
              "value": "65f1234567890abcdef12345"
            }
          ]
        }
      }
    },
    {
      "name": "Count Active Staff",
      "request": {
        "method": "GET",
        "url": {
          "raw": "http://localhost:8080/api/staff/count-active",
          "protocol": "http",
          "host": ["localhost"],
          "port": "8080",
          "path": ["api", "staff", "count-active"]
        }
      }
    }
  ]
}
```

---

## KẾT LUẬN

Tài liệu này cung cấp hướng dẫn chi tiết để test tất cả các API của chức năng Quản lý nhân viên. Hãy thực hiện các test case theo thứ tự để đảm bảo tất cả các chức năng hoạt động đúng như mong đợi.

Nếu gặp lỗi, hãy kiểm tra:

1. Server đã khởi động chưa
2. MongoDB đã chạy chưa
3. Token authentication có hợp lệ không
4. Role STAFF đã được tạo trong database chưa
5. Email service đã được cấu hình đúng chưa (.env file)
