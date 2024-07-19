import { JsonTagFS } from "../jfs.js";

function updateViewport() {
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

    for (let [tag, count] of Object.entries(tag_counts)) {
        let label = document.getElementById('label_' + tag);

        if (count === 0) {
            label.parentElement.style.display = 'none';
            continue;
        } else {
            label.parentElement.style.display = 'block';
        }

        let i = label.innerText.search(/\(\d+\)$/);
        label.innerText = label.innerText.substring(0, i) + ' (' + count + ')';
    }
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

function uploadItem(file, tags = ["no tags"]) {
    let fd = new FormData();
    fd.append("file", file);
    fd.append("tags", JSON.stringify(tags));

    fetch("/upload", { method: "POST", body: fd });
}

function fetchItems() {
    fetch("/fetch")
        .then(response => response.json())
        .then(data => {
            viewport.textContent = '';
            taglist.textContent = '';

            tagfs = new JsonTagFS(data);
            tagfs.files.forEach(file =>
                viewport.appendChild(file.element)
            );

            tagfs.tags.forEach(addTag);
        })
        .catch(error => {
            console.error("Error fetching the JSON file:", error);
        });
}

const taglist = document.getElementById("taglist");
const viewport = document.getElementById("viewport");

let tagfs;
fetchItems();

document.getElementById("clear").addEventListener("click", () => {
    let tags = taglist.getElementsByTagName("input");

    for (let element of tags)
        element.checked = false;

    updateViewport();
});


let fileInput = document.getElementById('fileElem');
fileInput.addEventListener('change', () => {
    displayModal(fileInput.files[0]);
});

let dropArea = document.getElementById('drop-area');

(['dragenter', 'dragover', 'dragleave', 'drop']).forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
})

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}


function highlight(e) {
    dropArea.classList.add('highlight')
}

function unhighlight(e) {
    dropArea.classList.remove('highlight')
}

(['dragenter', 'dragover']).forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
});

(['dragleave', 'drop']).forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
});

dropArea.addEventListener('drop', handleDrop, false)

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    if (files.length > 1) {
        for (let file of files)
            uploadItem(file);

        return;
    }

    displayModal(files[0]);
}


let modal = document.getElementById('modal');
let modalView = document.getElementById('right');
document.getElementById('modalClose').addEventListener('click', closeModal)

function showModal() {
    modal.style.display = 'flex';
}

function closeModal() {
    modal.style.display = 'none';
}


function displayModal(file) {
    if (!file)
        return;

    showModal();

    let fileType = file.type.split('/')[0];
    if (fileType == 'image') {
        modalView.textContent = "";
        let element = new Image();

        var fr = new FileReader();
        fr.onload = function () {
            element.src = fr.result;
            element.data = file;
        }
        fr.readAsDataURL(file);
        modalView.appendChild(element);
    }
}

let modalTags = document.getElementById('modal-tag-list');
let tagsInput = document.getElementById('tags-input');
tagsInput.addEventListener('change', ev => {
    let elem = document.createElement('span');
    elem.className = 'tag';
    elem.innerText = tagsInput.value;

    modalTags.appendChild(elem);
    tagsInput.value = "";
});

document.getElementById('modalUpload').addEventListener('click', () => {
    let tags = [];
    for (let tag of modalTags.getElementsByClassName('tag'))
        tags.push(tag.innerText);

    let image = modalView.firstChild;

    uploadItem(image.data, tags);
    viewport.appendChild(image);
    modalView.textContent = '';
    closeModal();
});