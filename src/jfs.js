import { TagFS } from "./js/tagfs.js";
import { Item } from "./js/item.js";

export class JsonTagFS extends TagFS {
    #files;
    #tags;

    constructor() {
        super();

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
        let element = new Image();
        element.src = "/vault/" + it["directory"] + "/" + it["id"] + it["extension"];

        let item = new Item(it["path"], it["tags"], element);
        this.#files.push(item);
        return it;
    }

    addTags(tags) {
        for (let tag of tags)
            if (!this.#tags.includes(tag))
                this.#tags.push(tag);
    }
}