import apiFetch from "@/components/utils/fetchInstance";

// Munshyana-create
const createMunshyana = async (Munshyana : any) => {
  try {
    const response = await apiFetch('Munshyana', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Munshyana),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Munshyana-list
const getAllMunshyana  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Munshyana?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllMunshyanaPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`MunshyanaPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Munshyana-data
const getSingleMunshyana  = async (id: string) => {
  try {
    const response = await apiFetch(`Munshyana/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateMunshyana = async (Munshyana: any) => {
  try {
    const response = await apiFetch(`Munshyana`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Munshyana),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Munshyana-data
const deleteMunshyana  = async (id: string) => {
  try {
    const response = await apiFetch(`Munshyana/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateMunshyanaStatus = async (MunshyanaStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Munshyana/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: MunshyanaStatus.id, Status: MunshyanaStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createMunshyana , getAllMunshyana , getAllMunshyanaPositions , getSingleMunshyana , updateMunshyana , deleteMunshyana, updateMunshyanaStatus  };
