I need you to refactor my SAP CAP project's data model with the following 
three improvements. Please execute them in order and show me the results 
after each step.

PROJECT CONTEXT:
- Namespace: burhan.claude
- Current schema file: @db/schema.cds
- This is a Vacation & Traveller Management application

═══════════════════════════════════════════════════════════════════
TASK 1: SEPARATE REUSABLE TYPES INTO db/common.cds
═══════════════════════════════════════════════════════════════════

Create a new file at @db/common.cds that contains all reusable types, 
code lists, and type definitions extracted from db/schema.cds.

Move the following items from schema.cds to common.cds:
- All entities extending sap.common.CodeList:
  * AddressTypes (with code: String(1))
  * TravellerStatus (with code: String(1))
  * Roles (with code: String(10))
- All type definitions:
  * AddressType (Association to AddressTypes)
  * Status (Association to TravellerStatus)
  * Role (Association to Roles)

The common.cds file should:
- Use namespace: burhan.claude.common
- Import from '@sap/cds/common'
- Be the single source of truth for reusable artifacts
- Include proper file header comments

The schema.cds file should:
- Import from './common' to use the moved types
- Only contain business entities (Travellers, Vacations, Contacts, 
  Destinations, AppUsers)
- Keep all associations working correctly

═══════════════════════════════════════════════════════════════════
TASK 2: ADD @title ANNOTATION TO EVERY FIELD
═══════════════════════════════════════════════════════════════════

Add @title annotations to ALL fields across ALL entities in both 
common.cds and schema.cds. Use the i18n key reference format so the 
actual text comes from properties files.

Format to use: @title: '{i18n>FieldName}'

Apply @title annotations to every field in data model

═══════════════════════════════════════════════════════════════════
TASK 3: CREATE i18n.properties FILES
═══════════════════════════════════════════════════════════════════

Create the following i18n properties files for text elements:

1. Create folder: db/i18n/
2. Create file: db/i18n/i18n.properties (default English)

Add ALL text keys referenced in the @title annotations above with their 
English values. Structure the file with comments separating sections.

File content for db/i18n/i18n.properties with all the text elements and english names.

═══════════════════════════════════════════════════════════════════
EXECUTION GUIDELINES
═══════════════════════════════════════════════════════════════════

1. Show me the file structure before and after the changes
2. After Task 1, run `cds compile db/schema.cds` to verify the model 
   compiles without errors
3. After Task 2, show me a sample of the annotated entity to confirm 
   the format is correct
4. After Task 3, list all created files with their full paths
<!-- 5. Finally, run `cds watch` mentally and confirm the i18n keys would  -->
   <!-- resolve correctly -->
5. If any errors occur, show me the exact error message and fix it 
   before proceeding
6. Provide a summary at the end listing:
   - Files created
   - Files modified
   - Total number of @title annotations added
   - Total number of i18n keys defined