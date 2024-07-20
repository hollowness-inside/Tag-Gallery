import { JsonTagFS } from "./jfs.js";

/**
 * Controls the viewport and the tag list.
 */
export class UIManager {
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

    /**
     * @type {JsonTagFS}
     */
    #tagfs;

    /**
     * @param {JsonTagFS} tagfs
     */
    constructor(tagfs) {
        this.#tagfs = tagfs;

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
    createTag(tag) {
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
     * Adds a tag to the tag list. If the tag is already present,
     * nothing happens.
     * @param {string} tag tag to be added
     */
    addTag(tag) {
        if (this.#tagfs.hasTag(tag))
            return;

        this.#tagfs.addTag(tag);
        this.createTag(tag);
    }

    /**
     * Adds an element to the viewport.
     * @param {HTMLElement} elem element to be added to the viewport.
     */
    addElement(elem) {
        this.#viewport.appendChild(elem);
    }

    updateViewport() {
        const activeFilters = this.#getCheckedTags();
        let [filteredFiles, droppedFiles, tag_counts] = this.#tagfs.filter(activeFilters);

        filteredFiles.forEach(file => file.element.style.display = "block");
        droppedFiles.forEach(file => file.element.style.display = "none");

        for (let [tag, count] of Object.entries(tag_counts)) {
            let label = document.getElementById("label_" + tag);

            if (count === 0) {
                label.parentElement.style.display = "none";
            } else {
                label.parentElement.style.display = "block";

                let i = label.innerText.search(/\(\d+\)$/);
                label.innerText = label.innerText.substring(0, i) + " (" + count + ")";
            }
        }
    }

    #getCheckedTags() {
        let checkboxes = this.#taglist.getElementsByTagName("input");
        checkboxes = Array.from(checkboxes);

        return checkboxes.filter(ch => ch.checked).map(ch => ch.name);
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