import { Tagger } from "./tagger.js";

const navbar = document.getElementById('navbar');
const taglist = document.getElementById('taglist');
const viewport = document.getElementById('viewport');

const tagger = new Tagger(['funny', 'sad', 'meme', 'kitten', 'puppy', 'baby', 'quote']);

tagger.tags.forEach(tag => {
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = tag;
    checkbox.id = 'cb_' + tag;

    let label = document.createElement('label');
    label.setAttribute('for', checkbox.id);
    label.setAttribute('id', 'label_' + tag);
    label.innerText = tag;

    let listItem = document.createElement('li');
    listItem.appendChild(checkbox);
    listItem.appendChild(label);

    taglist.appendChild(listItem);
});

document.getElementById('clear').addEventListener('click', () => {
    let tags = taglist.getElementsByTagName('input');

    for (let element of tags)
        element.checked = false;
});