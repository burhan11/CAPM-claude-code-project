// srv/catalog-service.ts
// Generic handlers for CatalogService, per .claude/specs/travel_spec.md
// section 04.2 (generic handler pattern) and sections 03/07.
import cds from '@sap/cds';

export default (srv: cds.ApplicationService) => {
  const { Travellers, TravelledLocations, Destinations } = srv.entities;

  srv.before(['CREATE', 'UPDATE'], Travellers, async (req: cds.Request) => {
    const data = req.data as any;

    if ('firstName' in data && !String(data.firstName ?? '').trim()) {
      return req.error(400, 'First name and last name are required');
    }
    if ('lastName' in data && !String(data.lastName ?? '').trim()) {
      return req.error(400, 'First name and last name are required');
    }
    if ('fullName' in data) {
      return req.error(400, 'fullName is computed and cannot be set directly');
    }

    if (data.email) {
      const existing = await SELECT.one.from(Travellers).where({ email: data.email, ID: { '!=': data.ID ?? null } });
      if (existing) return req.error(409, 'Email already registered');
    }
  });

  srv.before('UPDATE', Travellers, (req: cds.Request) => {
    const ifMatch = req.headers?.['if-match'];
    if (!ifMatch) return req.reject(428, 'If-Match header is required');
  });

  srv.before('READ', Travellers, (req: cds.Request) => {
    const refsFullName = (node: any): boolean => {
      if (!node) return false;
      if (Array.isArray(node)) return node.some(refsFullName);
      if (node.ref?.includes('fullName')) return true;
      if (node.xpr) return refsFullName(node.xpr);
      return false;
    };
    const { where, orderBy } = req.query?.SELECT ?? {};
    if (refsFullName(where) || refsFullName(orderBy)) {
      return req.reject(400, 'fullName is computed and cannot be filtered or sorted on');
    }
  });

  srv.after('READ', Travellers, (data: any) => {
    if (Array.isArray(data)) data.forEach(enrichFullName);
    else enrichFullName(data);
  });

  srv.before('CREATE', TravelledLocations, async (req: cds.Request) => {
    const data = req.data as any;
    if (!data.travelFrom || !data.travelTo) return;

    if (data.travelFrom > data.travelTo) {
      return req.error(400, 'Travel start date must be before end date');
    }

    const travellerID = data.traveller_ID ?? data.traveller?.ID;
    if (!travellerID) return;

    const overlapping = await SELECT.one.from(TravelledLocations).where({
      traveller_ID: travellerID,
      travelFrom: { '<=': data.travelTo },
      travelTo: { '>=': data.travelFrom }
    });
    if (overlapping) {
      return req.error(409, 'Traveller already has a trip during srv date range');
    }
  });

  srv.on('UPDATE', Destinations, (req: cds.Request) => req.reject(405, 'Destinations cannot be updated'));
  srv.on('DELETE', Destinations, (req: cds.Request) => req.reject(405, 'Destinations cannot be deleted'));
};



const enrichFullName = (d: any) => {
  if (d) d.fullName = `${(d.firstName || '').trim()} ${(d.lastName || '').trim()}`.trim();
};
