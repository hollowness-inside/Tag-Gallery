import { JsonTagFS } from "./jfs.js";
import { UIManager } from "./uiManager.js";
import { ModalWindow } from "./modalWindow.js";
import { DropArea } from "./dropArea.js";
import { ServerCommunication } from "./serverCommunication.js";

const tagfs = new JsonTagFS();
const ui = new UIManager(tagfs);
const mw = new ModalWindow(ui);
new DropArea(ui, mw);

ServerCommunication.fetchItems(tagfs, ui);