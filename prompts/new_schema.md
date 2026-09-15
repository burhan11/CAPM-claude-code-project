Create a SAP Cloud Application Programming Model (CAP) data model file 
named schema.cds under @db folder with the following specifications:

NAMESPACE: burhan.claude

IMPORTS:
- Import sap, cuid, Currency, and managed from '@sap/cds/common'

CODE LIST ENTITIES (extending sap.common.CodeList):

1. Entity "AddressTypes" with:
   - key code: String(1)
   - This will store values like Home, Office, Permanent, Temporary

2. Entity "TravellerStatus" with:
   - key code: String(1)
   - This will store traveller statuses like Active, Inactive, Suspended

TYPE DEFINITIONS:
- AddressType: Association to AddressTypes
- Status: Association to TravellerStatus

MAIN ENTITIES:

3. Entity "Destinations" using cuid:
   - address: String(255)
   - city: String(40)
   - postalCode: String(8)
   - country: String(40)
   - traveller: Association to Travellers

4. Entity "Travellers" using cuid and managed:
   - userName: String(255) with @mandatory annotation
   - firstName: String(255)
   - lastName: String(255)
   - contacts: Composition of many Contacts on contacts.traveller = $self
   - gender: String(10)
   - age: Integer
   - status: Status with default value 'A'
   - createdBy: String(40)
   - address: Composition of Destinations
   - vacations: Composition of many Vacations on vacations.traveller = $self
   - Annotate Travellers entity with: modifiedAt @odata.etag

5. Entity "Contacts" using cuid:
   - type: AddressType
   - address: String(255)
   - traveller: Association to Travellers

6. Entity "Vacations" using cuid:
   - name: String(255)
   - budget: Decimal(10,2)
   - currency: Currency
   - description: String(1024)
   - startsAt: DateTime
   - endsAt: DateTime
   - traveller: Association to Travellers