# Frontend Migration Guide: ID to Slug Migration

## Overview
All API endpoints that previously used integer IDs in path parameters have been migrated to use **slugs** (UUID-based identifiers). This improves security by hiding database primary keys.

## Migration Pattern
**Before:** `GET /api/v1/users/{user_id}` where `user_id` is an integer (e.g., `123`)  
**After:** `GET /api/v1/users/{user_slug}` where `user_slug` is a UUID string (e.g., `"a1b2c3d4e5f6..."`)

## Important Notes
1. **Slugs are strings** - Always pass them as strings, not integers
2. **Slugs are in responses** - All response objects now include a `slug` field
3. **Query parameters unchanged** - Filter query parameters (like `category_id`) remain as integers
4. **Request bodies unchanged** - IDs in request bodies (like `user_ids: [1, 2, 3]`) remain as integers

---

## API Endpoints Migration List

### 1. Users API (`/api/v1/users`)

#### Changed Endpoints:
- ✅ `GET /api/v1/users/{user_slug}` - Get user by slug (was `/{user_id}`)
- ✅ `PUT /api/v1/users/{user_slug}` - Update user by slug (was `/{user_id}`)
- ✅ `DELETE /api/v1/users/{user_slug}` - Delete user by slug (was `/{user_id}`)
- ✅ `POST /api/v1/users/{user_slug}/assign-role/{role_slug}` - Assign role (was `/{user_id}/assign-role/{role_id}`)
- ✅ `DELETE /api/v1/users/{user_slug}/remove-role/{role_slug}` - Remove role (was `/{user_id}/remove-role/{role_id}`)
- ✅ `POST /api/v1/users/{user_slug}/assign-permission/{permission_slug}` - Assign permission (was `/{user_id}/assign-permission/{permission_id}`)
- ✅ `DELETE /api/v1/users/{user_slug}/remove-permission/{permission_slug}` - Remove permission (was `/{user_id}/remove-permission/{permission_id}`)
- ✅ `GET /api/v1/users/{user_slug}/roles` - Get user roles (was `/{user_id}/roles`)
- ✅ `GET /api/v1/users/{user_slug}/permissions` - Get user permissions (was `/{user_id}/permissions`)

**Action Required:**
- Replace all `user_id` path parameters with `user.slug` from API responses
- Update role and permission assignment endpoints to use slugs

**Example:**
```javascript
// Before
GET /api/v1/users/123

// After
GET /api/v1/users/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

### 2. Documents API (`/api/v1/documents`)

#### Changed Endpoints:
- ✅ `GET /api/v1/documents/{document_slug}` - Get document (was `/{document_id}`)
- ✅ `PUT /api/v1/documents/{document_slug}` - Update document (was `/{document_id}`)
- ✅ `DELETE /api/v1/documents/{document_slug}` - Delete document (was `/{document_id}`)
- ✅ `GET /api/v1/documents/categories/{category_slug}` - Get category (was `/categories/{category_id}`)
- ✅ `PUT /api/v1/documents/categories/{category_slug}` - Update category (was `/categories/{category_id}`)
- ✅ `DELETE /api/v1/documents/categories/{category_slug}` - Delete category (was `/categories/{category_id}`)
- ✅ `GET /api/v1/documents/categories/{category_slug}/permissions` - Get category permissions (was `/categories/{category_id}/permissions`)
- ✅ `PUT /api/v1/documents/categories/{category_slug}/permissions` - Update category permissions (was `/categories/{category_id}/permissions`)

**Action Required:**
- Use `document.slug` instead of `document.id` in all document operations
- Use `category.slug` instead of `category.id` for category operations

**Example:**
```javascript
// Before
GET /api/v1/documents/456

// After
GET /api/v1/documents/b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7
```

---

### 3. Projects API (`/api/v1/projects`)

#### Changed Endpoints:
- ✅ `GET /api/v1/projects/{project_slug}` - Get project (was `/{project_id}`)
- ✅ `PUT /api/v1/projects/{project_slug}` - Update project (was `/{project_id}`)
- ✅ `DELETE /api/v1/projects/{project_slug}` - Delete project (was `/{project_id}`)
- ✅ `GET /api/v1/projects/{project_slug}/members` - Get project members (was `/{project_id}/members`)
- ✅ `POST /api/v1/projects/{project_slug}/members` - Add project member (was `/{project_id}/members`)
- ✅ `PUT /api/v1/projects/{project_slug}/members/{user_slug}` - Update project member (was `/{project_id}/members/{user_id}`)
- ✅ `DELETE /api/v1/projects/{project_slug}/members/{user_slug}` - Remove project member (was `/{project_id}/members/{user_id}`)
- ✅ `GET /api/v1/projects/{project_slug}/tasks` - Get project tasks (was `/{project_id}/tasks`)
- ✅ `POST /api/v1/projects/{project_slug}/tasks/{task_slug}` - Add task to project (was `/{project_id}/tasks/{task_id}`)
- ✅ `DELETE /api/v1/projects/{project_slug}/tasks/{task_slug}` - Remove task from project (was `/{project_id}/tasks/{task_id}`)

**Action Required:**
- Use `project.slug` for all project operations
- Use `user.slug` for member operations
- Use `task.slug` for task operations

---

### 4. Locations API (`/api/v1/locations`)

#### Changed Endpoints:
- ✅ `GET /api/v1/locations/{location_slug}` - Get location (was `/{location_id}`)
- ✅ `PUT /api/v1/locations/{location_slug}` - Update location (was `/{location_id}`)
- ✅ `DELETE /api/v1/locations/{location_slug}` - Delete location (was `/{location_id}`)
- ✅ `GET /api/v1/locations/{location_slug}/hierarchy` - Get location hierarchy (was `/{location_id}/hierarchy`)
- ✅ `POST /api/v1/locations/{location_slug}/move` - Move location (was `/{location_id}/move`)
- ✅ `GET /api/v1/locations/{location_slug}/children` - Get child locations (was `/{location_id}/children`)
- ✅ `GET /api/v1/locations/{location_slug}/descendants` - Get descendant locations (was `/{location_id}/descendants`)

**Action Required:**
- Use `location.slug` for all location operations

---

### 5. Assets API (`/api/v1/assets`)

#### Changed Endpoints:
- ✅ `GET /api/v1/assets/{asset_slug}` - Get asset (was `/{asset_id}`)
- ✅ `PUT /api/v1/assets/{asset_slug}` - Update asset (was `/{asset_id}`)
- ✅ `DELETE /api/v1/assets/{asset_slug}` - Delete asset (was `/{asset_id}`)

**Action Required:**
- Use `asset.slug` for all asset operations

---

### 6. Tasks API (`/api/v1/tasks`)

#### Changed Endpoints:
- ✅ `GET /api/v1/tasks/user/{user_slug}` - Get tasks by user (was `/user/{user_id}`)
- ✅ `GET /api/v1/tasks/asset/{asset_slug}` - Get tasks by asset (was `/asset/{asset_id}`)

**Action Required:**
- Use `user.slug` and `asset.slug` for filtering tasks

---

### 7. Roles API (`/api/v1/roles`)

#### Changed Endpoints:
- ✅ `GET /api/v1/roles/{role_slug}` - Get role (was `/{role_id}`)
- ✅ `PUT /api/v1/roles/{role_slug}` - Update role (was `/{role_id}`)
- ✅ `DELETE /api/v1/roles/{role_slug}` - Delete role (was `/{role_id}`)
- ✅ `POST /api/v1/roles/assign/{user_slug}/{role_slug}` - Assign role to user (was `/assign/{user_id}/{role_id}`)
- ✅ `DELETE /api/v1/roles/assign/{user_slug}/{role_slug}` - Remove role from user (was `/assign/{user_id}/{role_id}`)
- ✅ `GET /api/v1/roles/users/{user_slug}/roles` - Get user roles (was `/users/{user_id}/roles`)
- ✅ `GET /api/v1/roles/roles/{role_slug}/users` - Get role users (was `/roles/{role_id}/users`)

**Action Required:**
- Use `role.slug` and `user.slug` for all role operations

---

### 8. Permissions API (`/api/v1/permissions`)

#### Changed Endpoints:
- ✅ `GET /api/v1/permissions/{permission_slug}` - Get permission (was `/{permission_id}`)
- ✅ `PUT /api/v1/permissions/{permission_slug}` - Update permission (was `/{permission_id}`)
- ✅ `DELETE /api/v1/permissions/{permission_slug}` - Delete permission (was `/{permission_id}`)
- ✅ `GET /api/v1/permissions/{permission_slug}/roles` - Get permission roles (was `/{permission_id}/roles`)
- ✅ `GET /api/v1/permissions/check/{user_slug}` - Check user permission (was `/check/{user_id}`)

**Action Required:**
- Use `permission.slug` and `user.slug` for all permission operations

---

### 9. Departments API (`/api/v1/departments`)

#### Changed Endpoints:
- ✅ `GET /api/v1/departments/{department_slug}` - Get department (was `/{department_id}`)
- ✅ `PUT /api/v1/departments/{department_slug}` - Update department (was `/{department_id}`)
- ✅ `DELETE /api/v1/departments/{department_slug}` - Delete department (was `/{department_id}`)
- ✅ `GET /api/v1/departments/{department_slug}/users` - Get department users (was `/{department_id}/users`)
- ✅ `DELETE /api/v1/departments/assignments/{user_slug}/{department_slug}` - Remove user from department (was `/assignments/{user_id}/{department_id}`)
- ✅ `GET /api/v1/departments/users/{user_slug}/departments` - Get user departments (was `/users/{user_id}/departments`)
- ✅ `PUT /api/v1/departments/assignments/{assignment_slug}` - Update assignment (was `/assignments/{assignment_id}`)

**Action Required:**
- Use `department.slug`, `user.slug`, and `assignment.slug` for all department operations

---

### 10. Messages API (`/api/v1/messages`)

#### Changed Endpoints:
- ✅ `GET /api/v1/messages/{message_slug}` - Get message (was `/{message_id}`)
- ✅ `PATCH /api/v1/messages/{message_slug}` - Update message (was `/{message_id}`)
- ✅ `POST /api/v1/messages/{message_slug}/read` - Mark message as read (was `/{message_id}/read`)
- ✅ `POST /api/v1/messages/{message_slug}/acknowledge` - Acknowledge message (was `/{message_id}/acknowledge`)

**Action Required:**
- Use `message.slug` for all message operations

---

### 11. Conversations API (`/api/v1/conversations`)

#### Changed Endpoints:
- ✅ `GET /api/v1/conversations/{conversation_slug}` - Get conversation (was `/{conversation_id}`)
- ✅ `GET /api/v1/conversations/{conversation_slug}/messages` - Get conversation messages (was `/{conversation_id}/messages`)
- ✅ `GET /api/v1/conversations/{conversation_slug}/thread` - Get conversation thread (was `/{conversation_id}/thread`)
- ✅ `POST /api/v1/conversations/{conversation_slug}/participants` - Add participant (was `/{conversation_id}/participants`)
- ✅ `DELETE /api/v1/conversations/{conversation_slug}/participants/{user_slug}` - Remove participant (was `/{conversation_id}/participants/{user_id}`)
- ✅ `POST /api/v1/conversations/{conversation_slug}/deactivate` - Deactivate conversation (was `/{conversation_id}/deactivate`)

**Action Required:**
- Use `conversation.slug` and `user.slug` for all conversation operations
- Note: `POST /participants` still uses `user_id` in request body (this is correct)

---

### 12. Profile API (`/api/v1/profile`)

#### Changed Endpoints:
- ✅ `GET /api/v1/profile/{user_slug}` - Get user profile (Admin) (was `/{user_id}`)
- ✅ `GET /api/v1/profile/{user_slug}/stats` - Get user stats (Admin) (was `/{user_id}/stats`)
- ✅ `POST /api/v1/profile/{user_slug}/reactivate` - Reactivate user (Admin) (was `/{user_id}/reactivate`)

**Action Required:**
- Use `user.slug` for admin profile operations

---

### 13. Audit Logs API (`/api/v1/audit-logs`)

#### Changed Endpoints:
- ✅ `GET /api/v1/audit-logs/user/{user_slug}` - Get user audit logs (was `/user/{user_id}`)
- ✅ `GET /api/v1/audit-logs/{audit_log_slug}` - Get audit log (was `/{audit_log_id}`)

**Action Required:**
- Use `user.slug` and `audit_log.slug` for audit log operations

---

### 14. Clock API (`/api/v1/clock`)

#### Changed Endpoints:
- ✅ `GET /api/v1/clock/records/{clock_record_slug}` - Get clock record (was `/records/{clock_record_id}`)
- ✅ `PUT /api/v1/clock/records/{clock_record_slug}` - Edit clock record (was `/records/{clock_record_id}`)
- ✅ `GET /api/v1/clock/shift-roles/{job_role_slug}` - Get shift roles (was `/shift-roles/{job_role_id}`)

**Action Required:**
- Use `clock_record.slug` and `job_role.slug` for clock operations

---

### 15. Invitations API (`/api/v1/invitations`)

#### Changed Endpoints:
- ✅ `GET /api/v1/invitations/{invitation_slug}` - Get invitation (was `/{invitation_id}`)
- ✅ `DELETE /api/v1/invitations/{invitation_slug}` - Delete invitation (was `/{invitation_id}`)
- ✅ `POST /api/v1/invitations/{invitation_slug}/resend` - Resend invitation (was `/{invitation_id}/resend`)

**Action Required:**
- Use `invitation.slug` for all invitation operations

---

### 16. Task Types API (`/api/v1/task-types`)

#### Changed Endpoints:
- ✅ `GET /api/v1/task-types/{task_type_slug}` - Get task type (was `/{task_type_id}`)
- ✅ `PUT /api/v1/task-types/{task_type_slug}` - Update task type (was `/{task_type_id}`)
- ✅ `DELETE /api/v1/task-types/{task_type_slug}` - Delete task type (was `/{task_type_id}`)

**Action Required:**
- Use `task_type.slug` for all task type operations

---

### 17. Form Types API (`/api/v1/form-types`)

#### Changed Endpoints:
- ✅ `GET /api/v1/form-types/{form_type_slug}` - Get form type (was `/{form_type_id}`)
- ✅ `PUT /api/v1/form-types/{form_type_slug}` - Update form type (was `/{form_type_id}`)
- ✅ `DELETE /api/v1/form-types/{form_type_slug}` - Delete form type (was `/{form_type_id}`)

**Action Required:**
- Use `form_type.slug` for all form type operations

---

### 18. Settings API (`/api/v1/settings`)

#### Changed Endpoints:
- ✅ `GET /api/v1/settings/organization/{settings_slug}` - Get organization settings (was `/{settings_id}`)
- ✅ `PUT /api/v1/settings/organization/{settings_slug}` - Update organization settings (was `/{settings_id}`)
- ✅ `DELETE /api/v1/settings/organization/{settings_slug}` - Delete organization settings (was `/{settings_id}`)
- ✅ `GET /api/v1/settings/custom-fields/{field_slug}` - Get custom field (was `/{field_id}`)
- ✅ `PUT /api/v1/settings/custom-fields/{field_slug}` - Update custom field (was `/{field_id}`)
- ✅ `DELETE /api/v1/settings/custom-fields/{field_slug}` - Delete custom field (was `/{field_id}`)
- ✅ `DELETE /api/v1/settings/custom-fields/{field_slug}/hard` - Hard delete custom field (was `/{field_id}/hard`)
- ✅ `GET /api/v1/settings/custom-field-sections/{section_slug}` - Get custom field section (was `/{section_id}`)
- ✅ `PUT /api/v1/settings/custom-field-sections/{section_slug}` - Update custom field section (was `/{section_id}`)
- ✅ `DELETE /api/v1/settings/custom-field-sections/{section_slug}` - Delete custom field section (was `/{section_id}`)
- ✅ `DELETE /api/v1/settings/custom-field-sections/{section_slug}/hard` - Hard delete section (was `/{section_id}/hard`)
- ✅ `GET /api/v1/settings/custom-field-links/{link_slug}` - Get custom field link (was `/{link_id}`)
- ✅ `PUT /api/v1/settings/custom-field-links/{link_slug}` - Update custom field link (was `/{link_id}`)
- ✅ `DELETE /api/v1/settings/custom-field-links/{link_slug}` - Delete custom field link (was `/{link_id}`)
- ✅ `GET /api/v1/settings/custom-forms/{form_slug}` - Get custom form (was `/{form_id}`)
- ✅ `PUT /api/v1/settings/custom-forms/{form_slug}` - Update custom form (was `/{form_id}`)
- ✅ `DELETE /api/v1/settings/custom-forms/{form_slug}` - Delete custom form (was `/{form_id}`)
- ✅ `GET /api/v1/settings/form-submissions/{submission_slug}` - Get form submission (was `/{submission_id}`)
- ✅ `PUT /api/v1/settings/form-submissions/{submission_slug}` - Update form submission (was `/{submission_id}`)
- ✅ `GET /api/v1/settings/entity-comments/{comment_slug}` - Get entity comment (was `/{comment_id}`)
- ✅ `PUT /api/v1/settings/entity-comments/{comment_slug}` - Update entity comment (was `/{comment_id}`)
- ✅ `DELETE /api/v1/settings/entity-comments/{comment_slug}` - Delete entity comment (was `/{comment_id}`)
- ✅ `DELETE /api/v1/settings/group-entries/{entry_slug}` - Delete group entry (was `/{entry_id}`)

**Action Required:**
- Use slugs for all settings-related operations

---

### 19. Data Architecture API (`/api/v1/data`)

#### Changed Endpoints:
- ✅ `GET /api/v1/data/fields/{field_slug}` - Get core data field (was `/{field_id}`)
- ✅ `PUT /api/v1/data/fields/{field_slug}` - Update core data field (was `/{field_id}`)
- ✅ `GET /api/v1/data/collections/{collection_slug}` - Get collection (was `/{collection_id}`)
- ✅ `PUT /api/v1/data/collections/{collection_slug}` - Update collection (was `/{collection_id}`)
- ✅ `DELETE /api/v1/data/collections/{collection_slug}` - Delete collection (was `/{collection_id}`)
- ✅ `GET /api/v1/data/collections/records/{record_slug}` - Get record (was `/records/{record_id}`)
- ✅ `PUT /api/v1/data/collections/records/{record_slug}` - Update record (was `/records/{record_id}`)
- ✅ `GET /api/v1/data/users/{user_slug}/data` - Get user data (was `/users/{user_id}/data`)
- ✅ `GET /api/v1/data/users/{user_slug}/current` - Get user current data (was `/users/{user_id}/current`)
- ✅ `GET /api/v1/data/users/{user_slug}/history/{collection_name}` - Get user history (was `/users/{user_id}/history/{collection_name}`)
- ✅ `GET /api/v1/data/reports/users/{user_slug}/summary` - Get user summary (was `/reports/users/{user_id}/summary`)
- ✅ `GET /api/v1/data/{entity_type}/{entity_slug}/data` - Get entity data (was `/{entity_type}/{entity_id}/data`)
- ✅ `GET /api/v1/data/{entity_type}/{entity_slug}/current` - Get entity current data (was `/{entity_type}/{entity_id}/current`)
- ✅ `GET /api/v1/data/{entity_type}/{entity_slug}/history/{collection_name}` - Get entity history (was `/{entity_type}/{entity_id}/history/{collection_name}`)
- ✅ `GET /api/v1/data/reports/{entity_type}/{entity_slug}/summary` - Get entity summary (was `/reports/{entity_type}/{entity_id}/summary`)
- ✅ `GET /api/v1/data/{entity_type}/{entity_slug}/custom-fields/hierarchy` - Get custom fields hierarchy (was `/{entity_type}/{entity_id}/custom-fields/hierarchy`)
- ✅ `POST /api/v1/data/{entity_type}/{entity_slug}/group-entries` - Create group entry (was `/{entity_type}/{entity_id}/group-entries`)

**Action Required:**
- Use slugs for all data architecture operations
- Supported entity types: `user`, `asset`, `location`, `project`, `document`, `form`, `task`

---

### 20. Files API (`/api/v1/files`)

#### Changed Endpoints:
- ✅ `GET /api/v1/files/{file_slug}/url` - Get file URL (was `/download/{file_path:path}`)
- ✅ `DELETE /api/v1/files/delete/{file_slug}` - Delete file (was `/delete/{file_path:path}`)
- ✅ `POST /api/v1/files/entities/{entity_type}/{entity_slug}/attach` - Attach files to entity (was `/{entity_type}/{entity_id}/attach`)
- ✅ `POST /api/v1/files/entities/{entity_type}/{entity_slug}/attach-existing` - Attach existing files (was `/{entity_type}/{entity_id}/attach-existing`)
- ✅ `GET /api/v1/files/entities/{entity_type}/{entity_slug}/attachments` - Get entity attachments (was `/{entity_type}/{entity_id}/attachments`)
- ✅ `DELETE /api/v1/files/attachments/{attachment_slug}` - Delete entity attachment (was `/attachments/{attachment_id}`)

**Action Required:**
- Use `file_slug` and `entity_slug` for all file operations
- Supported entity types: `user`, `asset`, `location`, `project`, `document`, `form`, `task`

---

## Response Schema Changes

### All Response Objects Now Include `slug` Field

Every API response that represents a resource now includes a `slug` field:

```typescript
// Example: User Response
interface UserResponse {
  id: number;           // Still present (for internal use)
  slug: string;         // NEW - Use this for API calls
  email: string;
  username: string;
  // ... other fields
}

// Example: Document Response
interface DocumentResponse {
  id: number;           // Still present (for internal use)
  slug: string;         // NEW - Use this for API calls
  title: string;
  // ... other fields
}
```

**Action Required:**
- Update all TypeScript interfaces/types to include `slug: string`
- Store `slug` values from API responses
- Use `slug` instead of `id` for all subsequent API calls

---

## What Has NOT Changed

### ✅ Query Parameters (Still Use IDs)
Query parameters for filtering remain unchanged:
- `GET /api/v1/documents?category_id=123` ✅ (query param, not path param)
- `GET /api/v1/messages?user_id=456` ✅ (query param, not path param)

### ✅ Request Bodies (Still Use IDs)
Request bodies still use integer IDs where appropriate:
- `POST /api/v1/conversations/{conversation_slug}/participants`
  ```json
  {
    "user_id": 123  // ✅ Still integer ID in body
  }
  ```

- `POST /api/v1/messages`
  ```json
  {
    "target_user_ids": [1, 2, 3]  // ✅ Still integer IDs in body
  }
  ```

### ✅ List Endpoints (No Change)
List endpoints remain unchanged:
- `GET /api/v1/users` ✅
- `GET /api/v1/documents` ✅
- `GET /api/v1/projects` ✅

---

## Migration Checklist

### Step 1: Update Type Definitions
- [ ] Add `slug: string` to all resource TypeScript interfaces
- [ ] Update API client types

### Step 2: Update API Client Functions
- [ ] Replace all path parameter IDs with slugs
- [ ] Update URL construction logic
- [ ] Update route parameters

### Step 3: Update State Management
- [ ] Store `slug` values in state/Redux
- [ ] Update selectors to use slugs
- [ ] Update navigation/routing to use slugs

### Step 4: Update Components
- [ ] Replace `id` with `slug` in all API calls
- [ ] Update URL parameters in React Router/Vue Router
- [ ] Update navigation links
- [ ] Update detail page routes

### Step 5: Testing
- [ ] Test all CRUD operations
- [ ] Test navigation between pages
- [ ] Test deep linking
- [ ] Test error handling (404s for invalid slugs)

---

## Example Migration

### Before:
```typescript
// Component
const UserDetail = ({ userId }: { userId: number }) => {
  const { data } = useQuery(['user', userId], () => 
    api.get(`/api/v1/users/${userId}`)
  );
  
  return (
    <Link to={`/users/${userId}`}>
      {data?.username}
    </Link>
  );
};
```

### After:
```typescript
// Component
const UserDetail = ({ userSlug }: { userSlug: string }) => {
  const { data } = useQuery(['user', userSlug], () => 
    api.get(`/api/v1/users/${userSlug}`)
  );
  
  return (
    <Link to={`/users/${data?.slug}`}>
      {data?.username}
    </Link>
  );
};
```

---

## Support

If you encounter any issues during migration:
1. Check that you're using `slug` (string) not `id` (number) in path parameters
2. Verify that response objects include the `slug` field
3. Ensure query parameters and request bodies still use IDs where appropriate
4. Contact the backend team if you find any endpoints that still use IDs in paths

---

## Summary

**Total Endpoints Changed:** 153+ endpoints  
**Migration Complexity:** Medium  
**Breaking Changes:** Yes - All path parameters now require slugs  
**Backward Compatibility:** No - Old ID-based endpoints no longer exist

**Priority:** High - This is a breaking change and must be completed before deploying the new API version.

