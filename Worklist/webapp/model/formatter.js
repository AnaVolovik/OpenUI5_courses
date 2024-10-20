sap.ui.define([
	"sap/ui/core/format/DateFormat"
	] , function (DateFormat) {
		"use strict";

		return {
			numberUnit : function (sValue) {
				if (!sValue) {
					return "";
				}
				return parseFloat(sValue).toFixed(2);
			},

			formatDate: function (oDate) {
				if (oDate) {
						const oDateFormat = DateFormat.getDateInstance({
								style: "medium"
						});
						return oDateFormat.format(new Date(oDate));
				}
				return "";
		}
		};

	}
);