export function composite(...styles: (string|undefined)[]): string {
    return styles.filter(s => s?.length).join(' ');
}