// db/common.cds
// Reusable code lists and reference types shared across the
// burhan.claude domain model (Vacation & Traveller Management).
namespace burhan.claude.common;

using {sap} from '@sap/cds/common';

entity AddressTypes : sap.common.CodeList {
  key code : String(1) @title: '{i18n>AddressTypes.code}';
}

entity TravellerStatus : sap.common.CodeList {
  key code : String(1) @title: '{i18n>TravellerStatus.code}';
}

entity Roles : sap.common.CodeList {
  key code : String(10) @title: '{i18n>Roles.code}';
}

type AddressType : Association to AddressTypes;
type Status      : Association to TravellerStatus;
type Role        : Association to Roles;
