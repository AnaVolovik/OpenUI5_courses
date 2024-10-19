sap.ui.define([
	"zjblessons/Worklist/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"zjblessons/Worklist/model/formatter",
	"sap/ui/core/Fragment"
], function (
	BaseController,
	JSONModel,
	History,
	formatter,
	Fragment
) {
	"use strict";

	return BaseController.extend("zjblessons.Worklist.controller.Object", {

		formatter: formatter,

		onInit : function () {
			const oViewModel = new JSONModel({
				busy : true,
				delay : 0,
				bEditMode : false,
				sSelectedTab : "list"
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "objectView");
		},

		onBeforeRendering() {
			this._bindTemplate();
		},

		async _getPlantTemplate() {
			this._pPlantTemplate ??= await Fragment.load({
					name: 'zjblessons.Worklist.view.fragment.template.ComboBoxItem',
					id: this.getView().getId(),
					controller: this
				}).then((oTemplate => {
					this.getView().addDependent(oTemplate);
					return oTemplate;
				}))

				return this._pPlantTemplate;
		},

		async _bindTemplate() {
			const oComboBox = this.getView().byId('idPlantTextComboBox'),
						oTemplate = await this._getPlantTemplate();

			oComboBox.bindItems({
				path: '/zjblessons_base_Plants',
				template: oTemplate,
				events: {
						dataReceived: () => {oComboBox.setBusy(false)},
						dataRequested: () => {oComboBox.setBusy(true)}
				}
			})
		},

		onNavBack : function() {
			var sPreviousHash = History.getInstance().getPreviousHash();

			if (sPreviousHash !== undefined) {
				history.go(-1);
			} else {
				this.getRouter().navTo("worklist", {}, true);
			}
		},

		_onObjectMatched : function (oEvent) {
			var sObjectId =  oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then( function() {
				var sObjectPath = this.getModel().createKey("zjblessons_base_Headers", {
					HeaderID :  sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		_bindView : function (sObjectPath) {
			var oViewModel = this.getModel("objectView"),
				oDataModel = this.getModel();

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oDataModel.metadataLoaded().then(function () {
							oViewModel.setProperty("/busy", true);
						});
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange : function () {
			var oView = this.getView(),
				oViewModel = this.getModel("objectView"),
				oElementBinding = oView.getElementBinding();

			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("objectNotFound");
				return;
			}
		},

		onPressEdit() {
			this._setEditMode(true);
		},

		onPressSave() {
			const oModel = this.getModel(),
						oObjectView = this.getView(),
						oPendingChanges = oModel.getPendingChanges(),
						sPath = oObjectView.getBindingContext().getPath().slice(1);

			if (oPendingChanges.hasOwnProperty(sPath)) {
				oObjectView.setBusy(true);
				oModel.submitChanges({
					success: () => {oObjectView.setBusy(false)},
					error: () => {oObjectView.setBusy(false)}
				});
			}
			this._setEditMode(false);
		},

		onPressCancel() {
			this._setEditMode(false);
			this.getModel().resetChanges();
		},

		_setEditMode(bValue) {
			const oModel = this.getModel("objectView");
			oModel.setProperty('/bEditMode', bValue);
		}

	});

}
);