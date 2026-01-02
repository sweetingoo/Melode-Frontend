# Melode Frontend

This is a [Next.js](https://nextjs.org) project for the Melode application, a comprehensive workforce management system.

## Features

### Forms Management
- **Custom Form Builder**: Create complex forms with drag-and-drop field reordering
- **Rich Text Editor**: Text blocks with full formatting support (Tiptap editor)
- **Multiple Field Types**: Text, Textarea, Number, Email, Phone, Date, DateTime, Boolean, Select, Multi-Select, File Upload, Signature, JSON
- **Display-Only Fields**: Text Block (rich text), Image Block, Line Break, Page Break, Download Link
- **Conditional Visibility**: Show/hide fields based on other field values
- **Multi-Page Forms**: Split forms into multiple pages with progress tracking
- **Public Form Submissions**: Slug-based URLs for anonymous form submissions
- **Draft Saving**: Save and resume form submissions
- **Session Persistence**: Form progress saved in browser session storage
- **Image Support**: Upload images or use direct URLs with resizing and inline alignment
- **File Validation**: Comprehensive file type and size validation
- **Auto-Generated IDs**: Automatic field ID and form name generation

### Document Management
- **Hierarchical Categories**: Create categories and subcategories for organizing documents
- **Rich Text Editor**: Create documents with full formatting support (Tiptap editor)
- **File Attachments**: Attach multiple files to documents
- **Permission-Based Access**: Category-level permissions with inheritance from parent categories
- **Document Sharing**: Share documents with specific users or make them public
- **Search Functionality**: Full-text search across document titles and content
- **Audit History**: Track who accessed documents and when
- **Status Management**: Draft, published, and archived document states

### Notifications System
- **Real-time Notifications**: Server-Sent Events (SSE) for instant notification delivery
- **Document Notifications**: Notifications for document sharing, updates, and public access
- **Notification Categories**: Filter notifications by type (document, task, form, project, system)
- **Unread Tracking**: Track unread notifications with badges and counts
- **Notification Dropdown**: Quick access to recent notifications from the header

### Integration Configuration
- **SendGrid Email**: Configure SendGrid API for email delivery
- **Twilio SMS**: Set up Twilio credentials for SMS notifications
- **S3 Storage**: Configure AWS S3 for file storage with secure credential management
- **Email Sender Settings**: Customize from email, name, app name, and domain
- **Feature Flags**: Enable/disable two-way communication, email replies, and SMS replies
- **Unsubscribe Settings**: Configure unsubscribe URLs and one-click unsubscribe

### Other Features
- User authentication and role management
- Task management
- Department and location management
- Custom fields
- Audit logs
- Clock in/out functionality
- Asset management
- Reports and analytics

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
/app
  /admin          # Admin panel pages
  /auth           # Authentication pages
  /forms          # Public form submission pages
  /docs           # Documentation pages
/components       # React components
/hooks           # Custom React hooks
/services        # API service layer
/utils           # Utility functions
```

## Key Technologies

- **Next.js 14+**: React framework with App Router
- **React Query**: Data fetching and caching
- **Tiptap**: Rich text editor
- **Tailwind CSS**: Styling
- **shadcn/ui**: UI component library
- **Axios**: HTTP client
- **date-fns**: Date manipulation

## Documentation

For detailed information about features, see the in-app documentation:
- `/docs` - Complete documentation hub
- `/docs/forms` - Forms Management documentation
- `/docs/tasks` - Task Management documentation
- `/docs/configuration` - Configuration and settings documentation

### Key Admin Pages
- Document Management: `/admin/documents`
- Configuration: `/admin/configuration`
- Integrations: `/admin/configuration?tab=integrations`
- Organisation Settings: `/admin/configuration?tab=organisation`
- Form creation: `/admin/forms/new`
- Form editing: `/admin/forms/[id]/edit`
- Public form submission: `/forms/[slug]/submit`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
