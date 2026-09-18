01	Problem Statement
Business context and scope of the travel management service

The Travel Management Application is a cloud-native BTP CAP solution designed to digitise and streamline the end-to-end corporate travel lifecycle. The system exposes two OData services consumed by a Fiori Elements frontend and downstream integrations.

The application must address the following business needs:
•	Maintain a master list of travellers, their profiles, and current status within the organisation.
•	Record locations and destinations that each traveller has visited or is eligible to visit.
•	Allow travel planners to create and manage travel destinations — but never modify an existing destination record to preserve audit integrity.
•	Maintain traveller type classification (e.g. Frequent Flyer, Executive, Standard) as a fixed reference list that cannot be altered at runtime.
•	Expose all traveller data to administrators; restrict travellers to viewing only their own records (row-level security).
•	Provide a fully secured User and Role Management service — accessible only by administrators — for lifecycle management of application users and their role assignments.

Scope Boundary
This spec covers OData service definitions, entity relationships, CRUD restrictions, authorization rules, custom actions/functions, and technical constraints. Frontend UI annotations and deployment pipeline configuration are out of scope.

 

02	OData Service Architecture
CatalogService and UserManagement — endpoint overview

2.1  CatalogService — Travel Data Service
The primary service exposes travel domain entities to authenticated users. Row-level filtering ensures travellers see only their own data while admins have full visibility.

Entity (CDS Name)	Display Name	CRUD Restrictions	Access
Travellers	Traveller Master	Create, Read, Update	Admin: all rows  |  Traveller: own row
TravellerTypes	Traveller Type	Read only (no Create/Update/Delete)	Authenticated users
TravelledLocations	Visited Locations	Create, Read, Delete	Admin: all  |  Traveller: own
Destinations	Travel Destination	Create, Read (no Update/Delete)	Authenticated users
TravellerStatus	Traveller Status VH	Read only — value help	Authenticated users
AddressTypes	Address Type VH	Read only — value help	Authenticated users

2.2  UserManagement — Admin-only Service
This service is strictly restricted to the Administrator role via @restrict annotation. It must never be accessible to standard traveller users.

Entity / Operation	Type	Description	Access
Users	Entity	Application user registry linked to BTP identity	Admin only
Roles	Entity	Role definitions available for assignment	Admin only
UserRoles	Entity	Many-to-many: user-to-role assignments	Admin only
lockUser	Function	Locks a user account — prevents login	Admin only
unlockUser	Function	Unlocks a previously locked user account	Admin only
createUser	Action	Creates a new application user record	Admin only
resetPassword	Action	Resets the password for a specified user	Admin only
assignRole	Action	Assigns a role to a user	Admin only
unassignRole	Action	Removes a role from a user	Admin only

 

03	Functional Requirements
Detailed CRUD rules, relations, value helps, and custom operations

3.1  Travellers Entity
Represents the core traveller master data. Each traveller is linked to the authenticated BTP user identity.
•	Supports Create, Read, and Update operations.
•	Delete is NOT permitted — traveller records are soft-deactivated via status.
•	The traveller's status must be validated against the TravellerStatus value help entity.
•	Row-level filtering: traveller role can only access the row matching their own user ID.
•	Admin role can access all rows.
•	Each record carries an ETag for optimistic concurrency control.

3.2  Traveller Types Entity
Reference data for traveller classification. This is a fixed code list.
•	Read-only — no Create, Update, or Delete permitted via the OData service.
•	Pre-seeded via CSV initial data in the db/ layer.
•	Exposed as a value help for the Travellers entity type field.

3.3  Visited Locations Entity
Records the travel history — locations a traveller has already visited.
•	Supports Create, Read, and Delete. Update is NOT permitted (immutable travel log).
•	Maintains a composition relationship to the Travellers entity (a traveller owns their visited locations).
•	Admin sees all visited locations. Traveller sees only their own.
•	Each location must reference a valid entry in the Destinations entity.

3.4  Destinations Entity
The master list of travel destinations available for planning.
•	Supports Create and Read only. Update and Delete are strictly NOT permitted.
•	Once a destination is created it is immutable — to change a destination, a new record must be created.
•	Exposed as a value help when creating visited location records.

3.5  Value Helps — Traveller Status and Address Type
Two read-only code-list entities exposed purely as value helps.
•	TravellerStatus: provides the set of valid statuses (e.g. Active, Inactive, Suspended, On-Leave).
•	AddressTypes: provides address classification values (e.g. Home, Office, Mailing, Billing).
•	Both are pre-seeded via CSV and carry no write operations.
•	Annotated with @cds.autoexpose and @readonly in the CDS model.

3.6  User and Role Management Operations
All operations below are restricted to the Administrator role only.

Functions (read-safe, no side-effect on data model):
•	lockUser(userId: String): Boolean — marks the specified user account as locked. Returns true on success.
•	unlockUser(userId: String): Boolean — clears the lock flag on the specified user account.

Actions (modify data, require POST):
•	createUser(firstName, lastName, email, roleId): User — provisions a new user record and assigns an initial role.
•	resetPassword(userId: String, newPassword: String): Boolean — resets the password for the specified user.
•	assignRole(userId: String, roleId: String): Boolean — adds a role to the user's role list.
•	unassignRole(userId: String, roleId: String): Boolean — removes a role from the user's role list.

 

04	API Contracts
Entity shapes, key fields, associations, and navigation properties

4.1  Travellers
Property	CDS Type	Constraint	Description
ID	UUID	key, @cds.generated	Auto-generated traveller identifier
firstName	String	mandatory	Traveller's given name
lastName	String	mandatory	Traveller's family name
email	String	mandatory, unique	Corporate email — also BTP login identity
phone	String	optional	Contact phone number
addressType	Association to AddressTypes	optional	Type of primary address
typeCode	Association to TravellerTypes	mandatory	Classification of traveller
status	Association to TravellerStatus	mandatory	Current account status
userID	String	mandatory	BTP user ID — used for row-level filtering

4.2  Visited Locations
Property	CDS Type	Constraint	Description
ID	UUID	key	Auto-generated record ID
traveller	Association to Travellers	mandatory	Parent traveller (composition owner)
destination	Association to Destinations	mandatory	Which destination was visited
visitedOn	Date	mandatory	Date the location was visited
notes	String	optional	Free-text trip notes

4.3  Destinations
Property	CDS Type	Constraint	Description
ID	UUID	key	Auto-generated destination ID
name	String	mandatory, unique	Human-readable destination name
country	String	mandatory	Country of the destination
city	String	mandatory	City of the destination
region	String	optional	Region or state
description	LargeString	optional	Extended description of the destination

4.4  Users (UserManagement)
Property	CDS Type	Constraint	Description
ID	UUID	key	Auto-generated user ID
loginName	String	mandatory, unique	BTP login / email
firstName	String	mandatory	Given name
lastName	String	mandatory	Family name
isLocked	Boolean	default false	Lock flag — set by lockUser function
createdAt	Timestamp	@cds.on.insert	Auto-set on creation

 

05	Authorization & Security
Authentication, role-based access, and row-level filtering

Authentication Requirement
Every endpoint in both CatalogService and UserManagement is secured with @requires: 'authenticated-user'. No anonymous access is permitted under any circumstance.

5.1  Role Definitions
Role	Scope ID (XSUAA)	Description
Administrator	Admin	Full read/write on all entities. Full access to UserManagement service. Can view all traveller rows.
Traveller	Traveller	CRUD on own data only (row-filtered). Read-only on value helps and destinations. No access to UserManagement.

5.2  CDS Annotation Pattern
Apply the following @restrict pattern consistently on every exposed entity:

annotate CatalogService.Travellers with @restrict: [
  { grant: ['READ','UPDATE'], to: 'Traveller', where: 'userID = $user' },
  { grant: '*', to: 'Admin' }
];

annotate UserManagement with @requires: 'Admin';

5.3  Row-Level Filtering
•	Travellers entity: WHERE userID = $user applied automatically by CAP when role is Traveller.
•	TravelledLocations: filtered via the parent Travellers composition — only records where traveller.userID = $user are returned.
•	Admin role: $user condition is not applied — all rows are visible.
•	Implementation: use @restrict where clause in CDS — do NOT implement row filtering in handler code.

 

06	Edge Cases & Error Handling
What happens when things go wrong

Scenario	Expected Behaviour	HTTP Code
Traveller tries to read another traveller's record	CAP where-clause filters it out — returns empty result set, not 403	200 (empty)
Update attempted on Destinations entity	@readonly annotation returns error — no handler needed	405 Method Not Allowed
Update attempted on TravellerTypes	@readonly annotation blocks — same as Destinations	405 Method Not Allowed
Non-admin calls UserManagement endpoint	@requires: 'Admin' rejects at framework level	403 Forbidden
createUser called with duplicate loginName	Handler must call req.error(409, 'User already exists')	409 Conflict
lockUser called on already-locked user	Return false — do not throw; idempotent operation	200 false
assignRole with invalid roleId	req.error(404, 'Role not found') — validate before insert	404 Not Found
ETag mismatch on update	CAP ETag support returns standard concurrency error	412 Precondition Failed
resetPassword with empty password	req.error(400, 'Password must not be empty')	400 Bad Request
Visited Location referencing deleted destination	Association validation prevents dangling FK at DB layer	400 Bad Request

 
 

04	Technical Constraints
Platform, naming, language, patterns, and field rules

4.1  Language — TypeScript Only
Mandatory
All CAP service handlers, utilities, and custom logic must be written in TypeScript (.ts) on Node.js, using @cap-js/cds-typer generated types (#cds-models/*) for entity models where practical. Plain JavaScript (.js) is NOT permitted in the srv/ or handlers/ directory — the project is set up via `cds add typescript`, and cds-serve/cds watch transpile .ts on the fly via tsx.

4.2  Generic Handlers Pattern
Business logic must be implemented using CAP generic handler pattern — not entity-specific monolithic files.

// srv/handlers/travellers.handler.ts — generic pattern
import cds from '@sap/cds';

export default (srv: cds.ApplicationService) => {
  const { Travellers, TravelledLocations } = srv.entities;

  // Generic before-CREATE for all entities
  srv.before('CREATE', Travellers, async (req: cds.Request) => {
    // validation logic here
  });

  // Generic after-READ handler
  srv.after('READ', Travellers, (data: any) => {
    // compute fullName for each record
    if (Array.isArray(data)) data.forEach(enrichFullName);
    else enrichFullName(data);
  });
};

const enrichFullName = (d: any) => {
  if (d) d.fullName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
};

4.3  Passenger Full Name — Concatenation Constraint
The fullName field must never be stored in the database. It is always computed on read.
Rule	Detail
Storage	fullName is a @Core.Computed virtual element — NOT persisted
Computation	fullName = firstName.trim() + ' ' + lastName.trim()
Handler	Populated in srv.after('READ') generic handler for Travellers
Validation	firstName and lastName are individually mandatory — null check on CREATE/UPDATE
OData exposure	Included in $select, filterable, but not updatable via OData PATCH

4.4  OData Protocol
•	Primary: OData V4. Secondary: OData V2 via cds add odata-v2-proxy.
•	Both /odata/v4/ and /odata/v2/ endpoints must return equivalent results.

4.5  ETag / Concurrency
•	@odata.etag on modifiedAt (Timestamp, @cds.on.update: $now) for Travellers entity.
•	All PATCH requests require If-Match header. Requests without it return 428.
•	Stale ETag returns 412 Precondition Failed.

4.6  Service Naming
Service	CDS Name	OData V4 Path	OData V2 Path
Travel Data	CatalogService	/odata/v4/catalog	/odata/v2/catalog
User & Roles	UserManagement	/odata/v4/user-management	/odata/v2/user-management

4.7  Infrastructure
•	Runtime: SAP BTP Cloud Foundry (primary).
•	Database: SAP HANA Cloud — SQLite only for local cds watch.
•	Node.js: 18.x LTS minimum.
•	@sap/cds: pinned at ^8.x.
•	Auth: XSUAA — no mock auth above local dev.
•	Audit logging: @sap/audit-logging on all UserManagement write operations.
 

05	Authorization & Security
Authentication, roles, and row-level filtering

Authentication
Every endpoint in both services requires @requires: 'authenticated-user'. No anonymous access.

5.1  Roles
Role	Scope ID	Description
Administrator	Admin	Full access on all entities. All rows visible. Full UserManagement access.
Traveller	Traveller	Own data only (row-filtered). Read-only on value helps/destinations. No UserManagement.

5.2  CDS Annotation Pattern
annotate CatalogService.Travellers with @restrict: [
  { grant: ['READ','UPDATE'], to: 'Traveller', where: 'userID = $user' },
  { grant: '*', to: 'Admin' }
];

annotate CatalogService.TravelledLocations with @restrict: [
  { grant: ['READ','CREATE','DELETE'], to: 'Traveller', where: 'traveller.userID = $user' },
  { grant: '*', to: 'Admin' }
];

annotate UserManagement with @requires: 'Admin';
 

06	API Contracts
Entity shapes, key fields, and navigation properties

6.1  Travellers
Property	CDS Type	Constraint	Description
ID	UUID	key, generated	Auto-generated ID
firstName	String(80)	mandatory	Given name
lastName	String(80)	mandatory	Family name
fullName	String(160)	@Core.Computed, virtual	firstName + ' ' + lastName — never stored
email	String(120)	mandatory, unique	Corporate email / BTP identity
phone	String(20)	optional	Contact number
addressType_code	String	FK to AddressTypes	Type of primary address
type_code	String	FK to TravellerTypes, mandatory	Traveller classification
status_code	String	FK to TravellerStatus, mandatory	Current status
userID	String(100)	mandatory	BTP user ID — row-level filter key
modifiedAt	Timestamp	@odata.etag, @cds.on.update	Concurrency control field

6.2  TravelledLocations
Property	CDS Type	Constraint	Description
ID	UUID	key, generated	Record ID
traveller_ID	UUID	FK to Travellers, mandatory	Parent traveller
destination_ID	UUID	FK to Destinations, mandatory	Destination visited
travelFrom	Date	mandatory	Trip start date
travelTo	Date	mandatory	Trip end date — must be >= travelFrom
notes	LargeString	optional	Free-text notes

6.3  Destinations
Property	CDS Type	Constraint	Description
ID	UUID	key, generated	Destination ID
name	String(200)	mandatory, unique	Human-readable name
country	String(100)	mandatory	Country
city	String(100)	mandatory	City
region	String(100)	optional	Region / State
description	LargeString	optional	Extended description

6.4  Users (UserManagement)
Property	CDS Type	Constraint	Description
ID	UUID	key, generated	User ID
loginName	String(120)	mandatory, unique	BTP login / email
firstName	String(80)	mandatory	Given name
lastName	String(80)	mandatory	Family name
isLocked	Boolean	default false	Lock flag
createdAt	Timestamp	@cds.on.insert	Auto-set
 

07	Edge Cases & Error Handling
All failure scenarios with HTTP codes and handler guidance

7.1  Data Validation Edge Cases
Scenario	Expected Behaviour	HTTP Code	Handler Location
firstName or lastName is empty/null on CREATE	req.error(400,'First name and last name are required')	400	before CREATE Travellers
fullName PATCH attempted via OData	Framework ignores — @Core.Computed field is read-only; or req.error if handler detects it	400	before UPDATE Travellers
travelFrom > travelTo on location create	req.error(400,'Travel start date must be before end date')	400	before CREATE TravelledLocations
Overlapping date range for same traveller	req.error(409,'Traveller already has a trip during this date range')	409	before CREATE TravelledLocations
Destination ID does not exist when creating location	CAP FK constraint raises error; handler may enrich message	400	before CREATE TravelledLocations
Duplicate email on Traveller CREATE	DB unique constraint; handler catches and returns req.error(409,'Email already registered')	409	before CREATE Travellers

7.2  Access Control Edge Cases
Scenario	Expected Behaviour	HTTP Code	Notes
Traveller reads another traveller's record	CAP where-clause filters — empty result, not error	200 (empty)	Do not expose 403 for privacy
Traveller calls DELETE on TravelledLocations for another's record	Row filter prevents match — 0 rows affected or 404	404	
Non-admin calls any UserManagement endpoint	@requires: 'Admin' blocks at framework level	403	No handler needed
Unauthenticated request to any endpoint	@requires: 'authenticated-user' blocks	401	

7.3  UserManagement Edge Cases
Scenario	Expected Behaviour	HTTP Code	Handler Location
createUser with duplicate loginName	req.error(409,'User already exists')	409	createUser action handler
lockUser on already-locked user	Return false — idempotent, do not throw	200 false	lockUser function handler
unlockUser on non-existent user	req.error(404,'User not found')	404	unlockUser function handler
assignRole with invalid roleId	req.error(404,'Role not found')	404	assignRole action handler
unassignRole when assignment does not exist	req.error(404,'Role assignment not found')	404	unassignRole action handler
resetPassword with empty string	req.error(400,'Password must not be empty')	400	resetPassword action handler
resetPassword with password < 8 chars	req.error(400,'Password must be at least 8 characters')	400	resetPassword action handler

7.4  Concurrency Edge Cases
Scenario	Expected Behaviour	HTTP Code	Notes
PATCH Traveller without If-Match header	Return 428 Precondition Required	428	ETag enforcement
PATCH Traveller with stale ETag	Return 412 Precondition Failed	412	Another user modified the record
PATCH Traveller with correct ETag	Update succeeds, new ETag in response	200	modifiedAt auto-updated

7.5  OData Protocol Edge Cases
Scenario	Expected Behaviour	HTTP Code
PATCH on Destinations	405 Method Not Allowed — @readonly enforced	405
DELETE on Destinations	405 Method Not Allowed	405
PATCH on TravellerTypes	405 Method Not Allowed	405
$batch with mixed valid and invalid inserts	Valid inserts committed; invalid operations return individual errors per OData batch spec	207 Multi-Status
$expand on unknown navigation property	OData framework returns 400 Bad Request	400
$filter with unsupported operator on computed fullName	500 if not handled — handler must guard or annotate @Core.Computed as non-filterable	400/500
 

08	Acceptance Criteria
Definition of done — all checks that must pass before deployment

8.1  Build & Lint
•	cds watch starts without errors. All entities resolve correctly in $metadata.
•	cds lint passes with zero errors on all .cds files.
•	npm test passes all Jest unit tests.
•	mbt build --production completes without errors.

8.2  CatalogService — Travellers
•	GET /Travellers returns only own row for Traveller role; all rows for Admin.
•	POST /Travellers with firstName + lastName stores both; fullName computed correctly on READ response.
•	fullName is present in response but absent from HANA table column list.
•	PATCH /Travellers without If-Match → 428.
•	PATCH /Travellers with stale ETag → 412.
•	PATCH /Travellers with correct ETag → 200 with updated modifiedAt.

8.3  CatalogService — Visited Locations
•	POST /TravelledLocations with non-overlapping dates → 201 Created.
•	POST /TravelledLocations with overlapping dates for same traveller → 409.
•	POST /TravelledLocations with travelFrom > travelTo → 400.
•	DELETE /TravelledLocations/{id} → 204 for own record.
•	DELETE /TravelledLocations/{id} for another traveller's record → 404.
•	$expand=destination on TravelledLocations returns destination object inline.
•	$expand=traveller($select=firstName,lastName,fullName) returns computed fullName.

8.4  CatalogService — Destinations & Value Helps
•	POST /Destinations → 201 Created.
•	PATCH /Destinations → 405.
•	DELETE /Destinations → 405.
•	GET /TravellerStatus returns all status codes.
•	GET /AddressTypes returns all address type codes.
•	GET /TravellerTypes returns all type codes — no write operations available.

8.5  UserManagement
•	Any request from Traveller role → 403.
•	POST /createUser with valid payload → 201 + user record created.
•	POST /createUser with duplicate email → 409.
•	GET /lockUser(userId=...) → true + isLocked = true in DB.
•	GET /unlockUser(userId=...) → true + isLocked = false in DB.
•	POST /resetPassword with empty password → 400.
•	POST /resetPassword with < 8 chars → 400.
•	POST /assignRole with invalid roleId → 404.
•	POST /unassignRole when assignment missing → 404.

8.6  Batch Insert
•	$batch with 3 TravelledLocations for same traveller — all non-overlapping → all 201.
•	$batch with 3 locations where one overlaps → that one returns 409, others commit.
•	$batch with Traveller + related TravelledLocations in one request → 201 for parent, 201 for child.

8.7  OData V2 Compatibility
•	GET /odata/v2/catalog/Travellers returns equivalent XML response.
•	All entity names in both V4 and V2 $metadata use human-readable labels.
 

09	$expand Reference
All navigation property expand calls for dependent entity reads

Use $expand to read related entities in a single OData call rather than multiple round trips. All examples use OData V4 syntax.

9.1  Travellers with all related data
# Expand traveller with their visited locations and each location's destination
GET /odata/v4/catalog/Travellers
    ?$expand=locations($expand=destination)

# Expand with select — only return specific fields
GET /odata/v4/catalog/Travellers
    ?$expand=locations($select=travelFrom,travelTo,notes;$expand=destination($select=name,country,city))
    &$select=ID,firstName,lastName,fullName,status_code

# Expand with filter — only active travellers with locations in 2025
GET /odata/v4/catalog/Travellers
    ?$expand=locations($filter=travelFrom ge 2025-01-01)
    &$filter=status_code eq 'ACT'

9.2  TravelledLocations with destination detail
# Read all visited locations for current user, expand destination
GET /odata/v4/catalog/TravelledLocations
    ?$expand=destination

# Expand destination with select
GET /odata/v4/catalog/TravelledLocations
    ?$expand=destination($select=name,country,city,region)
    &$orderby=travelFrom desc

# Get specific traveller's location with both traveller and destination
GET /odata/v4/catalog/TravelledLocations(guid'<ID>')
    ?$expand=traveller($select=firstName,lastName,fullName),destination

9.3  UserManagement — Users with Roles
# Expand user with their assigned roles
GET /odata/v4/user-management/Users
    ?$expand=roles($expand=role)

# Get specific user with roles
GET /odata/v4/user-management/Users(guid'<userID>')
    ?$expand=roles($select=role_ID;$expand=role($select=name,description))
 

10	Claude Code Integration
Spec-driven development workflow for this project

Spec-Driven Development
@import this file into CLAUDE.md before writing any .cds or .js handler. Every Claude Code generation decision must trace back to a section of this spec.

•	Place spec at docs/spec.md — commit to git before any .cds file is created.
•	Add @import docs/spec.md to CLAUDE.md at project root.
•	When prompting Claude: 'Implement the Travellers entity per Section 6.1 using the generic handler pattern from Section 4.2.'
•	Ask Claude to validate date range overlap logic against Section 7.1 before finalising.
•	Generate Jest tests from acceptance criteria: 'Write Jest tests for Section 8.3.'
•	Reference Section 9 for $expand test calls in the .http test file.
•	Run /memory add after any architecture decision not in this spec.