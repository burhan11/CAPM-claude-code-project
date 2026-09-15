Enhance my @db/schema.cds file with following entities at the end

1. Entity "Roles" extending sap.common.CodeList:
   - key code: String(10)
   - Will store role values: ADMIN, TRAVELLER, AGENT

2. Entity "AppUsers" using cuid and managed:
   - userName: String(100) with @mandatory annotation
   - email: String(255) with @mandatory annotation
   - fullName: String(255)
   - role: Association to Roles
   - isActive: Boolean default true
   - lastLoginAt: DateTime
   - traveller: Association to Travellers (optional link if user is a traveller)

Generate the complete schema.cds file with proper syntax, indentation, 
and SAP CAP best practices.
If there are merge conflicts during pull, STOP and ask me how to proceed.