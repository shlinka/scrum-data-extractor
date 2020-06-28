chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message !== 'extract_data') {
        return;
    }

    let completedIssuesTable = $('h4:contains("Completed Issues")').parent().parent().next('table');
    let notCompletedIssuesTable = $('h4:contains("Issues Not Completed")').parent().parent().next('table');
    let outSprintCompletedIssuesTable = $('h4:contains("Issues completed outside of this sprint")').parent().parent().next('table');
    let removedIssuesTable = $('h4:contains("Issues Removed From Sprint")').parent().parent().next('table');

    getTableDataByType(notCompletedIssuesTable, 'initial');
    let allTables = [completedIssuesTable, notCompletedIssuesTable, outSprintCompletedIssuesTable, removedIssuesTable];

    let totalCommitted = allTables.reduce((acc, table) => acc + getTableDataByType(table, 'initial'), 0);
    let totalAdded = allTables.reduce((acc, table) => acc + getTableDataByType(table, 'added'), 0);
    let totalAddedBugs = allTables.reduce((acc, table) => acc + getTableDataByType(table, 'added', 'Bug'), 0);
    let totalAddedNonBugs = totalAdded - totalAddedBugs;

    let scrumData = {
        startDate: $('#ghx-sprint-report-meta [title="Start Date"]').text(),
        endDate: $('#ghx-sprint-report-meta [title="Completion Date"]').text(),

        committed: totalCommitted,
        achieved: getTableDataByType(completedIssuesTable, 'all'),
        initiallyAchieved: getTableDataByType(completedIssuesTable, 'initial'),
        added: totalAdded,
        addedBugs: totalAddedBugs,
        addedNonBugs: totalAddedNonBugs,
        removed: getTableDataByType(removedIssuesTable, 'all'),
    };

    scrumData.changed = scrumData.added - scrumData.removed;
    scrumData.productivity = parseInt(scrumData.achieved / scrumData.committed * 100) + '%';
    scrumData.effectivity = parseInt(scrumData.initiallyAchieved / scrumData.committed * 100) + '%';
    scrumData.entropy = parseInt(scrumData.changed / scrumData.committed * 100) + '%';

    chrome.runtime.sendMessage({message: 'data_extracted', scrumData: scrumData});
});

let getTableDataByType = (table, dataType, ticketType = null) => {
    if (dataType === 'added') {
        return getTableSum(table, true, ticketType);
    }

    let all = getTableSum(table);
    if (dataType === 'all') {
        return all;
    }

    return all - getTableSum(table, true);
};

let getTableSum = (table, onlyAdded = false, ticketType = null) => {
    let selector = onlyAdded ? '.ghx-added ' : '';
    selector += '.ghx-right.ghx-minimal.ghx-nowrap';

    return $(table).find(selector).toArray().splice(1).reduce((acc, item) => {
        let currentValue = $(item).find('.ghx-current-value').toArray().length > 0 ? $(item).find('.ghx-current-value').text() : $(item).text();

        if (currentValue === '-' || currentValue === '0') {
            return acc;
        }

        if (ticketType && $($(item).parent().find('.ghx-nowrap')[1]).text() != ticketType) {
            return acc;
        }

        return acc + parseInt(currentValue);
    }, 0);
};

