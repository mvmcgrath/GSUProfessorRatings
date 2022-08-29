const checkboxSwitch = document.getElementById("checkboxSwitch");

chrome.storage.sync.get("checked", ({ checked }) => {
    if (checked) {
        checkboxSwitch.setAttribute("checked", "checked");
    }
});

checkboxSwitch.addEventListener("click", () => {
    chrome.storage.sync.get("checked", ({ checked }) => {
        chrome.storage.sync.set({ "checked": !checked });
    });
});