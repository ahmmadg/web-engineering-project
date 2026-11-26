# web-engineering-project

## Local super-admin demo account

On first load, the app seeds a super-admin account if no super-admin exists:

- Username: `superAdmin`
- Password: `SuperAdmin123`

This account is stored in browser `localStorage` for this static demo. Do not use these credentials or this client-side authentication model in production.