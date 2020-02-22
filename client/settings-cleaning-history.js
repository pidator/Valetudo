/*global ons, fn*/
var loadingBarSettingsCleaningHistory =
    document.getElementById("loading-bar-settings-cleaning-history");
var settingsCleaningHistory = document.getElementById("settings-cleaning-history");
var settingsCleaningHistoryLoadMoreButtons =
    document.getElementById("settings-cleaning-history-load-more");
var remainingShownCount = 5;
var historyArray, timeZone;

ons.getScriptPage().onShow = function() {
    updateSettingsCleaningHistoryPage();
};

// eslint-disable-next-line no-unused-vars
function loadMoreItems() {
    remainingShownCount = historyArray.length > 5 ? 5 : historyArray.length;
    loadNextRemainingElements();
}

function updateSettingsCleaningHistoryPage() {
    loadingBarSettingsCleaningHistory.setAttribute("indeterminate", "indeterminate");
    while (settingsCleaningHistory.lastChild) {
        settingsCleaningHistory.removeChild(settingsCleaningHistory.lastChild);
    }
    fn.request("api/clean_summary", "GET", function(err, res) {
        if (!err) {
            // summary succeeded
            historyArray = res[3];
            // getting current timezone for properly showing local time
            fn.request("api/get_timezone", "GET", function(err, res) {
                loadingBarSettingsCleaningHistory.removeAttribute("indeterminate");
                if (!err) {
                    timeZone = res;
                    loadNextRemainingElements();
                } else {
                    ons.notification.toast(
                        err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                }
            });
        } else {
            loadingBarSettingsCleaningHistory.removeAttribute("indeterminate");
            ons.notification.toast(err,
                {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
        }
    });
}

function formatTwoDigitNumber(number) {
    if (number >= 0 && number <= 9) {
        return "0" + number;
    } else
        return number;
}

function loadNextRemainingElements() {
    if (!historyArray.length) {
        remainingShownCount = 0;
    }
    if (remainingShownCount > 0) {
        loadingBarSettingsCleaningHistory.setAttribute("indeterminate", "indeterminate");
        var historyTimestamp =
            historyArray.shift(); // array is sorted with latest items in the beginning
        fn.requestWithPayload(
            "api/clean_record", JSON.stringify({recordId: historyTimestamp}), "PUT",
            function(err, res) {
                loadingBarSettingsCleaningHistory.removeAttribute("indeterminate");
                if (err) {
                    ons.notification.toast(
                        err, {buttonLabel: "Dismiss", timeout: window.fn.toastErrorTimeout});
                } else {
                    // adjust counters
                    remainingShownCount--;
                    // set variables
                    var currentEntryId = historyArray.length + 1;
                    var fromTime =
                        new Date(res.startTime).toLocaleString("default", {timeZone: timeZone});
                    var durationTotalSeconds = res.duration;
                    var durationHours = Math.floor(durationTotalSeconds / 3600);
                    var remsecs = durationTotalSeconds % 3600;
                    var durationMinutes = Math.floor(remsecs / 60);
                    var durationSeconds = (remsecs % 60);
                    var area = Math.round(res.area / 1000000);
                    var errorCode = res.errorCode;
                    var errorDescription = res.errorDescription;
                    var completedFlag = res.finishedFlag;
                    settingsCleaningHistory.appendChild(ons.createElement(
                        "<ons-list-item>\n" +
                        "   <ons-row>" +
                        "       <ons-col></ons-col>" +
                        "       <ons-col width='400px' vertical-align='center' style='text-align:center;'>#" +
                        currentEntryId + " started on " + fromTime + "</ons-col>" +
                        "       <ons-col></ons-col>" +
                        "   </ons-row>" +
                        "   <ons-row>" +
                        "       <ons-col></ons-col>" +
                        "       <ons-col vertical-align='center' width='100px'>Duration</ons-col>" +
                        "       <ons-col vertical-align='center' width='150px'>" + durationHours +
                        ":" + formatTwoDigitNumber(durationMinutes) + ":" +
                        formatTwoDigitNumber(durationSeconds) + "</ons-col>" +
                        "       <ons-col></ons-col>" +
                        "   </ons-row>" +
                        "   <ons-row>" +
                        "       <ons-col></ons-col>" +
                        "       <ons-col vertical-align='center' width='100px'>Area</ons-col>" +
                        "       <ons-col vertical-align='center' width='150px'>" + area +
                        " m<sup>2</sup></ons-col>" +
                        "       <ons-col></ons-col>" +
                        "   </ons-row>" +
                        "   <ons-row>" +
                        "       <ons-col></ons-col>" +
                        "       <ons-col vertical-align='center' width='100px'>Completed</ons-col>" +
                        "       <ons-col vertical-align='center' width='150px'>" +
                        (completedFlag ? "<ons-icon icon='fa-check-circle' style='color:green;'>"
                            : "<ons-icon icon='fa-times-circle' style='color:red;'>") +
                        "</ons-col>" +
                        "       <ons-col></ons-col>" +
                        "   </ons-row>" +
                        (errorCode > 0
                            ? "   <ons-row>" +
                                   "       <ons-col></ons-col>" +
                                   "       <ons-col vertical-align='center' width='400px' style='text-align:center;'><ons-icon icon='fa-warning' style='color:red;'></ons-icon>&nbsp;" +
                                   errorDescription + " (Code: " + errorCode + ")</ons-col>" +
                                   "       <ons-col></ons-col>" +
                                   "   </ons-row>"
                            : "") +
                        "</ons-list-item>"));
                    // load next element
                    loadNextRemainingElements();
                }
            });
    } else {
        if (historyArray.length > 0) {
            // show link to load more
            settingsCleaningHistoryLoadMoreButtons.style.display = "block";
        } else {
            // hide link to load more
            settingsCleaningHistoryLoadMoreButtons.style.display = "none";
        }
    }
}
