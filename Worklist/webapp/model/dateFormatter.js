sap.ui.define([
  "sap/ui/core/format/DateFormat"
], function (DateFormat) {
  "use strict";

  return {
      formatCreatedDate: function (date) {
          if (date) {
              var oDateFormat = DateFormat.getInstance({
                  pattern: "HH:mm dd/MM/yyyy",
                  UTC: true
              });
              return oDateFormat.format(new Date(date));
          }
          return "";
      },

      formatDocumentDate: function (date) {
          if (date) {
              var oDateFormat = DateFormat.getInstance({
                  style: "short"
              });
              return oDateFormat.format(new Date(date));
          }
          return "";
      }
  };
});