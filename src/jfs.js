import { TagFS } from "./js/tagfs.js";
import { Item } from "./js/item.js";

export class JsonTagFS extends TagFS {
    #jsonData;

    constructor(path) {
        super();

        fetch(path)
            .then(response => response.json())
            .then(data => {
                this.#jsonData = data;

                for (let item of data)
                    this.insert(item['path'], item['tags'], item['src']);
            })
            .catch(error => {
                console.error('Error fetching the JSON file:', error);
            });
    }

    insert(path, tags, src) {
        let element = this.createElement(path, tags, src);

        let file = new Item(path, tags, element);
        this.files.push(file);

        return file;
    }

    tagFile(path) {
        let split = path.split("/");
        let name = split[split.length - 1];
        return this.#jsonData[name]["tags"];
    }

    createElement(path, tags, src) {
        let element = new Image();
        element.src = src;

        return element;
    }
}