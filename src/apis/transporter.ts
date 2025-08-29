import apiFetch from "@/components/utils/fetchInstance";

// Transporter-create
const createTransporter = async (Transporter : any) => {
  try {
    const response = await apiFetch('Transporter', {
      method: 'POST',
      headers: {}, 
      body: JSON.stringify(Transporter),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// Transporter-list
const getAllTransporter  = async (pageIndex:any=1,pageSize:any=10) => {
  try {
    const response = await apiFetch(`Transporter?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllTransporterPositions = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`TransporterPositions?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// get-single-Transporter-data
const getSingleTransporter  = async (id: string) => {
  try {
    const response = await apiFetch(`Transporter/${id}`, {
      method: 'GET',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const updateTransporter = async (Transporter: any, data?: { name?: string; currency?: string; address?: string; city?: string; zipCode?: string; id?: string; state?: string; bankName?: string; tel?: string; ntn?: string; mobile?: string; stn?: string; fax?: string; buyerCode?: string; email?: string; website?: string; }) => {
  try {
    const response = await apiFetch(`Transporter`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(Transporter),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

// delete-single-Transporter-data
const deleteTransporter  = async (id: string) => {
  try {
    const response = await apiFetch(`Transporter/${id}`, {
      method: 'DELETE',
      headers: {}, 
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }   
};
const updateTransporterStatus = async (TransporterStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('Transporter/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: TransporterStatus.id, Status: TransporterStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
export { createTransporter , getAllTransporter , getAllTransporterPositions , getSingleTransporter , updateTransporter , deleteTransporter, updateTransporterStatus  };
