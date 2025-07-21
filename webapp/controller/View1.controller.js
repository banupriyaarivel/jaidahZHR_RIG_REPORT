sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "jaidahZHR_RIG_REPORT2/util/formatter",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (
    Controller, JSONModel, formatter, Spreadsheet, library,
    Filter, FilterOperator, MessageBox, Fragment
) {
    "use strict";

    var EdmType = library.EdmType;
    var oReqNo;

    return Controller.extend("jaidahZHR_RIG_REPORT2.controller.View1", {

        formatter: formatter,

        onInit: function () {
            this.OdataModel = this.getOwnerComponent().getModel();
            this._oRouter = this.getOwnerComponent().getRouter();

            this.loadEmployeeData();

            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("RigChannel", "RefreshRigData", this.loadEmployeeData, this);
        },

        loadEmployeeData: function () {
            var oView = this.getView();
            this.OdataModel.read("/Get_EmployeeSet", {
                success: function (oData) {
                    var oModel = new JSONModel(oData.results);
                    oView.setModel(oModel, "oRIGData");
                },
                error: function () {
                    MessageBox.error("Failed to load Rig Data.");
                }
            });
        },

        onDownload: function (oEvent) {
            var oPath = oEvent.getSource().getParent().getBindingContextPath();
            oReqNo = this.getView().getModel("oRIGData").getProperty(oPath + "/RequestNo");

            var oView = this.getView();
            this.OdataModel.read("/Get_FilenameSet", {
                urlParameters: {
                    $filter: "RequestNo eq '" + oReqNo + "'"
                },
                success: function (oData) {
                    oView.setModel(new JSONModel(oData), "oDownModel");
                },
                error: function () {
                    MessageBox.error("Failed to fetch filenames.");
                }
            });

            if (!this._DailogCC7) {
                this._DailogCC7 = sap.ui.xmlfragment("jaidahZHR_RIG_REPORT2.fragments.onDownload", this);
                oView.addDependent(this._DailogCC7);
            }
            this._DailogCC7.open();
        },

        onDownCan: function () {
            sap.ui.getCore().byId("idDown").close();
        },

        ongetFile: function (oEvent) {
            var oPath = oEvent.getSource().getParent().getBindingContextPath();
            var oFname = this.getView().getModel("oDownModel").getProperty(oPath + "/Filename");

            var sUrl = this.OdataModel.sServiceUrl + `/Get_AttachmentSet(RequestNo='${oReqNo}',Filename='${oFname}')/$value`;
            window.open(sUrl, "_blank");
            sap.m.MessageToast.show("File Downloaded Successfully");
        },

        onExcelExport: function (oEvent) {
            var oTable = oEvent.getSource().getParent().getParent();
            var oBinding = oTable.getBinding("items");

            var oSettings = {
                workbook: {
                    columns: this.getColumns(),
                    context: { sheetName: "RIG_REPORT" }
                },
                dataSource: oBinding,
                fileName: `RIG_REPORT_${new Date().toISOString().replace(/[:.-]/g, "_")}.xlsx`
            };

            var oSheet = new Spreadsheet(oSettings);
            oSheet.build()
                .then(() => sap.m.MessageToast.show("Exported Successfully!"))
                .finally(() => oSheet.destroy());
        },

        getColumns: function () {
            return [
                { label: 'Request No', property: 'RequestNo', type: EdmType.String },
                { label: 'Employee ID and Name', property: ['EmployeeId', 'EmployeeName'], type: EdmType.String },
                { label: 'Company Code and Name', property: ['CompanyCode', 'CompanycodeDesc'], type: EdmType.String },
                { label: 'Cost Center and Name', property: ['CostCenter', 'CostcenterDesc'], type: EdmType.String },
                { label: 'Approver Status', property: 'UpdateLog', type: EdmType.String }
            ];
        },

        onRowEditPress: function (oEvent) {
            var oData = oEvent.getSource().getParent().getBindingContext("oRIGData").getObject();
            this._oRouter.navTo("AllowanceView", {
                EmployeeId: oData.EmployeeId,
                RequestNo: oData.RequestNo,
                CostCenter: oData.CostCenter,
                CompanyCode: oData.CompanyCode,
                Option: "E"
            });
        },

        onRowDeletePress: function (oEvent) {
            var oData = oEvent.getSource().getParent().getBindingContext("oRIGData").getObject();
            var sPath = `/Get_Employee_ItemSet(EmployeeId='${oData.EmployeeId}',ItemNo='${oData.ItemNo}',RequestNo='${oData.RequestNo}')`;

            var oPayload = { Action: "D" };
            this.OdataModel.update(sPath, oPayload, {
                success: () => MessageBox.success(`Request Number - ${oData.RequestNo} sent for deletion.`),
                error: () => MessageBox.error("Sending for deletion failed.")
            });
        },

        onRequestNoPress: function (oEvent) {
            var oData = oEvent.getSource().getBindingContext("oRIGData").getObject();
            var oView = this.getView();

            this._fetchEmployeeDetails(oData.RequestNo, oData.EmployeeId)
                .then((oResult) => {
                    oView.setModel(new JSONModel({ EmployeeData: oResult.results[0].EmployeeItem.results }), "empModel");

                    if (!this._pDialog) {
                        Fragment.load({
                            id: oView.getId(),
                            name: "jaidahZHR_RIG_REPORT2.view.EmployeeDetailsDialog",
                            controller: this
                        }).then((oDialog) => {
                            oView.addDependent(oDialog);
                            this._pDialog = oDialog;
                            oDialog.open();
                        });
                    } else {
                        this._pDialog.open();
                    }
                })
                .catch(() => MessageBox.error("Failed to fetch employee details."));
        },

        _fetchEmployeeDetails: function (RequestNo, EmployeeId) {
            return new Promise((resolve, reject) => {
                this.OdataModel.read("/Get_EmployeeSet", {
                    urlParameters: {
                        "$filter": `RequestNo eq '${RequestNo}'`,
                        "$expand": "EmployeeItem"
                    },
                    success: resolve,
                    error: reject
                });
            });
        },

        onCloseDialog: function () {
            if (this._pDialog && this._pDialog.isOpen()) {
                this._pDialog.close();
            }
        }
    });
});
