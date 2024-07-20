import { UIManager } from './uiManager.js';
import { ServerCommunication } from './serverCommunication.js';

/**
 * Wrapper for controlling the modal window.
 */
export class ModalWindow {
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
            this.#element = fileToElement(file);
            this.#element.data = file;

            this.#view.textContent = "";
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

        this.#ui.addElement(this.#element);
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