import { UIManager } from "./uiManager.js";
import { ModalWindow } from "./modalWindow.js";
import { ServerCommunication } from "./serverCommunication.js";
import { addEventListeners, fileToElement } from "./utils.js"

/**
 * Wrapper for the uploader, drop area.
 */
export class DropArea {
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
     * @type {UIManager}
     */
    #ui;

    /**
     * 
     * @param {UIManager} ui
     * @param {ModalWindow} mw modal window to be uesd.
     */
    constructor(ui, mw) {
        this.#mw = mw;
        this.#ui = ui;

        this.#fileInput = document.getElementById("fileElem");
        this.#dropArea = document.getElementById("drop-area");

        addEventListeners(this.#fileInput, ["change"], () => this.#onSelect());
        addEventListeners(this.#dropArea, ["dragenter", "dragover", "dragleave", "drop"], e => this.#preventDefaults(e));
        addEventListeners(this.#dropArea, ["dragenter", "dragover"], e => this.#highlight(e));
        addEventListeners(this.#dropArea, ["dragleave", "drop"], e => this.#unhighlight(e));
        addEventListeners(this.#dropArea, ["drop"], e => this.#onDrop(e), false);
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
            for (let file of files) {
                ServerCommunication.uploadItem(file);

                let el = fileToElement(file);
                this.#ui.addElement(el);
            }

            this.#ui.addTag("no tags");
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
