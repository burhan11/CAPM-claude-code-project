// srv/user-management.ts
// Handlers for UserManagement actions/functions, per
// .claude/specs/travel_spec.md section 03.6 / 07.3.
import cds from '@sap/cds';

export default (srv: cds.ApplicationService) => {
  const { Users, Roles, UserRoles } = srv.entities;

  srv.on('lockUser', async (req: cds.Request) => {
    const { userId } = req.data as { userId: string };
    const user = await SELECT.one.from(Users).where({ ID: userId });
    if (!user) return req.error(404, 'User not found');
    if (user.isLocked) return false;

    await UPDATE(Users).set({ isLocked: true }).where({ ID: userId });
    return true;
  });

  srv.on('unlockUser', async (req: cds.Request) => {
    const { userId } = req.data as { userId: string };
    const user = await SELECT.one.from(Users).where({ ID: userId });
    if (!user) return req.error(404, 'User not found');
    if (!user.isLocked) return false;

    await UPDATE(Users).set({ isLocked: false }).where({ ID: userId });
    return true;
  });

  srv.on('createUser', async (req: cds.Request) => {
    const { firstName, lastName, email, roleId } = req.data as {
      firstName: string; lastName: string; email: string; roleId: string;
    };

    const existing = await SELECT.one.from(Users).where({ loginName: email });
    if (existing) return req.error(409, 'User already exists');

    const role = await SELECT.one.from(Roles).where({ code: roleId });
    if (!role) return req.error(404, 'Role not found');

    await INSERT.into(Users).entries({
      loginName: email,
      firstName,
      lastName,
      isLocked: false
    });
    const newUser = await SELECT.one.from(Users).where({ loginName: email });

    await INSERT.into(UserRoles).entries({
      user_ID: newUser.ID,
      role_code: roleId
    });

    return newUser;
  });

  srv.on('resetPassword', async (req: cds.Request) => {
    const { userId, newPassword } = req.data as { userId: string; newPassword: string };

    if (!newPassword || !newPassword.trim()) {
      return req.error(400, 'Password must not be empty');
    }
    if (newPassword.length < 8) {
      return req.error(400, 'Password must be at least 8 characters');
    }

    const user = await SELECT.one.from(Users).where({ ID: userId });
    if (!user) return req.error(404, 'User not found');

    // Password credentials are owned by the BTP identity provider in
    // production; there is no local password field on Users (spec 6.4).
    return true;
  });

  srv.on('assignRole', async (req: cds.Request) => {
    const { userId, roleId } = req.data as { userId: string; roleId: string };

    const user = await SELECT.one.from(Users).where({ ID: userId });
    if (!user) return req.error(404, 'User not found');

    const role = await SELECT.one.from(Roles).where({ code: roleId });
    if (!role) return req.error(404, 'Role not found');

    const existing = await SELECT.one.from(UserRoles).where({ user_ID: userId, role_code: roleId });
    if (!existing) {
      await INSERT.into(UserRoles).entries({ user_ID: userId, role_code: roleId });
    }
    return true;
  });

  srv.on('unassignRole', async (req: cds.Request) => {
    const { userId, roleId } = req.data as { userId: string; roleId: string };

    const existing = await SELECT.one.from(UserRoles).where({ user_ID: userId, role_code: roleId });
    if (!existing) return req.error(404, 'Role assignment not found');

    await DELETE.from(UserRoles).where({ ID: existing.ID });
    return true;
  });
};
