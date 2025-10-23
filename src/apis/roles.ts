import apiFetch from "@/components/utils/fetchInstance";

// org-create
const createRole = async (Role: any) => {
  try {
    const response = await apiFetch('Roles', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Role),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// org-list
const getAllRoles = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Roles?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-org-data
const getSingleRole = async (id: string) => {
  try {
    const response = await apiFetch(`Roles/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// org-update
const updateRole = async (id: string, Role: any) => {
  try {
    const response = await apiFetch(`Roles/${id}`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(Role),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-org-data
const deleteRole = async (id: string) => {
  try {
    const response = await apiFetch(`Roles/${id}`, {
      method: 'DELETE',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createRole, getAllRoles, getSingleRole, updateRole, deleteRole };
