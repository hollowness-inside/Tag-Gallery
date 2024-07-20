import { JsonTagFS } from './jfs.js';
import { UIManager } from './uiManager.js';

/**
 * Wrapper for the backend server API.
 */
export class ServerCommunication {
    /**
     * Send the file to the server to be saved.
     * @param {File} file file to be saved in the vault.
     * @param {string[]} tags tags corresponding to the file.
     */
    static uploadItem(file, tags = ["no tags"]) {
        let body = new FormData();
        body.append("file", file);
        body.append("tags", JSON.stringify(tags));

        fetch("/upload", { method: "POST", body: body });
    }

    /**
     * Requests the backend server to retreive the list of items in the vault.
     * @param {JsonTagFS} tagfs
     * @param {UIManager} ui 
     */
    static fetchItems(tagfs, ui) {
        fetch("/fetch")
            .then(response => response.json())
            .then(data => {
                ui.clear();

                tagfs.update(data);
                tagfs.items.forEach(file =>
                    ui.addElement(file.element)
                );

                tagfs.tags.forEach(tag => ui.addTag(tag));
            })
            .catch(error => {
                console.error("Error fetching the JSON file:", error);
            });
    }
}