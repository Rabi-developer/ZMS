import apiFetch from "@/components/utils/fetchInstance";

const createInspectionNote = async (InspectionNote: any) => {
  try {
    const response = await apiFetch('InspectionNote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(InspectionNote),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllInspectionNote = async (pageIndex: any = 1, pageSize: any = 10) => {
  try {
    const response = await apiFetch(`InspectionNote?PageIndex=${pageIndex}&PageSize=${pageSize}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getSingleInspectionNote = async (id: string) => {
  try {
    const response = await apiFetch(`InspectionNote/${id}`, {
      method: 'GET',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};
const updateInspectionNote = async (InspectionNote : any) => {
  try {
    const response = await apiFetch(`InspectionNote`, {
      method: 'PUT',
      headers: {},
      body: JSON.stringify(InspectionNote),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const deleteInspectionNote = async (id: string) => {
  try {
    const response = await apiFetch(`InspectionNote/${id}`, {
      method: 'DELETE',
      headers: {},
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

const getAllAccountHierarchy = async () => {
  try {
    const response = await apiFetch(`InspectionNote/allhierarchy`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }, true);
    const transformHierarchy = (accounts: any[]): any[] => {
      return accounts.map(account => ({
        id: account.id,
        listid: account.listid,
        description: account.description,
        parentId: account.parentAccountId,
        children: transformHierarchy(account.children || [])
      }));
    };

    return transformHierarchy(response.data);
  } catch (error: any) {
    throw new Error(`Failed to fetch account hierarchy: ${error.message}`);
  }
};

const updateInspectionNoteStatus = async (InspectionNoteStatus: { id: string; status: string }) => {
  try {
    const response = await apiFetch('InspectionNote/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ Id: InspectionNoteStatus.id, Status: InspectionNoteStatus.status }),
    }, true);
    return response;
  } catch (error: any) {
    throw error;
  }
};

export {
  createInspectionNote,
  getAllInspectionNote,
  getSingleInspectionNote,
  updateInspectionNote,
  deleteInspectionNote,
  getAllAccountHierarchy,
  updateInspectionNoteStatus,
};