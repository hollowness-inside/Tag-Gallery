const navbar = document.getElementById('navbar');
const taglist = document.getElementById('taglist');
const viewport = document.getElementById('viewport');

document.getElementById('clear').addEventListener('click', () => {
    let tags = taglist.getElementsByTagName('input');

    for (let element of tags)
        element.checked = false;
});