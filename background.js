const checked = true;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ checked });
    chrome.storage.local.set({ "professorList": {}});
    chrome.storage.local.set({ "notFoundList": []});
});

// Resets cached data every week
chrome.alarms.create("reset", {
    "delayInMinutes": 0.05,
    "periodInMinutes": 10080
});

chrome.alarms.onAlarm.addListener(alarm => {
    chrome.storage.local.set({ "professorList": {}});
    chrome.storage.local.set({ "notFoundList": []});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { professorNames } = request;

    updateFromURL(professorNames)
        .then(() => {
            chrome.storage.local.get("professorList", ({ professorList }) => {
                sendResponse({ "professorList": { ...professorList } });
            });
        });
    return true;
});

async function updateFromURL(professorNames) {
    for (let name of professorNames) {
        await getIndividualData(name);
    }
}

async function getIndividualData(name) {
    const schoolIDs = ["U2Nob29sLTM1OA%3D%3D", "U2Nob29sLTUw", "2Nob29sLTE4MTQx"];
    const baseUrl = `https://www.ratemyprofessors.com/search/teachers?query=${name}&sid=`;
    const linkUrl = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=`
    const displayRegex = /"legacyId":(\d+),"avgRating":([\d.]+),"numRatings":\d+,"wouldTakeAgainPercent":[-\d.]+,"avgDifficulty":[-\d.]+,"department":"[\w-' &]+","school":{"__ref":"(U2Nob29sLTM1OA|U2Nob29sLTUw|2Nob29sLTE4MTQx)=*"}/

    const professorList = await chrome.storage.local.get("professorList");
    const notFoundList = await chrome.storage.local.get("notFoundList");
    const tested = professorList.professorList.hasOwnProperty(name) || notFoundList.notFoundList.includes(name); 
    
    if (tested) {
        return undefined;
    }

    for (let id of schoolIDs) {
        try {
            const response = await fetch(baseUrl.concat(id));
            const text = await response.text();

            const displayProperties = text.match(displayRegex);

            if (displayProperties) {
                chrome.storage.local.set({ "professorList" : { ...professorList.professorList, [name]: { "rating": displayProperties[2], "link": linkUrl.concat(displayProperties[1]) }}});
                return { "rating": displayProperties[2], "link": linkUrl.concat(displayProperties[1])};
            }
            
        } catch (error) {
            console.error(error);
        }
    }

    chrome.storage.local.set({ "notFoundList": [ ...notFoundList.notFoundList, name]})
    return undefined;
}