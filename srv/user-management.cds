// srv/user-management.cds
// Admin-only user & role lifecycle service per
// .claude/specs/travel_spec.md section 02.2 / 03.6 / 05.
using burhan.claude as my from '../db/schema';
using burhan.claude.common as common from '../db/common';

@requires: 'Admin'
service UserManagement @(path: 'user-management') {
  entity Users     as projection on my.Users;
  entity Roles     as projection on common.Roles;
  entity UserRoles as projection on my.UserRoles;

  function lockUser(userId : String)   returns Boolean;
  function unlockUser(userId : String) returns Boolean;

  action createUser(firstName : String, lastName : String, email : String, roleId : String) returns Users;
  action resetPassword(userId : String, newPassword : String) returns Boolean;
  action assignRole(userId : String, roleId : String)   returns Boolean;
  action unassignRole(userId : String, roleId : String) returns Boolean;
}
