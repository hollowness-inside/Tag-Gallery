import { JsonTagFS } from "../jfs.js";

class UIManager {
    #viewport;

    #taglist;
    #clearBtn;

    constructor() {
        this.#viewport = document.getElementById("viewport");
        this.#taglist = document.getElementById('taglist');
        this.#clearBtn = document.getElementById('clear');

        this.#clearBtn.addEventListener("click", () => {
            let tags = taglist.getElementsByTagName("input");

            for (let element of tags)
                element.checked = false;

            this.updateViewport();
        });

    }

    addTag(tag) {
        let checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.name = tag;
        checkbox.id = "cb_" + tag;
        checkbox.addEventListener("change", this.updateViewport);

        let label = document.createElement("label");
        label.setAttribute("for", checkbox.id);
        label.setAttribute("id", "label_" + tag);
        label.innerText = tag + `(0)`;

        let listItem = document.createElement("li");
        listItem.appendChild(checkbox);
        listItem.appendChild(label);

        this.#taglist.appendChild(listItem);
    }

    addImage(elem) {
        this.#viewport.appendChild(elem);
    }

    updateViewport() {
        let checkboxes = this.#taglist.getElementsByTagName("input");
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
}

class ServerCommunication {
    static uploadItem(file, tags = ["no tags"]) {
        let fd = new FormData();
        fd.append("file", file);
        fd.append("tags", JSON.stringify(tags));

        fetch("/upload", { method: "POST", body: fd });
    }

    static fetchItems() {
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
}

class ModalWindow {
    #body;
    #view;
    #tagList;
    #tagInput;

    #file;
    #tags;

    #closeBtn;
    #uploadBtn;

    constructor() {
        this.#tags = [];
        this.#file = null;

        this.#body = document.getElementById('modal');
        this.#view = document.getElementById('right');
        this.#closeBtn = document.getElementById('modalClose');
        this.#uploadBtn = document.getElementById('modalUpload');

        this.#tagList = document.getElementById('modal-tag-list');
        this.#tagInput = document.getElementById('tags-input');
        this.#tagInput.addEventListener('change', this.#enterTag);

        this.#uploadBtn.addEventListener('click', this.upload);
        this.#closeBtn.addEventListener('click', this.close);
    }

    show() {
        this.#body.style.display = 'flex';
    }

    close() {
        this.#body.style.display = 'none';
        this.#tags = [];
        this.#file = null;
    }

    observe(file) {
        if (!file)
            return;

        this.#file = file;
        this.show();

        let fileType = file.type.split('/')[0];
        if (fileType == 'image') {
            this.#view.textContent = "";

            let element = new Image();
            var fr = new FileReader();
            fr.onload = function () {
                element.src = fr.result;
                element.data = file;
            }
            fr.readAsDataURL(file);
        } else {
            alert('Unknow file format:' + fileType);
        }
    }

    upload() {
        let image = modalView.firstChild;

        ServerCommunication.uploadItem(image.data, this.#tags);
        viewport.appendChild(image);
        modalView.textContent = '';
        this.close();
    }

    #enterTag() {
        let tag = tagsInput.value;

        let elem = document.createElement('span');
        elem.className = 'tag';
        elem.innerText = tag;

        this.#tags.push(tag);
        this.#tagList.appendChild(elem);
        this.#tagInput.value = "";
    }
}

class DropArea {
    #fileInput;
    #dropArea;

    #mw;

    constructor(mw) {
        this.#mw = mw;

        this.#fileInput = document.getElementById('fileElem');
        this.#dropArea = document.getElementById('drop-area');

        this.#fileInput.addEventListener('change', this.#handleSelection);

        addEventListeners(this.#dropArea, ['dragenter', 'dragover', 'dragleave', 'drop'], this.#preventDefaults);
        addEventListeners(this.#dropArea, ['dragenter', 'dragover'], this.#highlight);
        addEventListeners(this.#dropArea, ['dragleave', 'drop'], this.#unhighlight);
        this.#dropArea.addEventListener('drop', this.#handleDrop, false);
    }

    #preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    #highlight(e) {
        this.#dropArea.classList.add('highlight');
    }

    #unhighlight(e) {
        this.#dropArea.classList.remove('highlight');
    }

    #handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;

        if (files.length > 1) {
            for (let file of files)
                uploadItem(file);

            return;
        }

        this.#mw.prompt(files[0]);
    }

    #handleSelection(e) {
        this.#mw.prompt(files[0]);
    }
}

function addEventListeners(object, events, action) {
    events.forEach(ev => {
        object.addEventListener(ev, action, false);
    });
}

const ui = new UIManager();
const mw = new ModalWindow();
const da = new DropArea(mw);

ServerCommunication.fetchItems()