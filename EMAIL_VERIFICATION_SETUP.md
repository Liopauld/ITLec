# Email Verification Setup Guide

## Overview
The ITPathfinder platform now includes email verification functionality. Users must verify their email address after signup before they can log in.

## Features Implemented

### 1. **User Registration Flow**
- User signs up with email, password, name, and role
- System generates a unique verification token (valid for 24 hours)
- Verification email is automatically sent to the user's email address
- User account is created but `emailVerified` is set to `false`

### 2. **Email Verification**
- User receives an email with a verification link
- Clicking the link verifies the email and activates the account
- Token expires after 24 hours for security

### 3. **Login Protection**
- Users cannot log in until their email is verified
- Login attempt shows a friendly error message
- Provides a link to resend verification email if needed

### 4. **Resend Verification**
- Users can request a new verification email
- New token is generated (old one is invalidated)
- Available at `/resend-verification` page

## SMTP Configuration

### Required Environment Variables

Add these to your `.env` file in the project root:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=ITPathfinder <your-email@gmail.com>
FRONTEND_URL=http://localhost:3000
```

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to your Google Account settings
   - Security → 2-Step Verification → Enable

2. **Generate App Password**
   - Go to Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Select "Mail" and "Other" (name it "ITPathfinder")
   - Copy the 16-character password
   - Use this as `SMTP_PASS` in your .env file

3. **Update .env**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=your-16-char-app-password
   SMTP_FROM=ITPathfinder <your-gmail@gmail.com>
   FRONTEND_URL=http://localhost:3000
   ```

### Other Email Providers

#### Outlook/Office 365
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Database Changes

### New User Model Fields
```prisma
model User {
  // ... existing fields ...
  emailVerified           Boolean   @default(false)
  verificationToken       String?
  verificationTokenExpiry DateTime?
  // ... rest of fields ...
}
```

### Migration Applied
The database schema has been updated with `prisma db push`. The following fields were added:
- `emailVerified` (Boolean, default: false)
- `verificationToken` (String, nullable)
- `verificationTokenExpiry` (DateTime, nullable)

## API Endpoints

### 1. POST `/auth/signup`
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "role": "student"
}
```

**Response:**
```json
{
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "emailVerified": false
  }
}
```

### 2. POST `/auth/login`
**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (Unverified):**
```json
{
  "error": "Email not verified",
  "message": "Please verify your email address before logging in. Check your inbox for the verification link.",
  "needsVerification": true
}
```

**Response (Verified):**
```json
{
  "token": "jwt-token",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

### 3. GET `/auth/verify-email?token={token}`
**Response (Success):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in to your account.",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  }
}
```

**Response (Invalid/Expired):**
```json
{
  "error": "Invalid or expired verification token",
  "message": "The verification link is invalid or has expired. Please request a new verification email."
}
```

### 4. POST `/auth/resend-verification`
**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent! Please check your inbox."
}
```

## Frontend Pages

### 1. `/signup` - Registration Page
- Shows success message after signup
- Instructs user to check email for verification

### 2. `/login` - Login Page
- Checks email verification status
- Shows error with "Resend Verification Email" link if unverified

### 3. `/verify-email` - Email Verification Page
- Automatically processes verification token from URL
- Shows success/error status
- Redirects to login after successful verification

### 4. `/resend-verification` - Resend Verification Page
- Allows users to request a new verification email
- Simple form with email input

## Email Template

The verification email includes:
- Welcome message with user's name
- Prominent "Verify Email Address" button
- Plain text verification URL (for email clients that don't support HTML)
- 24-hour expiration notice
- Professional styling with ITPathfinder branding

## Testing

### 1. Test Email Delivery
```bash
# Check API server logs for email status
# You should see:
Email server ready to send messages
Verification email sent to user@example.com
```

### 2. Test Complete Flow
1. Sign up at `http://localhost:3000/signup`
2. Check email inbox for verification email
3. Click verification link
4. Should redirect to login page
5. Login with credentials
6. Should successfully access dashboard

### 3. Test Error Cases
- Try logging in before verification → Should show error
- Use expired token → Should show error with resend option
- Request resend → Should receive new email

## Troubleshooting

### Email Not Sending
1. **Check SMTP credentials** in .env file
2. **Check console logs** for email errors
3. **Verify Gmail App Password** is correct (not regular password)
4. **Check spam folder** in email inbox

### Token Errors
- Tokens expire after 24 hours
- Each resend invalidates previous tokens
- Tokens are single-use only

### Login Still Blocked
- Verify emailVerified is true in database:
  ```sql
  SELECT id, email, "emailVerified" FROM "User" WHERE email = 'user@example.com';
  ```
- If false, manually update for testing:
  ```sql
  UPDATE "User" SET "emailVerified" = true WHERE email = 'user@example.com';
  ```

## Security Features

✅ **Secure Token Generation** - Cryptographically secure random tokens
✅ **Token Expiration** - 24-hour expiry for security
✅ **One-Time Use** - Tokens invalidated after verification
✅ **Login Protection** - Cannot access system without verification
✅ **Password Hashing** - Bcrypt with salt rounds
✅ **HTTPS Ready** - Configure SMTP_SECURE=true for production

## Production Deployment

### Before Going Live:

1. **Use Professional Email Service**
   - Consider SendGrid, Mailgun, or AWS SES
   - Better deliverability than Gmail
   - Higher sending limits

2. **Update Environment Variables**
   ```env
   SMTP_HOST=your-production-smtp-host
   FRONTEND_URL=https://your-production-domain.com
   SMTP_SECURE=true  # Use TLS
   ```

3. **Test Thoroughly**
   - Test with different email providers
   - Check spam folder placement
   - Verify all links work with production domain

4. **Monitor Email Delivery**
   - Set up logging for failed emails
   - Monitor bounce rates
   - Track verification completion rates

## Support

If you encounter issues:
1. Check the API server console for error messages
2. Verify all environment variables are set correctly
3. Test SMTP connection using nodemailer's verify method
4. Check email provider documentation for specific requirements

---

**Note:** This feature requires a working SMTP server. Make sure to configure your email provider correctly before testing.
