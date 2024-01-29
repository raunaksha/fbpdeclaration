sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    "sap/ui/model/json/JSONModel",
    'sap/ui/Device',
    "sap/ui/model/FilterOperator",
    "../model/Formatter",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, Fragment, Filter, JSONModel, Device, FilterOperator, Formatter, MessageToast, MessageBox) {
        "use strict";

        return Controller.extend("fbp.prestige.fbpdeclaration.controller.declaration", {
            formatter: Formatter,
            onInit: function () {
                this._getPayComp();
                this._getPayComponent();
                this._getDeclarationData();
                this._getEmpJobInfo();
                this._getFinYear();
                this.calculateFinancialYearStartDate();
            },

            calculateFinancialYearStartDate: function () {
                var that = this;
                this._getUserInfo();
                
                // Use a promise to make sure the getUserInfo function is resolved before further processing
                this._getUserInfoPromise().then(function (DOJModel) {
                    var DOJ = DOJModel.UserInfo.hireDate;
                    var currentDate = new Date();
                    var financialYearStartMonth = 3;
                    var financialYearStartYear = currentDate.getMonth() < financialYearStartMonth
                        ? currentDate.getFullYear() - 1
                        : currentDate.getFullYear();
            
                    // Set the financial year start date
                    var financialYearStartDate = new Date(financialYearStartYear, financialYearStartMonth, 1);
                    
                     var higherDate = DOJ > financialYearStartDate ? DOJ : financialYearStartDate;
                     that.getOwnerComponent().getModel("fbHdModel").setProperty("/qWindow", higherDate);
                });
            },
            
            _getUserInfoPromise: function () {
                var that = this;
                return new Promise(function (resolve, reject) {
                    that._getUserInfo();
                    var intervalId = setInterval(function () {
                        var DOJModel = that.getOwnerComponent().getModel("fbHdModel").getData();
                        if (DOJModel && DOJModel.UserInfo && DOJModel.UserInfo.hireDate) {
                            clearInterval(intervalId);
                            resolve(DOJModel);
                        }
                    }, 100);
                });
            },
          
            _getUserInfo: function () {
                this.empId = "5042";
                var that = this;
                that.getOwnerComponent().getModel("fbHdModel").setProperty("/uId", this.empId);
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("userId", FilterOperator.EQ, "751229")];
                oModel.read("/User", {
                    "filters": oFilter,
                    "success": function (oData) {
                        that.getOwnerComponent().getModel("fbHdModel").setProperty("/UserInfo", oData.results[0]);
                    },
                    "error": function (oError) {

                    }
                })
            },

            _getPayComponent: function () {
                var oModel = this.getOwnerComponent().getModel();
                var that = this;
                oModel.read("/cust_fbp_paycomponentparameters", {
                    "success": function (oData) {
                        // debugger;
                        that.getOwnerComponent().getModel("fbPayModel").setProperty("/fbpComponents", oData.results);
                    },
                    "error": function (oError) {

                    }
                })
            },

            _getPayComp: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("userId", FilterOperator.EQ, "751229")];
                var that = this;
                oModel.read("/EmpPayCompRecurring", {
                    "filters": oFilter,
                    "success": function (oData) {
                        for (let i = 0; i < oData.results.length; i++) {
                            if (oData.results[i].payComponent == '1010') {
                                that.getOwnerComponent().getModel("fbHdModel").setProperty("/monthly_basis_salary", oData.results[i]);
                            } else if (oData.results[i].payComponent == '1020') {
                                that.getOwnerComponent().getModel("fbHdModel").setProperty("/monthly_HRA", oData.results[i]);
                            } else if (oData.results[i].payComponent == '1070') {
                                that.getOwnerComponent().getModel("fbHdModel").setProperty("/monthly_LTA", oData.results[i]);
                            } else if (oData.results[i].payComponent == '1040') {
                                that.getOwnerComponent().getModel("fbHdModel").setProperty("/monthly_CCA", oData.results[i]);
                            } else if (oData.results[i].payComponent == '1001') {
                                that.getOwnerComponent().getModel("fbHdModel").setProperty("/total_monthly_gross", oData.results[i]);
                            }
                        }
                    },
                    "error": function (oError) {

                    }
                })
            },

            _getEmpJobInfo:function(){
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("userId", FilterOperator.EQ, "5042")];
                var that = this;
                oModel.read("/EmpJob", {
                    urlParameters: {
                        "$expand": "employmentTypeNav,employmentTypeNav/picklistLabels"
                    },
                    "filters": oFilter,
                    "success": function (oData) {
                        that.getOwnerComponent().getModel("fbHdModel").setProperty("/JobInfo", oData.results);
                    },
                    "error": function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                    }
                })
            },

            _getFinYear:function(){
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("externalCode", FilterOperator.EQ, "Declaration")];
                var that = this;
                oModel.read("/cust_fbp_decalarationwindow", {
                    "filters": oFilter,
                    "success": function (oData) {
                         debugger;
                        that.getOwnerComponent().getModel("fbHdModel").setProperty("/finYear", oData.results);
                        // that._getQuartDetails();
                        // that._getApproverData();
                        console.log(oData.results[0]);
                    },
                    "error": function (oError) {
                        sap.ui.core.BusyIndicator.hide();
                    }
                })
            },

            _getDeclarationData: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("externalCode", FilterOperator.EQ, "5042")];
                var that = this;
                oModel.read("/cust_declaration_form", {
                    urlParameters: {
                        "$expand": ["cust_declarationform"]
                    },
                    "filters": oFilter,
                    "success": function (oData) {
                        that.getOwnerComponent().getModel("fbDeclareModel").setProperty("/fbpDecDetails", oData.results[0].cust_declarationform.results);
                    },
                    "error": function (oError) {

                    }
                })
            },

            onAddComponent: function () {
                var oFBModel = this.getOwnerComponent().getModel("fbBillModel");
                var oEData = oFBModel.getData();
                var oBbj = {
                    "pay_component_id": "",
                    "declared_amount": "",
                    "approved_amount": "",
                    "limit_amount": "",
                    "remarks": ""
                };
                if (oEData.length > 0) {
                    oEData.push(oBbj);
                } else {
                    oEData = [oBbj];
                }
                oFBModel.setData(oEData);
                oFBModel.refresh(true);

            },

            onBillDelete: function (oEvent) {
                var oBIndex = oEvent.getSource().getParent().getBindingContextPath().split("/")[1];
                var oModel = this.getOwnerComponent().getModel("fbBillModel");
                var oMData = oModel.getData();
                oMData.splice(oBIndex, 1);
                oModel.setData(oMData);
                oModel.refresh(true);
            },

            onChangeComponent: function (oEvent) {
                var that = this;
                var selectedPayComponentId = oEvent.getParameter("selectedItem").getKey();
                var selectedPayComponenttext = oEvent.getParameter("selectedItem").getText();

                var mParams = {
                    filters: [new Filter("externalCode", FilterOperator.EQ, selectedPayComponentId)],
                    success: function (oData) {
                        if (oData && oData.results && oData.results[0]) {
                            var limitAmount = oData.results[0].cust_limitamount;

                            // Get the fbBillModel
                            var oFBModel = that.getOwnerComponent().getModel("fbBillModel");
                            var oFBData = oFBModel.getData();

                            // Find the index of the row with the selected pay component id
                            var rowIndex = oFBData.findIndex(function (item) {
                                return item.pay_comp_id === selectedPayComponenttext;
                            });

                            // If rowIndex is not -1 (i.e., found), update the limit_amount
                            if (rowIndex !== -1) {
                                oFBData[rowIndex].limit_amount = limitAmount;
                                oFBModel.setData(oFBData);
                                oFBModel.refresh(true);
                            }
                        }
                    },
                    error: function (error) {
                        var errMsg = "";
                        try {
                            errMsg = JSON.parse(error.responseText).error.message.value;
                        } catch (e) {
                            errMsg = error.responseText;
                        }
                        MessageBox.error(errMsg);
                    }
                };

                that.getOwnerComponent().getModel().read("/cust_fbp_paycomponentparameters", mParams);
            },

            onBillSave: function (oEvent) {
                var oPBS = this.getView().byId("idSub");
                oPBS.setBusy(true);
                var vFlag = this._onSValidation();
                if (vFlag) {
                    var oModel = this.getOwnerComponent().getModel();
                    var oBData = this.getOwnerComponent().getModel("fbBillModel").getData();
                    var fComponent = this.getView().getModel("locModel").getProperty("/eSComponent");
                    var fCompDisc = this.getView().byId("retype").getSelectedItem().getText();
                    var oUpload = this.getView().byId("fileUploader");
                    // var domRef = oUpload.getFocusDomRef();
                    // var file = domRef.files[0];
                    var quart = this.getOwnerComponent().getModel("fbHdModel").getProperty("/qWindow/cust_quarter");
                    oBData = _.map(oBData, function (oBbj) {
                        var sData = new Date(oBbj.cust_bill_date);
                        var sDate = sData.getFullYear() + '' + (sData.getMonth() + 1) + '' + (sData.getDate() < 9 ? '0' + sData.getDate() : sData.getDate());
                        oBbj.cust_paycompid = fComponent;
                        oBbj.externalCode = '5042_' + oBbj.cust_pay_component + '_' + sDate + '_' + oBbj.cust_bill_number;
                        oBbj.cust_bill_date = new Date(oBbj.cust_bill_date);
                        oBbj.cust_declaration_form_externalCode = '5042';
                        oBbj.cust_declaration_form_effectiveStartDate = new Date();
                        oBbj.cust_Q1DecAmt = "0";
                        oBbj.cust_Q2DecAmt = "0";
                        oBbj.cust_Q3DecAmt = "0";
                        oBbj.cust_Q4DecAmt = "0";
                        oBbj.cust_quarter = quart;
                        oBbj.cust_subamt = oBbj.cust_bill_amount;
                        oBbj.externalName = fCompDisc;
                        oBbj.createdDateTime = new Date();
                        oBbj.createdBy = "5042";
                        return oBbj;
                    });
                    var oPData = {
                        "__metadata": {
                            "uri": "cust_declaration_form"
                        },
                        "externalCode": "5042",
                        "effectiveStartDate": this.getView().byId("_IDGenObjectStatus13").getValue(),
                        "cust_declarationform_child": oBData
                    };
                    oModel.create("/upsert", oPData, {
                        success: function () {
                            console.log("datasucces");
                            MessageBox.success("Saved Successfully");
                            oPBS.setBusy(false);
                            if (oUpload.getValue() !== '') {
                                oUpload.setValue(null);
                                this._uploadAttachment(fComponent, fCompDisc);

                            }
                            this._cFormData();

                        }.bind(this),
                        error: function () {

                        }.bind(this)
                    });
                } else {
                    oPBS.setBusy(false);
                }
            },

            _wfTrigger: function () {
                var oModel = this.getOwnerComponent().getModel("fbHdModel");
                sap.ui.core.BusyIndicator.show();
                var wfPayload = {
                    "definitionId": "ap10.devlaunchpad.flexiblebenefitplanfbpdeclaration.fBPDeclaration",
                    "context": {
                        "emp_id": "5045",
                        "emp_email": "nitin.chargundi@motiveminds.com",
                        "emp_name": "Nitin Chargundi",
                        "emp_company": "Prestige",
                        "approver_id": "5042",
                        "approver_email": "nitin.chargundi@motiveminds.com",
                        "approver_name": "Raunak Sharma",
                        "emp_eff_date": "2024-01-22",
                        "approvedon": "2024-01-22"

                    }
                }
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                var appPath = appId.replaceAll(".", "/");
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var wfUrlPath = appModulePath + "/workflow/rest/v1/workflow-instances";
                $.ajax({
                    url: wfUrlPath,
                    method: "POST",
                    async: false,
                    contentType: "application/json",
                    data: JSON.stringify(wfPayload),
                    success: function (result, xhr, data) {
                        console.log("WF Successfully started", data);
                        // this.wfApprInstanId = result.id;
                        // this.updtInstanIdWfAppr(this.wfApprInstanId);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.success("FBP Submitted Successfully", {
                            actions: sap.m.MessageBox.Action.OK,
                            onClose: async function (oAcion) {

                            }.bind(this)
                        });
                    }.bind(this),
                    error: function (data) {
                        console.log("WF Error", data);
                        sap.ui.core.BusyIndicator.hide();
                        MessageBox.error("FBP Submission Failed. Please try again after some time", {
                            actions: sap.m.MessageBox.Action.OK,
                            onClose: async function (oAcion) {

                            }.bind(this)
                        });
                    }.bind(this)

                });
            },
            onWfSubmitConf: function (oEvent) {
                MessageBox.warning("Are you sure you want to submit FBP submissions for approval?", {
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    onClose: async function (oAction) {
                        if (oAction === 'OK') {
                            this._wfTrigger();
                        }
                    }.bind(this)
                });
            }
        });
    });
