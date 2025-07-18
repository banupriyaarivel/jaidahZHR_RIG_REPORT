var header_xcsrf_token, upload_token;
sap.ui.define([
		"sap/ui/core/mvc/Controller", "sap/ui/core/Fragment", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
		'sap/ui/unified/DateRange', 'sap/m/MessageToast', 'sap/ui/core/format/DateFormat', 'sap/ui/core/library', 'sap/ui/model/Filter',
		'sap/ui/model/FilterOperator',
		"jaidahZHR_RIG_REPORT/util/formatter"
	],
	function (Controller, Fragment, JSONModel, MessageBox, DateRange, MessageToast, DateFormat, coreLibrary, Filter, FilterOperator,formatter) {
		"use strict";
		var oView;
		var CalendarType = coreLibrary.CalendarType;
		var ValueState = coreLibrary.ValueState;
		return Controller.extend("jaidahZHR_RIG_REPORT.controller.Allowance", {
			formatter: formatter,
			oFormatYyyymmdd: null,
			onInit: function () {
				this.OdataModel = this.getOwnerComponent().getModel();
				this._oRouter = this.getOwnerComponent().getRouter();
				oView = this.getView();
				var oModel = new JSONModel({
        EmployeeData: [] 
    });
    this.getView().setModel(oModel, "empModel");
				this._oRouter.getRoute("AllowanceView").attachMatched(this._onObjectMatched, this);
			},
			_onObjectMatched: async function (oEvent) {
				const {
					EmployeeId,
					CompanyCode,
					CostCenter,
					RequestNo,
					Option
				} = oEvent.getParameter("arguments");
				var oAllowance = [{
					oAllowance: "4051 - RIG Allowance"
				}, {
					oAllowance: "4052 - Food Allowance"
				}];
				
				this.Action = Option;

				const aData = await this._onEmployeeData(RequestNo, EmployeeId);
				var oModel1 = new JSONModel(oAllowance);
				oView.setModel(oModel1, "AllowanceData");
				var oLocation = [{
					RigLocation: "E-15 RIG"
				}, {
					RigLocation: "Groa RIG"
				}, {
					RigLocation: "Halul RIG"
				}, {
					RigLocation: "Al Khor RIG"
				}, {
					RigLocation: "Al Zubarah RIG"
				}, {
			    	RigLocation: "GDI-1 RIG"
				}, {
					RigLocation: "Al Wajba RIG"
				}, {
					RigLocation: "Staff House"
				}, {
					RigLocation: "Hotel"	
				}, {	
					RigLocation: "Office"	
				}, {
					RigLocation: "Elite-09"	
				}, {
					RigLocation: "GDI-07"	
				}, {
					RigLocation: "Aqua Marine"	
				}, {
					RigLocation: "GDI-4 RIG"
				}, {
					RigLocation: "GDI-6 RIG"
				}, {
					RigLocation: "Home"					
				}];
				var oModelLoc = new JSONModel(oLocation);
				oView.setModel(oModelLoc, "LocationData");
				var oModelData = this.getView().getModel("oGlobalData").getData();
				var oModelD = new JSONModel(oModelData);
				oView.setModel(oModelD);
				// Rig Location Added
				const {
					RigLocation,
					ToDt,
					FromDt,
					WorkedDays
				} = this.getView().getModel("oGlobalData").getData();
			/*	oView.byId("idLocation").setSelectedKey(RigLocation);
				oView.byId("selectedDateFrom").setText(FromDt);
				oView.byId("selectedDateTo").setText(ToDt);*/

				this.oFormatYyyymmdd = DateFormat.getInstance({
					pattern: "dd-MM-yyyy",
					calendarType: CalendarType.Gregorian
				});
	

   this.OdataModel.read("/Get_FilenameSet", {
        urlParameters: {
            $filter: "RequestNo eq '" + oModelData.RequestNo + "'"
        },
      success: function (oData) {
            var aItems = [];
            oData.results.forEach(function (item) {
                aItems.push({
                    "documentId": item.Filename,
                    "fileName": item.Filename,
                    "url": item.__metadata.uri + "/$value",
                    "enableEdit": false,
                    "enableDelete": true,
                    "visibleEdit": false,
                    "visibleDelete": true
                });
            });
            
            var oJsonModel = new sap.ui.model.json.JSONModel({
                "items": aItems
            });
            oView.byId("UploadCollectionIP").setModel(oJsonModel);
        },
        error: function (oError) {
            sap.m.MessageToast.show("Failed to fetch attachments");
        }
    });
			},
		
onCheckboxSelect: function (oEvent) {
    var oCheckBox = oEvent.getSource();
    var bSelected = oCheckBox.getSelected(); // Get the checkbox state
    var oContext = oCheckBox.getBindingContext("empModel"); // Get the binding context

    if (oContext) {
        oContext.getModel("empModel").setProperty(oContext.getPath() + "/Selected", bSelected ? "X" : "");
    }
},


      onAddRow: function () {
    var oModel = this.getView().getModel("empModel");
    if (!oModel) {
        console.error("Model 'empModel' is not found!");
        return;
    }

    var aData = oModel.getProperty("/EmployeeData") || [];

    var oNewRow = {
        Selected: "", 
        FromDt: null,  // Initialize as null
        ToDt: null,  // Initialize as null
        RigLocation: "",  
        AllowanceType: "",  
        Comments: "",  
        WorkedDays: "" ,
        JobType:"",
        AllowanceName:""
    };

    aData.push(oNewRow);
    oModel.setProperty("/EmployeeData", aData);
    oModel.refresh();
}
,

    onRemoveRow: function () {
    var oTable = this.getView().byId("employeeDetailsTable");
    var oModel = this.getView().getModel("empModel");
    var aData = oModel.getProperty("/EmployeeData");

    // Filter out selected rows
    var aUpdatedData = aData.filter(function (oRow) {
        return oRow.Selected !== "X"; // Only keep unselected rows
    });

    // Update the model
    oModel.setProperty("/EmployeeData", aUpdatedData);
},

onJobTypeChange: function (oEvent) {
    var oSource = oEvent.getSource();
    var sSelectedKey = oSource.getSelectedKey();
    var oContext = oSource.getBindingContext("empModel");

    var sAllowanceType = "";
    var sAllowanceName = "";

    switch (sSelectedKey) {
       case "Working on Rig site":
                sAllowanceType = "4051";
                sAllowanceName = "RIG Allowance";
           
                
                break;
            case "Working from Town":
            	sAllowanceType = "4053";
                sAllowanceName = "Rig & Food Allowance";
              
                break;
            case "Stand by Town":
            case "Tech/Operation Support":
               sAllowanceType = "4052";
               sAllowanceName = "Food Allowance";
             
                break;
            case "Vacation":
                sAllowanceType = "2001";
                sAllowanceName = "Rig Employee Leave";
              
                break;
    }

    oContext.getModel().setProperty(oContext.getPath() + "/AllowanceType", sAllowanceType);
    oContext.getModel().setProperty(oContext.getPath() + "/AllowanceName", sAllowanceName);
},
onRigLocationChange: function (oEvent) {
    var oSource = oEvent.getSource();
    var sPath = oSource.getBindingContext("empModel").getPath();
    var sSelectedKey = oSource.getSelectedKey();

    if (sSelectedKey) {
        var oModel = this.getView().getModel("empModel");
        oModel.setProperty(sPath + "/RigLocation", sSelectedKey);
        oModel.refresh();
    }
}
,
onDateChange: function (oEvent) {
    var oSource = oEvent.getSource();
    var oSelectedDate = oSource.getDateValue();

    if (!oSelectedDate) return;

    var oTable = this.getView().byId("employeeDetailsTable"),
        aItems = oTable.getItems(),
        oSelectedItem = oSource.getParent(),
        oBindingContext = oSelectedItem.getBindingContext("empModel"),
        oModel = oBindingContext.getModel(),
        oData = oBindingContext.getObject(),
        aCells = oSelectedItem.getCells(); // Get all cells in the row

    function formatDateToString(oDate) {
        if (!oDate) return null;
        var oUTCDate = new Date(oDate.getTime() - oDate.getTimezoneOffset() * 60000);
        return oUTCDate.toISOString().split("T")[0];
    }

    var isFromDateChange = oSource === aCells[1]; // Assuming From Date is the second column
    var isToDateChange = oSource === aCells[2];   // Assuming To Date is the third column

    // Update only the changed field
    if (isFromDateChange) {
        oData.FromDt = formatDateToString(oSelectedDate);
    } else if (isToDateChange) {
        oData.ToDt = formatDateToString(oSelectedDate);
    }

    var oFromDate = oData.FromDt ? new Date(oData.FromDt) : null;
    var oToDate = oData.ToDt ? new Date(oData.ToDt) : null;

    // **Validation: Ensure From Date is not greater than To Date**
    if (oFromDate && oToDate && oFromDate > oToDate) {
        MessageBox.error("From Date cannot be greater than To Date.");
        if (isFromDateChange) {
            oData.FromDt = ""; // Reset only the incorrect field
        } else if (isToDateChange) {
            oData.ToDt = "";
        }
        oData.WorkedDays = "";
        oModel.refresh(true);
        return;
    }

    // **Validation: Ensure no overlapping date ranges**
    for (var i = 0; i < aItems.length; i++) {
        var oItem = aItems[i];
        if (oItem !== oSelectedItem) {
            var oExistingData = oItem.getBindingContext("empModel").getObject();
            var oExistingFromDate = oExistingData.FromDt;
            var oExistingToDate = oExistingData.ToDt;

            if (oExistingFromDate && oExistingToDate) {
                var oExistingFrom = new Date(oExistingFromDate);
                var oExistingTo = new Date(oExistingToDate);

                if (
                    (oFromDate && oFromDate >= oExistingFrom && oFromDate <= oExistingTo) ||
                    (oToDate && oToDate >= oExistingFrom && oToDate <= oExistingTo) ||
                    (oFromDate && oToDate && oFromDate <= oExistingFrom && oToDate >= oExistingTo)
                ) {
                    MessageBox.error("Selected dates overlap with an existing entry. Please choose different dates.");
                    if (isFromDateChange) {
                        oData.FromDt = "";
                    } else if (isToDateChange) {
                        oData.ToDt = "";
                    }
                    oData.WorkedDays = "";
                    oModel.refresh(true);
                    return;
                }
            }
        }
    }

    // **Worked Days Calculation**
    if (oFromDate && oToDate) {
        var iWorkedDays = Math.floor((oToDate - oFromDate) / (1000 * 60 * 60 * 24)) + 1;
        oData.WorkedDays = iWorkedDays.toString();
    } else {
        oData.WorkedDays = "";
    }

    oModel.refresh(true);
},




	_onEmployeeData: async function (RequestNo, EmployeeId) {
    return new Promise((resolve, reject) => {
    this.OdataModel.read(
        "/Get_EmployeeSet", // Base Entity Set
        {
            urlParameters: {
                "$filter": `RequestNo eq '${RequestNo}'`, // Applying filter
                "$expand": "EmployeeItem" // Expanding EmployeeItem
            },
            success: function (oData) {
                if (oData) {
                    // Setting main employee data to global model
                    var oGlobalModel = new sap.ui.model.json.JSONModel(oData.results[0]);
                    this.getView().setModel(oGlobalModel, "oGlobalData");

                    // Ensure EmployeeItems exists and has results
                    if (oData.results?.length > 0 && oData.results[0].EmployeeItem?.results?.length > 0) {
                        var empModel = new sap.ui.model.json.JSONModel({ EmployeeData: oData.results[0].EmployeeItem.results });
                        this.getView().setModel(empModel, "empModel");
                    }

                    resolve(oData);
                } else {
                    reject(new Error("No data received from OData service"));
                }
            }.bind(this),

            error: function (oError) {
                MessageBox.error("Only RIG Employee is authorized to use this Application", {
                    onClose: function () {
                        var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                        oCrossAppNavigator.toExternal({
                            target: { semanticObject: "#" }
                        });
                    }
                });
                reject(oError);
            }
        }
    );
});

},

onNavBack: function () {
    var oView = this.getView();
    
    // Reset empModel Data
    var oEmpModel = oView.getModel("empModel"); 
    oEmpModel.refresh();
    if (oEmpModel) {
        oEmpModel.setData({ EmployeeData: [] }); // Clear EmployeeData
        oEmpModel.refresh(true);
    }

    // Clear UploadCollection Data
    var oUploadModel = oView.byId("UploadCollectionIP")?.getModel();
    oUploadModel.refresh(true);
    if (oUploadModel) {
        oUploadModel.setData({ items: [] });
    }

    // Navigate Back
    this.getOwnerComponent().getRouter().navTo("InitialView");
},
			onLocationChange: function (oEvent) {
				var oValidatedComboBox = oEvent.getSource(),
					sSelectedKey = oValidatedComboBox.getSelectedKey(),
					sValue = oValidatedComboBox.getValue();

				if (!sSelectedKey && sValue) {
					oValidatedComboBox.setValueState(ValueState.Error);
					oValidatedComboBox.setValueStateText("Please enter a valid Location!");
			
			
					oView.byId("idLocation").setValue();
				} else {
					oValidatedComboBox.setValueState(ValueState.None);
					sap.ui.getCore().getModel("oGlobalData").setProperty("/RigLocation", sSelectedKey);
				}
			},
			onSelectRig: function () {
				oView.getModel().setProperty("/AllowanceType", "4051");
				oView.getModel().setProperty("/AllowanceName", "RIG Allowance");
			},
			onNotSelectRig: function () {
				oView.getModel().setProperty("/AllowanceType", "4053");
				oView.getModel().setProperty("/AllowanceName", "Rig & Food Allowance");
			},
			onWellSiteRig: function () {
				oView.getModel().setProperty("/AllowanceType", "4052");
				oView.getModel().setProperty("/AllowanceName", "Food Allowance");
			},
			onTechRig: function () {
				oView.getModel().setProperty("/AllowanceType", "4052");
				oView.getModel().setProperty("/AllowanceName", "Food Allowance");
			},
			onVacationRig: function () {
				oView.getModel().setProperty("/AllowanceType", "2001");
				oView.getModel().setProperty("/AllowanceName", "Rig Employee Leave");
			},

			onValidateDays: function (oEvent) {
				var oDays = oEvent.getParameter("value");
				var oDaysLen = oDays.length;
				if (oDaysLen > 3) {
					MessageBox.error("Only 3 digits are permitted");
					this.getView().byId("idDays").setValue(oDays.slice(0, 3));
				} else if (oDays >= 367) {
					MessageBox.error("Please enter the number as below 365 days");
					this.getView().byId("idDays").setValue();
				} else {
					this.getView().getModel().setProperty("/WorkedDays", oDays);
				}
			},
	onSubmit: function (oEvent) {
    var oView = this.getView();
    
    // Get header data from the main model
    var oHeaderData = oView.getModel().getData();
    
    // Get employee data from empModel
    var aEmployeeData = oView.getModel("empModel").getProperty("/EmployeeData") || [];

    // Function to format dates correctly
    function formatDate(sDate) {
        if (!sDate) return ""; // Return empty if no date is provided
        var oDate = new Date(sDate);
        return oDate.toISOString().split("T")[0] + "T00:00:00"; // Ensure proper format
    }

    // Remove "Selected" field and format dates
    var aProcessedEmployeeData = aEmployeeData.map((oItem, i) => {
        var { Selected, ...oFilteredItem } = oItem; 
        return {
            //...oFilteredItem,
           FromDt: formatDate(oItem.FromDt),
            ToDt: formatDate(oItem.ToDt),
            RigLocation: oItem.RigLocation,
            AllowanceType: oItem.AllowanceType,
            AllowanceName: oItem.AllowanceName,
            WorkedDays: oItem.WorkedDays,
            JobType: oItem.JobType,
            ItemNo: (i + 1).toString(),
            RequestNo: oHeaderData.RequestNo
        };
    });

    // Construct the deep insert payload
    var oPayload = {
        ...oHeaderData,  
        EmployeeItem: aProcessedEmployeeData  
    };

    var oControl = this;

    // Send deep insert request
    this.OdataModel.create("/Get_EmployeeSet", oPayload, {
  success: function (oData, oResponse) {
            sap.ui.core.BusyIndicator.hide();
            
            MessageBox.success("Request Number - " + oPayload.RequestNo + " Sent for Approval", {
                onClose: function () {
                    // ✅ Publish Event to Refresh Data in RigData Controller
                    var oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.publish("RigChannel", "RefreshRigData");

                    // ✅ Clear Form Models
                    oView.getModel().setData({});
                    oView.getModel("empModel").setData({
                        EmployeeData: []
                    });

                    // ✅ Navigate Back
                    oControl.onNavBack();
                }
            });
        },
        error: function (oError) {
            sap.ui.core.BusyIndicator.hide();
            const errorMsg = JSON.parse(oError.responseText);
            MessageBox.error(errorMsg.error.message.value);
        }
    });
},


			handleCalendarSelect: function (oEvent) {
				var oCalendar = oEvent.getSource();
				this._updateText(oCalendar.getSelectedDates()[0]);
			},

			_updateText: function (oSelectedDates) {
				var oSelectedDateFrom = this.byId("selectedDateFrom"),
					oSelectedDateTo = this.byId("selectedDateTo"),
					oStDate,
					oEndDate,
					oDate;
				var oDateFormat = DateFormat.getInstance({
					pattern: "yyyy-MM-dd",
					calendarType: CalendarType.Gregorian
				});
				var oDateModel = this.getView().getModel();
				if (oSelectedDates) {
					oDate = oSelectedDates.getStartDate();
					if (oDate) {
						oStDate = oDate;
						oSelectedDateFrom.setText(this.oFormatYyyymmdd.format(oDate));
						oDateModel.setProperty("/FromDt", oDateFormat.format(oDate).concat("T00:00:00"));
					} else {
						oSelectedDateTo.setText("No Date Selected");
						oDateModel.setProperty("/FromDt", "");
					}
					oDate = oSelectedDates.getEndDate();
					if (oDate) {
						oEndDate = oDate;
						oSelectedDateTo.setText(this.oFormatYyyymmdd.format(oDate));
						oDateModel.setProperty("/ToDt", oDateFormat.format(oDate).concat("T00:00:00"));
						this.oGetWorkDays();
					} else {
						oSelectedDateTo.setText("No Date Selected");
						oDateModel.setProperty("/ToDt", "");
					}
				} else {
					oSelectedDateFrom.setText("No Date Selected");
					oSelectedDateTo.setText("No Date Selected");
				}
			},
			oGetWorkDays: function () {
				var oPayloadData = this.getView().getModel().getData();
				this.OdataModel.read("/Get_EmployeeSet", {
					urlParameters: {
						$filter: "FromDt gt (datetime'" + oPayloadData.FromDt + "') and ToDt lt (datetime'" + oPayloadData.ToDt + "')"
					},
					success: function (oData) {
						oView.getModel().setProperty("/WorkedDays", oData.results[0].WorkedDays);
					},
					error: function (oError) {

					}
				});
			},
			handleSelectThisWeek: function () {
				this._selectWeekInterval(6);
			},

			handleSelectWorkWeek: function () {
				this._selectWeekInterval(4);
			},

			handleWeekNumberSelect: function (oEvent) {
				var oDateRange = oEvent.getParameter("weekDays"),
					iWeekNumber = oEvent.getParameter("weekNumber");

				if (iWeekNumber % 5 === 0) {
					oEvent.preventDefault();
					MessageToast.show("You are not allowed to select this calendar week!");
				} else {
					this._updateText(oDateRange);
				}
			},

			_selectWeekInterval: function (iDays) {
				var oCurrent = new Date(), // get current date
					iWeekStart = oCurrent.getDate() - oCurrent.getDay() + 1,
					iWeekEnd = iWeekStart + iDays, // end day is the first day + 6
					oMonday = new Date(oCurrent.setDate(iWeekStart)),
					oSunday = new Date(oCurrent.setDate(iWeekEnd)),
					oCalendar = this.byId("calendar");

				oCalendar.removeAllSelectedDates();
				oCalendar.addSelectedDate(new DateRange({
					startDate: oMonday,
					endDate: oSunday
				}));

				this._updateText(oCalendar.getSelectedDates()[0]);
			},
	onBeforeUploadStarts: function (oEvent) {
var	 oRequestNumber = 	oView.getModel().getData().RequestNo;
    var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
        name: "slug",
        value: oEvent.getParameter("fileName")
    });

    var oCustomerHeaderContentType = new sap.m.UploadCollectionParameter({
        name: "Content-Type",
        value: "application/xml;charset=utf-8" // Ensure the correct format
    });
    var oHeaderRequestNumber = new sap.m.UploadCollectionParameter({
        name: "x-request-number",
        value: oRequestNumber
    });
    oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
    oEvent.getParameters().addHeaderParameter(oCustomerHeaderContentType);
      oEvent.getParameters().addHeaderParameter(oHeaderRequestNumber);
},


			onTypeMissmatch: function () {
				MessageToast.show("TypeMissmatch event triggered.");
			},

		onChangeIP: function (oEvent) {
    var oUploadCollection = oEvent.getSource();
    
    // Fetch CSRF token dynamically
    var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZHR_RIG_EMPLOYEE_SRV/", true);
    oModel.refreshSecurityToken();

    var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
        name: "x-csrf-token",
        value: oModel.getSecurityToken()
    });

    oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
},


		onFileDeleted: function (oEvent) {
	var sDocumentId = oEvent.getParameter("documentId");
	var oData = this.getView().byId("UploadCollectionIP").getModel().getData();
	var aItems = oData.items;
	var sEntityName = "Get_AttachmentSet";

	jQuery.each(aItems, function (index) {
		if (aItems[index] && aItems[index].documentId === sDocumentId) {
			aItems.splice(index, 1);
		}
	});
	
	this.getView().byId("UploadCollectionIP").getModel().setData({"items": aItems});
	var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZHR_RIG_EMPLOYEE_SRV/", true);
		var sRequestNo = oView.getModel().getData().RequestNo;
	oModel.remove("/" + sEntityName + "(RequestNo='" + sRequestNo + "',Filename='" + sDocumentId + "')", {
		success: function () {
			sap.m.MessageToast.show("File Deleted Successfully");
		},
		error: function () {
			sap.m.MessageToast.show("File Deletion Failed");
		}
	});
},

onDownloadAttachment: function (oEvent) {
	var sFileName = oEvent.getSource().getFileName();
	var sRequestNo = oView.getModel().getData().RequestNo;
	var sUrl = "/sap/opu/odata/sap/ZHR_RIG_EMPLOYEE_SRV/Get_AttachmentSet(RequestNo='" + sRequestNo + "',Filename='" + encodeURIComponent(sFileName) + "')/$value";
	if (sUrl) {
		window.open(sUrl, "_blank");
		sap.m.MessageToast.show("File Downloaded Successfully");
	} else {
		sap.m.MessageToast.show("URL not available");
	}
},

onUploadComplete: function (oEvent) {
	var iStatus = oEvent.getParameter("status");
	var sFileName = oEvent.getParameter("files")[0].fileName;

	if (iStatus === 400) {
		MessageBox.error("File Upload Failed: " + sFileName);
	} else {
		var oData = this.getView().byId("UploadCollectionIP").getModel().getData();
		var aItems = oData.items || [];
		aItems.unshift({
			"documentId": sFileName,
			"fileName": sFileName,
			"enableEdit": false,
			"enableDelete": true,
			"visibleEdit": false,
			"visibleDelete": true
		});
		
		oView.byId("UploadCollectionIP").getModel().setData({"items": aItems});
		MessageToast.show("File Uploaded Successfully");
	}
}

		});

	});
//# sourceURL=https://jg-sapecc02.jaidah.local:8100/sap/bc/ui5_ui5/sap/zhr_rig_report/~FDB2F7D80FB27F9B1DCC88AA392C0B5F~5/controller/Allowance.controller.js?eval