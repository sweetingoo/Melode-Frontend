// Export all API services
export { authService } from "./auth";
export { usersService } from "./users";
export { rolesService } from "./roles";
export { permissionsService } from "./permissions";
export { invitationsService } from "./invitations";
export { customFieldsService } from "./customFields";
export { employeesService } from "./employees";
export { departmentsService } from "./departments";
export { assignmentsService } from "./assignments";
export { clockService } from "./clock";
export { configurationService } from "./configuration";
export { setupService } from "./setup";

// Re-export the main API client and utilities
export { api, apiUtils } from "./api-client";
