# Frontend Migration Quick Reference

## 🚨 Breaking Changes Summary

**All path parameters now use SLUGS (strings) instead of IDs (integers)**

## Quick Pattern

```javascript
// ❌ OLD - Using ID
GET /api/v1/users/123

// ✅ NEW - Using Slug
GET /api/v1/users/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

## All Changed Endpoints by Module

### Users (`/api/v1/users`)
- `GET /users/{user_slug}` (was `/{user_id}`)
- `PUT /users/{user_slug}` (was `/{user_id}`)
- `DELETE /users/{user_slug}` (was `/{user_id}`)
- `POST /users/{user_slug}/assign-role/{role_slug}` (was `/{user_id}/assign-role/{role_id}`)
- `DELETE /users/{user_slug}/remove-role/{role_slug}` (was `/{user_id}/remove-role/{role_id}`)
- `POST /users/{user_slug}/assign-permission/{permission_slug}` (was `/{user_id}/assign-permission/{permission_id}`)
- `DELETE /users/{user_slug}/remove-permission/{permission_slug}` (was `/{user_id}/remove-permission/{permission_id}`)
- `GET /users/{user_slug}/roles` (was `/{user_id}/roles`)
- `GET /users/{user_slug}/permissions` (was `/{user_id}/permissions`)

### Documents (`/api/v1/documents`)
- `GET /documents/{document_slug}` (was `/{document_id}`)
- `PUT /documents/{document_slug}` (was `/{document_id}`)
- `DELETE /documents/{document_slug}` (was `/{document_id}`)
- `GET /documents/categories/{category_slug}` (was `/categories/{category_id}`)
- `PUT /documents/categories/{category_slug}` (was `/categories/{category_id}`)
- `DELETE /documents/categories/{category_slug}` (was `/categories/{category_id}`)
- `GET /documents/categories/{category_slug}/permissions` (was `/categories/{category_id}/permissions`)
- `PUT /documents/categories/{category_slug}/permissions` (was `/categories/{category_id}/permissions`)

### Projects (`/api/v1/projects`)
- `GET /projects/{project_slug}` (was `/{project_id}`)
- `PUT /projects/{project_slug}` (was `/{project_id}`)
- `DELETE /projects/{project_slug}` (was `/{project_id}`)
- `GET /projects/{project_slug}/members` (was `/{project_id}/members`)
- `POST /projects/{project_slug}/members` (was `/{project_id}/members`)
- `PUT /projects/{project_slug}/members/{user_slug}` (was `/{project_id}/members/{user_id}`)
- `DELETE /projects/{project_slug}/members/{user_slug}` (was `/{project_id}/members/{user_id}`)
- `GET /projects/{project_slug}/tasks` (was `/{project_id}/tasks`)
- `POST /projects/{project_slug}/tasks/{task_slug}` (was `/{project_id}/tasks/{task_id}`)
- `DELETE /projects/{project_slug}/tasks/{task_slug}` (was `/{project_id}/tasks/{task_id}`)

### Locations (`/api/v1/locations`)
- `GET /locations/{location_slug}` (was `/{location_id}`)
- `PUT /locations/{location_slug}` (was `/{location_id}`)
- `DELETE /locations/{location_slug}` (was `/{location_id}`)
- `GET /locations/{location_slug}/hierarchy` (was `/{location_id}/hierarchy`)
- `POST /locations/{location_slug}/move` (was `/{location_id}/move`)
- `GET /locations/{location_slug}/children` (was `/{location_id}/children`)
- `GET /locations/{location_slug}/descendants` (was `/{location_id}/descendants`)

### Assets (`/api/v1/assets`)
- `GET /assets/{asset_slug}` (was `/{asset_id}`)
- `PUT /assets/{asset_slug}` (was `/{asset_id}`)
- `DELETE /assets/{asset_slug}` (was `/{asset_id}`)

### Tasks (`/api/v1/tasks`)
- `GET /tasks/user/{user_slug}` (was `/user/{user_id}`)
- `GET /tasks/asset/{asset_slug}` (was `/asset/{asset_id}`)

### Roles (`/api/v1/roles`)
- `GET /roles/{role_slug}` (was `/{role_id}`)
- `PUT /roles/{role_slug}` (was `/{role_id}`)
- `DELETE /roles/{role_slug}` (was `/{role_id}`)
- `POST /roles/assign/{user_slug}/{role_slug}` (was `/assign/{user_id}/{role_id}`)
- `DELETE /roles/assign/{user_slug}/{role_slug}` (was `/assign/{user_id}/{role_id}`)
- `GET /roles/users/{user_slug}/roles` (was `/users/{user_id}/roles`)
- `GET /roles/roles/{role_slug}/users` (was `/roles/{role_id}/users`)

### Permissions (`/api/v1/permissions`)
- `GET /permissions/{permission_slug}` (was `/{permission_id}`)
- `PUT /permissions/{permission_slug}` (was `/{permission_id}`)
- `DELETE /permissions/{permission_slug}` (was `/{permission_id}`)
- `GET /permissions/{permission_slug}/roles` (was `/{permission_id}/roles`)
- `GET /permissions/check/{user_slug}` (was `/check/{user_id}`)

### Departments (`/api/v1/departments`)
- `GET /departments/{department_slug}` (was `/{department_id}`)
- `PUT /departments/{department_slug}` (was `/{department_id}`)
- `DELETE /departments/{department_slug}` (was `/{department_id}`)
- `GET /departments/{department_slug}/users` (was `/{department_id}/users`)
- `DELETE /departments/assignments/{user_slug}/{department_slug}` (was `/assignments/{user_id}/{department_id}`)
- `GET /departments/users/{user_slug}/departments` (was `/users/{user_id}/departments`)
- `PUT /departments/assignments/{assignment_slug}` (was `/assignments/{assignment_id}`)

### Messages (`/api/v1/messages`)
- `GET /messages/{message_slug}` (was `/{message_id}`)
- `PATCH /messages/{message_slug}` (was `/{message_id}`)
- `POST /messages/{message_slug}/read` (was `/{message_id}/read`)
- `POST /messages/{message_slug}/acknowledge` (was `/{message_id}/acknowledge`)

### Conversations (`/api/v1/conversations`)
- `GET /conversations/{conversation_slug}` (was `/{conversation_id}`)
- `GET /conversations/{conversation_slug}/messages` (was `/{conversation_id}/messages`)
- `GET /conversations/{conversation_slug}/thread` (was `/{conversation_id}/thread`)
- `POST /conversations/{conversation_slug}/participants` (was `/{conversation_id}/participants`)
- `DELETE /conversations/{conversation_slug}/participants/{user_slug}` (was `/{conversation_id}/participants/{user_id}`)
- `POST /conversations/{conversation_slug}/deactivate` (was `/{conversation_id}/deactivate`)

### Profile (`/api/v1/profile`)
- `GET /profile/{user_slug}` (was `/{user_id}`)
- `GET /profile/{user_slug}/stats` (was `/{user_id}/stats`)
- `POST /profile/{user_slug}/reactivate` (was `/{user_id}/reactivate`)

### Audit Logs (`/api/v1/audit-logs`)
- `GET /audit-logs/user/{user_slug}` (was `/user/{user_id}`)
- `GET /audit-logs/{audit_log_slug}` (was `/{audit_log_id}`)

### Clock (`/api/v1/clock`)
- `GET /clock/records/{clock_record_slug}` (was `/records/{clock_record_id}`)
- `PUT /clock/records/{clock_record_slug}` (was `/records/{clock_record_id}`)
- `GET /clock/shift-roles/{job_role_slug}` (was `/shift-roles/{job_role_id}`)

### Invitations (`/api/v1/invitations`)
- `GET /invitations/{invitation_slug}` (was `/{invitation_id}`)
- `DELETE /invitations/{invitation_slug}` (was `/{invitation_id}`)
- `POST /invitations/{invitation_slug}/resend` (was `/{invitation_id}/resend`)

### Task Types (`/api/v1/task-types`)
- `GET /task-types/{task_type_slug}` (was `/{task_type_id}`)
- `PUT /task-types/{task_type_slug}` (was `/{task_type_id}`)
- `DELETE /task-types/{task_type_slug}` (was `/{task_type_id}`)

### Form Types (`/api/v1/form-types`)
- `GET /form-types/{form_type_slug}` (was `/{form_type_id}`)
- `PUT /form-types/{form_type_slug}` (was `/{form_type_id}`)
- `DELETE /form-types/{form_type_slug}` (was `/{form_type_id}`)

### Settings (`/api/v1/settings`)
- All organization settings, custom fields, custom field sections, custom field links, custom forms, form submissions, entity comments, and group entries endpoints now use slugs

### Data Architecture (`/api/v1/data`)
- All field, collection, record, and entity endpoints now use slugs
- Entity types: `user`, `asset`, `location`, `project`, `document`, `form`, `task`

### Files (`/api/v1/files`)
- All file and attachment endpoints now use slugs
- Entity types: `user`, `asset`, `location`, `project`, `document`, `form`, `task`

## Response Changes

**All responses now include `slug` field:**
```typescript
interface UserResponse {
  id: number;      // Still present (internal use)
  slug: string;    // NEW - Use this for API calls
  // ... other fields
}
```

## What Has NOT Changed

✅ **Query Parameters** - Still use IDs (e.g., `?category_id=123`)  
✅ **Request Bodies** - Still use IDs (e.g., `{"user_id": 123}`)  
✅ **List Endpoints** - No change (e.g., `GET /api/v1/users`)

## Action Items

1. ✅ Update TypeScript interfaces to include `slug: string`
2. ✅ Replace all path parameter IDs with slugs
3. ✅ Update routing/navigation to use slugs
4. ✅ Store slugs in state management
5. ✅ Test all CRUD operations

## Total Impact

- **153+ endpoints changed**
- **Breaking change** - Must migrate before deployment
- **All tests passing** - Backend is ready

