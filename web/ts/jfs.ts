export class Item {
    path: string;
    tags: string[];
    element: HTMLElement;

    constructor(path: string, tags: string[], element: HTMLElement) {
        this.path = path;
        this.tags = tags;
        this.element = element;
    }
}

export class JsonTagFS {
    items: Item[];
    #tags: string[];

    constructor() {
        this.items = [];
        this.#tags = [];
    }

    update(data: { [_: string]: any }[]) {
        for (let item of data) {
            let tags = item["tags"];
            this.#addTags(tags);
            this.#addItem(item);
        }
    }

    get getItems() {
        return this.items;
    }

    get getTags() {
        return this.#tags;
    }

    #addItem(it: { [_: string]: any }) {
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

    #addImage(it: { [_: string]: any }) {
        let element = new Image();
        element.src = "/thumb/" + it["id"];
        element.addEventListener("click", () => window.open("/vault/" + it["id"]))

        let item = new Item(it["path"], it["tags"], element);
        this.items.push(item);
        return it;
    }

    #addVideo(it: { [_: string]: any }) {
        let element = document.createElement("video");
        element.src = "/thumb/" + it["id"];
        element.addEventListener("click", () => window.open("/vault/" + it["id"]))


        let item = new Item(it["path"], it["tags"], element);
        this.items.push(item);
        return it;
    }

    #addTags(tags: string[]) {
        for (let tag of tags)
            if (!this.#tags.includes(tag))
                this.#tags.push(tag);
    }

    addTag(tag: string): boolean {
        if (!this.#tags.includes(tag)) {
            this.#tags.push(tag);
            return true;
        }

        return false;
    }

    /**
     * Checks if the given tag exists.
     * @param tag tag to be checked for existence.
     */
    hasTag(tag: string): boolean {
        return this.#tags.includes(tag);
    }

    /**
     * Filters files based on the provided tags.
     * @param activeTags - The tags to filter by.
     * @returns An array of files that match the filter criteria.
     */
    filter(activeTags: string[]): { filteredFiles: Item[], droppedFiles: Item[], tagCounts: { [tag: string]: number } } {
        if (activeTags.length === 0) {
            let tagCounts: { [tag: string]: number } = {};

            this.items.forEach(file =>
                file.tags.forEach(tag =>
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1
                )
            );

            return { filteredFiles: this.items, droppedFiles: [], tagCounts };
        }

        let tagCounts: { [tag: string]: number } = {};
        let filteredFiles: Item[] = [];
        let droppedFiles: Item[] = [];

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


        return {filteredFiles, droppedFiles, tagCounts};
    }
}