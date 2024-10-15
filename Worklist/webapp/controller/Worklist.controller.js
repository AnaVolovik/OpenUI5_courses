sap.ui.define([
	"zjblessons/Worklist/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"zjblessons/Worklist/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/Sorter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment"
], function (BaseController, JSONModel, formatter, Filter, Sorter, FilterOperator, Fragment) {
	"use strict";

	return BaseController.extend("zjblessons.Worklist.controller.Worklist", {

		formatter: formatter,

		onInit : function () {
			const oViewModel = new JSONModel({
				sCount : '0',
			});
			this.setModel(oViewModel, "worklistView");
		},

		onBeforeRendering: function () {
			this._bindTable();
		},
		
		_bindTable() {
			const oTable = this.getView().byId('table');

			oTable.bindItems({
				path: '/zjblessons_base_Headers',
				sorter: [new Sorter('DocumentDate', true)],
				template: this._getTableTemplate(),
				urlParameters: {
					$select: 'HeaderID,DocumentNumber,DocumentDate,PlantText,RegionText,Description,Created'
				},
				events: {
					dataRequested: (oData) => {
						this._getTableCounter();
					}
				}
			});
		},

		_getTableCounter() {
			this.getModel().read('/zjblessons_base_Headers/$count', {
				success: (sCount) => {
					this.getModel('worklistView').setProperty('/sCount', sCount);
				}
			})
		},
		
		_getTableTemplate() {
			const oTemplate = new sap.m.ColumnListItem({
				type: 'Navigation',
				navigated: true,
				cells: [
					new sap.m.Text({
						text: '{DocumentNumber}'
					}),
					new sap.m.Text({
						text: '{DocumentDate}'
					}),
					new sap.m.Text({
						text: '{PlantText}'
					}),
					new sap.m.Text({
						text: '{RegionText}'
					}),
					new sap.m.Text({
						text: '{Description}'
					}),
					new sap.m.Text({
						text: '{Created}'
					}),
					new sap.m.Button({
						type: 'Transparent',
						icon: this.getResourceBundle().getText('iDecline'),
						press: this.onPressDelete.bind(this)
					})
				]
			});
			
			return oTemplate;
		},

		onPressDelete(oEvent){
			const oBindingContext = oEvent.getSource().getBindingContext(),
					sKey = this.getModel().createKey('/zjblessons_base_Headers', {
						HeaderID: oBindingContext.getProperty('HeaderID')
					}),
					sBoxMessage = this.getResourceBundle().getText("MessageBoxMessage"),
					sBoxTitle = this.getResourceBundle().getText("MessageBoxTitle");
					
			sap.m.MessageBox.confirm(sBoxMessage, {
					title: sBoxTitle,
					onClose: (oAction) => {
						if (oAction === sap.m.MessageBox.Action.OK) {
							this.getModel().remove(sKey, {
									success: (oData) => {
										console.log('Delete successful:', oData);
									},
									error: (oError) => {
										console.error('Delete failed:', oError);
									}
							});
						} else {
							console.log('Delete action canceled');
						}
					}
				});
		},

		onPressRefresh() {
			const sMessageToast = this.getResourceBundle().getText("MessageToastMessage");
			this._bindTable();
			sap.m.MessageToast.show(sMessageToast);
		},

		onPressCreate() {
			this._loadCreateDialog();
		},

		_loadCreateDialog : async function () {
			if (!this._oDialog) {
				this._oDialog = await Fragment.load({
					name: "zjblessons.Worklist.view.fragment.CreateDialog",
					controller: this,
					id: "DialogAddNewRow"
				}).then(oDialog => {
					this.getView().addDependent(oDialog);
					return oDialog;
				})	
			}
			this._oDialog.open();
		},

		onDialogBeforeOpen(oEvent) {
			const oDialog = oEvent.getSource(),
					oParams = {
						Version: "A",
						HeaderID: "0"
					},
					oEntry = this.getModel().createEntry("/zjblessons_base_Headers", {
						properties: oParams
					});

			oDialog.setBindingContext(oEntry);
		},

		onPressSave(oEvent) {
			const oDialog = this._oDialog,
							oBindingContext = oDialog.getBindingContext(),
							oData = oBindingContext.getObject();
							console.log("Data to be saved:", oData);
							
				this.getModel().submitChanges();    
			this._oDialog.close();
		},
		
		onPressCancel() {
			this.getModel().resetChanges()
			this._oDialog.close();
		},

		onSearch : function (oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				this.onRefresh();
			} else {
				var aTableSearchState = [];
				var sQuery = oEvent.getParameter("query");

				if (sQuery && sQuery.length > 0) {
					aTableSearchState = [new Filter("DocumentNumber", FilterOperator.Contains, sQuery)];
				}
				this._applySearch(aTableSearchState);
			}

		},

		onSearchPlant: function(oEvent) {
			var aTableSearchState = [];
			var sQuery = oEvent.getParameter("query");
	
			if (sQuery && sQuery.length > 0) {
				aTableSearchState = [new Filter("PlantText", FilterOperator.EQ, sQuery)];
			}
			this._applySearch(aTableSearchState);
		},

		onRefresh : function () {
			var oTable = this.byId("table");
			oTable.getBinding("items").refresh();
		},

		_showObject : function (oItem) {
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("HeaderID")
			});
		},

		_applySearch: function(aTableSearchState) {
			var oTable = this.byId("table"),
				oViewModel = this.getModel("worklistView");
			oTable.getBinding("items").filter(aTableSearchState, "Application");
			if (aTableSearchState.length !== 0) {
				oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
			}
		}

	});
}
);