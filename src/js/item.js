export class Item {
    /**
     * 
     * @param {string} path 
     * @param {string[]} tags 
     * @param {Element} element 
     */
    constructor(path, tags, element) {
        this.path = path;
        this.tags = tags;
        this.element = element;
    }
}