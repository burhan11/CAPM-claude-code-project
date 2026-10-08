// srv/catalog-service.ts
// Generic handlers for CatalogService, per .claude/specs/travel_spec.md
// section 04.2 (generic handler pattern) and sections 03/07.
import cds from '@sap/cds';

export default (srv: cds.ApplicationService) => {
  const { Travellers, TravelledLocations } = srv.entities;

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

  // userID is the ownership key: only Admin may change it
  srv.before('UPDATE', [Travellers, Travellers.drafts], async (req: cds.Request) => {
    const data = req.data as any;
    if (!('userID' in data) || req.user.is('Admin')) return;
    const param = req.params?.at(-1) as any;
    const key = param?.ID ?? param;
    const existing = key && await SELECT.one.from(Travellers.drafts).columns('userID').where({ ID: key });
    if (existing?.userID !== data.userID) return req.reject(403, 'Only Admin can change userID');
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

  // A Traveller may only create locations under their own traveller record
  srv.before('CREATE', TravelledLocations, async (req: cds.Request) => {
    if (req.user.is('Admin')) return;
    const data = req.data as any;
    const travellerID = data.traveller_ID ?? data.traveller?.ID;
    const own = travellerID && await SELECT.one.from(Travellers).columns('ID').where({ ID: travellerID, userID: req.user.id });
    if (!own) return req.reject(403, 'Travellers can only create their own travelled locations');
  });

  srv.before(['CREATE', 'UPDATE'], TravelledLocations, async (req: cds.Request) => {
    const data = req.data as any;
    const isUpdate = req.event === 'UPDATE';
    const param = req.params?.at(-1) as any;
    const key = isUpdate ? (param?.ID ?? param) : undefined;

    // On UPDATE the payload may be partial: merge with the stored row
    const existing = isUpdate && key ? await SELECT.one.from(TravelledLocations).where({ ID: key }) : undefined;
    const travelFrom = data.travelFrom ?? existing?.travelFrom;
    const travelTo = data.travelTo ?? existing?.travelTo;
    if (!travelFrom || !travelTo) return;

    if (travelFrom > travelTo) {
      return req.error(400, 'Travel start date must be before end date');
    }

    if (isUpdate && data.traveller_ID && existing && data.traveller_ID !== existing.traveller_ID) {
      return req.error(400, 'Traveller of a travelled location cannot be changed');
    }

    const travellerID = data.traveller_ID ?? data.traveller?.ID ?? existing?.traveller_ID;
    if (!travellerID) return;

    const overlapping = await SELECT.one.from(TravelledLocations).where({
      traveller_ID: travellerID,
      ...(key ? { ID: { '!=': key } } : {}),
      travelFrom: { '<=': travelTo },
      travelTo: { '>=': travelFrom }
    });
    if (overlapping) {
      return req.error(409, 'Traveller already has a trip during this date range');
    }
  });

};



const enrichFullName = (d: any) => {
  if (d) d.fullName = `${(d.firstName || '').trim()} ${(d.lastName || '').trim()}`.trim();
};
