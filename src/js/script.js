import { JsonTagFS } from "../jfs.js";

function updateViewport() {
    const zip = (a, b) => a.map((k, i) => [k, b[i]]);

    let checkboxes = taglist.getElementsByTagName("input");
    checkboxes = Array.from(checkboxes);

    const activeFilters = checkboxes.filter(ch => ch.checked).map(ch => ch.name);
    let filteredFiles = tagfs.filter(activeFilters);

    let tag_counts = {};
    tagfs.tags.forEach(tag => tag_counts[tag] = 0);

    tagfs.files.forEach(file => {
        if (filteredFiles.includes(file)) {
            file.element.style.display = "block";
            file.tags.forEach(tag => {
                tag_counts[tag] += 1;
            });
        } else {
            file.element.style.display = "none";
        }
    });

    zip(Object.keys(tag_counts), Object.values(tag_counts)).forEach(([tag, count]) => {
        let label = document.getElementById('label_' + tag);

        if (count === 0) {
            label.parentElement.style.display = 'none';
            return;
        } else {
            label.parentElement.style.display = 'block';
        }

        let i = label.innerText.search(/\(\d+\)$/);
        label.innerText = label.innerText.substring(0, i) + ' (' + count + ')';
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
    label.innerText = tag + `(0)`;

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