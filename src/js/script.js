import { JsonTagFS } from "../jfs.js";

class App {
    constructor() {
        const ui = new UIManager();
        const mw = new ModalWindow(ui);
        new DropArea(mw);

        ServerCommunication.fetchItems(ui);
    }
}

/**
 * Controls the viewport and the tag list.
 */
class UIManager {
    /**
     * @type {HTMLDivElement}
     */
    #viewport;

    /**
     * @type {HTMLUListElement}
     */
    #taglist;

    /**
     * @type {HTMLButtonElement}
     */
    #clearBtn;

    constructor() {
        this.#viewport = document.getElementById("viewport");
        this.#taglist = document.getElementById("taglist");
        this.#clearBtn = document.getElementById("clear");

        this.#clearBtn.addEventListener("click", () => {
            let tags = taglist.getElementsByTagName("input");

            for (let element of tags)
                element.checked = false;

            this.updateViewport();
        });

    }

    /**
     * Creates a new element for the tag and inserts it into the list.
     * @param {string} tag tag to be added
     */
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

    /**
     * Adds an element to the viewport.
     * @param {HTMLElement} elem element to be added to the viewport.
     */
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
            let label = document.getElementById("label_" + tag);

            if (count === 0) {
                label.parentElement.style.display = "none";
                continue;
            } else {
                label.parentElement.style.display = "block";
            }

            let i = label.innerText.search(/\(\d+\)$/);
            label.innerText = label.innerText.substring(0, i) + " (" + count + ")";
        }
    }

    /**
     * Removes all elements in the viewport.
     */
    clearViewport() {
        this.#viewport.textContent = "";
    }

    /**
     * Removes all elements in the tag list.
     */
    clearTaglist() {
        this.#taglist.textContent = "";
    }

    /**
     * Removes all elements in the viewport and the tag list.
     */
    clear() {
        this.clearViewport();
        this.clearTaglist();
    }
}

/**
 * Wrapper for the backend server API.
 */
class ServerCommunication {
    /**
     * Send the file to the server to be saved.
     * @param {File} file file to be saved in the vault.
     * @param {string[]} tags tags corresponding to the file.
     */
    static uploadItem(file, tags = ["no tags"]) {
        let fd = new FormData();
        fd.append("file", file);
        fd.append("tags", JSON.stringify(tags));

        fetch("/upload", { method: "POST", body: fd });
    }

    /**
     * Requests the backend server to retreive the list of items in the vault.
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

                tagfs.tags.forEach(tag => ui.addTag(tag));
            })
            .catch(error => {
                console.error("Error fetching the JSON file:", error);
            });
    }
}

/**
 * Wrapper for controlling the modal window.
 */
class ModalWindow {
    /**
     * @type {UIManager}
     */
    #ui;

    /**
     * @type {HTMLDivElement}
     */
    #body;

    /**
     * @type {HTMLDivElement}
     */
    #view;

    /**
     * @type {HTMLDivElement}
     */
    #tagList;

    /**
     * @type {HTMLDivElement}
     */
    #tagInput;

    /**
     * Currently observed file.
     * @type {HTMLElement}
     */
    #element;

    /**
     * Tags corresponding to the currently observed file.
     * @type {string[]}
     */
    #tags;

    /**
     * @type {HTMLButtonElement}
     */
    #closeBtn;

    /**
     * @type {HTMLButtonElement}
     */
    #uploadBtn;

    constructor(ui) {
        this.#ui = ui;

        this.#body = document.getElementById("modal");
        this.#view = document.getElementById("right");
        this.#closeBtn = document.getElementById("modalClose");
        this.#uploadBtn = document.getElementById("modalUpload");

        this.#tagList = document.getElementById("modal-tag-list");
        this.#tagInput = document.getElementById("tags-input");

        this.#tagInput.addEventListener("change", () => this.#enterTag());
        this.#uploadBtn.addEventListener("click", () => this.upload());
        this.#closeBtn.addEventListener("click", () => this.close());

        this.#reset();
    }

    /**
     * Show up the modal window.
     */
    show() {
        this.#body.style.display = "flex";
    }

    /**
     * Close the modal window and reset its state.
     */
    close() {
        this.#body.style.display = "none";
        this.#reset();
    }

    /**
     * Reset current state. Remove all tags and the observed item.
     */
    #reset() {
        this.#view.textContent = "";
        this.#tagList.textContent = "";

        this.#tags = [];
        this.#element = null;
    }

    /**
     * Shows up the modal window and display the given file in it.
     * @param {File} file file to be observed
     */
    observe(file) {
        if (!file)
            return;

        this.show();

        let fileType = file.type.split("/")[0];
        if (fileType == "image") {
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
            alert("Unknow file format: " + fileType);
            this.close();
        }
    }

    /**
     * Action on clicking the 'upload' button. All newly introduced tags get added
     * to the global tag list.
     */
    upload() {
        ServerCommunication.uploadItem(this.#element.data, this.#tags);

        for (let tag of this.#tags)
            this.#ui.addTag(tag);

        this.#ui.addImage(this.#element);
        this.close();
    }

    /**
     * Action on entering a tag in the input. Creates a tag element
     * and adds it to the tag list.
     */
    #enterTag() {
        let tag = this.#tagInput.value;

        let elem = document.createElement("span");
        elem.className = "tag";
        elem.innerText = tag;

        this.#tags.push(tag);
        this.#tagList.appendChild(elem);
        this.#tagInput.value = "";
    }
}

/**
 * Wrapper for the uploader, drop area.
 */
class DropArea {
    /**
     * @type {HTMLInputElement}
     */
    #fileInput;

    /**
     * @type {HTMLDivElement}
     */
    #dropArea;

    /**
     * @type {ModalWindow} modal window to be used.
     */
    #mw;

    /**
     * 
     * @param {ModalWindow} mw modal window to be uesd.
     */
    constructor(mw) {
        this.#mw = mw;

        this.#fileInput = document.getElementById("fileElem");
        this.#dropArea = document.getElementById("drop-area");

        this.#fileInput.addEventListener("change", () => this.#onSelect());

        addEventListeners(this.#dropArea, ["dragenter", "dragover", "dragleave", "drop"], e => this.#preventDefaults(e));
        addEventListeners(this.#dropArea, ["dragenter", "dragover"], e => this.#highlight(e));
        addEventListeners(this.#dropArea, ["dragleave", "drop"], e => this.#unhighlight(e));
        this.#dropArea.addEventListener("drop", e => this.#onDrop(e), false);
    }

    #preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Action on dragging an item over the drop area.
     */
    #highlight(e) {
        this.#dropArea.classList.add("highlight");
    }

    /**
     * Action on dragging out an item from the drop area.
     */
    #unhighlight(e) {
        this.#dropArea.classList.remove("highlight");
    }

    /**
     * Action on dropping an item into the drop area. Multiple files get 
     * directly uploaded to the server. One file causes Modal Window to 
     * show up to enter tags for the given file.
     */
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

    /**
     * Action on selecting an item by clicking the upload button.
     */
    #onSelect(e) {
        this.#mw.observe(this.#fileInput.files[0]);
    }
}

/**
 * 
 * @param {HTMLElement} listener
 * @param {string} events
 * @param {Function} action 
 */
function addEventListeners(listener, events, action) {
    events.forEach(ev => {
        listener.addEventListener(ev, action, false);
    });
}

let app = new App();