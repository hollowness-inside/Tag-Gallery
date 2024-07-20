export function fileToElement(file: File): HTMLElement | null {
    let fileType = file.type.split("/")[0];
    if (fileType == "image") {
        let element = new Image();
        var fr = new FileReader();

        fr.onload = () => {
            element.src = fr.result! as string;
        }
        fr.readAsDataURL(file);

        return element;
    } else if (fileType == "video") {
        let element = document.createElement("video");

        var fr = new FileReader();
        fr.onload = () => {
            element.src = fr.result! as string;
        }
        fr.readAsDataURL(file);

        return element;
    } else {
        alert("Uknown file format: " + fileType);
    }

    return null;
}


/**
 * 
 * @param {HTMLElement} listener
 * @param {string} events
 * @param {Function} action 
 */
export function addEventListeners(listener: HTMLElement, events: string[], action: any) {
    events.forEach(ev => {
        listener.addEventListener(ev, action, false);
    });
}