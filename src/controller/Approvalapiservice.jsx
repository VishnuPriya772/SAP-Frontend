import { api } from "./constants";
import axios from "axios";


export const getdetails=async ()=>{
    const response = await axios.get(`${api}/Approval/get_details`);
    return response.data;
};


export const getApprovalView = async (docId) => {
    
      // Send docId as a query parameter
      const response = await axios.get(`${api}/Approval/get_ViewButton`, {
        params: { Doc_ID: docId } 
      });
  
    //   console.log("API Response", response.data); // Log successful response data
      return response.data;
  
    
  };
  
 // Handle approval action (approve/reject/query) for a specific document
export const HandleApprovalAction = async (data) => {
  try {
    // Send docId, action (approve/reject/query), and comment as request payload
    const response = await axios.post(`${api}/Approval/HandleApprovalAction`, 
     data
    );

    return response.data;
  } catch (error) {
    console.error('Error handling approval action:', error.message);
    throw error;
  }
};



  