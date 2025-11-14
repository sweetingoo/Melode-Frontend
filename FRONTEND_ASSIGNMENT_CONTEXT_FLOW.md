# Frontend Assignment Context Management Flow

## Overview

This document explains how the frontend should interact with the backend to manage user assignment context. The system uses **assignment_id** (UserDepartmentRole.id) instead of role_id to handle cases where the same role exists in multiple departments.

## Key Concepts

- **Assignment ID**: `UserDepartmentRole.id` - uniquely identifies a specific user-department-role combination
- **X-Assignment-ID Header**: Used to maintain assignment context across API requests
- **Permissions**: Based on the active assignment (role permissions + direct permissions)

---

## Complete Flow

### Step 1: User Login

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "mfa_token": "123456"  // Optional, required if MFA enabled
}
```

**Response Scenarios**:

#### Scenario A: Single Assignment (Auto-selected)
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "available_assignments": [
    {
      "assignment_id": 10,
      "role_id": 3,
      "role_name": "Manager",
      "role_display_name": "Department Manager",
      "department_id": 5,
      "department_name": "Human Resources"
    }
  ],
  "selected_assignment_id": 10
}
```

**Frontend Action**: 
- Store `access_token` and `refresh_token`
- Store `selected_assignment_id: 10` in application state
- **Automatically proceed** to dashboard (no selection screen needed)

---

#### Scenario B: Multiple Assignments (Requires Selection)
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "available_assignments": [
    {
      "assignment_id": 10,
      "role_id": 3,
      "role_name": "Manager",
      "role_display_name": "Department Manager",
      "department_id": 5,
      "department_name": "Human Resources"
    },
    {
      "assignment_id": 11,
      "role_id": 3,  // Same role!
      "role_name": "Manager",
      "role_display_name": "Department Manager",
      "department_id": 6,
      "department_name": "Information Technology"
    },
    {
      "assignment_id": 12,
      "role_id": 4,
      "role_name": "Staff",
      "role_display_name": "Staff Member",
      "department_id": 7,
      "department_name": "Operations"
    }
  ]
}
```

**Frontend Action**:
- Store `access_token` and `refresh_token`
- **Show Assignment Selection Screen** (see Step 2)

---

#### Scenario C: No Assignments
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

**Frontend Action**:
- Store tokens
- User has no department-role assignments
- Show appropriate message or redirect

---

### Step 2: Assignment Selection Screen

**When to Show**: When `available_assignments.length > 1` and no `selected_assignment_id` in login response

**UI Display**:
```
Select Your Role Context

┌─────────────────────────────────────────┐
│ Human Resources                         │
│ Manager                                 │
│ [Select]                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Information Technology                  │
│ Manager                                 │
│ [Select]                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Operations                              │
│ Staff Member                            │
│ [Select]                                │
└─────────────────────────────────────────┘
```

**Frontend Logic**:
```javascript
// When user clicks "Select" on an assignment
const selectedAssignment = {
  assignment_id: 10,
  department_name: "Human Resources",
  role_name: "Manager"
};

// Store in application state
localStorage.setItem('assignment_id', selectedAssignment.assignment_id);
// Or use your state management (Redux, Context, etc.)
setActiveAssignmentId(selectedAssignment.assignment_id);
```

**Next Step**: Proceed to dashboard with assignment context

---

### Step 3: Making API Requests with Assignment Context

**Important**: Include `X-Assignment-ID` header in ALL authenticated requests

**Example Request**:
```javascript
// Using fetch
fetch('/api/v1/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Assignment-ID': activeAssignmentId,  // ← REQUIRED
    'Content-Type': 'application/json'
  }
});

// Using axios
axios.get('/api/v1/users', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Assignment-ID': activeAssignmentId  // ← REQUIRED
  }
});
```

**What Happens**:
1. Backend reads `X-Assignment-ID` header
2. Validates assignment belongs to user
3. Returns permissions based on that specific assignment
4. Department context is derived from assignment

---

### Step 4: Getting User Permissions

**Endpoint**: `GET /api/v1/auth/me` or `GET /api/v1/profile/me`

**Request Headers**:
```
Authorization: Bearer <access_token>
X-Assignment-ID: 10
```

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "permissions": [
    "user:read",
    "user:create",
    "department:read",
    "role:read"
  ],
  "direct_permissions": [],
  "active_assignment_id": 10,
  "mfa_enabled": false,
  "display_name": "John Doe"
}
```

**Frontend Usage**:
```javascript
// Check if user has permission
const hasPermission = (permission) => {
  return user.permissions.includes(permission) || 
         user.permissions.includes('*'); // Superuser
};

// Protect routes/pages
if (!hasPermission('user:create')) {
  // Hide "Create User" button or redirect
}
```

---

### Step 5: Getting Available Assignments

**Endpoint**: `GET /api/v1/profile/me/departments`

**Request Headers**:
```
Authorization: Bearer <access_token>
X-Assignment-ID: 10  // Optional - shows current assignment
```

**Response**:
```json
{
  "departments": [
    {
      "department": {
        "id": 5,
        "name": "Human Resources",
        "code": "HR"
      },
      "role": {
        "id": 3,
        "name": "Manager",
        "display_name": "Department Manager"
      },
      "assignment_id": 10,
      "is_active": true,
      "start_date": "2024-01-01T00:00:00",
      "end_date": null
    },
    {
      "department": {
        "id": 6,
        "name": "Information Technology",
        "code": "IT"
      },
      "role": {
        "id": 3,
        "name": "Manager",
        "display_name": "Department Manager"
      },
      "assignment_id": 11,
      "is_active": true,
      "start_date": "2024-01-15T00:00:00",
      "end_date": null
    }
  ],
  "current_assignment_id": 10
}
```

**Frontend Usage**:
- Display available assignments in a dropdown/switcher
- Show current assignment
- Allow user to switch assignments (if enabled)

---

### Step 6: Switching Assignment Context

**Endpoint**: `POST /api/v1/profile/me/roles/switch`

**Note**: This feature may be disabled by admin. Check if enabled before showing switch UI.

**Request**:
```json
{
  "assignment_id": 11
}
```

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Response**:
```json
{
  "message": "Role switched successfully",
  "assignment_id": 11,
  "department": {
    "id": 6,
    "name": "Information Technology",
    "code": "IT"
  },
  "role": {
    "id": 3,
    "name": "Manager",
    "display_name": "Department Manager"
  },
  "note": "Use X-Assignment-ID header in subsequent requests to maintain this context"
}
```

**Frontend Action**:
```javascript
// Update stored assignment_id
localStorage.setItem('assignment_id', 11);
setActiveAssignmentId(11);

// Refresh user permissions
const response = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Assignment-ID': 11  // New assignment
  }
});

// Update UI based on new permissions
updateUserPermissions(response.permissions);
```

**Error Response** (if switching disabled):
```json
{
  "detail": "Role switching is disabled. Please logout and login again to switch roles."
}
```

**Frontend Action**: 
- Hide switch UI or show message
- User must logout and login again to switch

---

## Frontend Implementation Guide

### 1. State Management

```javascript
// Example using React Context or Redux
const AuthContext = {
  accessToken: string | null,
  refreshToken: string | null,
  activeAssignmentId: number | null,
  user: User | null,
  permissions: string[]
};

// Store assignment_id
localStorage.setItem('assignment_id', assignmentId);
// Or use secure storage
```

### 2. HTTP Client Configuration

```javascript
// Axios interceptor example
axios.interceptors.request.use((config) => {
  const token = getAccessToken();
  const assignmentId = getActiveAssignmentId();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (assignmentId) {
    config.headers['X-Assignment-ID'] = assignmentId;
  }
  
  return config;
});
```

### 3. Permission-Based Route Protection

```javascript
// React Router example
const ProtectedRoute = ({ permission, children }) => {
  const { permissions } = useAuth();
  
  if (!hasPermission(permissions, permission)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

// Usage
<ProtectedRoute permission="user:create">
  <CreateUserPage />
</ProtectedRoute>
```

### 4. Assignment Switcher Component

```javascript
const AssignmentSwitcher = () => {
  const { assignments, activeAssignmentId, switchAssignment } = useAuth();
  const [switchingEnabled, setSwitchingEnabled] = useState(true);
  
  const handleSwitch = async (assignmentId) => {
    try {
      await switchAssignment(assignmentId);
      // Update UI
      showSuccess('Assignment switched successfully');
    } catch (error) {
      if (error.response?.status === 403) {
        showError('Role switching is disabled. Please logout and login again.');
        setSwitchingEnabled(false);
      }
    }
  };
  
  if (!switchingEnabled) {
    return null; // Hide switcher
  }
  
  return (
    <Select value={activeAssignmentId} onChange={handleSwitch}>
      {assignments.map(assignment => (
        <Option key={assignment.assignment_id} value={assignment.assignment_id}>
          {assignment.department_name} - {assignment.role_display_name}
        </Option>
      ))}
    </Select>
  );
};
```

---

## Complete Flow Diagram

```
┌─────────────────┐
│   User Login    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Check available_assignments │
└────────┬────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌──────┐  ┌──────────────┐
│  1   │  │   Multiple   │
└──┬───┘  └──────┬───────┘
   │             │
   │             ▼
   │      ┌──────────────────┐
   │      │ Show Selection    │
   │      │ Screen            │
   │      └──────┬───────────┘
   │             │
   │             ▼
   │      ┌──────────────────┐
   │      │ User Selects     │
   │      │ Assignment       │
   │      └──────┬───────────┘
   │             │
   └─────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Store assignment_id         │
│ Store tokens                 │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Include X-Assignment-ID     │
│ in all API requests         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Backend returns permissions │
│ based on assignment         │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Frontend uses permissions   │
│ to control UI/access        │
└─────────────────────────────┘
```

---

## API Endpoints Summary

| Endpoint | Method | Headers Required | Purpose |
|----------|--------|------------------|---------|
| `/api/v1/auth/login` | POST | None | Login and get available assignments |
| `/api/v1/auth/me` | GET | `Authorization`, `X-Assignment-ID` (optional) | Get user info and permissions |
| `/api/v1/profile/me` | GET | `Authorization`, `X-Assignment-ID` (optional) | Get user profile and permissions |
| `/api/v1/profile/me/departments` | GET | `Authorization`, `X-Assignment-ID` (optional) | Get all user assignments |
| `/api/v1/profile/me/roles/switch` | POST | `Authorization` | Switch to different assignment |

---

## Important Notes

1. **Always Include Header**: Include `X-Assignment-ID` in all authenticated requests (except login)
2. **Assignment ID is Unique**: Each assignment has a unique ID, even if role is the same
3. **Permissions are Contextual**: Permissions change based on active assignment
4. **Direct Permissions**: Always included regardless of assignment
5. **Role Switching**: May be disabled by admin - check before showing UI
6. **No Assignment**: If no header provided, user gets permissions from ALL assignments

---

## Error Handling

### Missing Assignment Selection
```json
{
  "detail": "Multiple role assignments available. Please select an assignment to continue."
}
```
**Action**: Show assignment selection screen

### Invalid Assignment ID
```json
{
  "detail": "Invalid assignment_id. Available assignments: [10, 11, 12]"
}
```
**Action**: Show error, allow user to select from available assignments

### Role Switching Disabled
```json
{
  "detail": "Role switching is disabled. Please logout and login again to switch roles."
}
```
**Action**: Hide switch UI, show message

### Assignment Not Found
```json
{
  "detail": "You do not have access to this assignment or it is not active"
}
```
**Action**: Clear stored assignment_id, redirect to selection or login

---

## Example Frontend Code

```javascript
// Complete example
class AuthService {
  async login(email, password, mfaToken = null, assignmentId = null) {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, mfa_token: mfaToken, assignment_id: assignmentId })
    });
    
    const data = await response.json();
    
    if (data.available_assignments && data.available_assignments.length > 1 && !data.selected_assignment_id) {
      // Show selection screen
      return { requiresSelection: true, assignments: data.available_assignments, tokens: data };
    }
    
    // Store tokens and assignment
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('assignment_id', data.selected_assignment_id);
    
    return { requiresSelection: false, tokens: data };
  }
  
  async getCurrentUser() {
    const token = localStorage.getItem('access_token');
    const assignmentId = localStorage.getItem('assignment_id');
    
    const response = await fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Assignment-ID': assignmentId
      }
    });
    
    return response.json();
  }
  
  async switchAssignment(assignmentId) {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch('/api/v1/profile/me/roles/switch', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ assignment_id: assignmentId })
    });
    
    if (response.ok) {
      localStorage.setItem('assignment_id', assignmentId);
      // Refresh user permissions
      return await this.getCurrentUser();
    }
    
    throw new Error('Failed to switch assignment');
  }
}
```

---

## Testing Checklist

- [ ] Login with single assignment (auto-select)
- [ ] Login with multiple assignments (show selection)
- [ ] Login with no assignments
- [ ] Select assignment from selection screen
- [ ] Make API request with X-Assignment-ID header
- [ ] Verify permissions are correct for selected assignment
- [ ] Switch assignment (if enabled)
- [ ] Verify permissions update after switch
- [ ] Handle role switching disabled error
- [ ] Handle invalid assignment_id error
- [ ] Persist assignment_id across page refreshes

---

This flow ensures proper assignment context management and handles all edge cases including same role in multiple departments.

