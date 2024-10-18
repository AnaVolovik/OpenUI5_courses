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
				sCount: '0',
				sIconTHKey: 'All'
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
				filters: this._getTableFilters(),
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

		_getTableFilters() {
			const oModel = this.getModel('worklistView'),
						sSelectedKey = oModel.getProperty('/sIconTHKey');

			return sSelectedKey === 'All' ? [] : [new Filter('Version', FilterOperator.EQ, 'D')];
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

			this.getModel().submitChanges();
			this._oDialog.close();
		},
		
		onPressCancel() {
			this.getModel().resetChanges()
			this._oDialog.close();
		},

		onSearch(oEvent) {
			const sValue = oEvent.getParameter('query');

			this._searchHandler(sValue);
		},

		_searchHandler(sValue) {
			const oTable = this.getView().byId('table'),
						oFilter = new Filter({
								filters: [
										new Filter('DocumentNumber', FilterOperator.Contains, sValue),
										new Filter('PlantText', FilterOperator.EQ, sValue)
								],
								and: false
						});

			oTable.getBinding('items').filter(oFilter);
		},

		_onDateRangeChange(oEvent) {
			const oTable = this.getView().byId('table'),
						oDateRange = oEvent.getSource(),
						oStartDate = oDateRange.getDateValue(),
						oEndDate = oDateRange.getSecondDateValue(),
						oFilter = new sap.ui.model.Filter("DocumentDate", sap.ui.model.FilterOperator.BT, oStartDate, oEndDate);

			oTable.getBinding('items').filter([oFilter]);
		},

		onItemSelect(oEvent) {
			const oSelectedItem = oEvent.getParameter('listItem'),
						sHeaderId = oSelectedItem.getBindingContext().getProperty('HeaderID');

			this.getRouter().navTo('object', {
				objectId: sHeaderId
			})
		},

		onIconTabHeaderSelect(oEvent) {
			const sSelectedKey = oEvent.getParameter('key');

			this.getModel('worklistView').setProperty('/sIconTHKey', sSelectedKey);
			this._bindTable()
		}

	});
}
);