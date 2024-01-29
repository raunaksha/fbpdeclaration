sap.ui.define([], function () {
    "use strict";
    return {
        resigDtFormatDisplayNew: function (odate) {
            var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd-MM-yyyy" });
            var dateFormatted = dateFormat.format(odate);   // y MMM d
            return dateFormatted;

        },
        getEffectiveDate: function (oFBPData, UserInfo) {
            // Check if Date of Joining is higher than FBP Effective Date
            var dateOfJoining = new Date(UserInfo.hireDate);
            var fbpEffectiveDate = new Date(oFBPData.effectiveStartDate);

            if (dateOfJoining > fbpEffectiveDate) {
                // If Date of Joining is higher, replace FBP Effective Date with Date of Joining
                fbpEffectiveDate = dateOfJoining;
            }

            // Format the date as needed
            var formattedDate = this.formatDateToDDMMYYYY(fbpEffectiveDate);

            return formattedDate;
        }
    };
});