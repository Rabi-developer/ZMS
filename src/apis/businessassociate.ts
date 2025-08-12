import apiFetch from "@/components/utils/fetchInstance";

// BusinessAssociate-create
const createBusinessAssociate = async (BusinessAssociate : any) => {
  try {
    const response = await apiFetch('BusinessAssociate', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(BusinessAssociate),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// BusinessAssociate-list
const getAllBusinessAssociate  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`BusinessAssociate?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllBusinessAssociatePositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`BusinessAssociatePositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-BusinessAssociate-data
const getSingleBusinessAssociate  = async (id: string) => {
  try {
    const response = await apiFetch(`BusinessAssociate/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateBusinessAssociate = async (BusinessAssociate: any, data: { name: string; mobile: string; address: string; id?: string | undefined; }) => {
  try {
    const response = await apiFetch(`BusinessAssociate`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(BusinessAssociate),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-BusinessAssociate-data
const deleteBusinessAssociate  = async (id: string) => {
  try {
    const response = await apiFetch(`BusinessAssociate/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateBusinessAssociateStatus = async (BusinessAssociateStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('BusinessAssociate/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: BusinessAssociateStatus.id, Status: BusinessAssociateStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createBusinessAssociate , getAllBusinessAssociate , getAllBusinessAssociatePositions , getSingleBusinessAssociate , updateBusinessAssociate , deleteBusinessAssociate, updateBusinessAssociateStatus  };
