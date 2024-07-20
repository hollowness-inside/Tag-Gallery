export class Item {
    /**
     * @type {string}
     */
    path;

    /**
     * @type {string[]}
     */
    tags;

    /**
     * @type {HTMLElement}
     */
    element;

    /**
     * 
     * @param {string} path 
     * @param {string[]} tags 
     * @param {HTMLElement} element 
     */
    constructor(path, tags, element) {
        this.path = path;
        this.tags = tags;
        this.element = element;
    }
}

export class JsonTagFS {
    items;
    #tags;

    constructor() {
        this.items = [];
        this.#tags = [];
    }

    update(data) {
        for (let item of data) {
            let tags = item["tags"];
            this.addTags(tags);
            this.addItem(item);
        }
    }

    get items() {
        return this.items;
    }

    get tags() {
        return this.#tags;
    }

    addItem(it) {
        let type = it["type"].split("/")[0];

        if (type == "image") {
            let element = new Image();
            element.src = "/vault/" + it["directory"] + "/" + it["id"] + it["extension"];

            let item = new Item(it["path"], it["tags"], element);
            this.items.push(item);
            return it;
        } else if (type == "video") {
            let element = document.createElement("video");
            element.src = "/vault/" + it["directory"] + "/" + it["id"] + it["extension"];

            let item = new Item(it["path"], it["tags"], element);
            this.items.push(item);
            return it;
        } else {
            alert("Unknown file format: " + it["type"]);
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
     * @returns {[Item[], Item[], {}]} An array of files that match the filter criteria.
     */
    filter(filters) {
        if (filters.length === 0)
            return this.items;

        let tagCounts = {};
        let filteredFiles = [];
        let droppedFiles = [];

        this.items.forEach(file => {
            let cond = filters.every(tag => file.tags.includes(tag));

            if (cond)
                filteredFiles.push(file);
            else
                droppedFiles.push(file);
        });

        filteredFiles.forEach(tag => tagCounts[tag] = (tagCounts[tag] || 0) + 1);

        return [filteredFiles, droppedFiles, tagCounts];
    }
}