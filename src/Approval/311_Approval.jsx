import React, { useState, useEffect } from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
} from "@mui/x-data-grid";
import IconButton from '@mui/material/IconButton';
import {
  Modal,
  Box,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,

} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close'; // For CloseIcon
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder'; // For QueryBuilderIcon
import axios from 'axios';
//import * as XLSX from 'xlsx';
import * as XLSX from 'sheetjs-style';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { getdetails, getApprovalView, HandleApprovalAction, getPlants, getRole, get311ApprovalView, DownloadAllExcel } from '../controller/Approval311apiservice';
import { decryptSessionData } from "../controller/StorageUtils"
import DownloadIcon from '@mui/icons-material/Download';


import VisibilityIcon from "@mui/icons-material/Visibility";

const Approval311 = () => {
  // State to control the visibility of the modal
  const [openViewModal, setOpenViewModal] = useState(false);
  const [PlantTable, setPlantTable] = useState([]);
  const [RoleTable, setRoleTable] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);

  const [originalRows, setOriginalRows] = useState([]);
  const [data, setData] = useState([]);

  const [Comment, setComment] = useState('');
  // To manage the comment state

  const [openActionModal, setOpenActionModal] = useState(false); // For action modal visibility


  // State to store text entered in the search box
  const [searchText, setSearchText] = useState('');
  const [rows, setRows] = useState([]);
  const [User_Level, setUser_Level] = useState("");

  // Function to open the view modal


  //ApprovalListView
  const [Role, setRole] = useState('');
  const UserID = localStorage.getItem('UserID');
  const RoleID = localStorage.getItem('RoleID');
  const Approval_Level = localStorage.getItem('Approval_Level');
  console.log('Approval_Level', Approval_Level)
  const Plant_ID = localStorage.getItem('Plant_ID')

  console.log('pl', Plant_ID)

  //ApprovalListView (View approver status)
  const [openViewStatusModal, setOpenViewStatusModal] = useState(false);
  const [viewStatusData, setViewStatusData] = useState([]);


  useEffect(() => {
    const encryptedData = sessionStorage.getItem('userData');
    if (encryptedData) {
      const decryptedData = decryptSessionData(encryptedData);
      setRole(decryptedData.RoleId);
      console.log("us", decryptedData.RoleId)
      setUser_Level(decryptedData.UserLevelName)
      console.log("userlevel", decryptedData.UserLevelName)
    }
  }, []);


  const handleViewStatus = async (docId) => {
    console.log("Fetching approval status for Doc_ID:", docId);
    try {
      const response = await get311ApprovalView(docId);  // Make sure get309ApprovalView is set up properly
      console.log("API Response:", response);
      setViewStatusData(response);  // Update your state with the fetched data
    } catch (error) {
      console.error("❌ Error fetching grouped records:", error);
      setViewStatusData([]);  // Handle errors and reset data
    }
  };





  const handleOpenViewStatusModal = async (rowData) => {
    const docId = rowData?.Doc_ID; // ✅ Get only Doc_ID
    console.log("Opening View Status Modal for Doc_ID:", docId);

    setOpenViewStatusModal(true);
    await handleViewStatus(docId); // ✅ Pass only Doc_ID to API call
  };



  //console.log('📤 Sending request to backend with params:', { Plant, Role });

  const handleOpenViewModal = async (item) => {
    console.log("Opening modal with item:", item);

    // Make sure Doc_ID exists and is numeric
    if (!item.Doc_ID || isNaN(item.Doc_ID)) {
      console.error("❌ Invalid Doc_ID:", item.Doc_ID);
      return;
    }

    await getViewButton(item.Doc_ID);  // ✅ Load the data BEFORE showing the modal
    setOpenViewModal(true);            // ✅ Show modal AFTER data is loaded
  };


  const handleCloseViewModal = () => {
    setOpenViewModal(false);  // Closes the modal
  };

  // Function to handle search input (you can implement filtering here)

  const handleSearch = () => {
    const text = searchText.trim().toLowerCase();

    if (!text) {
      setRows(originalRows);
    } else {
      const filteredRows = originalRows.filter((row) =>
        [
          "Plant_Code",
          "Doc_ID",
          "Date",
          "Movement_ID",
          "Request_By",
          "Approver_Status"
        ].some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(text);
        })
      );
      setRows(filteredRows);
    }
  };
  // Table columns for DataGrid
  const columns = [
    { field: "Plant_Code", headerName: "Plant Code", flex: 1 },
    { field: "Doc_ID", headerName: "Doc ID ", flex: 1 },
    { field: "Date", headerName: "Date", flex: 1 },
    { field: "Movement_ID", headerName: "Movement Type", flex: 1 },
    { field: "Requested_By", headerName: "Requset By", flex: 1 },
    { field: "Approver_Status", headerName: "Approver Status", flex: 1 },

    // // View Column
    // {
    //   field: "view",
    //   headerName: "View",
    //   flex: 1,
    //   sortable: false,
    //   renderCell: (params) => (
    //     <div style={{ display: "flex", justifyContent: "center" }}>
    //       <IconButton
    //         size="large"
    //         color="primary"
    //         onClick={() => handleOpenViewModal(params.row)} // Pass row data to the view modal
    //       >
    //         <VisibilityIcon fontSize="small" />
    //       </IconButton>
    //     </div>
    //   ),
    // },
    // Approve Column
    {
      field: "action",
      headerName: "Action",
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
          {/* Approve Button */}
          <IconButton
            size="large"
            color="success"
            onClick={() => handleActionOpen(params.row)}
            title="Approve"
          >
            <CheckCircleIcon fontSize="small" />
          </IconButton>

          {/* Download Button */}
          <IconButton
            size="large"
            color="primary"
            onClick={() => handleDownloadAllExcel(params.row.Doc_ID)} // ✅ only pass the docId
            title="Download"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>

        </div>
      ),
    }


  ];

  // ✅ Custom Toolbar
  const CustomToolbar = () => (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
    </GridToolbarContainer>
  );


  const get_Plant = async () => {
    try {
      const response = await getPlants();
      setPlantTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const GetRole = async () => {
    try {
      const response = await getRole();
      setRoleTable(response.data);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };


  const getData = async () => {
    try {
      const response = await getdetails(Plant_ID, RoleID, Role);

      console.log('response 311', response);  // Check the structure of response
      setData(response);  // Ensure that this is correctly setting the data
      setOriginalRows(response); // for reference during search
      setRows(response);

    } catch (error) {
      console.error(error);
      setData([]);  // Handle error by setting empty data
      setOriginalRows([]); // handle error case
      setRows([]);
    }
  };

  const getViewButton = async (docId) => {
    try {
      const response = await getApprovalView(docId);

      setSelectedRow(response); // Set grouped records

    } catch (error) {

      setSelectedRow([]); // Fallback to empty array
    }
  };

  //view docid detail for Particular DocID Particular row  download
  const handleDownloadExcelRowView = (row) => {
    if (!row) {
      alert("No data available to export.");
      return;
    }

    const DataColumns = [
      "Doc_ID", "Plant_Code", "Material_Code", "Quantity", "SLoc_Code", "CostCenter_Code",
      "Movement_Code", "Valuation_Type", "Batch", "Rate_Unit", "Reason_For_Movt",
      "Approval_Status"
    ];

    const filteredData = [{
      Doc_ID: row.Doc_ID || '',
      Plant_Code: row.Plant_Code || '',
      Material_Code: row.Material_Code || '',
      Quantity: row.Qty || '',
      SLoc_Code: row.SLoc_Code || '',
      CostCenter_Code: row.CostCenter_Code || '',
      Movement_Code: row.Movement_Code || '',
      Valuation_Type: row.Valuation_Type || '',
      Batch: row.Batch || '',
      Rate_Unit: row.Rate_PerPart || '',
      Reason_For_Movt: row.Remarks || '',
      Approval_Status: row.Approval_Status || ''
    }];

    const worksheet = XLSX.utils.json_to_sheet(filteredData, { header: DataColumns });

    // Style header
    DataColumns.forEach((_, index) => {
      const cellAddress = XLSX.utils.encode_cell({ c: index, r: 0 });
      if (worksheet[cellAddress]) {
        worksheet[cellAddress].s = {
          font: { bold: true, color: { rgb: "000000" } },
          fill: { fgColor: { rgb: "FFFF00" } },
          alignment: { horizontal: "center" },
        };
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Row_Details");

    XLSX.writeFile(workbook, `Trn311Movt_${row.Doc_ID || 'Row'}.xlsx`);

    alert("Refer To The XLSX sheet For The Particular DocID Details.");
  };


  //view detail for Particular DocID Details ... download


  const handleDownloadAllExcel = async (DocID) => {
    try {
      const response = await DownloadAllExcel(DocID);
      console.log('Data from API:', response.data);

      if (!response.data || response.data.length === 0) {
        alert('No data available to download.');
        return;
      }

      const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
      const fileExtension = ".xlsx";
      const fileName = "Trn 311 Movement List";

      // Create worksheet from JSON data
      const ws = XLSX.utils.json_to_sheet(response.data);

      // Style headers - row 0
      const headers = Object.keys(response.data[0] || {});
      headers.forEach((_, colIdx) => {
        const cellAddress = XLSX.utils.encode_cell({ c: colIdx, r: 0 });
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "000000" } },
            fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
            alignment: { horizontal: "center" },
          };
        }
      });

      // Create workbook and add worksheet
      const wb = { Sheets: { data: ws }, SheetNames: ["data"] };

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      // Create Blob and trigger download
      const data = new Blob([excelBuffer], { type: fileType });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName + fileExtension);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("File downloaded successfully! View The Particular DocID Details ...");
    } catch (error) {
      console.error("Download failed:", error);

      if (error.response) {
        alert(`Error: ${error.response.data.message || 'Unknown backend error'}`);
      } else if (error.request) {
        alert('No response from server. Please try again later.');
      } else {
        alert(`Error: ${error.message}`);
      }
    }
  };



  useEffect(() => {
    getData();
  }, []);


  // Handle action buttons
  const handleApprove = async () => {
    // Ensure there's a selected row to approve
    if (!selectedRow) {
      alert("No document selected for approval.");
      return;
    }


    // Prepare the data object to send for approval
    const data = {
      Doc_ID: selectedRow.Doc_ID,
      Approver_Comment: Comment,
      Action: "Approved",
      UserID: UserID,
      Approval_Level: Role,  // Current approval level
    };


    console.log('Sending approval data:', data);

    try {
      // Call the HandleApprovalAction API to process the approval
      const response = await HandleApprovalAction(data);

      console.log('sdfg', response);

      // Check for success in the response
      if (response && response.success && response.success) {
        alert("Document Approved!");
        setOpenActionModal(false);  // Close the modal after successful approval
        getData();  // Refresh the data/grid after approval
      } else {
        alert(response.message || "Approval Failed.");
      }
    } catch (error) {
      console.error("Approval error:", error);

      // Provide specific error message if available
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("An error occurred while approving the document.");
      }
    }
  };

  const handleReject = async () => {
    if (!selectedRow) {
      alert("No document selected for rejection.");
      return;
    }

    if (!Comment.trim()) {
      alert("Please provide a comment for rejection.");
      return;
    }

    const data = {
      Doc_ID: selectedRow.Doc_ID,
      Approver_Comment: Comment,
      Action: "Rejected",
      UserID: UserID,
      Approval_Level: Role
    };

    console.log("Sending rejection data:", data);

    try {
      const response = await HandleApprovalAction(data);
      console.log("Rejection API response:", response);

      const isSuccess = response?.data?.success ?? response?.success;

      if (isSuccess) {
        alert("Document Rejected!");
        setOpenActionModal(false);
        getData();
      } else {
        const message = response?.data?.message ?? response?.message ?? "Rejection failed.";
        alert(message);
      }
    } catch (error) {
      console.error("Rejection error:", error);
      const errMsg = error.response?.data?.message || "An error occurred while rejecting the document.";
      alert(errMsg);
    }
  };


  const handleQuery = async () => {
    if (!selectedRow) {
      alert("No document selected for query.");
      return;
    }

    if (!Comment.trim()) {
      alert("Please provide a comment for query.");
      return;
    }

    const data = {
      Doc_ID: selectedRow.Doc_ID,
      Approver_Comment: Comment,
      Action: "Under Query",
      UserID: UserID,
      Approval_Level: Role
    };

    console.log("Sending query data:", data);

    try {
      const response = await HandleApprovalAction(data);
      console.log("Query API response:", response);

      const isSuccess = response?.data?.success ?? response?.success;

      if (isSuccess) {
        alert("Document sent for query successfully!");
        setOpenActionModal(false);
        getData();
      } else {
        const message = response?.data?.message ?? response?.message ?? "Failed to send query.";
        alert(message);
      }
    } catch (error) {
      console.error("Query error:", error);
      const errMsg = error.response?.data?.message || "An error occurred while sending query on the document.";
      alert(errMsg);
    }
  };



  const handleActionOpen = (row) => {
    console.log('Row selected for action:', row);
    setSelectedRow(row);  // Store selected row to pass to the modal
    setOpenActionModal(true);  // Open the action modal
  };


  const handleCancel = () => {
    setOpenActionModal(false); // Simply close the modal without doing anything
  };


  const thStyle = {
    padding: "8px",
    borderBottom: "1px solid #ccc",
    textAlign: "left",
  };

  const tdStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee",
  };


  return (
    <div
      style={{
        padding: 20,
        backgroundColor: "#F5F5F5",
        marginTop: "50px",
        display: "flex",
        flexDirection: "column",
        maxHeight: "100%",
        overflowY: "auto",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "#2e59d9",
            textDecoration: "underline",
            textDecorationColor: "limegreen",
            marginBottom: -7,
            textDecorationThickness: '3px',
            textUnderlineOffset: "6px",
          }}
        >
          311 Approval
        </h2>
      </div>

      {/* Search and Filter Section */}
      {/* Search Box */}
      <div style={{ display: "flex", gap: "10px" }}>
        <TextField
          size="small"
          variant="outlined"
          placeholder="Type here..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyUp={handleSearch}
          style={{ width: "400px" }}
        />
        <Button
          onClick={handleSearch}
          style={{
            borderRadius: "25px",
            border: "2px solid skyblue",
            color: "skyblue",
            fontWeight: "bold",
            textTransform: "none",
          }}
        >
          <SearchIcon style={{ marginRight: "5px" }} />
          Search
        </Button>
      </div>

      {/* ✅ DataGrid */}
      <div
        style={{
          flexGrow: 1,  // Ensures it grows to fill the remaining space
          backgroundColor: "#fff",
          borderRadius: 8,
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          height: "500px"
        }}
      >

        <DataGrid
          rows={rows}
          columns={columns}
          pageSize={5}
          getRowId={(row) => row.Doc_ID} // Ensure Trn_309_ID is unique and exists
          rowsPerPageOptions={[5]}
          disableSelectionOnClick
          slots={{ toolbar: CustomToolbar }}
          sx={{
            // Header Style
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: '#bdbdbd',
              color: "black", //"white",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              fontSize: "16px",
              //fontWeight: "bold",
            },
            "& .MuiDataGrid-row": {
              backgroundColor: "#f5f5f5", // Default row background
              "&:hover": {
                backgroundColor: "#f5f5f5",
              },
            },
            // ✅ Remove Selected Row Background
            "& .MuiDataGrid-row.Mui-selected": {
              backgroundColor: "inherit", // No background on selection
            },

            "& .MuiDataGrid-cell": {
              color: "#333",
              fontSize: "14px",
            },
          }}
        />
      </div>

      {/* View Modal for row details */}

      {/* Action modal  */}
      <Modal open={openActionModal} onClose={handleCancel}>
        <Box
          sx={{
            width: 380,
            height: '330px',
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            margin: "auto",
            marginTop: "10%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: "#1565c0",
              mb: 3,
              textAlign: "center",
              fontWeight: "bold",
              borderBottom: "3px solid limegreen",  // underline with control
              paddingBottom: "1px",                  // space between text and underline
              display: "inline-block",               // shrink width to text only
              textUnderlineOffset: "px",
              textDecorationThickness: "3px",
               textUnderlineOffset: "6px",
            }}
          >
            311 Approval
          </Typography>

          <TextField
            label="Enter your comment"
            multiline
            rows={3}
            variant="outlined"
            fullWidth
            margin="normal"
            onChange={(e) => setComment(e.target.value)}
          />

          {/* Action Buttons */}
          <Box display="flex" justifyContent="space-between" width="100%" mt={2}>
            <Button
              variant="contained"
              color="success"
              onClick={handleApprove}
              startIcon={<CheckCircleIcon />}
            >
              Approve
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              startIcon={<CloseIcon />}
              sx={{
                bgcolor: '#d32f2f', // default red (MUI error.main)
                '&:hover': {
                  bgcolor: '#9a0007', // darker red on hover (MUI error.dark)
                },
              }}
            >
              Reject
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleQuery}
              startIcon={<QueryBuilderIcon />}
            >
              Query
            </Button>
          </Box>

          {/* ✅ Fixed View Button */}
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => handleOpenViewStatusModal(selectedRow)}
            sx={{
              mt: 2,
              color: '#ffffff',           //  purple text
              borderColor: '#6a1b9a',     // purple border
              bgcolor: '#6a1b9a',         // light purple background
              '&:hover': {
                bgcolor: '#4a148c',       // dark purple background on hover
                color: '#ffffff',         // white text on hover
                borderColor: '#4a148c',   // dark purple border on hover
              },
            }}
          >
            View Approval Status
          </Button>


          {/* Cancel Button */}
          <Button
            variant="outlined"
            onClick={handleCancel}
            sx={{
              marginTop: "20px",
              backgroundColor: "gray",
              color: "black",
              borderColor: "black",
              '&:hover': {
                borderColor: "black",
                backgroundColor: "#e0e0e0",
              },
            }}
          >
            Cancel
          </Button>
        </Box>
      </Modal>


{/* Approver page view approval status*/}
<Modal open={openViewStatusModal} onClose={() => setOpenViewStatusModal(false)}>
  <Box
    sx={{
      width: 1000,
      bgcolor: "background.paper",
      borderRadius: 2,
      boxShadow: 24,
      p: 3,
      margin: "auto",
      marginTop: "10%",
      position: "relative",
    }}
  >
    {/* ❌ Close button */}
    <IconButton
      onClick={() => setOpenViewStatusModal(false)}
      sx={{
        position: 'absolute',
        top: 8,
        right: 8,
        color: '#f44336',
        '&:hover': {
          backgroundColor: '#ffcdd2',
          color: '#b71c1c',
        },
      }}
    >
      <CloseIcon />
    </IconButton>

    {/* 📝 Title */}
    <Typography
      variant="h6"
      align="center"
      sx={{
        mb: 2,
        fontWeight: "bold",
        color: "#1565c0",
        textDecoration: "underline",
        textDecorationColor: "limegreen",
        textDecorationThickness: "3px",
        textUnderlineOffset: "6px",
      }}
    >
      Approval Status Details
    </Typography>

    {/* 📋 Table */}
    <Table size="small" sx={{ borderCollapse: 'collapse' }}>
      <TableHead>
        <TableRow sx={{ bgcolor: '#bdbdbd' }}>
          <TableCell sx={{ border: '1px solid #555555', color: 'black' }}>Role</TableCell>
          <TableCell sx={{ border: '1px solid #555555', color: 'black' }}>Date</TableCell>
          <TableCell sx={{ border: '1px solid #555555', color: 'black' }}>Name</TableCell>
          <TableCell sx={{ border: '1px solid #555555', color: 'black' }}>Comment</TableCell>
          <TableCell sx={{ border: '1px solid #555555', color: 'black' }}>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {viewStatusData.map((item, index) => (
          <TableRow key={index}>
            <TableCell sx={{ border: '1px solid #555555' }}>{item.Role}</TableCell>
            <TableCell sx={{ border: '1px solid #555555' }}>{item.Action_Date}</TableCell>
            <TableCell sx={{ border: '1px solid #555555' }}>{item.Action_By}</TableCell>
            <TableCell sx={{ border: '1px solid #555555' }}>{item.Approver_Comment}</TableCell>
            <TableCell sx={{ border: '1px solid #555555' }}>
              {item.Status}
              {item.Role === User_Level && (
                <Typography component="span" sx={{ fontWeight: 'bold', color: '#1b5e20', ml: 1 }}>
                  (Your Level)
                </Typography>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
</Modal>


    </div>
  );
};

export default Approval311;