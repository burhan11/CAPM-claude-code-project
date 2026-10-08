// srv/catalog-service.cds
// Travel data service per .claude/specs/travel_spec.md section 02.1 / 05.
using burhan.claude as my from '../db/schema';
using burhan.claude.common as common from '../db/common';

@requires: 'authenticated-user'
service CatalogService @(path: 'catalog') {
  @odata.draft.enabled
  entity Travellers         as projection on my.Travellers;
  entity TravellerTypes     as projection on common.TravellerTypes;
  entity TravelledLocations as projection on my.TravelledLocations;
  entity Destinations       as projection on my.Destinations;
  entity TravellerStatus    as projection on common.TravellerStatus;
  entity AddressTypes       as projection on common.AddressTypes;
}

// Row-Level Security

annotate CatalogService.Travellers with @restrict: [
  // Traveller: edit own record only (no create/delete)
  { grant: ['READ', 'UPDATE'], to: 'Traveller', where: 'userID = $user' },
  // Admin: full create/edit/delete on all travellers
  { grant: ['READ', 'CREATE', 'UPDATE'], to: 'Admin' }
];

annotate CatalogService.TravelledLocations with @restrict: [
  // Traveller: full create/edit/delete on own locations
  { grant: ['READ', 'CREATE', 'UPDATE'], to: 'Traveller', where: 'traveller.userID = $user' },
  // Admin: read-only
  { grant: 'READ', to: 'Admin' }
];

// Destinations: Create + Read is open to any authenticated user (spec 3.4);
// Update/Delete are explicitly rejected with 405 in catalog-service.ts,
// since @restrict would short-circuit those verbs with 403 before the
// handler runs.

annotate CatalogService.TravellerTypes with @readonly;
annotate CatalogService.TravellerStatus with @readonly;
annotate CatalogService.AddressTypes with @readonly;
