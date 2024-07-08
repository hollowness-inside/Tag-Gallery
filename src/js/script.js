import { JsonTagFS } from "../jfs.js";

function updateViewport() {
    let checkboxes = taglist.getElementsByTagName("input");
    checkboxes = Array.from(checkboxes);

    const activeFilters = checkboxes.filter(ch => ch.checked).map(ch => ch.name);
    let filteredFiles = tagfs.filter(activeFilters);

    tagfs.files.forEach(file => {
        if (filteredFiles.includes(file))
            file.element.style.display = "block";
        else
            file.element.style.display = "none";
    });
}

function addTag(tag) {
    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = tag;
    checkbox.id = "cb_" + tag;
    checkbox.addEventListener("change", updateViewport);

    let label = document.createElement("label");
    label.setAttribute("for", checkbox.id);
    label.setAttribute("id", "label_" + tag);
    label.innerText = tag;

    let listItem = document.createElement("li");
    listItem.appendChild(checkbox);
    listItem.appendChild(label);

    taglist.appendChild(listItem);
}

const taglist = document.getElementById("taglist");
const viewport = document.getElementById("viewport");
let tagfs;

fetch("tags.json")
    .then(response => response.json())
    .then(data => {
        tagfs = new JsonTagFS(data);
        tagfs.files.forEach(file =>
            viewport.appendChild(file.element)
        );

        tagfs.tags.forEach(addTag);
    })
    .catch(error => {
        console.error("Error fetching the JSON file:", error);
    });

document.getElementById("clear").addEventListener("click", () => {
    let tags = taglist.getElementsByTagName("input");

    for (let element of tags)
        element.checked = false;

    updateViewport();
});