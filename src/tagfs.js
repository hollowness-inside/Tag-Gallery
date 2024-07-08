import { Item } from "./item.js";

export class TagFS {
    constructor(tagger) {
        this.files = [];
        this.tagger = tagger;
    }

    upload(path) {
        let tags = this.tagger.feedFile(path);
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