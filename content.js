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
        startDate: $($('#sprint-meta-details .secondary-value')[0]).text(),
        endDate: $($('#sprint-meta-details .secondary-value')[2]).text(),

        committed: totalCommitted,
        achieved: getTableDataByType(completedIssuesTable, 'all'),
        initiallyAchieved: getTableDataByType(completedIssuesTable, 'initial'),
        added: totalAdded,
        addedBugs: totalAddedBugs,
        addedNonBugs: totalAddedNonBugs,
        removed: getTableDataByType(removedIssuesTable, 'all'),

        storiesCommitted: allTables.reduce((acc, table) => acc + getTableDataByType(table, 'all', 'Story', 'tasks'), 0),
        storiesDelivered: getTableDataByType(completedIssuesTable, 'all', 'Story', 'tasks'),
        storiesAdded: allTables.reduce((acc, table) => acc + getTableDataByType(table, 'added', 'Story', 'tasks'), 0),
    };

    scrumData.changed = scrumData.added - scrumData.removed;
    scrumData.absoluteChanged = scrumData.added + scrumData.removed;
    scrumData.productivity = parseInt(scrumData.achieved / scrumData.committed * 100) + '%';
    scrumData.effectivity = parseInt(scrumData.initiallyAchieved / scrumData.committed * 100) + '%';
    scrumData.entropy = parseInt(scrumData.changed / scrumData.committed * 100) + '%';
    scrumData.absoluteEntropy = parseInt(scrumData.absoluteChanged / scrumData.committed * 100) + '%';

    scrumData.storyProductivity = parseInt(scrumData.storiesDelivered / scrumData.storiesCommitted * 100) + '%';

    chrome.runtime.sendMessage({message: 'data_extracted', scrumData: scrumData});
});

let getTableDataByType = (table, dataType, ticketType = null, countType = 'points') => {
    if (dataType === 'added') {
        return getTableSum(table, true, ticketType, countType);
    }

    let all = getTableSum(table, false, ticketType, countType);
    if (dataType === 'all') {
        return all;
    }

    return all - getTableSum(table, true, ticketType, countType);
};

let getTableSum = (table, onlyAdded = false, ticketType = null, countType = 'points') => {
    let selector = onlyAdded ? '.ghx-added ' : '';
    selector += '.ghx-right.ghx-minimal.ghx-nowrap';

    return $(table).find(selector).toArray().splice(1).reduce((acc, item) => {
        if (ticketType && $($(item).parent().find('.ghx-nowrap')[1]).text() != ticketType) {
            return acc;
        }

        if (countType === 'tasks') {
            return acc + 1;
        }

        let currentValue = $(item).find('.ghx-current-value').toArray().length > 0 ? $(item).find('.ghx-current-value').text() : $(item).text();
        if (currentValue === '-' || currentValue === '0') {
            return acc;
        }

        return acc + parseInt(currentValue);
    }, 0);
};

