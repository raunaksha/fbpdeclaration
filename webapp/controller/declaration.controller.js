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
                this._getCarComponent();
                this._getEmpJobInfo();
                this._getFinYear();
                this.calculateFinancialYearStartDate();
                this._getDeclarationData();
                this.checkDeclarationPeriod();
                this._carPickList();
                this._carLeaseData();
            },


            calculateFinancialYearStartDate: function () {
                var that = this;
                this._getUserInfo();

                // Use a promise to make sure the getUserInfo function is resolved before further processing
                this._getUserInfoPromise().then(function (DOJModel) {
                    var DOJ = DOJModel.UserInfo.hireDate;
                    var currentDate = new Date();
                    that.getOwnerComponent().getModel("fbHdModel").setProperty("/submission_date", currentDate);
                    var financialYearStartMonth = 3;
                    var financialYearStartYear = currentDate.getMonth() < financialYearStartMonth
                        ? currentDate.getFullYear() - 1
                        : currentDate.getFullYear();

                    // Set the financial year start date
                    var financialYearStartDate = new Date(financialYearStartYear, financialYearStartMonth, 1);
                    that.getOwnerComponent().getModel("fbHdModel").setProperty("/financialYearStartDate", financialYearStartDate);
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
                this.empId = "751229";
                var that = this;
                that.getOwnerComponent().getModel("fbHdModel").setProperty("/uId", this.empId);
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("userId", FilterOperator.EQ, this.empId)];
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
                var oFilter = [new Filter("cust_specialPayComp", FilterOperator.EQ, "N")];
                var that = this;
                oModel.read("/cust_fbp_paycomponentparameters", {
                    "filters": oFilter,
                    "success": function (oData) {
                        that.getOwnerComponent().getModel("fbPayModel").setProperty("/fbpComponents", oData.results);
                    },
                    "error": function (oError) {

                    }
                })
            },

            _getCarComponent: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("cust_specialPayComp", FilterOperator.EQ, "Y")];
                var that = this;
                oModel.read("/cust_fbp_paycomponentparameters", {
                    "filters": oFilter,
                    "success": function (oData) {
                        that.getOwnerComponent().getModel("fbCarModel").setProperty("/fbpComponents", oData.results);
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

            _getEmpJobInfo: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("userId", FilterOperator.EQ, "751229")];
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

            _getFinYear: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("externalCode", FilterOperator.EQ, "Declaration")];
                var that = this;

                return new Promise(function (resolve, reject) {
                    oModel.read("/cust_fbp_decalarationwindow", {
                        "filters": oFilter,
                        "success": function (oData) {
                            that.getOwnerComponent().getModel("fbHdModel").setProperty("/finYear", oData.results);
                            resolve();
                            console.log(oData.results[0]);
                        },
                        "error": function (oError) {
                            sap.ui.core.BusyIndicator.hide();
                            reject(oError);
                        }
                    });
                });
            },

            onCarSelect: function () {
                var oModel = this.getOwnerComponent().getModel();
                var grade = this.getOwnerComponent().getModel("fbHdModel").getProperty("/JobInfo/0/employmentTypeNav/externalCode");
                var oFilter = [new Filter("externalCode", FilterOperator.EQ, grade)];
                var that = this;
                var rangeSubSet = function (rangeList, selectedKey) {
                    let
                        result = []; rangeList.
                            forEach
                            (
                                obj => {
                                    if
                                        (
                                        parseFloat
                                            (obj.externalCode) <=
                                        parseFloat
                                            (selectedKey)) {
                                        result.
                                            push
                                            (obj);
                                    }
                                });
                    return result;
                }
                return new Promise(function (resolve, reject) {
                    oModel.read("/cust_gradeCarRentalMapping", {
                        "filters": oFilter,
                        "success": function (oData) {
                            that.getOwnerComponent().getModel("fbHdModel").setProperty("/carCostRange", oData.results[0].cust_carCostRange);
                            const carCostRange = oData.results[0].cust_carCostRange;
                            var carRangeList = that.getOwnerComponent().getModel("fbHdModel").getProperty("/carPickList/0/values/results");
                            var filteredRange = rangeSubSet(carRangeList, carCostRange);
                            that.getOwnerComponent().getModel("fbCarModel").setProperty("/carCostRange", filteredRange); // Set filtered range
                            resolve(filteredRange);
                        },
                        "error": function (oError) {
                            sap.ui.core.BusyIndicator.hide();
                            reject(oError);
                        }
                    });
                });
            },

            _carLeaseData: function(){
                var that = this;
                var empId = that.getOwnerComponent().getModel("fbHdModel").getProperty("/uId");
                var oModel = that.getOwnerComponent().getModel();
                var oFilter = [new Filter("externalCode ", FilterOperator.EQ, empId)];
                // var that = this;
                oModel.read("/cust_FBPcarLeaseAgreement", {
                    "filters": oFilter,
                    "success": function (oData) {
                        that.getOwnerComponent().getModel("fbCarLeaseModel").setData(oData.results);
                        if (oData.results.length > 0 && oData.results[0].cust_wf_status === "Approved") {
                            that.getView().getModel("fbHdModel").setProperty("/cancelbuttonsEnabled", true);
                        }else{
                            that.getView().getModel("fbHdModel").setProperty("/cancelbuttonsEnabled", false);
                        }
                    },
                    "error": function (oError) {

                    }
                })
            },

            onCarRangeSelect: function (oEvent) {
                var that = this;
                var oFBModel = that.getOwnerComponent().getModel("fbCarLeaseModel");
                var oFBData = oFBModel.getData();
                var carRangeKey = oEvent.getParameters().selectedItem.mProperties.key;
                var oModel = that.getOwnerComponent().getModel();
                var oFilter = [new Filter("externalCode ", FilterOperator.EQ, carRangeKey)];
                // var that = this;
                oModel.read("/cust_carRentalAmount", {
                    "filters": oFilter,
                    "success": function (oData) {
                        var cust_declared_amount = oData.results[0].cust_leaseRentalAmount;
                        oFBData[0].cust_declared_amount = cust_declared_amount;
                        oFBModel.setData(oFBData);
                        oFBModel.refresh(true);
                    },
                    "error": function (oError) {

                    }
                })

            },

            _carPickList: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("id", FilterOperator.EQ, "carCostRange")];
                var that = this;
                oModel.read("/PickListV2", {
                    urlParameters: {
                        "$expand": ["values"]
                    },
                    "filters": oFilter,
                    "success": function (oData) {
                        that.getOwnerComponent().getModel("fbHdModel").setProperty("/carPickList", oData.results);
                    },
                    "error": function (oError) {

                    }
                })
            },

            checkDeclarationPeriod: function () {
                var that = this;
                this._getFinYear().then(function () {
                    var currentDate = new Date();
                    var startDate = new Date(that.getOwnerComponent().getModel("fbHdModel").getProperty("/finYear/0/effectiveStartDate"));
                    var endDate = new Date(that.getOwnerComponent().getModel("fbHdModel").getProperty("/finYear/0/cust_windowend"));
                    var totalMonthlyGross = that.getOwnerComponent().getModel("fbHdModel").getProperty("/total_monthly_gross/paycompvalue");

                    if (currentDate >= startDate && currentDate <= endDate && totalMonthlyGross > 70000) {
                        console.log("You Can Access The Application");
                    } else {
                        sap.m.MessageBox.error("The application is not accessible as the current date is not within the declaration period.");
                    }
                }).catch(function (error) {
                    console.error("Error fetching finYear:", error);
                });
            },


            _getDeclarationData: function () {
                var oModel = this.getOwnerComponent().getModel();
                var oFilter = [new Filter("externalCode", FilterOperator.EQ, "751229")];
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

            onAddCarComponent: function () {
                var oFBModel = this.getOwnerComponent().getModel("fbCarLeaseModel");
                var oEData = oFBModel.getData();
                var oBbj = {
                    "externalCode": "",
                    "cust_carCostRange": "",
                    "cust_declared_amount": "",
                    "cust_wf_status": "",
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

            onCarLeaseDelete: function (oEvent) {
                var oBIndex = oEvent.getSource().getParent().getBindingContextPath().split("/")[1];
                var oModel = this.getOwnerComponent().getModel("fbCarLeaseModel");
                var oMData = oModel.getData();
                oMData.splice(oBIndex, 1);
                oModel.setData(oMData);
                oModel.refresh(true);
            },

            onChangeComponent: function (oEvent) {
                var that = this;
                var selectedPayComponentId = oEvent.getParameter("selectedItem").getKey();
                var selectedPayComponenttext = oEvent.getParameter("selectedItem").getText();
                // that.getOwnerComponent().getModel("fbBillModel").setProperty("/pay_component_id", selectedPayComponentId)
                var mParams = {
                    filters: [new Filter("externalCode", FilterOperator.EQ, selectedPayComponentId)],
                    success: function (oData) {
                        if (oData && oData.results && oData.results[0]) {
                            that.getOwnerComponent().getModel("fbBillModel").setProperty("/cust_frequency", oData.results[0].cust_frequency);
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
                                oFBData[rowIndex].pay_component_id = selectedPayComponentId;
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

            onDeclaredAmountChange: function (oEvent) {
                var declaredAmount = oEvent.getParameters().value;
                declaredAmount = parseFloat(declaredAmount);
                var monthlyLimit = this.getOwnerComponent().getModel("fbBillModel").getData()[0].limit_amount;
                monthlyLimit = parseFloat(monthlyLimit);

                if (declaredAmount > monthlyLimit) {
                    sap.m.MessageToast.show("Declared amount cannot exceed monthly limit amount.");
                }
            },

            onBillCancel: function(){

            },

            
            onBillSave: function (oEvent) {
                var oPBS = this.getView().byId("idSub");
                oPBS.setBusy(true);
            
                var fbBillModel = this.getOwnerComponent().getModel("fbBillModel");
                var fbHdModel = this.getOwnerComponent().getModel("fbHdModel");
                var efDate = new Date(fbHdModel.getProperty("/qWindow"));
                var crDate = new Date(fbHdModel.getProperty("/submission_date"));
                var finYear = fbHdModel.getProperty("/finYear/0/cust_finyear");
                var parts = finYear.split("-");
                var convertedFinancialYear = parts[0] + parts[1];
                var cust_frequency = fbBillModel.getProperty("/cust_frequency");
                var financialYearStartDate = fbHdModel.getProperty("/financialYearStartDate");
                var eff_start_date = fbHdModel.getProperty("/qWindow");
            
                var oBillData = fbBillModel.getData();
                var refinedData = [];
            
                oBillData.forEach(function (item) {
                    var declared_amount = parseFloat(item.declared_amount);
                    var cust_Q1DecAmt = 0.0;
                    var cust_Q2DecAmt = 0.0;
                    var cust_Q3DecAmt = 0.0;
                    var cust_Q4DecAmt = 0.0;
                    var cust_YearlyDecAmt = "";
            
                    if (eff_start_date === financialYearStartDate) {
                        if (cust_frequency === "Quarterly") {
                            cust_Q1DecAmt = declared_amount * 3;
                            cust_Q2DecAmt = declared_amount * 3;
                            cust_Q3DecAmt = declared_amount * 3;
                            cust_Q4DecAmt = declared_amount * 3;
                        } else {
                            cust_YearlyDecAmt = declared_amount * 12;
                        }
                    }
            
                    refinedData.push({
                        "cust_paycompid": item.pay_component_id,
                        "externalCode": "751229" + '_' + item.pay_component_id + '_' + convertedFinancialYear,
                        "cust_declaration_form_externalCode": "751229",
                        "cust_declaration_form_effectiveStartDate": efDate,
                        "cust_Q1DecAmt": cust_Q1DecAmt,
                        "cust_Q2DecAmt": cust_Q2DecAmt,
                        "cust_Q3DecAmt": cust_Q3DecAmt,
                        "cust_Q4DecAmt": cust_Q4DecAmt,
                        "cust_YearlyDecAmt": cust_YearlyDecAmt.toString(),
                        "cust_declared_amount": declared_amount,
                        "cust_wf_status": "Draft",
                        "cust_approvedBy": "5045",
                        "cust_remarks": item.remarks,
                        "externalName": item.pay_comp_id,
                        "createdDateTime": crDate,
                        "createdBy": "751229"
                    });
                });
            
                var oModel = this.getOwnerComponent().getModel();
                var oPData = {
                    "__metadata": {
                        "uri": "cust_declaration_form"
                    },
                    "externalCode": "751229",
                    "effectiveStartDate": efDate,
                    "cust_declarationform": refinedData
                };
            
                oModel.create("/upsert", oPData, {
                    success: function () {
                        console.log("datasuccess");
                        MessageBox.success("Saved Successfully");
                        oPBS.setBusy(false);
                        this._cFormData();
                    }.bind(this),
                    error: function () {
                        // Handle error if needed
                    }.bind(this)
                });
            },            

            _cFormData: function (oEvent) {
                var oFBModel = this.getOwnerComponent().getModel("fbBillModel");
                oFBModel.setData([]);
                oFBModel.refresh(true);
            },

            _wfTrigger: function () {
                this.getView().getModel("fbHdModel").setProperty("/buttonsEnabled", false);
                var format = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "yyyy-MM-dd" });
                var oModel = this.getOwnerComponent().getModel("fbHdModel");
                sap.ui.core.BusyIndicator.show();
                var wfPayload = {
                    "definitionId": "ap10.devlaunchpad.flexiblebenefitplanfbpdeclaration.fBPDeclaration",
                    "context": {
                        "emp_id": oModel.getProperty("/uId"),
                        "emp_email": oModel.getProperty("/UserInfo/email"),
                        "emp_name": oModel.getProperty("/UserInfo/firstName") + " " + oModel.getProperty("/UserInfo/lastName"),
                        "emp_company": "Prestige",
                        "approver_id": "5045",
                        "approver_email": "nitin.chargundi@motiveminds.com",
                        "approver_name": "Raunak Sharma",
                        "emp_eff_date": format.format(oModel.getData().qWindow),
                        "approvedon": "2024-01-31"

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
                        this.wfApprInstanId = result.id;
                        this.updtInstanIdWfAppr(this.wfApprInstanId);
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

            updtInstanIdWfAppr: function (wfId) {
                var oModel = this.getOwnerComponent().getModel();
                var ofModel = this.getOwnerComponent().getModel("fbHdModel");
                var efDate = new Date(ofModel.getProperty("/qWindow"));
                var oBillData = this.getView().getModel("fbDeclareModel").getProperty("/fbpDecDetails");
                var refinedData = oBillData.map(function (item) {
                    return {
                        "externalCode": item.externalCode,
                        "cust_declaration_form_externalCode": item.cust_declaration_form_externalCode,
                        "cust_declaration_form_effectiveStartDate": new Date(item.cust_declaration_form_effectiveStartDate),
                        "cust_wf_status": "Submitted",
                        "cust_submittedBy": ofModel.getProperty("/uId"),
                        "cust_submittedOn": new Date()
                    };
                });
                var oPData = {
                    "__metadata": {
                        "uri": "cust_declaration_form"
                    },
                    "externalCode": "751229",
                    "effectiveStartDate": efDate,
                    "cust_wf_status": "Submitted",
                    "cust_declarationform": refinedData
                };
                oModel.create("/upsert", oPData, {
                    success: function () {

                    }.bind(this),
                    error: function () {

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
