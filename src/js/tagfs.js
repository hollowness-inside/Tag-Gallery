import { Item } from "./item.js";

/**
 * An abstract class that provides methods for accessing files and tags.
 * It associates files with tags and is responsible for filtering files based on their associated tags.
 */
export class TagFS {
    /**
     * @returns {Item[]} An array of files in the filesystem.
     * @throws {Error} This method is abstract and must be implemented by subclasses.
     */
    get files() {
        throw new Error("Not implemented");
    }

    /**
     * @returns {string[]} An array of known tags.
     * @throws {Error} This method is abstract and must be implemented by subclasses.
     */
    get tags() {
        throw new Error("Not implemented");
    }

    /**
     * Filters files based on the provided tags.
     * @param {string[]} filters - The tags to filter by.
     * @returns {Item[]} An array of files that match the filter criteria.
     */
    filter(filters) {
        if (filters.length === 0) return this.files;
        return this.files.filter(file => filters.every(tag => file.tags.includes(tag)));
    }
}
