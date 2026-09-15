// db/schema.cds
// Business entities for the burhan.claude Vacation & Traveller
// Management domain model. Reusable code lists and types live in
// ./common.cds.
namespace burhan.claude;

using {
  cuid,
  Currency,
  managed
} from '@sap/cds/common';

using burhan.claude.common.AddressType as AddressType from './common';
using burhan.claude.common.Status as Status from './common';
using burhan.claude.common.Role as Role from './common';

entity Destinations : cuid {
  address    : String(255)               @title: '{i18n>Destinations.address}';
  city       : String(40)                @title: '{i18n>Destinations.city}';
  postalCode : String(8)                 @title: '{i18n>Destinations.postalCode}';
  country    : String(40)                @title: '{i18n>Destinations.country}';
  traveller  : Association to Travellers @title: '{i18n>Destinations.traveller}';
}

entity Travellers : cuid, managed {
  userName  : String(255)                 @mandatory  @title: '{i18n>Travellers.userName}';
  firstName : String(255)                 @title: '{i18n>Travellers.firstName}';
  lastName  : String(255)                 @title: '{i18n>Travellers.lastName}';
  contacts  : Composition of many Contacts
                on contacts.traveller = $self
                                          @title: '{i18n>Travellers.contacts}';
  gender    : String(10)                  @title: '{i18n>Travellers.gender}';
  age       : Integer                     @title: '{i18n>Travellers.age}';
  status    : Status default 'A'          @title: '{i18n>Travellers.status}';
  createdBy : String(40)                  @title: '{i18n>Travellers.createdBy}';
  address   : Composition of Destinations @title: '{i18n>Travellers.address}';
  vacations : Composition of many Vacations
                on vacations.traveller = $self
                                          @title: '{i18n>Travellers.vacations}';
}

annotate Travellers with {
  modifiedAt @odata.etag;
}

entity Contacts : cuid {
  type      : AddressType               @title: '{i18n>Contacts.type}';
  address   : String(255)               @title: '{i18n>Contacts.address}';
  traveller : Association to Travellers @title: '{i18n>Contacts.traveller}';
}

entity Vacations : cuid {
  name        : String(255)               @title: '{i18n>Vacations.name}';
  budget      : Decimal(10, 2)            @title: '{i18n>Vacations.budget}';
  currency    : Currency                  @title: '{i18n>Vacations.currency}';
  description : String(1024)              @title: '{i18n>Vacations.description}';
  startsAt    : DateTime                  @title: '{i18n>Vacations.startsAt}';
  endsAt      : DateTime                  @title: '{i18n>Vacations.endsAt}';
  traveller   : Association to Travellers @title: '{i18n>Vacations.traveller}';
}

entity AppUsers : cuid, managed {
  userName    : String(100)               @mandatory  @title: '{i18n>AppUsers.userName}';
  email       : String(255)               @mandatory  @title: '{i18n>AppUsers.email}';
  fullName    : String(255)               @title: '{i18n>AppUsers.fullName}';
  role        : Role                      @title: '{i18n>AppUsers.role}';
  isActive    : Boolean default true      @title: '{i18n>AppUsers.isActive}';
  lastLoginAt : DateTime                  @title: '{i18n>AppUsers.lastLoginAt}';
  traveller   : Association to Travellers @title: '{i18n>AppUsers.traveller}';
}
