import { AuthUser } from "@ca-saas/shared-types";
import { prisma } from "./db";
import { ForbiddenError } from "../middleware/errorHandler";

/**
 * Returns Prisma filter condition for row-level scoping.
 * SuperAdmin and Admin have full access to all firm clients.
 * Client users or restricted staff are scoped only to their own client profile.
 */
export function scopeToAssignedClients(user: AuthUser, query: Record<string, any> = {}) {
  if (user.role === "SuperAdmin" || user.role === "Admin") {
    return query;
  }

  // Scoped to client matching contact email or assigned staff
  return {
    ...query,
    OR: [
      { contactEmail: user.email },
      { assignedStaffId: user.id }
    ]
  };
}

/**
 * Verifies whether the authenticated user has authorization to access a specific client.
 * Throws ForbiddenError if access is denied.
 */
export async function verifyClientAccess(user: AuthUser, clientId: string) {
  if (user.role === "SuperAdmin" || user.role === "Admin") {
    return true;
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      OR: [
        { contactEmail: user.email },
        { assignedStaffId: user.id }
      ]
    }
  });

  if (!client) {
    throw new ForbiddenError("You are not authorized to view or manage documents for this client.");
  }

  return true;
}
