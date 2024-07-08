import { Item } from "./item.js";

export class TagFS {
    constructor() {
        this.files = [];
        this.tags = [];
    }

    createElement(path, tags, src) {
        throw new Error("Not implemented");
    }

    tagFile(path) {
        throw new Error("Not implemented");
    }

    insert(path, tags, src) {
        this.#addTags(tags);

        let element = this.createElement(path, tags, src);
        let file = new Item(path, tags, element);
        this.files.push(file);

        return file;
    }

    upload(path) {
        let tags = this.tagFile(path);
        return this.insert(path, tags);
    }

    filter(filters) {
        if (filters == []) return this.files;
        return this.files.filter(file => filters.every(tag => file.tags.includes(tag)));
    }

    #addTags(tags) {
        for (let tag of tags)
            if (!this.tags.includes(tag))
                this.tags.push(tag);
    }
}