const config = { attributes: true, childList: true };
let tableChangeObserver = null;

// If table completely refreshes
function tableRefresh(mutationList, observer) {
    updateHeader();
    prepareRows();
    addTableChangeObserver();
}

// If table length/sorting changes
function tableChange (mutationList, observer) {
    prepareRows();
}

function prepareRows() {
    let rows = [...document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")];

    const professorNodes = rows
        .map(row => row.getElementsByTagName("td")[4])
        .filter(professor => professor !== undefined && professor.innerHTML !== "R")
    
    const professorNames = professorNodes
        .map(professor => professor.getElementsByTagName("a")[0] ? 
            professor.getElementsByTagName("a")[0].textContent.split(", ").join(" ") :
            professor.textContent.split(", ").join(" "));

    if (professorNames.length !== 0) {
        chrome.runtime.sendMessage({ professorNames })
            .then((response) => {
                populateRows(professorNames, professorNodes, response.professorList);
            });
    }
}

function populateRows(professorNames, professorNodes, professorList) {
    // Needs refactor. Would love zip here :)
    for (let i = 0; i < professorNames.length; i++) {
        const name = professorNames[i];
        const node = professorNodes[i];
        const beforeElement = node.nextSibling;

        if (beforeElement.nodeType !== Node.TEXT_NODE) {
            continue;
        }

        const parent = node.parentElement;

        const text = professorList.hasOwnProperty(name) ? "⭐ ".concat(convertNum(professorList[name].rating)) : "N/A";
        const link = professorList.hasOwnProperty(name) ? professorList[name].link : "";

        if (text === "N/A") {
            newElement("td", text, beforeElement, parent);
            continue;
        }

        newRowElement = newElement("td", "", beforeElement, parent);
        newLinkElement = document.createElement("a");

        newLinkElement.textContent = text;
        newLinkElement.href = link;
        newLinkElement.target = "_blank";

        newRowElement.appendChild(newLinkElement);
    }
}

function convertNum(num) {
    return parseFloat(num).toFixed(1);
}

function createObserver(node, mutFunc) {
    const observer = new MutationObserver(mutFunc);
    observer.observe(node, config);
    return observer;
}

function newElement(tag, textContent, beforeElement, parent) {
    const newRowElement = document.createElement(tag);
    newRowElement.textContent = textContent;
    parent.insertBefore(newRowElement, beforeElement);
    return newRowElement;
}

function updateHeader() {
    const tableHeadRow = document.getElementsByTagName("thead")[0].getElementsByTagName("tr")[0];
    const tableHeadInstructor = tableHeadRow.getElementsByTagName("th")[5];
    newElement("th", "Rating", tableHeadInstructor, tableHeadRow);
}

function addTableChangeObserver() {
    const tableBody = document.getElementsByTagName("tbody")[0];

    if (tableChangeObserver) {
        tableChangeObserver.disconnect();
    }

    tableChangeObserver = createObserver(tableBody, tableChange);
}

chrome.storage.sync.get("checked", ({ checked }) => {
    if (checked) {
        const spinner = document.getElementById("spinner");
        createObserver(spinner, tableRefresh);
    }
});