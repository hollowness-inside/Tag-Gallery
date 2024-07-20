/**
 * Converts a file to item
 * @param {File} file
 * @returns {Item}
 */
export function fileToElement(file) {
    let fileType = file.type.split("/")[0];
    if (fileType == "image") {
        let element = new Image();
        var fr = new FileReader();

        fr.onload = () => {
            element.src = fr.result;
        }
        fr.readAsDataURL(file);

        return element;
    } else if (fileType == "video") {
        let element = document.createElement("video");

        var fr = new FileReader();
        fr.onload = () => {
            element.src = fr.result;
        }
        fr.readAsDataURL(file);

        return element;
    } else {
        alert("Uknown file format: " + fileType);
    }
}


/**
 * 
 * @param {HTMLElement} listener
 * @param {string} events
 * @param {Function} action 
 */
export function addEventListeners(listener, events, action) {
    events.forEach(ev => {
        listener.addEventListener(ev, action, false);
    });
}