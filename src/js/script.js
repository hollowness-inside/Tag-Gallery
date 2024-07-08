import { Tagger } from "./tagger.js";
import { TagFS } from "./tagfs.js";

function updateViewport() {
    let checkboxes = taglist.getElementsByTagName('input');
    checkboxes = Array.from(checkboxes);

    const activeFilters = checkboxes.filter(ch => ch.checked).map(ch => ch.name);
    let filteredFiles = tagfs.filter(activeFilters);

    tagfs.files.forEach(file => {
        if (filteredFiles.includes(file))
            file.element.style.display = "block";
        else
            file.element.style.display = "none";
    });
}

const taglist = document.getElementById('taglist');
const viewport = document.getElementById('viewport');

const files = {
    'kitten.png': ['200x300', ['funny', 'meme', 'kitten', 'baby']],
    'puppy': ['600x600', ['sad', 'puppy', 'quote']],
    'kitten2.jpg': ['100x200', ['meme', 'kitten']],
    'meme.webp': ['1980x1366', ['meme', 'funny', 'quote']],
}

const tagger = new Tagger(['funny', 'sad', 'meme', 'kitten', 'puppy', 'baby', 'quote']);
tagger.feedFile = path => files[path][1];

const tagfs = new TagFS(tagger);
tagfs.createElement = (path, tags) => {
    let image = new Image();
    image.src = "https://via.placeholder.com/" + files[path][0];
    image.addEventListener('click', () => window.open(image.src));
    return image;
};

Object.keys(files).forEach(fpath => {
    let file = tagfs.upload(fpath);
    viewport.appendChild(file.element);
});

tagger.tags.forEach(tag => {
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = tag;
    checkbox.id = 'cb_' + tag;
    checkbox.addEventListener('change', updateViewport);

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

    updateViewport();
});