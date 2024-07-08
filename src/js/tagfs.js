import { Item } from "./item.js";

export class TagFS {
    constructor() {
        this.files = [];
        this.tags = [];
    }

    createElement() {
        throw new Error("Not implemented");
    }

    tagFile(path) {
        throw new Error("Not implemented");
    }

    upload(path) {
        let tags = this.tagFile(path);
        let element = this.createElement(path, tags);

        let file = new Item(path, tags, element);
        this.files.push(file);

        return file;
    }

    filter(filters) {
        if (filters == []) return this.files;
        return this.files.filter(file => filters.every(tag => file.tags.includes(tag)));
    }
}