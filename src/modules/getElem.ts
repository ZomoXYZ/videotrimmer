//custom DOM selectors
export function getElementById(id: string): HTMLElement {
    let elem = document.getElementById(id);

    if (!elem)
        throw `Missing Element with id ${id}`;

    return elem;
}

export function querySelector(query: string): HTMLElement {
    let elem = document.querySelector(query) as HTMLElement;

    if (!elem)
        throw `Missing Element with query "${query}"`;

    return elem;
}

export function querySelectorAll(query: string): NodeListOf<HTMLElement> {
    let elem = document.querySelectorAll(query) as NodeListOf<HTMLElement>;

    if (!elem)
        throw `Missing Element with query "${query}"`;

    return elem;
}