import apiFetch from "@/components/utils/fetchInstance";

// org-create
const createOrganization = async (organization: any) => {
  try {
    const response = await apiFetch('Organization', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(organization),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// org-list
const getAllOrganization = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Organization?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-org-data
const getSingleOrganization = async (id: string) => {
  try {
    const response = await apiFetch(`Organization/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// org-update
const updateOrganization = async (id: string, organization: any) => {
  try {
    const response = await apiFetch(`Organization`, {
      method: 'PUT',
      headers: {}, // Ensure headers property is present
      body: JSON.stringify(organization),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-org-data
const deleteOrganization = async (id: string) => {
  try {
    const response = await apiFetch(`Organization/${id}`, {
      method: 'DELETE',
      headers: {}, // Ensure headers property is present
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export { createOrganization, getAllOrganization, getSingleOrganization, updateOrganization, deleteOrganization };
