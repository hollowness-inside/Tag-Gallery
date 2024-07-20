import { Item } from "./item.js";

export class JsonTagFS {
    #files;
    #tags;

    constructor() {
        this.#files = [];
        this.#tags = [];
    }

    update(data) {
        for (let item of data) {
            let tags = item["tags"];
            this.addTags(tags);
            this.addItem(item);
        }
    }

    get files() {
        return this.#files;
    }

    get tags() {
        return this.#tags;
    }

    addItem(it) {
        if (it['type'] == "image") {
            let element = new Image();
            element.src = "/vault/" + it["directory"] + "/" + it["id"] + it["extension"];

            let item = new Item(it["path"], it["tags"], element);
            this.#files.push(item);
            return it;
        } else if (it['type'] == "video") {
            let element = document.createElement('video');
            element.src = "/vault/" + it["directory"] + "/" + it["id"] + it["extension"];

            let item = new Item(it["path"], it["tags"], element);
            this.#files.push(item);
            return it;
        }
    }

    addTags(tags) {
        for (let tag of tags)
            if (!this.#tags.includes(tag))
                this.#tags.push(tag);
    }

    /**
     * Filters files based on the provided tags.
     * @param {string[]} filters - The tags to filter by.
     * @returns {Item[]} An array of files that match the filter criteria.
     */
    filter(filters) {
        if (filters.length === 0)
            return this.files;

        return this.files.filter(file =>
            filters.every(tag => file.tags.includes(tag))
        );
    }
}