# Admin Account Setup

This document explains how to set up and manage the default admin account.

## Default Admin Credentials

**Email:** `prabhat@autoformindia.com`  
**Password:** `Admin@123`

## Creating the Admin Account

Run the following command from the `server` directory:

```bash
npm run seed:admin
```

This will:
- Create an admin user in the database
- Set up the role as 'admin'
- Display the credentials in the console

## Changing Admin Credentials

### To change the default email/password:

1. Edit `server/src/config/admin.config.ts`
2. Update the `DEFAULT_ADMIN` object with your desired credentials
3. Run `npm run seed:admin` again

### To change password after login:

Currently, password change functionality needs to be implemented in the profile page.

## Security Notes

⚠️ **IMPORTANT:** 
- Change the default password immediately after first login in production
- Never commit real production credentials to version control
- Use environment variables for production credentials

## Troubleshooting

If you see "Admin user already exists":
- The admin account is already created in the database
- You can log in with the existing credentials
- To reset, manually delete the user from the database and run the script again
