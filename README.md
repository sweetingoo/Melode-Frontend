# Melode Frontend - Healthcare Management System

A modern, responsive frontend for the Melode Healthcare Management System built with HTML, CSS, JavaScript, and Tailwind CSS.

## Features

### Authentication System
- **Multi-role Login**: Support for Superadmin, Doctor/Contractors, Staff, and Patients
- **MFA Support**: Multi-factor authentication integration
- **Password Management**: Forgot password and reset password functionality
- **Session Management**: 30-day remember functionality for patients
- **Secure Token Handling**: Automatic token refresh and session validation

### User Management
- **Profile Management**: Update user profile with editable and non-editable fields
- **Role-based Access**: Different interfaces based on user roles
- **User Dashboard**: Personalized dashboard for each user type

### Invitation System
- **Create Invitations**: Superadmin and admins can create user invitations
- **Invitation Management**: List, view, and delete invitations
- **Email Integration**: Automatic email sending for invitations
- **Role Assignment**: Assign specific roles to invited users
- **Expiration Handling**: Configurable invitation expiration (1-30 days)

### Patient Portal
- **Dedicated Patient Console**: Separate interface for patients
- **30-day Session**: Extended session validity for patient convenience
- **Medical Records**: Access to medical records and test results
- **Appointment Management**: View and book appointments
- **Medication Tracking**: View current medications and prescriptions

## File Structure

```
Melode-Frontend/
├── index.html              # Main dashboard
├── login.html              # Login page with role selection
├── profile.html            # User profile management
├── invitations.html        # Invitation management
├── patient-dashboard.html  # Patient-specific dashboard
├── js/
│   ├── api.js             # API integration layer
│   ├── auth.js            # Authentication utilities
│   ├── app.js             # Main application logic
│   ├── login.js           # Login page functionality
│   ├── profile.js         # Profile management
│   ├── invitations.js     # Invitation management
│   └── patient.js         # Patient dashboard
└── README.md              # This file
```

## API Integration

The frontend integrates with the FastAPI backend through the following endpoints:

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration (with invitation)
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset confirmation
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout

### Profile Endpoints
- `GET /api/v1/profile/me` - Get user profile
- `PUT /api/v1/profile/me` - Update user profile
- `POST /api/v1/profile/change-password` - Change password

### Invitation Endpoints
- `GET /api/v1/invitations/` - List invitations
- `POST /api/v1/invitations/` - Create invitation
- `GET /api/v1/invitations/{id}` - Get invitation details
- `DELETE /api/v1/invitations/{id}` - Delete invitation
- `GET /api/v1/invitations/validate/{token}` - Validate invitation token

### MFA Endpoints
- `POST /api/v1/mfa/setup` - Setup MFA
- `POST /api/v1/mfa/verify` - Verify MFA token
- `POST /api/v1/mfa/disable` - Disable MFA

## User Roles and Permissions

### Superadmin
- Full system access
- Create and manage all user types
- Manage invitations
- System configuration

### Doctor/Contractor
- Patient management
- Medical records access
- Appointment scheduling
- Limited administrative functions

### Staff
- Patient support
- Appointment management
- Basic administrative tasks
- Limited system access

### Patient
- Personal medical records
- Appointment booking
- Medication tracking
- Profile management
- 30-day session validity

## Security Features

- **JWT Token Management**: Secure token handling with automatic refresh
- **Role-based Access Control**: UI elements hidden based on user permissions
- **Session Validation**: Automatic session checking and logout
- **Password Strength Validation**: Client-side password validation
- **MFA Integration**: Multi-factor authentication support
- **Secure API Communication**: HTTPS-ready API communication

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Dependencies

- **Tailwind CSS**: Utility-first CSS framework (CDN)
- **Alpine.js**: Lightweight JavaScript framework (CDN)
- **Font Awesome**: Icon library (CDN)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Melode-Frontend
   ```

2. **Configure API endpoint**
   - Update the `baseURL` in `js/api.js` to point to your FastAPI backend
   - Default: `http://localhost:8000/api/v1`

3. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

4. **Access the application**
   - Open `http://localhost:8000` in your browser
   - Navigate to `login.html` to start

## Configuration

### API Configuration
Update the API base URL in `js/api.js`:
```javascript
this.baseURL = 'https://your-api-domain.com/api/v1';
```

### Session Configuration
Patient session duration can be modified in `js/login.js`:
```javascript
// Set longer expiration for patients
const expirationDate = new Date();
expirationDate.setDate(expirationDate.getDate() + 30); // 30 days
```

## Features by Page

### Login Page (`login.html`)
- Role-based login interface
- MFA token input
- Password reset functionality
- Remember me for patients (30 days)
- Form validation

### Dashboard (`index.html`)
- Role-based navigation
- Quick action cards
- User information display
- System overview

### Profile Page (`profile.html`)
- Editable profile fields
- Non-editable fields (email, username)
- Password change functionality
- Real-time validation

### Invitations Page (`invitations.html`)
- Create new invitations
- List all invitations
- View invitation details
- Delete invitations
- Status tracking (Active, Used, Expired)

### Patient Dashboard (`patient-dashboard.html`)
- Patient-specific interface
- Medical records access
- Appointment management
- Medication tracking
- Session validity display

## Development

### Adding New Features
1. Create new HTML pages as needed
2. Add corresponding JavaScript files in `js/` directory
3. Update navigation in existing pages
4. Add API endpoints in `js/api.js`
5. Update authentication checks in `js/auth.js`

### Styling
- Uses Tailwind CSS utility classes
- Custom color scheme defined in HTML head
- Responsive design for mobile and desktop
- Consistent component styling

### JavaScript Architecture
- Modular JavaScript files for each page
- Global API client for backend communication
- Authentication manager for session handling
- Alpine.js for reactive UI components

## Troubleshooting

### Common Issues

1. **API Connection Errors**
   - Check API base URL configuration
   - Verify backend server is running
   - Check CORS settings on backend

2. **Authentication Issues**
   - Clear browser localStorage
   - Check token expiration
   - Verify user permissions

3. **Session Expiration**
   - Check patient session validity
   - Verify token refresh functionality
   - Clear expired tokens

### Debug Mode
Enable console logging by setting:
```javascript
window.DEBUG = true;
```

## Contributing

1. Follow the existing code structure
2. Use consistent naming conventions
3. Add proper error handling
4. Test across different browsers
5. Update documentation as needed

## License

This project is part of the Melode Healthcare Management System.