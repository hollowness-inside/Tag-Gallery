import { Item, JsonTagFS } from "./jfs.js";

/**
 * Controls the viewport and the tag list.
 */
export class UIManager {
    #viewport: HTMLDivElement;
    #taglist: HTMLUListElement;
    #clearBtn: HTMLButtonElement;
    #tagfs: JsonTagFS;

    constructor(tagfs: JsonTagFS) {
        this.#tagfs = tagfs;

        this.#viewport = document.getElementById("viewport")! as HTMLDivElement;
        this.#taglist = document.getElementById("taglist")! as HTMLUListElement;
        this.#clearBtn = document.getElementById("clear")! as HTMLButtonElement;

        this.#clearBtn.addEventListener("click", () => {
            let tags = Array.from(this.#taglist.getElementsByTagName("input"));

            for (let element of tags)
                element.checked = false;

            this.updateViewport();
        });

    }

    /**
     * Creates a new element for the tag and inserts it into the list.
     * @param tag tag to be added
     */
    createTag(tag: string) {
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
     * @param tag tag to be added
     */
    addTag(tag: string) {
        if (this.#tagfs.addTag(tag))
            this.createTag(tag);
    }

    addTags(tags: string[]) {
        for (let tag of tags)
            this.addTag(tag);
    }

    /**
     * Adds an element to the viewport.
     * @param elem element to be added to the viewport.
     */
    addElement(elem: HTMLElement) {
        this.#viewport.appendChild(elem);
    }

    updateViewport() {
        const activeFilters = this.#getCheckedTags();
        let {filteredFiles, droppedFiles, tagCounts} = this.#tagfs.filter(activeFilters);

        filteredFiles.forEach(file => file.element.style.display = "block");
        droppedFiles.forEach(file => file.element.style.display = "none");

        for (let [tag, count] of Object.entries(tagCounts)) {
            let label = document.getElementById("label_" + tag)!;
            let parent = label.parentElement!;

            if (count === 0) {
                parent.style.display = "none";
            } else {
                parent.style.display = "block";

                let i = label.innerText.search(/\(\d+\)$/);
                label.innerText = label.innerText.substring(0, i) + " (" + count + ")";
            }
        }
    }

    #getCheckedTags() {
        let checkboxes = this.#taglist.getElementsByTagName("input");
        return Array.from(checkboxes).filter(ch => ch.checked).map(ch => ch.name);
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