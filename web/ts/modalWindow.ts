import { UIManager } from "./uiManager.js";
import { ServerCommunication } from "./serverCommunication.js";
import { fileToElement } from "./utils.js";

interface ElementWithData extends HTMLElement {
    data: File
}

/**
 * Wrapper for controlling the modal window.
 */
export class ModalWindow {
    #ui: UIManager;
    #body: HTMLDivElement;
    #view: HTMLDivElement;
    #tagList: HTMLDivElement;
    #tagInput: HTMLInputElement;
    #closeBtn: HTMLButtonElement;
    #uploadBtn: HTMLButtonElement;

    /**
     * Currently observed file.
     */
    #element?: ElementWithData;

    /**
     * Tags corresponding to the currently observed file.
     */
    #tags: string[];

    constructor(ui: UIManager) {
        this.#ui = ui;
        this.#tags = [];

        this.#body = document.getElementById("modal")! as HTMLDivElement;
        this.#view = document.getElementById("right")! as HTMLDivElement;
        this.#closeBtn = document.getElementById("modalClose")! as HTMLButtonElement;
        this.#uploadBtn = document.getElementById("modalUpload")! as HTMLButtonElement;

        this.#tagList = document.getElementById("modal-tag-list")! as HTMLDivElement;
        this.#tagInput = document.getElementById("tags-input")! as HTMLInputElement;

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
        this.#element = undefined;
    }

    /**
     * Shows up the modal window and display the given file in it.
     * @param {File} file file to be observed
     */
    observe(file?: File) {
        if (!file)
            return;

        this.show();

        let fileType = file.type.split("/")[0];
        if (fileType == "image") {
            this.#element = fileToElement(file)! as ElementWithData;
            this.#element.data = file;

            this.#view.textContent = "";
            this.#view.appendChild(this.#element);
        } else {
            alert("Unknow file format: " + fileType);
            this.close();
        }
    }

    /**
     * Action on clicking the "upload" button. All newly introduced tags get added
     * to the global tag list.
     */
    upload() {
        if (!this.#element)
            return;

        ServerCommunication.uploadItem(this.#element.data, this.#tags);

        this.#ui.addTags(this.#tags);
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