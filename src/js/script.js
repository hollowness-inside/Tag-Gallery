import { JsonTagFS } from "../jfs.js";

class App {
    constructor() {
        const ui = new UIManager();
        const mw = new ModalWindow(ui);
        new DropArea(mw);

        ServerCommunication.fetchItems(ui);
    }
}

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
        checkbox.addEventListener("change", () => this.updateViewport());

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

    clearViewport() {
        this.#viewport.textContent = '';
    }

    clearTaglist() {
        this.#taglist.textContent = '';
    }

    clear() {
        this.clearViewport();
        this.clearTaglist();
    }
}

class ServerCommunication {
    static uploadItem(file, tags = ["no tags"]) {
        let fd = new FormData();
        fd.append("file", file);
        fd.append("tags", JSON.stringify(tags));

        fetch("/upload", { method: "POST", body: fd });
    }

    /**
     * 
     * @param {UIManager} ui 
     */
    static fetchItems(ui) {
        fetch("/fetch")
            .then(response => response.json())
            .then(data => {
                ui.clear();

                let tagfs = new JsonTagFS(data);
                tagfs.files.forEach(file =>
                    ui.addImage(file.element)
                );

                console.log(tagfs);

                tagfs.tags.forEach(tag => ui.addTag(tag));
            })
            .catch(error => {
                console.error("Error fetching the JSON file:", error);
            });
    }
}

class ModalWindow {
    #ui;

    #body;
    #view;
    #tagList;
    #tagInput;

    #element;
    #tags;

    #closeBtn;
    #uploadBtn;

    constructor(ui) {
        this.#ui = ui;

        this.#body = document.getElementById('modal');
        this.#view = document.getElementById('right');
        this.#closeBtn = document.getElementById('modalClose');
        this.#uploadBtn = document.getElementById('modalUpload');

        this.#tagList = document.getElementById('modal-tag-list');
        this.#tagInput = document.getElementById('tags-input');

        this.#tagInput.addEventListener('change', () => this.#enterTag());
        this.#uploadBtn.addEventListener('click', () => this.upload());
        this.#closeBtn.addEventListener('click', () => this.close());

        this.#reset();
    }

    show() {
        this.#body.style.display = 'flex';
    }

    close() {
        this.#body.style.display = 'none';
        this.#reset();
    }

    #reset() {
        this.#view.textContent = '';
        this.#tagList.textContent = '';

        this.#tags = [];
        this.#element = null;
    }

    observe(file) {
        if (!file)
            return;

        this.show();

        let fileType = file.type.split('/')[0];
        if (fileType == 'image') {
            this.#view.textContent = "";

            let element = new Image();
            var fr = new FileReader();
            fr.onload = () => {
                element.src = fr.result;
                element.data = file;
            }
            fr.readAsDataURL(file);
            this.#element = element;
            this.#view.appendChild(this.#element);
        } else {
            alert('Unknow file format: ' + fileType);
            this.close();
            return;
        }
    }

    upload() {
        ServerCommunication.uploadItem(this.#element.data, this.#tags);

        for (let tag of this.#tags)
            this.#ui.addTag(tag);

        this.#ui.addImage(this.#element);
        this.close();
    }

    #enterTag() {
        let tag = this.#tagInput.value;

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

    /**
     * @type {ModalWindow}
     */
    #mw;

    /**
     * 
     * @param {ModalWindow} mw 
     */
    constructor(mw) {
        this.#mw = mw;

        this.#fileInput = document.getElementById('fileElem');
        this.#dropArea = document.getElementById('drop-area');

        this.#fileInput.addEventListener('change', () => this.#onSelect());

        addEventListeners(this.#dropArea, ['dragenter', 'dragover', 'dragleave', 'drop'], e => this.#preventDefaults(e));
        addEventListeners(this.#dropArea, ['dragenter', 'dragover'], e => this.#highlight(e));
        addEventListeners(this.#dropArea, ['dragleave', 'drop'], e => this.#unhighlight(e));
        this.#dropArea.addEventListener('drop', e => this.#onDrop(e), false);
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

    #onDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;

        if (files.length > 1) {
            for (let file of files)
                ServerCommunication.uploadItem(file);

            return;
        }

        this.#mw.observe(files[0]);
    }

    #onSelect(e) {
        this.#mw.observe(this.#fileInput.files[0]);
    }
}

function addEventListeners(object, events, action) {
    events.forEach(ev => {
        object.addEventListener(ev, action, false);
    });
}

let app = new App();