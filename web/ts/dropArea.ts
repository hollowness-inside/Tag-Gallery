import { UIManager } from "./uiManager.js";
import { ModalWindow } from "./modalWindow.js";
import { ServerCommunication } from "./serverCommunication.js";
import { addEventListeners, fileToElement } from "./utils.js";

/**
 * Wrapper for the uploader, drop area.
 */
export class DropArea {
    #fileInput: HTMLInputElement;
    #dropArea: HTMLDivElement;

    /**
     * modal window to be used.
     */
    #mw: ModalWindow;
    #ui: UIManager;

    constructor(ui: UIManager, mw: ModalWindow) {
        this.#mw = mw;
        this.#ui = ui;

        this.#fileInput = document.getElementById("fileElem")! as HTMLInputElement;
        this.#dropArea = document.getElementById("drop-area")! as HTMLDivElement;

        addEventListeners(this.#fileInput, ["change"], (e: Event) => this.#onSelect(e));
        addEventListeners(this.#dropArea, ["dragenter", "dragover", "dragleave", "drop"], (e: DragEvent) => this.#preventDefaults(e));
        addEventListeners(this.#dropArea, ["dragenter", "dragover"], (e: DragEvent) => this.#highlight(e));
        addEventListeners(this.#dropArea, ["dragleave", "drop"], (e: DragEvent) => this.#unhighlight(e));
        addEventListeners(this.#dropArea, ["drop"], (e: DragEvent) => this.#onDrop(e));
    }

    #preventDefaults(e: { preventDefault: () => void; stopPropagation: () => void; }) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Action on dragging an item over the drop area.
     */
    #highlight(e: Event) {
        this.#dropArea.classList.add("highlight");
    }

    /**
     * Action on dragging out an item from the drop area.
     */
    #unhighlight(e: Event) {
        this.#dropArea.classList.remove("highlight");
    }

    /**
     * Action on dropping an item into the drop area. Multiple files get 
     * directly uploaded to the server. One file causes Modal Window to 
     * show up to enter tags for the given file.
     */
    #onDrop(e: DragEvent) {
        // TODO: Check if not null
        let dt = e.dataTransfer!;
        let files = Array.from(dt.files);

        if (files.length > 1) {
            for (let file of files) {
                ServerCommunication.uploadItem(file);

                // TODO: Check if not null
                let el = fileToElement(file)!;
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
    #onSelect(e: Event) {
        // TODO: Check if not null
        this.#mw.observe(this.#fileInput.files![0]);
    }
}
