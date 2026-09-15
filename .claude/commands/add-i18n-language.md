---
Description: Add a new language translation to a SAP CAP project's i18n folder
argument-hint: <language-code> (e.g., es, it, ja, zh, pt, hi)
---

# Add New Language to SAP CAP Project

User specified language code: $ARGUMENTS

Please add a new language translation to the SAP CAP project by 
following these steps:

═══════════════════════════════════════════════════════════════════
STEP 1: VALIDATE INPUT
═══════════════════════════════════════════════════════════════════

1. Confirm $ARGUMENTS is a valid 2-letter ISO 639-1 language code
2. Common supported codes:
   - es (Spanish)
   - it (Italian)
   - ja (Japanese)
   - zh (Chinese Simplified)
   - pt (Portuguese)
   - hi (Hindi)
   - ar (Arabic)
   - ru (Russian)
   - ko (Korean)
   - nl (Dutch)
3. If $ARGUMENTS is empty or invalid, ask me which language to add

═══════════════════════════════════════════════════════════════════
STEP 2: LOCATE EXISTING i18n FOLDER
═══════════════════════════════════════════════════════════════════

1. Search for existing i18n folders in the project:
   - db/i18n/
   - srv/i18n/
   - app/*/i18n/
   - _i18n/
2. If multiple i18n folders exist, list them and ask which one to update
3. Use the English baseline file (i18n.properties or i18n_en.properties) 
   as the source for keys

═══════════════════════════════════════════════════════════════════
STEP 3: READ ENGLISH BASELINE FILE
═══════════════════════════════════════════════════════════════════

1. Read all keys and English values from the baseline properties file
2. Preserve all section comments (lines starting with #)
3. Note the structure and ordering of keys

═══════════════════════════════════════════════════════════════════
STEP 4: CREATE TRANSLATION FILE
═══════════════════════════════════════════════════════════════════

1. Create new file: <i18n-folder>/i18n_$ARGUMENTS.properties
2. For each English key:
   - Translate the value accurately into the target language
   - Use proper grammar, capitalization, and conventions for that 
     language
   - Translate section comments as well for consistency
3. For technical terms common across languages (Email, ID, URL), 
   keep them as-is or use the locally accepted form
4. For SAP/business terminology, use industry-standard translations

═══════════════════════════════════════════════════════════════════
STEP 5: VERIFY AND REPORT
═══════════════════════════════════════════════════════════════════

1. Compare key count between English file and new translation file
2. Confirm no keys are missing
3. Show me a sample of 5-10 translated entries for review
4. List the final file path
5. Suggest running `cds watch` to test the new language
6. Provide instructions to test the language in the running app:
   - Add ?sap-language=$ARGUMENTS to URL
   - Or set Accept-Language header to $ARGUMENTS

═══════════════════════════════════════════════════════════════════
TRANSLATION QUALITY GUIDELINES
═══════════════════════════════════════════════════════════════════

- Use formal/professional tone (suitable for business apps)
- Preserve technical terms that are universally understood
- Match the length roughly to fit UI labels (avoid overly long 
  translations for short fields like "Status" or "ID")
- For right-to-left languages (ar, he), note that UI may need 
  additional RTL configuration
- For languages with formal/informal forms (de, fr, ja), use the 
  formal version (Sie/vous/您)