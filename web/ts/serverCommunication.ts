import { JsonTagFS } from "./jfs.js";
import { UIManager } from "./uiManager.js";

/**
 * Wrapper for the backend server API.
 */
export class ServerCommunication {
    /**
     * Send the file to the server to be saved.
     * @param file file to be saved in the vault.
     * @param tags tags corresponding to the file.
     */
    static uploadItem(file: File, tags: string[] = ["no tags"]): Promise<number> {
        let body = new FormData();
        body.append("file", file);
        body.append("tags", JSON.stringify(tags));

        return fetch("/upload", { method: "POST", body: body })
            .then(data => data.text())
            .then(data => parseInt(data))
    }

    /**
     * Requests the backend server to retreive the list of items in the vault.
     */
    static fetchItems(tagfs: JsonTagFS, ui: UIManager) {
        fetch("/fetch")
            .then(response => response.json())
            .then(data => {
                ui.clear();

                tagfs.update(data);
                tagfs.items.forEach(file =>
                    ui.addElement(file.element)
                );

                tagfs.getTags.forEach(tag => ui.createTag(tag));

            })
            .then(() => ui.updateViewport())
            .catch(error => {
                console.error("Error fetching the JSON file:", error);
            });
    }
}