# KYC Form Validation Test Guide

## Summary of Changes

The KYC form now has comprehensive field-level validation with specific error messages for each field. Here's what's been implemented:

### 1. **Split Phone Number Fields**
- Country code dropdown with flags
- Separate phone number input field
- Automatic formatting and validation based on selected country

### 2. **Real-time Validation**
- All fields validate on blur (when you click away from the field)
- Errors only show after a field has been touched
- Clear, specific error messages for each validation rule

### 3. **Enhanced Error Messages**

#### First Name / Last Name:
- "First name is required"
- "First name must be at least 2 characters"
- "First name can only contain letters, spaces, hyphens, and apostrophes"

#### Email:
- "Email is required"
- "Please enter a valid email address (e.g., user@example.com)"
- "Email address is too long"

#### Phone Number:
- "Phone number is required"
- "US/Canada numbers are not supported. Please use a European phone number"
- "UK numbers are not supported. Please use an EU/EEA phone number"
- "Phone number must include country code (e.g., +351 for Portugal)"
- "Phone number too short. Portugal numbers should be at least 6 digits"
- "Phone number can only contain digits after the country code"

#### Date of Birth:
- "Date of birth is required"
- "Please enter a valid date"
- "Date of birth cannot be in the future"
- "You must be at least 18 years old to use this service"

#### Address:
- "Street address is required"
- "Please enter a complete street address"
- "City name can only contain letters, spaces, and hyphens"

#### Postal Code:
- Dynamic validation based on selected country
- Shows expected format for each country (e.g., "1234-567" for Portugal)
- Auto-formatting for Portugal and Netherlands

### 4. **Visual Feedback**
- Fields turn red when they have errors and have been touched
- Error messages appear below each field
- Form-level error alert with icon

### 5. **Server Error Mapping**
- Server errors are mapped to specific fields when possible
- More user-friendly error messages

## How to Test

1. **Access the KYC form**: http://155.138.165.47:3018/kyc

2. **Test each validation scenario**:
   - Leave fields empty and click away
   - Enter invalid characters in name fields (numbers, special chars)
   - Enter invalid email formats
   - Try US/UK phone numbers (should be rejected)
   - Enter phone numbers that are too short
   - Select different countries and see postal code format change
   - Enter date of birth for someone under 18

3. **Test the phone number split fields**:
   - Select different country codes from dropdown
   - Enter local phone number without country code
   - Observe how the full phone number is constructed

4. **Test postal code formatting**:
   - Select Portugal and type numbers (auto-formats with dash)
   - Select Netherlands and try the format (1234 AB)
   - Select other countries and observe placeholder changes

## Benefits for Users

1. **Immediate Feedback**: Users know exactly what's wrong as soon as they move to the next field
2. **Clear Instructions**: Specific error messages tell users exactly how to fix the problem
3. **Less Frustration**: No more guessing what format is expected
4. **Better Success Rate**: Users are more likely to complete the form correctly on first try
5. **Country-Specific Help**: Postal codes and phone numbers adapt to selected country

## Technical Implementation

- Used React state for touched fields tracking
- Implemented `validateField` function for individual field validation
- Added `onBlur` handlers to all input fields
- Enhanced `validateFormData` function with detailed validation rules
- Added visual indicators with conditional CSS classes
- Implemented auto-formatting for specific countries
- Added comprehensive error mapping from server responses