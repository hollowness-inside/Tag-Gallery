import { Item } from "./item.js";

export class TagFS {
    get files() {
        throw new Error("Not implemented");
    }

    get tags() {
        throw new Error("Not implemented");
    }

    filter(filters) {
        if (filters == []) return this.files;
        return this.files.filter(file => filters.every(tag => file.tags.includes(tag)));
    }
}