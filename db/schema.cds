// db/schema.cds
// Business entities for the burhan.claude Travel Management domain
// model, per .claude/specs/travel_spec.md section 06. Reusable code
// lists and types live in ./common.cds.
namespace burhan.claude;

using {cuid} from '@sap/cds/common';

using burhan.claude.common.AddressType as AddressType from './common';
using burhan.claude.common.Status as Status from './common';
using burhan.claude.common.TravellerType as TravellerType from './common';
using burhan.claude.common.Roles as Roles from './common';

entity Destinations : cuid {
  name        : String(200)  @mandatory  @title: '{i18n>Destinations.name}';
  country     : String(100)  @mandatory  @title: '{i18n>Destinations.country}';
  city        : String(100)  @mandatory  @title: '{i18n>Destinations.city}';
  region      : String(100)  @title: '{i18n>Destinations.region}';
  description : LargeString  @title: '{i18n>Destinations.description}';
}

entity Travellers : cuid {
  firstName        : String(80)     @mandatory            @title: '{i18n>Travellers.firstName}';
  lastName         : String(80)     @mandatory            @title: '{i18n>Travellers.lastName}';
  virtual fullName : String(160)    @Core.Computed        @title: '{i18n>Travellers.fullName}';
  email            : String(120)    @mandatory            @title: '{i18n>Travellers.email}';
  phone            : String(20)     @title: '{i18n>Travellers.phone}';
  addressType      : AddressType    @title: '{i18n>Travellers.addressType}';
  type             : TravellerType  @mandatory            @title: '{i18n>Travellers.type}';
  status           : Status         @mandatory            @title: '{i18n>Travellers.status}';
  userID           : String(100)    @mandatory            @title: '{i18n>Travellers.userID}';
  locations        : Composition of many TravelledLocations
                       on locations.traveller = $self
                                    @title: '{i18n>Travellers.locations}';
  modifiedAt       : Timestamp      @cds.on.insert: $now  @cds.on.update: $now  @title: '{i18n>Travellers.modifiedAt}';
}

annotate Travellers with {
  modifiedAt @odata.etag;
}

entity TravelledLocations : cuid {
  traveller   : Association to Travellers    @mandatory  @title: '{i18n>TravelledLocations.traveller}';
  destination : Association to Destinations  @mandatory  @title: '{i18n>TravelledLocations.destination}';
  travelFrom  : Date                         @mandatory  @title: '{i18n>TravelledLocations.travelFrom}';
  travelTo    : Date                         @mandatory  @title: '{i18n>TravelledLocations.travelTo}';
  notes       : LargeString                  @title: '{i18n>TravelledLocations.notes}';
}

entity Users : cuid {
  loginName : String(120)           @mandatory            @title: '{i18n>Users.loginName}';
  firstName : String(80)            @mandatory            @title: '{i18n>Users.firstName}';
  lastName  : String(80)            @mandatory            @title: '{i18n>Users.lastName}';
  isLocked  : Boolean default false @title: '{i18n>Users.isLocked}';
  createdAt : Timestamp             @cds.on.insert: $now  @title: '{i18n>Users.createdAt}';
  roles     : Composition of many UserRoles
                on roles.user = $self
                                    @title: '{i18n>Users.roles}';
}

entity UserRoles : cuid {
  user : Association to Users  @mandatory  @title: '{i18n>UserRoles.user}';
  role : Association to Roles  @mandatory  @title: '{i18n>UserRoles.role}';
}
