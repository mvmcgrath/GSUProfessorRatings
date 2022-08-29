const checked = true;

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.set({ checked });
    chrome.storage.local.set({ "professorList": {}});
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { professorNames } = request;

    updateFromURL(professorNames)
        .then((result) => {
            if (Object.keys(result).length) {
                chrome.storage.local.get("professorList", ({ professorList }) => {
                    chrome.storage.local.set({ "professorList" : { ...professorList, ...result }});
                    sendResponse({ "professorList": { ...professorList, ...result } });
                });
            } else {
                chrome.storage.local.get("professorList", ({ professorList }) => {
                    sendResponse({ "professorList": { ...professorList } });
                });
            }
        });
    return true;
});

async function updateFromURL(professorNames) {
    const tempProfessorContainer = {};

    for (let name of professorNames) {
        const result = await getIndividualData(name.split(" ").join("%20"));
        if (result !== undefined) {
            tempProfessorContainer[name] = result;
        }
    }
    return tempProfessorContainer;
}

async function getIndividualData(name) {
    const schoolIDs = ["U2Nob29sLTM1OA%3D%3D", "U2Nob29sLTUw", "2Nob29sLTE4MTQx"];
    const baseUrl = `https://www.ratemyprofessors.com/search/teachers?query=${name}&sid=`;
    const linkUrl = `https://www.ratemyprofessors.com/ShowRatings.jsp?tid=`
    const pageRegex = /"legacyId":(\d+),"avgRating":([\d.]+)/

    const professorList = await chrome.storage.local.get("professorList");
    const found = professorList.professorList.hasOwnProperty(name.split("%20").join(" ")); 
    
    if (found) {
        return undefined;
    }

    for (let id of schoolIDs) {
        try {
            // Always fetches even if a professor will never be found. Figure out a way to optimize somehow?
            const response = await fetch(baseUrl.concat(id));
            const text = await response.text();

            const properties = text.match(pageRegex);
            if (properties) {
                return { "rating": properties[2], "link": linkUrl.concat(properties[1]) };
            }
            
        } catch (error) {
            console.error(error);
        }
    }

    return undefined;
}