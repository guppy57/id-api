import { RolesOnAccounts } from '@prisma/client';

export default async function compareRoles(
  rolesOnAccount: RolesOnAccounts[],
  rolesToVerify: string[],
): Promise<boolean> {
  if (rolesOnAccount.length === 0) {
    return false;
  }

  const rolesOnAccountIds: string[] = rolesOnAccount.map((role) => role.rid);

  const numberOfRolesToVerify = rolesToVerify.length;
  let numberOfRolesVerified = 0;

  rolesToVerify.forEach((role) => {
    if (rolesOnAccountIds.includes(role)) {
      numberOfRolesVerified++;
    }
  });

  if (numberOfRolesVerified === numberOfRolesToVerify) return true;
  else return false;
}
