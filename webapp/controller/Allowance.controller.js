sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/Fragment",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/unified/DateRange",
    "sap/m/MessageToast",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/library",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "jaidahZHR_RIG_REPORT/util/formatter"
], function (
    Controller,
    Fragment,
    JSONModel,
    MessageBox,
    DateRange,
    MessageToast,
    DateFormat,
    coreLibrary,
    Filter,
    FilterOperator,
    formatter
) {
    "use strict";

    var CalendarType = coreLibrary.CalendarType;
    var ValueState = coreLibrary.ValueState;

    return Controller.extend("jaidahZHR_RIG_REPORT.controller.Allowance", {
        formatter: formatter,
        oFormatYyyymmdd: null,

        onInit: function () {
            this.OdataModel = this.getOwnerComponent().getModel();
            this._oRouter = this.getOwnerComponent().getRouter();

            var oModel = new JSONModel({ EmployeeData: [] });
            this.getView().setModel(oModel, "empModel");

            this._oRouter.getRoute("AllowanceView").attachMatched(this._onObjectMatched, this);

            this.oFormatYyyymmdd = DateFormat.getInstance({
                pattern: "dd-MM-yyyy",
                calendarType: CalendarType.Gregorian
            });
        },

        _onObjectMatched: async function (oEvent) {
            const { EmployeeId, CompanyCode, CostCenter, RequestNo, Option } = oEvent.getParameter("arguments");

            const oAllowance = [
                { oAllowance: "4051 - RIG Allowance" },
                { oAllowance: "4052 - Food Allowance" }
            ];

            this.Action = Option;

            // Set Allowance and Location models
            this.getView().setModel(new JSONModel(oAllowance), "AllowanceData");

            const oLocation = [
                { RigLocation: "E-15 RIG" }, { RigLocation: "Groa RIG" }, { RigLocation: "Halul RIG" },
                { RigLocation: "Al Khor RIG" }, { RigLocation: "Al Zubarah RIG" }, { RigLocation: "GDI-1 RIG" },
                { RigLocation: "Al Wajba RIG" }, { RigLocation: "Staff House" }, { RigLocation: "Hotel" },
                { RigLocation: "Office" }, { RigLocation: "Elite-09" }, { RigLocation: "GDI-07" },
                { RigLocation: "Aqua Marine" }, { RigLocation: "GDI-4 RIG" }, { RigLocation: "GDI-6 RIG" },
                { RigLocation: "Home" }
            ];
            this.getView().setModel(new JSONModel(oLocation), "LocationData");

            // Load global data and set model
            try {
                await this._loadEmployeeData(RequestNo, EmployeeId);
            } catch (error) {
                MessageBox.error("Only RIG Employee is authorized to use this Application", {
                    onClose: () => {
                        var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                        oCrossAppNavigator.toExternal({ target: { semanticObject: "#" } });
                    }
                });
            }
        },

        _loadEmployeeData: function (RequestNo, EmployeeId) {
            return new Promise((resolve, reject) => {
                this.OdataModel.read("/Get_EmployeeSet", {
                    urlParameters: {
                        "$filter": `RequestNo eq '${RequestNo}'`,
                        "$expand": "EmployeeItem"
                    },
                    success: (oData) => {
                        if (oData && oData.results.length > 0) {
                            var oGlobalModel = new JSONModel(oData.results[0]);
                            this.getView().setModel(oGlobalModel, "oGlobalData");

                            var empItems = oData.results[0].EmployeeItem?.results || [];
                            this.getView().setModel(new JSONModel({ EmployeeData: empItems }), "empModel");
                            resolve(oData);
                        } else {
                            reject(new Error("No employee data found"));
                        }
                    },
                    error: (oError) => reject(oError)
                });
            });
        },

        onCheckboxSelect: function (oEvent) {
            var oCheckBox = oEvent.getSource();
            var bSelected = oCheckBox.getSelected();
            var oContext = oCheckBox.getBindingContext("empModel");
            if (oContext) {
                oContext.getModel("empModel").setProperty(oContext.getPath() + "/Selected", bSelected ? "X" : "");
            }
        },

        onAddRow: function () {
            var oModel = this.getView().getModel("empModel");
            var aData = oModel.getProperty("/EmployeeData") || [];

            aData.push({
                Selected: "",
                FromDt: null,
                ToDt: null,
                RigLocation: "",
                AllowanceType: "",
                Comments: "",
                WorkedDays: "",
                JobType: "",
                AllowanceName: ""
            });

            oModel.setProperty("/EmployeeData", aData);
            oModel.refresh();
        },

        onRemoveRow: function () {
            var oModel = this.getView().getModel("empModel");
            var aData = oModel.getProperty("/EmployeeData") || [];

            var aFiltered = aData.filter(row => row.Selected !== "X");

            oModel.setProperty("/EmployeeData", aFiltered);
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
                default:
                    break;
            }

            if (oContext) {
                oContext.getModel().setProperty(oContext.getPath() + "/AllowanceType", sAllowanceType);
                oContext.getModel().setProperty(oContext.getPath() + "/AllowanceName", sAllowanceName);
            }
        },

        onRigLocationChange: function (oEvent) {
            var oSource = oEvent.getSource();
            var sSelectedKey = oSource.getSelectedKey();
            var sPath = oSource.getBindingContext("empModel").getPath();

            if (sSelectedKey) {
                var oModel = this.getView().getModel("empModel");
                oModel.setProperty(sPath + "/RigLocation", sSelectedKey);
                oModel.refresh();
            }
        },

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
                aCells = oSelectedItem.getCells();

            function formatDateToString(oDate) {
                if (!oDate) return null;
                var oUTCDate = new Date(oDate.getTime() - oDate.getTimezoneOffset() * 60000);
                return oUTCDate.toISOString().split("T")[0];
            }

            var isFromDateChange = oSource === aCells[1];
            var isToDateChange = oSource === aCells[2];

            if (isFromDateChange) {
                oData.FromDt = formatDateToString(oSelectedDate);
            } else if (isToDateChange) {
                oData.ToDt = formatDateToString(oSelectedDate);
            }

            var oFromDate = oData.FromDt ? new Date(oData.FromDt) : null;
            var oToDate = oData.ToDt ? new Date(oData.ToDt) : null;

            // Validate From <= To
            if (oFromDate && oToDate && oFromDate > oToDate) {
                MessageBox.error("From Date cannot be greater than To Date.");
                if (isFromDateChange) {
                    oData.FromDt = "";
                } else {
                    oData.ToDt = "";
                }
                oData.WorkedDays = "";
                oModel.refresh(true);
                return;
            }

            // Check overlapping date ranges
            for (var i = 0; i < aItems.length; i++) {
                var oItem = aItems[i];
                if (oItem !== oSelectedItem) {
                    var oExistingData = oItem.getBindingContext("empModel").getObject();
                    var oExistingFrom = oExistingData.FromDt ? new Date(oExistingData.FromDt) : null;
                    var oExistingTo = oExistingData.ToDt ? new Date(oExistingData.ToDt) : null;

                    if (oFromDate && oToDate && oExistingFrom && oExistingTo) {
                        if (
                            (oFromDate >= oExistingFrom && oFromDate <= oExistingTo) ||
                            (oToDate >= oExistingFrom && oToDate <= oExistingTo) ||
                            (oFromDate <= oExistingFrom && oToDate >= oExistingTo)
                        ) {
                            MessageBox.error("Selected dates overlap with an existing entry. Please choose different dates.");
                            if (isFromDateChange) {
                                oData.FromDt = "";
                            } else {
                                oData.ToDt = "";
                            }
                            oData.WorkedDays = "";
                            oModel.refresh(true);
                            return;
                        }
                    }
                }
            }

            // Calculate worked days
            if (oFromDate && oToDate) {
                var iWorkedDays = Math.floor((oToDate - oFromDate) / (1000 * 60 * 60 * 24)) + 1;
                oData.WorkedDays = iWorkedDays.toString();
            } else {
                oData.WorkedDays = "";
            }

            oModel.refresh(true);
        },

        onSubmit: function () {
            var oView = this.getView();
            var oHeaderData = oView.getModel().getData();
            var aEmployeeData = oView.getModel("empModel").getProperty("/EmployeeData") || [];

            function formatDate(sDate) {
                if (!sDate) return "";
                var oDate = new Date(sDate);
                return oDate.toISOString().split("T")[0] + "T00:00:00";
            }

            // Remove Selected and format dates for submission
            var aProcessedEmployeeData = aEmployeeData.map((item, index) => ({
                FromDt: formatDate(item.FromDt),
                ToDt: formatDate(item.ToDt),
                RigLocation: item.RigLocation,
                AllowanceType: item.AllowanceType,
                AllowanceName: item.AllowanceName,
                WorkedDays: item.WorkedDays,
                JobType: item.JobType,
                ItemNo: (index + 1).toString(),
                RequestNo: oHeaderData.RequestNo
            }));

            var oPayload = {
                ...oHeaderData,
                EmployeeItem: aProcessedEmployeeData
            };

            var that = this;
            sap.ui.core.BusyIndicator.show();

            this.OdataModel.create("/Get_EmployeeSet", oPayload, {
                success: function () {
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.success("Request Number - " + oPayload.RequestNo + " Sent for Approval", {
                        onClose: function () {
                            sap.ui.getCore().getEventBus().publish("RigChannel", "RefreshRigData");
                            oView.getModel().setData({});
                            oView.getModel("empModel").setData({ EmployeeData: [] });
                            that.getOwnerComponent().getRouter().navTo("InitialView");
                        }
                    });
                },
                error: function (oError) {
                    sap.ui.core.BusyIndicator.hide();
                    var errorMsg = "Unknown error";
                    try {
                        var err = JSON.parse(oError.responseText);
                        errorMsg = err.error.message.value;
                    } catch {
                        errorMsg = oError.message || errorMsg;
                    }
                    MessageBox.error(errorMsg);
                }
            });
        },

        onNavBack: function () {
            var oView = this.getView();

            var oEmpModel = oView.getModel("empModel");
            if (oEmpModel) {
                oEmpModel.setData({ EmployeeData: [] });
                oEmpModel.refresh(true);
            }

            var oUploadModel = oView.byId("UploadCollectionIP")?.getModel();
            if (oUploadModel) {
                oUploadModel.setData({ items: [] });
                oUploadModel.refresh(true);
            }

            this.getOwnerComponent().getRouter().navTo("InitialView");
        },

        onBeforeUploadStarts: function (oEvent) {
            var oView = this.getView();
            var oRequestNumber = oView.getModel().getData().RequestNo;

            var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
                name: "slug",
                value: oEvent.getParameter("fileName")
            });
            var oCustomerHeaderContentType = new sap.m.UploadCollectionParameter({
                name: "Content-Type",
                value: "application/octet-stream"
            });

            var oHeaders = oEvent.getParameters().addHeaderParameter;
            oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
            oEvent.getParameters().addHeaderParameter(oCustomerHeaderContentType);

            var oUploadCollection = oView.byId("UploadCollectionIP");
            var oModel = oUploadCollection.getModel();

            // CSRF Token
            this.OdataModel.refreshSecurityToken(function () {
                var sToken = this.OdataModel.getSecurityToken();
                var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
                    name: "x-csrf-token",
                    value: sToken
                });
                oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
            }.bind(this));
        },

        onChangeIP: function (oEvent) {
            var oUploadCollection = oEvent.getSource();
            var oView = this.getView();

            var aFiles = oEvent.getParameter("files") || [];
            var aNewItems = aFiles.map(file => ({
                documentId: "",
                fileName: file.name,
                mimeType: file.type,
                url: ""
            }));

            var oModel = oUploadCollection.getModel();
            var aItems = oModel.getProperty("/items") || [];
            oModel.setProperty("/items", aItems.concat(aNewItems));
        },

        onFileDeleted: function (oEvent) {
            var oView = this.getView();
            var oUploadCollection = oView.byId("UploadCollectionIP");
            var oModel = oUploadCollection.getModel();

            var sFileName = oEvent.getParameter("documentId");
            var aItems = oModel.getProperty("/items") || [];
            var aFilteredItems = aItems.filter(item => item.documentId !== sFileName);

            oModel.setProperty("/items", aFilteredItems);
        },

        onDownloadAttachment: function (oEvent) {
            var oView = this.getView();
            var sDocumentId = oEvent.getParameter("documentId");
            var oUploadCollection = oView.byId("UploadCollectionIP");
            var oModel = oUploadCollection.getModel();

            var oItem = oModel.getProperty("/items").find(item => item.documentId === sDocumentId);
            if (oItem && oItem.url) {
                window.open(oItem.url, "_blank");
            } else {
                MessageToast.show("File not found or URL missing.");
            }
        },

        onUploadComplete: function (oEvent) {
            var oView = this.getView();
            var oUploadCollection = oView.byId("UploadCollectionIP");
            var oModel = oUploadCollection.getModel();

            var sFileName = oEvent.getParameter("fileName");
            var sRawResponse = oEvent.getParameter("responseRaw");
            var aItems = oModel.getProperty("/items") || [];

            // Example: Parse response and update documentId, url
            // Here you might want to update the model with server response info.

            // Show success message
            MessageToast.show("File uploaded: " + sFileName);
        }
    });
});
