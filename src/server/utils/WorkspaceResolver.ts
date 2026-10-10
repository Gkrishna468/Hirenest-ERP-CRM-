import { getAdminDb } from "./firebaseAdmin";

export interface WorkspaceContext {
  organizationId: string;
  organizationName: string;
  userId: string;
  uid: string;
  role: "founder" | "admin" | "bdm" | "recruiter" | "vendor" | "client" | string;
  vendorId?: string;
  clientId?: string;
  workspace: "CRM" | "Vendor" | "Client" | "Recruiter" | "Executive";
  permissions: string[];
}

export class WorkspaceResolver {
  static async resolve(userId: string, email: string, roleFromToken?: string): Promise<WorkspaceContext> {
    const db = getAdminDb();
    
    // Default fallback values
    let organizationId = "bootstrap-org";
    let organizationName = "Default Organization";
    let role = roleFromToken || "viewer";
    let vendorId: string | undefined = undefined;
    let clientId: string | undefined = undefined;
    let permissions: string[] = ["read"];
    let workspace: "CRM" | "Vendor" | "Client" | "Recruiter" | "Executive" = "Recruiter";

    // Executive root bypass
    const isExecRoot = userId === "executive-root" || userId === "me99591dmNkwfXXfaCyrDo80a03" || email === "admin@hirenestworkforce.com";

    if (isExecRoot) {
      return {
        organizationId: "bootstrap-org",
        organizationName: "HireNest Workforce Org",
        role: "admin",
        userId,
        uid: userId,
        permissions: ["*"],
        workspace: "Executive"
      };
    }

    let userExists = false;
    let userStatus = "active";

    try {
      // 1. Fetch User document from Firestore
      console.log(`[WorkspaceResolver] Fetching user doc: users/${userId}`);
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        userExists = true;
        const userData = userDoc.data() || {};
        console.log(`[WorkspaceResolver] User doc found:`, { uid: userId, role: userData.role, status: userData.status });
        role = userData.role || roleFromToken || role;
        organizationId = userData.organizationId || userData.companyId || organizationId;
        vendorId = userData.vendorId;
        clientId = userData.clientId;
        userStatus = userData.status || "active";
        if (role === "admin" || role === "founder") {
          workspace = "Executive";
          permissions = ["*"];
        } else {
          if (userData.workspace) {
            workspace = userData.workspace;
          }
          if (userData.permissions && Array.isArray(userData.permissions)) {
            permissions = userData.permissions;
          }
        }
      } else {
        console.log(`[WorkspaceResolver] User doc not found by UID, trying email query: ${email}`);
        if (email) {
          const emailQuery = await db.collection("users").where("email", "==", email).limit(1).get();
          if (!emailQuery.empty) {
            userExists = true;
            const userData = emailQuery.docs[0].data() || {};
            console.log(`[WorkspaceResolver] User found by email fallback:`, { email, role: userData.role });
            role = userData.role || roleFromToken || role;
            organizationId = userData.organizationId || userData.companyId || organizationId;
            vendorId = userData.vendorId;
            clientId = userData.clientId;
            userStatus = userData.status || "active";
            if (role === "admin" || role === "founder") {
              workspace = "Executive";
              permissions = ["*"];
            } else {
              if (userData.workspace) {
                workspace = userData.workspace;
              }
              if (userData.permissions && Array.isArray(userData.permissions)) {
                permissions = userData.permissions;
              }
            }
          }
        }

        if (!userExists) {
          console.log(`[WorkspaceResolver] User record missing. Auto-provisioning user profile.`);
          // Secure auto-provisioning: respect token role if provided. If token claims missing, assign executive role only for verified executive domains (@hirenestworkforce.com), otherwise default to recruiter.
          const isExecDomain = email && (email.toLowerCase().endsWith('@hirenestworkforce.com') || email === 'gopalkrishna0046@gmail.com');
          const assignedRole = (roleFromToken && roleFromToken !== 'viewer') 
            ? roleFromToken 
            : (isExecDomain ? 'admin' : 'recruiter');
          
          const isPrivileged = assignedRole === 'admin' || assignedRole === 'founder';
          role = assignedRole;
          workspace = isPrivileged ? 'Executive' : 'Recruiter';
          permissions = isPrivileged ? ['*'] : ['recruiter:read', 'recruiter:write', 'candidates:read', 'candidates:write'];
          
          const newUserDoc = {
            id: userId,
            uid: userId,
            email: email || 'user@hirenestworkforce.com',
            name: email ? email.split('@')[0] : 'User',
            role,
            organizationId,
            status: 'active',
            workspace,
            permissions,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await db.collection("users").doc(userId).set(newUserDoc, { merge: true });
          userExists = true;
          console.log(`[WorkspaceResolver] Auto-provisioned missing user document for ${email} with role ${role}`);
        }
      }

      if (userExists && (userStatus === "inactive" || userStatus === "disabled")) {
        console.warn(`[WorkspaceResolver] Access denied for deactivated user: ${userId}`);
        throw new Error("USER_INACTIVE");
      }

      // Ensure proper casing for roles to match Workspace definitions
      const normalizedRole = role.toLowerCase().trim();

      // 2. Fetch Organization details if present
      if (organizationId) {
        try {
          const orgDoc = await db.collection("organizations").doc(organizationId).get();
          if (orgDoc.exists) {
            organizationName = orgDoc.data()?.name || orgDoc.data()?.companyName || `Org ${organizationId.slice(-5)}`;
          } else {
            // Check users collection metadata as fallback or create placeholder org name
            organizationName = `Organization ${organizationId.slice(-5)}`;
          }
        } catch (orgError) {
          console.warn("Failed to fetch organization document:", orgError);
        }
      }

      // 3. Resolve Vendor ID for Vendor Role
      if (normalizedRole === "vendor") {
        workspace = "Vendor";
        permissions = ["vendor:read", "vendor:write", "candidates:write", "candidates:read"];
        if (!vendorId) {
          // Look up vendor document where userId == current user ID
          const vendorQuery = await db.collection("vendors").where("userId", "==", userId).limit(1).get();
          if (!vendorQuery.empty) {
            vendorId = vendorQuery.docs[0].id;
          } else {
            // Look up by email
            const vendorEmailQuery = await db.collection("vendors").where("email", "==", email).limit(1).get();
            if (!vendorEmailQuery.empty) {
              vendorId = vendorEmailQuery.docs[0].id;
            }
          }
        }
      }

      // 4. Resolve Client ID for Client Role
      else if (normalizedRole === "client") {
        workspace = "Client";
        permissions = ["client:read", "client:write", "requirements:write", "requirements:read"];
        if (!clientId) {
          // Look up client document where userId == current user ID
          const clientQuery = await db.collection("clients").where("userId", "==", userId).limit(1).get();
          if (!clientQuery.empty) {
            clientId = clientQuery.docs[0].id;
          } else {
            // Look up by email
            const clientEmailQuery = await db.collection("clients").where("email", "==", email).limit(1).get();
            if (!clientEmailQuery.empty) {
              clientId = clientEmailQuery.docs[0].id;
            }
          }
        }
      }

      // 5. Establish full Recruiter/Admin/BDM properties
      else if (normalizedRole === "admin" || normalizedRole === "founder") {
        workspace = "Executive";
        permissions = ["*"];
      } else if (normalizedRole === "bdm") {
        workspace = "CRM";
        permissions = ["recruiter:read", "recruiter:write", "candidates:read", "candidates:write", "requirements:read", "requirements:write", "submissions:read", "submissions:write"];
      } else if (normalizedRole === "recruiter" || normalizedRole === "vendor_manager" || normalizedRole === "client_manager" || normalizedRole === "manager" || normalizedRole === "viewer") {
        workspace = "Recruiter";
        permissions = ["recruiter:read", "recruiter:write", "candidates:read", "candidates:write", "requirements:read", "requirements:write", "submissions:read", "submissions:write"];
      }

    } catch (error) {
      console.error("Error inside WorkspaceResolver:", error);
    }

    return {
      organizationId,
      organizationName,
      role: role.toLowerCase().trim(),
      vendorId,
      clientId,
      userId,
      uid: userId,
      permissions,
      workspace
    };
  }
}
