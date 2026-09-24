using CatalogService as service from '../../srv/catalog-service';

// ---------------------------------------------------------------------------
// Travellers - List Report (filter bar + table)
// ---------------------------------------------------------------------------
annotate service.Travellers with @(
  UI.HeaderInfo         : {
    TypeName      : 'Traveller',
    TypeNamePlural: 'Travellers',
    Title         : {Value: fullName},
    Description   : {Value: email}
  },

  UI.SelectionFields    : [
    firstName,
    lastName,
    email,
    type_code,
    status_code,
    addressType_code
  ],

  UI.LineItem           : [
    {Value: firstName,        @UI.Importance: #High},
    {Value: lastName,         @UI.Importance: #High},
    {Value: fullName,         @UI.Importance: #Medium},
    {Value: email,            @UI.Importance: #High},
    {Value: phone,            @UI.Importance: #Medium},
    {Value: addressType_code, @UI.Importance: #Low},
    {Value: type_code,        @UI.Importance: #High},
    {Value: status_code,      @UI.Importance: #High},
    {Value: userID,           @UI.Importance: #Low},
    {Value: modifiedAt,       @UI.Importance: #Low}
  ],

  // ---- Object Page ------------------------------------------------------
  UI.Facets             : [
    {
      $Type : 'UI.CollectionFacet',
      ID    : 'GeneralInfo',
      Label : 'General Information',
      Facets: [
        {$Type: 'UI.ReferenceFacet', ID: 'PersonalData', Label: 'Personal Data', Target: '@UI.FieldGroup#PersonalData'},
        {$Type: 'UI.ReferenceFacet', ID: 'ContactData',  Label: 'Contact',       Target: '@UI.FieldGroup#ContactData'},
        {$Type: 'UI.ReferenceFacet', ID: 'Classification', Label: 'Classification', Target: '@UI.FieldGroup#Classification'}
      ]
    },
    {
      $Type : 'UI.ReferenceFacet',
      ID    : 'LocationsFacet',
      Label : 'Travelled Locations',
      Target: 'locations/@UI.LineItem'
    }
  ],

  UI.FieldGroup #PersonalData    : {Data: [
    {Value: firstName},
    {Value: lastName},
    {Value: userID}
  ]},

  UI.FieldGroup #ContactData     : {Data: [
    {Value: email},
    {Value: phone},
    {Value: addressType_code}
  ]},

  UI.FieldGroup #Classification  : {Data: [
    {Value: type_code},
    {Value: status_code}
  ]},

  UI.HeaderFacets       : [
    {$Type: 'UI.ReferenceFacet', ID: 'HdrStatus', Target: '@UI.FieldGroup#HeaderStatus'}
  ],

  UI.FieldGroup #HeaderStatus    : {Data: [
    {Value: type_code},
    {Value: status_code},
    {Value: modifiedAt}
  ]}
);

// Code-list fields: show the description, offer a value help (filter + edit).
annotate service.Travellers with {
  type             @(
    Common.Text                    : type.name,
    Common.TextArrangement         : #TextOnly,
    Common.ValueListWithFixedValues: true,
    Common.ValueList               : {
      CollectionPath: 'TravellerTypes',
      Parameters    : [
        {$Type: 'Common.ValueListParameterInOut',       LocalDataProperty: type_code, ValueListProperty: 'code'},
        {$Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name'}
      ]
    }
  );
  status           @(
    Common.Text                    : status.name,
    Common.TextArrangement         : #TextOnly,
    Common.ValueListWithFixedValues: true,
    Common.ValueList               : {
      CollectionPath: 'TravellerStatus',
      Parameters    : [
        {$Type: 'Common.ValueListParameterInOut',       LocalDataProperty: status_code, ValueListProperty: 'code'},
        {$Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name'}
      ]
    }
  );
  addressType      @(
    Common.Text                    : addressType.name,
    Common.TextArrangement         : #TextOnly,
    Common.ValueListWithFixedValues: true,
    Common.ValueList               : {
      CollectionPath: 'AddressTypes',
      Parameters    : [
        {$Type: 'Common.ValueListParameterInOut',       LocalDataProperty: addressType_code, ValueListProperty: 'code'},
        {$Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name'}
      ]
    }
  );
};

// ---------------------------------------------------------------------------
// TravelledLocations - composition table on the Traveller object page and
// its own sub object page (route: Travellers({key})/locations({key2}))
// ---------------------------------------------------------------------------
annotate service.TravelledLocations with @(
  UI.HeaderInfo      : {
    TypeName      : 'Travelled Location',
    TypeNamePlural: 'Travelled Locations',
    Title         : {Value: destination.name},
    Description   : {Value: destination.country}
  },

  UI.LineItem        : [
    {Value: destination_ID, @UI.Importance: #High},
    {Value: travelFrom,     @UI.Importance: #High},
    {Value: travelTo,       @UI.Importance: #High},
    {Value: notes,          @UI.Importance: #Low}
  ],

  UI.Facets          : [
    {$Type: 'UI.ReferenceFacet', ID: 'TripDetails', Label: 'Trip Details', Target: '@UI.FieldGroup#TripDetails'},
    {$Type: 'UI.ReferenceFacet', ID: 'TripNotes',   Label: 'Notes',        Target: '@UI.FieldGroup#TripNotes'}
  ],

  UI.FieldGroup #TripDetails : {Data: [
    {Value: destination_ID},
    {Value: travelFrom},
    {Value: travelTo}
  ]},

  UI.FieldGroup #TripNotes   : {Data: [
    {Value: notes}
  ]}
);

annotate service.TravelledLocations with {
  destination @(
    Common.Text         : destination.name,
    Common.TextArrangement: #TextOnly,
    Common.ValueList    : {
      CollectionPath: 'Destinations',
      Parameters    : [
        {$Type: 'Common.ValueListParameterInOut',       LocalDataProperty: destination_ID, ValueListProperty: 'ID'},
        {$Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name'},
        {$Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'city'},
        {$Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'country'}
      ]
    }
  );
};
