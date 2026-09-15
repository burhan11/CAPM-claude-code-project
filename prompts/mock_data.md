Generate test data CSV files for a SAP CAP application with namespace 
"burhan.claude" for travel management. Create the following CSV files 
inside a folder called @db/data/ following SAP CAP naming convention 
(namespace-EntityName.csv).

REQUIRED CSV FILES:

1. File: burhan.claude-AddressTypes.csv
   - Columns: code, name, descr
   - Generate 4 records:
     * H, Home, Home address for personal communication
     * O, Office, Work address for business communication
     * P, Permanent, Permanent residential address
     * T, Temporary, Temporary stay address

2. File: burhan.claude-AddressTypes_texts.csv
   - Columns: locale, code, name, descr
   - Generate localization records for English (en) and German (de)
     for all 4 address types

3. File: burhan.claude-TravellerStatus.csv
   - Columns: code, name, descr
   - Generate 4 records:
     * A, Active, Active traveller
     * I, Inactive, Inactive traveller
     * S, Suspended, Suspended traveller
     * P, Pending, Pending verification

4. File: burhan.claude-Roles.csv
   - Columns: code, name, descr
   - Generate 3 records:
     * ADMIN, Administrator, Full system access
     * TRAVELLER, Traveller, Self-service traveller access
     * AGENT, Travel Agent, Agent access for managing travellers

5. File: burhan.claude-Travellers.csv
   - Columns: ID, userName, firstName, lastName, gender, age, status_code, 
     createdBy, createdAt, modifiedAt
   - Generate 10 diverse traveller records with:
     * Use UUID format for ID (e.g., a1b2c3d4-e5f6-7890-abcd-ef1234567890)
     * Mix of male and female names from different cultures (Indian, 
       American, European, Asian)
     * Ages between 22 and 65
     * Mix of statuses (mostly Active, some Inactive)
     * createdBy as email format
     * createdAt and modifiedAt as ISO 8601 timestamps

6. File: burhan.claude-Contacts.csv
   - Columns: ID, type_code, address, traveller_ID
   - Generate 20 contact records (2 per traveller)
   - Mix of email addresses and phone numbers
   - Reference traveller_ID from Travellers.csv
   - Mix of all 4 address types (H, O, P, T)

7. File: burhan.claude-Destinations.csv
   - Columns: ID, address, city, postalCode, country, traveller_ID
   - Generate 15 destination records
   - Mix of international cities: Paris, Tokyo, New York, Dubai, 
     Singapore, London, Sydney, Bangkok, Rome, Bali
   - Realistic addresses and postal codes
   - Reference traveller_ID from Travellers.csv

8. File: burhan.claude-Vacations.csv
   - Columns: ID, name, budget, currency_code, description, startsAt, 
     endsAt, traveller_ID
   - Generate 15 vacation records with:
     * Creative vacation names like "Paris Romance Tour", "Tokyo Cherry 
       Blossom Trip", "Bali Beach Getaway"
     * Budgets between 1500.00 and 25000.00
     * Mix of currencies: USD, EUR, INR, GBP, JPY, AUD
     * Detailed descriptions (50-100 words each)
     * Future dates spanning next 12 months
     * Trip duration between 3 and 21 days
     * Reference traveller_ID from Travellers.csv

9. File: burhan.claude-AppUsers.csv
   - Columns: ID, userName, email, fullName, role_code, isActive, 
     lastLoginAt, traveller_ID, createdBy, createdAt, modifiedAt
   - Generate 12 app user records:
     * 2 ADMIN users
     * 3 AGENT users
     * 7 TRAVELLER users (linked to existing traveller_ID)
     * Realistic email addresses
     * Recent lastLoginAt timestamps
     * Mix of active and inactive users

IMPORTANT GUIDELINES:
- Use semicolon (;) as CSV separator (SAP CAP standard)
- First row must contain column headers
- Use UUID format consistently across related entities
- Ensure referential integrity (foreign keys must exist in parent entities)
- Use ISO 8601 format for all DateTime fields (YYYY-MM-DDTHH:mm:ssZ)
- Provide realistic, diverse, and culturally varied sample data
- Ensure data tells a coherent story (e.g., a traveller with vacations, 
  contacts, and destinations that make logical sense)