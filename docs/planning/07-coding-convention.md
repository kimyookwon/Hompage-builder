# 07-coding-convention.md — 코딩 컨벤션

**작성일**: 2026-03-27
**버전**: v1.0
**프로젝트명**: 홈페이지 빌더 (Homepage Builder)

---

## 1. 개요

이 문서는 홈페이지 빌더 프로젝트의 모든 개발자가 따라야 할 코딩 컨벤션을 정의합니다.

- **백엔드**: PHP (Vanilla)
- **관리자 프론트엔드**: Next.js + React + TypeScript + Tailwind CSS
- **공개 페이지**: PHP 템플릿 렌더링

---

## 2. 일반 규칙

### 2.1 들여쓰기 및 줄 길이

- **들여쓰기**: 2칸 (스페이스)
- **최대 줄 길이**: 100자 (초과 시 줄 바꿈)
- **파일 끝**: 빈 줄 1개로 끝남

### 2.2 주석

**비즈니스 로직 주석만 작성 (코드가 명확하면 생략)**:

```php
// 백엔드 예시
// 사용자가 차단되었는지 확인하여 로그인 차단
if ($user['status'] === 'blocked') {
  throw new UnauthorizedException('차단된 사용자입니다.');
}
```

```typescript
// 프론트엔드 예시
// 로그인 상태가 변경되면 회원 목록을 자동으로 새로고침
useEffect(() => {
  if (isLoggedIn) {
    fetchMembers();
  }
}, [isLoggedIn]);
```

### 2.3 네이밍 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| 변수 | camelCase | `userName`, `isPublished` |
| 상수 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`, `DEFAULT_TIMEOUT` |
| 함수 | camelCase | `getUserById()`, `validateEmail()` |
| 클래스 | PascalCase | `UserController`, `PageService` |
| 파일명 | kebab-case (PHP) / kebab-case (TS) | `user-controller.php`, `use-auth-store.ts` |
| 컴포넌트 | PascalCase | `UserList.tsx`, `PageEditor.tsx` |

---

## 3. 백엔드 (PHP)

### 3.1 파일 구조

```
backend/
├── config/              # 설정 파일
│   └── database.php
├── controllers/         # 컨트롤러
│   ├── auth-controller.php
│   ├── user-controller.php
│   ├── page-controller.php
│   └── board-controller.php
├── services/            # 비즈니스 로직
│   ├── auth-service.php
│   ├── user-service.php
│   └── page-service.php
├── models/              # 데이터 모델
│   ├── user.php
│   ├── page.php
│   └── board.php
├── middleware/          # 미들웨어
│   ├── auth-middleware.php
│   └── cors-middleware.php
├── utils/               # 유틸리티 함수
│   ├── jwt-helper.php
│   └── response-helper.php
├── routes/              # 라우팅
│   └── api-routes.php
├── database/            # DB 마이그레이션
│   └── migrations/
└── public/              # 공개 엔드포인트
    └── index.php        # 라우터 진입점
```

### 3.2 클래스 및 함수 구조

**컨트롤러 예시**:
```php
<?php
// 파일: controllers/user-controller.php

namespace Controllers;

use Services\UserService;
use Utils\ResponseHelper;

class UserController {
  private UserService $userService;

  public function __construct() {
    $this->userService = new UserService();
  }

  // GET /api/users (회원 목록)
  public function listUsers() {
    try {
      $page = $_GET['page'] ?? 1;
      $limit = $_GET['limit'] ?? 50;
      $search = $_GET['search'] ?? '';

      $result = $this->userService->getUsers($page, $limit, $search);
      ResponseHelper::success($result);
    } catch (\Exception $e) {
      ResponseHelper::error($e->getMessage(), 500);
    }
  }

  // PATCH /api/users/{id}/role (역할 변경)
  public function updateUserRole($userId) {
    try {
      // 관리자 권한 확인
      if ($_SESSION['role'] !== 'admin') {
        ResponseHelper::error('권한이 없습니다.', 403);
        return;
      }

      $data = json_decode(file_get_contents('php://input'), true);
      $newRole = $data['role'] ?? null;

      if (!in_array($newRole, ['admin', 'user'])) {
        ResponseHelper::error('유효하지 않은 역할입니다.', 400);
        return;
      }

      $result = $this->userService->updateRole($userId, $newRole);
      ResponseHelper::success($result);
    } catch (\Exception $e) {
      ResponseHelper::error($e->getMessage(), 500);
    }
  }
}
?>
```

**서비스 예시**:
```php
<?php
// 파일: services/user-service.php

namespace Services;

use Models\User;

class UserService {
  private User $userModel;

  public function __construct() {
    $this->userModel = new User();
  }

  public function getUsers($page, $limit, $search) {
    $offset = ($page - 1) * $limit;
    return $this->userModel->findAll($offset, $limit, $search);
  }

  public function updateRole($userId, $newRole) {
    // 사용자 존재 확인
    $user = $this->userModel->findById($userId);
    if (!$user) {
      throw new \Exception('사용자를 찾을 수 없습니다.', 404);
    }

    // 역할 업데이트
    return $this->userModel->update($userId, ['role' => $newRole]);
  }

  public function getUserById($userId) {
    return $this->userModel->findById($userId);
  }
}
?>
```

**모델 예시**:
```php
<?php
// 파일: models/user.php

namespace Models;

use PDO;

class User {
  private PDO $db;

  public function __construct() {
    global $db; // 또는 의존성 주입
    $this->db = $db;
  }

  public function findAll($offset, $limit, $search = '') {
    $query = "SELECT * FROM users WHERE 1=1";
    $params = [];

    if ($search) {
      $query .= " AND (email LIKE ? OR name LIKE ?)";
      $params = ["%$search%", "%$search%"];
    }

    $query .= " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $this->db->prepare($query);
    $stmt->execute($params);

    return [
      'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
      'total' => $this->count($search)
    ];
  }

  public function findById($id) {
    $stmt = $this->db->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
  }

  public function findByEmail($email) {
    $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
  }

  public function create($data) {
    $stmt = $this->db->prepare(
      "INSERT INTO users (email, password_hash, name, role)
       VALUES (?, ?, ?, ?)"
    );
    $stmt->execute([
      $data['email'],
      $data['password_hash'],
      $data['name'],
      $data['role'] ?? 'user'
    ]);

    return $this->findById($this->db->lastInsertId());
  }

  public function update($id, $data) {
    $allowedFields = ['name', 'role', 'status', 'oauth_provider', 'oauth_id'];
    $updates = [];
    $params = [];

    foreach ($data as $key => $value) {
      if (in_array($key, $allowedFields)) {
        $updates[] = "$key = ?";
        $params[] = $value;
      }
    }

    if (empty($updates)) {
      return $this->findById($id);
    }

    $params[] = $id;
    $query = "UPDATE users SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $this->db->prepare($query);
    $stmt->execute($params);

    return $this->findById($id);
  }

  private function count($search = '') {
    $query = "SELECT COUNT(*) as total FROM users WHERE 1=1";
    $params = [];

    if ($search) {
      $query .= " AND (email LIKE ? OR name LIKE ?)";
      $params = ["%$search%", "%$search%"];
    }

    $stmt = $this->db->prepare($query);
    $stmt->execute($params);
    return $stmt->fetch(PDO::FETCH_ASSOC)['total'];
  }
}
?>
```

### 3.3 API 응답 형식

**성공 응답**:
```php
ResponseHelper::success($data, 'message', 200);
// 결과: { "success": true, "data": {...}, "message": "..." }
```

**에러 응답**:
```php
ResponseHelper::error('에러 메시지', 400, 'ERROR_CODE');
// 결과: { "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

### 3.4 에러 처리

**try-catch 필수**:
```php
try {
  $user = $this->userService->getUserById($userId);
  ResponseHelper::success($user);
} catch (NotFoundException $e) {
  ResponseHelper::error($e->getMessage(), 404);
} catch (\Exception $e) {
  ResponseHelper::error('서버 오류가 발생했습니다.', 500);
}
```

### 3.5 데이터베이스

**PreparedStatement 필수 (SQL Injection 방지)**:
```php
// 올바른 예
$stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);

// 잘못된 예
$query = "SELECT * FROM users WHERE email = '$email'"; // SQL Injection 위험
```

**트랜잭션**:
```php
try {
  $this->db->beginTransaction();
  // 여러 쿼리 실행
  $this->db->commit();
} catch (\Exception $e) {
  $this->db->rollBack();
  throw $e;
}
```

---

## 4. 프론트엔드 (Next.js + React + TypeScript)

### 4.1 파일 구조

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # 홈페이지 (S01)
│   ├── login/
│   │   └── page.tsx              # 로그인 (S02)
│   └── admin/
│       ├── layout.tsx
│       ├── page.tsx              # 대시보드 (S03)
│       ├── pages/
│       │   └── page.tsx          # 페이지 관리 (S04)
│       ├── pages/[id]/
│       │   └── edit.tsx          # 컨테이너 편집기 (S05)
│       ├── settings/
│       │   └── page.tsx          # 시서스 관리 (S06)
│       ├── members/
│       │   └── page.tsx          # 회원 관리 (S07)
│       └── boards/
│           └── page.tsx          # 게시판 관리 (S08)
├── components/                   # 재사용 컴포넌트
│   ├── Header.tsx
│   ├── Navigation.tsx
│   ├── UserList.tsx
│   ├── PageForm.tsx
│   └── ...
├── hooks/                        # 커스텀 훅
│   ├── use-auth.ts
│   ├── use-pages.ts
│   └── use-users.ts
├── lib/                          # 유틸리티 함수
│   ├── api-client.ts             # API 호출 래퍼
│   ├── auth-helper.ts
│   └── validation.ts
├── store/                        # 상태 관리 (Zustand)
│   ├── auth-store.ts
│   ├── page-store.ts
│   └── ui-store.ts
├── types/                        # TypeScript 타입 정의
│   ├── user.ts
│   ├── page.ts
│   ├── board.ts
│   └── api.ts
├── styles/                       # 전역 스타일
│   └── globals.css
└── env.local                     # 환경 변수
```

### 4.2 컴포넌트 구조

**함수형 컴포넌트 (필수)**:
```typescript
// 파일: components/UserList.tsx

import React, { useEffect, useState } from 'react';
import { User } from '@/types/user';
import { apiClient } from '@/lib/api-client';

interface UserListProps {
  onUserSelect?: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({ onUserSelect }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users', {
        params: { page, limit: 50 }
      });
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500">에러: {error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium">이름</th>
            <th className="px-4 py-2 text-left text-sm font-medium">이메일</th>
            <th className="px-4 py-2 text-left text-sm font-medium">역할</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              onClick={() => onUserSelect?.(user)}
              className="border-b hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-4 py-2">{user.name}</td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

### 4.3 커스텀 훅

**API 호출 훅**:
```typescript
// 파일: hooks/use-users.ts

import { useCallback, useEffect, useState } from 'react';
import { User } from '@/types/user';
import { apiClient } from '@/lib/api-client';

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export const useUsers = (options: UseUsersOptions = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users', { params: options });
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [options]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
};
```

### 4.4 상태 관리 (Zustand)

**인증 스토어**:
```typescript
// 파일: store/auth-store.ts

import { create } from 'zustand';
import { User } from '@/types/user';

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  login: (user, token) => {
    set({ user, token, isLoggedIn: true });
    localStorage.setItem('token', token);
  },

  logout: () => {
    set({ user: null, token: null, isLoggedIn: false });
    localStorage.removeItem('token');
  },

  setUser: (user) => {
    set({ user });
  }
}));
```

### 4.5 타입 정의

**모든 데이터 타입 정의 필수**:
```typescript
// 파일: types/user.ts

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  oauth_provider?: 'google' | 'kakao' | 'naver';
  status: 'active' | 'blocked';
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  password_confirm: string;
  name: string;
}

export interface UpdateUserRequest {
  role?: 'admin' | 'user';
  status?: 'active' | 'blocked';
}

// 파일: types/api.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    limit: number;
  };
}
```

### 4.6 Tailwind CSS

**클래스 네이밍**:
```tsx
// 올바른 예
<div className="flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow">
  <h1 className="text-xl font-semibold text-gray-900">제목</h1>
  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
    버튼
  </button>
</div>

// 복잡한 스타일은 extract하기
const containerClasses = "flex items-center justify-between gap-4 p-4 bg-white rounded-lg shadow";
const titleClasses = "text-xl font-semibold text-gray-900";
const buttonClasses = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition";
```

### 4.7 API 호출

**API 클라이언트**:
```typescript
// 파일: lib/api-client.ts

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth-store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // JWT 토큰 자동 추가
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 에러 처리
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
        }
        throw error;
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.get<T>(url, config);
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.post<T>(url, data, config);
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.client.patch<T>(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

---

## 5. 커밋 메시지 규칙

### 5.1 형식

```
[타입] 간단한 설명 (50자 이내)

상세 설명 (필요시)
- 변경 사항 1
- 변경 사항 2

관련 Issue: #123
```

### 5.2 타입

| 타입 | 설명 | 예시 |
|------|------|------|
| feat | 새로운 기능 | `feat: 회원 관리 API 추가` |
| fix | 버그 수정 | `fix: 로그인 오류 해결` |
| refactor | 코드 리팩토링 | `refactor: UserService 구조 개선` |
| test | 테스트 추가 | `test: 회원 API 단위 테스트 추가` |
| docs | 문서화 | `docs: API 명세서 업데이트` |
| style | 스타일 수정 (코드 포맷, 세미콜론 등) | `style: Tailwind 클래스 정렬` |
| chore | 빌드, 의존성 등 | `chore: npm 패키지 업데이트` |

### 5.3 예시

```
feat: 페이지 관리 CRUD API 구현

- 페이지 생성 (POST /pages)
- 페이지 목록 조회 (GET /pages)
- 페이지 발행 토글 (PATCH /pages/{id}/publish)
- 페이지 삭제 (DELETE /pages/{id})

모든 엔드포인트는 관리자 권한 필수
슬러그 중복 검사 및 유효성 검사 포함

관련 Issue: #12
```

---

## 6. 테스트

### 6.1 단위 테스트

**PHP**:
```php
// tests/UserServiceTest.php
use PHPUnit\Framework\TestCase;
use Services\UserService;

class UserServiceTest extends TestCase {
  private UserService $userService;

  protected function setUp(): void {
    $this->userService = new UserService();
  }

  public function testGetUserByIdReturnsUser() {
    $user = $this->userService->getUserById(1);
    $this->assertIsArray($user);
    $this->assertEquals(1, $user['id']);
  }

  public function testUpdateRoleThrowsExceptionIfUserNotFound() {
    $this->expectException(\Exception::class);
    $this->userService->updateRole(9999, 'admin');
  }
}
```

**TypeScript (Jest)**:
```typescript
// __tests__/hooks/use-users.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from '@/hooks/use-users';

describe('useUsers', () => {
  it('should fetch users', async () => {
    const { result } = renderHook(() => useUsers());

    await waitFor(() => {
      expect(result.current.users.length).toBeGreaterThan(0);
    });
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => useUsers());
    expect(result.current.loading).toBeDefined();
  });
});
```

### 6.2 테스트 커버리지

- **목표**: 70% 이상
- **필수**: 비즈니스 로직 (services, models)
- **선택**: UI 컴포넌트

---

## 7. 환경 변수

### 7.1 백엔드 (.env)

```env
# 데이터베이스
DB_HOST=localhost
DB_PORT=3306
DB_NAME=homepage_builder
DB_USER=root
DB_PASSWORD=

# 서버
APP_ENV=development
APP_DEBUG=true
APP_PORT=8000

# 인증
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=86400

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
```

### 7.2 프론트엔드 (.env.local)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=Homepage Builder
```

---

## 8. 린팅 및 포맷팅

### 8.1 PHP

**설정**: `.phpcs.xml.dist`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<ruleset name="PHP_CodeSniffer">
  <rule ref="PSR12"/>
  <config name="installed_paths" value="vendor/slevomat/coding-standard"/>
</ruleset>
```

**실행**:
```bash
./vendor/bin/phpcs --standard=PSR12 backend/
./vendor/bin/phpcbf --standard=PSR12 backend/  # 자동 수정
```

### 8.2 TypeScript/JavaScript

**설정**: `.eslintrc.json`
```json
{
  "extends": "next/core-web-vitals",
  "rules": {
    "@next/next/no-img-element": "warn",
    "react/display-name": "warn"
  }
}
```

**실행**:
```bash
npm run lint                 # 검사
npm run lint -- --fix       # 자동 수정
```

**Prettier**:
```bash
npm run format              # 포맷팅
```

---

## 9. 성능 최적화

### 9.1 백엔드

- 쿼리 최적화 (인덱스, JOIN)
- 캐싱 (site_settings 등)
- 페이지네이션 (대량 데이터)

### 9.2 프론트엔드

- 컴포넌트 메모이제이션 (`React.memo`)
- 이미지 최적화 (`next/image`)
- 코드 스플리팅 (동적 import)
- 번들 크기 모니터링

---

## 10. 보안

### 10.1 백엔드

- **SQL Injection**: PreparedStatement 필수
- **CORS**: 화이트리스트 설정
- **HTTPS**: 프로덕션 필수
- **비밀번호**: bcrypt 해시 (최소 10 round)

### 10.2 프론트엔드

- **XSS**: 자동 이스케이프 (React)
- **CSRF**: 토큰 기반 (Phase 2)
- **민감 정보**: localStorage 사용 주의 (또는 httpOnly 쿠키)

---

## 11. CI/CD

### 11.1 자동화 검사

```bash
# 린팅
npm run lint
./vendor/bin/phpcs

# 테스트
npm run test
./vendor/bin/phpunit

# 빌드
npm run build
```

---

## 12. 배포 체크리스트

- [ ] 모든 테스트 통과
- [ ] 린팅 오류 없음
- [ ] 환경 변수 설정 (.env, .env.local)
- [ ] 데이터베이스 마이그레이션 완료
- [ ] HTTPS 설정 완료
- [ ] 백업 생성
- [ ] 성능 테스트 통과
- [ ] 보안 검토 완료

---

## 13. 참고 자료

- [Feature Specification](./03-feature-spec.md)
- [API Specification](./05-api-spec.md)
- [Screen Mapping](./06-screens.md)
- [PHP PSR-12](https://www.php-fig.org/psr/psr-12/)
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/)
