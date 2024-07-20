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
            this.#addTags(tags);
            this.#addItem(item);
        }
    }

    get items() {
        return this.items;
    }

    get tags() {
        return this.#tags;
    }

    #addItem(it) {
        let type = it["type"].split("/")[0];

        switch (type) {
            case "image":
                return this.#addImage(it);

            case "video":
                return this.#addVideo(it);

            default:
                alert("Unknown file format: " + it["type"]);
        }
    }

    #addImage(it) {
        let element = new Image();
        element.src = "/vault/" + it["directory"] + "/" + it["id"] + it["extension"];

        let item = new Item(it["path"], it["tags"], element);
        this.items.push(item);
        return it;
    }

    #addVideo(it) {
        let element = document.createElement("video");
        element.src = "/vault/" + it["directory"] + "/" + it["id"] + it["extension"];

        let item = new Item(it["path"], it["tags"], element);
        this.items.push(item);
        return it;
    }

    #addTags(tags) {
        for (let tag of tags)
            if (!this.#tags.includes(tag))
                this.#tags.push(tag);
    }

    addTag(tag) {
        this.#tags.push(tag);
    }

    /**
     * Checks if the given tag exists.
     * @param {string} tag tag to be checked for existence.
     * @returns {bool}
     */
    hasTag(tag) {
        return this.#tags.includes(tag);
    }

    /**
     * Filters files based on the provided tags.
     * @param {string[]} activeTags - The tags to filter by.
     * @returns {[Item[], Item[], {}]} An array of files that match the filter criteria.
     */
    filter(activeTags) {
        if (activeTags.length === 0) {
            let tagCounts = {};

            this.items.forEach(file =>
                file.tags.forEach(tag =>
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1
                )
            );

            return [this.items, [], tagCounts];
        }

        let tagCounts = {};
        let filteredFiles = [];
        let droppedFiles = [];

        this.#tags.forEach(tag => tagCounts[tag] = 0);

        this.items.forEach(file => {
            let cond = activeTags.every(tag => file.tags.includes(tag));

            if (cond) {
                filteredFiles.push(file);
                file.tags.forEach(tag => tagCounts[tag] += 1);
            } else {
                droppedFiles.push(file);
            }
        });


        return [filteredFiles, droppedFiles, tagCounts];
    }
}