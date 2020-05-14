$(() => {
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        var activeTab = tabs[0];
        chrome.tabs.sendMessage(activeTab.id, {message: 'extract_data'});
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.message !== 'data_extracted') {
            return;
        }

        for (var key in request.scrumData) {
            $('#tabs_table tr:last').after('<tr><td>' + key + '</td>' + '<td>' + request.scrumData[key] + '</td></tr>');
        }
    });
});