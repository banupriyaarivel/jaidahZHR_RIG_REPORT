sap.ui.define([
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat"
], function (DateFormat, NumberFormat) {
    "use strict";

    return {

        /**
         * Format date and time as "dd-MM-yyyy"
         */
        date: function (value) {
            if (value) {
                var oDateFormat = DateFormat.getDateTimeInstance({ pattern: "dd-MM-yyyy" });
                return oDateFormat.format(new Date(value));
            }
            return value;
        },

        /**
         * Format date only as "dd-MM-yyyy"
         */
        date1: function (value) {
            if (value) {
                var oDateFormat = DateFormat.getDateInstance({ pattern: "dd-MM-yyyy" });
                return oDateFormat.format(new Date(value));
            }
            return value;
        },

        /**
         * Rounds number to 2 decimal places
         */
        numberUnit: function (sValue) {
            if (!sValue) {
                return "";
            }
            return parseFloat(sValue).toFixed(2);
        },

        /**
         * Converts amount to fixed 2 decimal places
         */
        amount: function (value) {
            if (value) {
                return parseFloat(value).toFixed(2);
            }
            return "0.00";
        },

        /**
         * Status formatter for Approver Status
         */
        Priority: function (value) {
            if (value === "Completed") {
                return "Success";
            } else if (value === "Rejected") {
                return "Error";
            } else {
                return "Warning";
            }
        },

        /**
         * Parse ItemNo as integer
         */
        ItemNo: function (value) {
            return parseInt(value, 10);
        },

        /**
         * Round off currency values with 2 decimals
         */
      oRoundoff: function(oRound){
			var oRoundOff =  sap.ui.core.format.NumberFormat.getCurrencyInstance({
    "currencyCode": false,
    "customCurrencies": {
        "Bitcoin": {
            "decimals": 2
        }
    }
});
 var oRou = oRoundOff.format(oRound);
			return oRou;
		}

	};
});